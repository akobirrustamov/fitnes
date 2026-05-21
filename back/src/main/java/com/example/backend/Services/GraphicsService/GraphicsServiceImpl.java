package com.example.backend.Services.GraphicsService;

import com.example.backend.Entity.ApiSettings;
import com.example.backend.Entity.OrganizationGraphics;
import com.example.backend.Payload.req.GraphicsRequest;
import com.example.backend.Repository.ApiSettingsRepo;
import com.example.backend.Repository.OrganizationGraphicsRepo;
import com.example.backend.Repository.PersonRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GraphicsServiceImpl implements GraphicsService {

    private final OrganizationGraphicsRepo graphicsRepo;
    private final PersonRepo personRepo;
    private final ApiSettingsRepo apiSettingsRepo;

    @Override
    public HttpEntity<?> getAll(Integer orgId) {
        List<Map<String, Object>> data = graphicsRepo
                .findByOrganizationIdAndDeletedFalseOrderByCreatedTimeDesc(orgId)
                .stream()
                .map(g -> toResponseRow(g, true))
                .toList();
        return ResponseEntity.ok(data);
    }

    @Override
    public HttpEntity<?> getById(Integer orgId, Long id) {
        OrganizationGraphics g = graphicsRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElse(null);
        if (g == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Grafik topilmadi"));
        }
        return ResponseEntity.ok(toResponseRow(g, false));
    }

    @Override
    @Transactional
    public HttpEntity<?> create(Integer orgId, GraphicsRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "name majburiy"));
        }

        long currentCount = graphicsRepo.countByOrganizationIdAndDeletedFalse(orgId);
        int maxCount = maxGraphicsCount();
        if (currentCount >= maxCount) {
            return ResponseEntity.badRequest().body(Map.of(
                    "errorCode", "G001",
                    "message", "Grafiklar soni limitdan oshdi"
            ));
        }

        OrganizationGraphics saved = graphicsRepo.save(OrganizationGraphics.builder()
                .organizationId(orgId)
                .name(request.getName())
                .description(request.getDescription())
                .monday(bool(request.getIsMonday()))
                .tuesday(bool(request.getIsTuesday()))
                .wednesday(bool(request.getIsWednesday()))
                .thursday(bool(request.getIsThursday()))
                .friday(bool(request.getIsFriday()))
                .saturday(bool(request.getIsSaturday()))
                .sunday(bool(request.getIsSunday()))
                .createdTime(LocalDateTime.now())
                .updatedTime(null)
                .deleted(false)
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", saved.getId(),
                "message", "Grafik muvaffaqiyatli yaratildi"
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> update(Integer orgId, Long id, GraphicsRequest request) {
        OrganizationGraphics g = graphicsRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElse(null);
        if (g == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Grafik topilmadi"));
        }

        if (request.getName() != null) g.setName(request.getName());
        if (request.getDescription() != null) g.setDescription(request.getDescription());
        if (request.getIsMonday() != null) g.setMonday(request.getIsMonday());
        if (request.getIsTuesday() != null) g.setTuesday(request.getIsTuesday());
        if (request.getIsWednesday() != null) g.setWednesday(request.getIsWednesday());
        if (request.getIsThursday() != null) g.setThursday(request.getIsThursday());
        if (request.getIsFriday() != null) g.setFriday(request.getIsFriday());
        if (request.getIsSaturday() != null) g.setSaturday(request.getIsSaturday());
        if (request.getIsSunday() != null) g.setSunday(request.getIsSunday());
        g.setUpdatedTime(LocalDateTime.now());

        graphicsRepo.save(g);

        return ResponseEntity.ok(Map.of("message", "Grafik muvaffaqiyatli yangilandi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> delete(Integer orgId, Long id) {
        OrganizationGraphics g = graphicsRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElse(null);
        if (g == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Grafik topilmadi"));
        }

        long personsCount = personRepo.countByOrganizationIdAndDeletedFalseAndGraphicId(orgId, id.intValue());
        if (personsCount > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "errorCode", "G002",
                    "message", "Grafik ishlatilmoqda, o'chirib bo'lmaydi"
            ));
        }

        g.setDeleted(true);
        g.setUpdatedTime(LocalDateTime.now());
        graphicsRepo.save(g);

        return ResponseEntity.ok(Map.of("message", "Grafik muvaffaqiyatli o'chirildi"));
    }

    @Override
    public HttpEntity<?> downloadExcel(Integer orgId) {
        List<Map<String, Object>> rows = graphicsRepo
                .findByOrganizationIdAndDeletedFalseOrderByCreatedTimeDesc(orgId)
                .stream()
                .map(g -> toResponseRow(g, true))
                .toList();

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Graphics");
            String[] cols = {"ID", "Name", "Description", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Created"};
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
            for (Map<String, Object> row : rows) {
                Row r = sheet.createRow(idx++);
                r.createCell(0).setCellValue(((Number) row.get("id")).longValue());
                r.createCell(1).setCellValue(String.valueOf(row.get("name")));
                r.createCell(2).setCellValue(String.valueOf(row.get("description") == null ? "" : row.get("description")));
                r.createCell(3).setCellValue(boolString(row.get("isMonday")));
                r.createCell(4).setCellValue(boolString(row.get("isTuesday")));
                r.createCell(5).setCellValue(boolString(row.get("isWednesday")));
                r.createCell(6).setCellValue(boolString(row.get("isThursday")));
                r.createCell(7).setCellValue(boolString(row.get("isFriday")));
                r.createCell(8).setCellValue(boolString(row.get("isSaturday")));
                r.createCell(9).setCellValue(boolString(row.get("isSunday")));
                r.createCell(10).setCellValue(String.valueOf(row.get("createdTime") == null ? "" : row.get("createdTime")));
            }

            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            byte[] bytes = baos.toByteArray();

            String fileName = "grafiklar_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".xlsx";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDisposition(ContentDisposition.attachment().filename(fileName).build());
            headers.setContentLength(bytes.length);
            return new ResponseEntity<>(bytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            log.error("Graphics excel xatoligi", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Excel yaratishda xatolik yuz berdi"));
        }
    }

    private int maxGraphicsCount() {
        return apiSettingsRepo.findTopByOrderByIdDesc()
                .map(ApiSettings::getMaxGraphicsCount)
                .map(v -> Math.max(1, v == null ? 50 : v))
                .orElse(50);
    }

    private boolean bool(Boolean value) {
        return Boolean.TRUE.equals(value);
    }

    private String boolString(Object value) {
        return Boolean.TRUE.equals(value) ? "Ha" : "Yo'q";
    }

    private Map<String, Object> toResponseRow(OrganizationGraphics g, boolean withCreated) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", g.getId());
        m.put("name", g.getName());
        m.put("description", g.getDescription());
        m.put("isMonday", g.isMonday());
        m.put("isTuesday", g.isTuesday());
        m.put("isWednesday", g.isWednesday());
        m.put("isThursday", g.isThursday());
        m.put("isFriday", g.isFriday());
        m.put("isSaturday", g.isSaturday());
        m.put("isSunday", g.isSunday());
        if (withCreated) {
            m.put("createdTime", g.getCreatedTime() == null ? null : g.getCreatedTime().toString());
        }
        return m;
    }
}
