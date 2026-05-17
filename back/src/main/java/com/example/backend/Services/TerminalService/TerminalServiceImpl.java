package com.example.backend.Services.TerminalService;

import com.example.backend.Entity.ApiSettings;
import com.example.backend.Entity.Terminal;
import com.example.backend.Entity.TerminalTask;
import com.example.backend.Payload.req.TerminalAddRequest;
import com.example.backend.Payload.req.TerminalUpdateRequest;
import com.example.backend.Repository.ApiSettingsRepo;
import com.example.backend.Repository.PersonRepo;
import com.example.backend.Repository.TaskRepo;
import com.example.backend.Repository.TerminalRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TerminalServiceImpl implements TerminalService {

    private final TerminalRepo terminalRepo;
    private final ApiSettingsRepo apiSettingsRepo;
    private final TaskRepo taskRepo;
    private final PersonRepo personRepo;

    @Override
    public HttpEntity<?> getAll(Integer orgId, String part, int page, int pageSize) {
        ensureSettings();

        int safePage = Math.max(1, page);
        int safePageSize = Math.min(500, Math.max(1, pageSize));

        if (part != null && !part.isBlank() && part.trim().length() < 3) {
            return ResponseEntity.badRequest().body(Map.of("message", "part kamida 3 ta belgidan iborat bo'lishi kerak"));
        }

        Page<Terminal> resultPage = (part == null || part.isBlank())
                ? terminalRepo.findByOrganizationIdAndDeletedFalseOrderByCreatedAtDesc(
                        orgId, PageRequest.of(safePage - 1, safePageSize))
                : terminalRepo.searchByOrganization(
                        orgId, part.trim(), PageRequest.of(safePage - 1, safePageSize));

        List<Map<String, Object>> data = resultPage.getContent().stream()
                .map(t -> toTerminalItem(t, false))
                .toList();

        return ResponseEntity.ok(Map.of(
                "data", data,
                "totalCount", resultPage.getTotalElements(),
                "page", safePage,
                "pageSize", safePageSize
        ));
    }

    @Override
    public HttpEntity<?> getById(Integer orgId, Long id) {
        ensureSettings();

        Terminal terminal = terminalRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId).orElse(null);
        if (terminal == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Terminal topilmadi"));
        }

        return ResponseEntity.ok(toTerminalItem(terminal, true));
    }

    @Override
    public HttpEntity<?> download(Integer orgId, String part) {
        ensureSettings();

        List<Terminal> terminals = (part == null || part.isBlank())
                ? terminalRepo.findByOrganizationIdAndDeletedFalseOrderByCreatedAtDesc(orgId)
                : terminalRepo.searchAllByOrganization(orgId, part.trim());

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Terminals");
            String[] cols = {"ID", "Name", "Description", "Filter", "Created", "Last Online", "IP", "Login", "Model", "Is Coming"};
            Row header = sheet.createRow(0);

            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            for (int i = 0; i < cols.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(cols[i]);
                cell.setCellStyle(headerStyle);
            }

            int idx = 1;
            for (Terminal terminal : terminals) {
                Map<String, Object> row = toTerminalItem(terminal, false);
                Row r = sheet.createRow(idx++);
                r.createCell(0).setCellValue(((Number) row.get("id")).longValue());
                r.createCell(1).setCellValue(String.valueOf(row.get("name") == null ? "" : row.get("name")));
                r.createCell(2).setCellValue(String.valueOf(row.get("description") == null ? "" : row.get("description")));
                r.createCell(3).setCellValue(String.valueOf(row.get("filter") == null ? "" : row.get("filter")));
                r.createCell(4).setCellValue(String.valueOf(row.get("createdTime") == null ? "" : row.get("createdTime")));
                r.createCell(5).setCellValue(String.valueOf(row.get("lastOnline") == null ? "" : row.get("lastOnline")));
                r.createCell(6).setCellValue(String.valueOf(row.get("ip") == null ? "" : row.get("ip")));
                r.createCell(7).setCellValue(String.valueOf(row.get("login") == null ? "" : row.get("login")));
                r.createCell(8).setCellValue(String.valueOf(row.get("model") == null ? "" : row.get("model")));
                r.createCell(9).setCellValue(Boolean.TRUE.equals(row.get("isComing")) ? "Ha" : "Yo'q");
            }

            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);

            Path targetDir = Paths.get("src/main/resources/static/downloads");
            Files.createDirectories(targetDir);

            String fileName = "terminals_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")) + ".xlsx";
            Path filePath = targetDir.resolve(fileName);
            try (OutputStream out = Files.newOutputStream(filePath)) {
                workbook.write(out);
            }

            String base = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
            return ResponseEntity.ok(Map.of("url", base + "/downloads/" + fileName));
        } catch (Exception e) {
            log.error("Terminal excel xatoligi", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Excel yaratishda xatolik yuz berdi"));
        }
    }

    @Override
    @Transactional
    public HttpEntity<?> add(Integer orgId, TerminalAddRequest request) {
        ensureSettings();

        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "name majburiy"));
        }
        if (request.getLogin() == null || request.getLogin().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "login majburiy"));
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "password majburiy"));
        }

        long currentCount = terminalRepo.countByOrganizationIdAndDeletedFalse(orgId);
        int maxCount = maxTerminalsCount();
        if (currentCount >= maxCount) {
            return ResponseEntity.badRequest().body(Map.of(
                    "errorCode", "T001",
                    "message", "Terminallar soni limitdan oshdi"
            ));
        }

        String ip = request.getIp() == null ? null : request.getIp().trim();
        if (ip != null && !ip.isBlank() && terminalRepo.existsByIpAndDeletedFalse(ip)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "errorCode", "T002",
                    "message", "Bunday IP manzil allaqachon mavjud"
            ));
        }

        Terminal saved = terminalRepo.save(Terminal.builder()
                .organizationId(orgId)
                .name(request.getName())
                .description(request.getDescription())
                .ip(ip)
                .login(request.getLogin())
                .password(request.getPassword())
                .model(request.getModel())
                .filter(request.getFilter())
                .isComing(request.getIsComing() != null && request.getIsComing())
                .active(true)
                .deleted(false)
                .createdAt(LocalDateTime.now())
                .build());

        taskRepo.save(TerminalTask.builder()
                .terminalId(saved.getId())
                .personId(null)
                .action("add_all_persons")
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "terminalId", saved.getId(),
                "message", "Terminal muvaffaqiyatli qo'shildi"
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> update(Integer orgId, Long id, TerminalUpdateRequest request) {
        ensureSettings();

        Terminal terminal = terminalRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId).orElse(null);
        if (terminal == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Terminal topilmadi"));
        }

        if (request.getIp() != null && !request.getIp().isBlank()
                && terminalRepo.existsByIpAndDeletedFalseAndIdNot(request.getIp().trim(), id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "errorCode", "T002",
                    "message", "Bunday IP manzil allaqachon mavjud"
            ));
        }

        if (request.getName() != null) terminal.setName(request.getName());
        if (request.getDescription() != null) terminal.setDescription(request.getDescription());
        if (request.getFilter() != null) terminal.setFilter(request.getFilter());
        if (request.getIsComing() != null) terminal.setComing(request.getIsComing());
        if (request.getIp() != null) terminal.setIp(request.getIp());
        if (request.getLogin() != null) terminal.setLogin(request.getLogin());
        if (request.getPassword() != null) terminal.setPassword(request.getPassword());
        if (request.getModel() != null) terminal.setModel(request.getModel());
        terminalRepo.save(terminal);

        return ResponseEntity.ok(Map.of(
                "terminalId", id,
                "message", "Terminal muvaffaqiyatli yangilandi"
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> delete(Integer orgId, Long id) {
        ensureSettings();

        Terminal terminal = terminalRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId).orElse(null);
        if (terminal == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Terminal topilmadi"));
        }

        terminal.setDeleted(true);
        terminal.setActive(false);
        terminalRepo.save(terminal);

        return ResponseEntity.ok(Map.of(
                "terminalId", id,
                "message", "Terminal muvaffaqiyatli o'chirildi"
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> reset(Integer orgId, Long id) {
        ensureSettings();

        Terminal terminal = terminalRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId).orElse(null);
        if (terminal == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Terminal topilmadi"));
        }

        taskRepo.save(TerminalTask.builder()
                .terminalId(id)
                .personId(null)
                .action("add_all_persons")
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build());

        long count = personRepo.countByOrganizationIdAndDeletedFalse(orgId);

        return ResponseEntity.ok(Map.of(
                "terminalId", id,
                "message", "Terminal muvaffaqiyatli reset qilindi. " + count + " ta mijoz qayta yuklandi."
        ));
    }

    private int maxTerminalsCount() {
        Integer max = apiSettingsRepo.findTopByOrderByIdDesc()
                .map(ApiSettings::getMaxTerminalsCount)
                .orElse(10);
        return max == null ? 10 : Math.max(1, max);
    }

    private void ensureSettings() {
        if (apiSettingsRepo.findTopByOrderByIdDesc().isEmpty()) {
            apiSettingsRepo.save(ApiSettings.builder()
                    .maxGraphicsCount(50)
                    .maxTerminalsCount(10)
                    .build());
        }
    }

    private Map<String, Object> toTerminalItem(Terminal terminal, boolean includePassword) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", terminal.getId());
        row.put("organizationId", terminal.getOrganizationId());
        row.put("name", terminal.getName());
        row.put("description", terminal.getDescription());
        row.put("filter", terminal.getFilter());
        row.put("createdTime", terminal.getCreatedAt() == null ? null : terminal.getCreatedAt().toString());
        row.put("lastOnline", terminal.getLastOnline() == null ? null : terminal.getLastOnline().toString());
        row.put("ip", terminal.getIp());
        row.put("login", terminal.getLogin());
        if (includePassword) row.put("password", terminal.getPassword());
        row.put("model", terminal.getModel());
        row.put("deleted", terminal.isDeleted());
        row.put("isComing", terminal.isComing());
        row.put("isOnline", terminal.getIsOnline() != null && terminal.getIsOnline());
        return row;
    }
}

