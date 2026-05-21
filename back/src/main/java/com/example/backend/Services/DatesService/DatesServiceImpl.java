package com.example.backend.Services.DatesService;

import com.example.backend.Entity.OrganizationDate;
import com.example.backend.Payload.req.DateUpdateRequest;
import com.example.backend.Repository.DatesRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatesServiceImpl implements DatesService {

    private final DatesRepo datesRepo;

    @Override
    public HttpEntity<?> getAll(Integer orgId, Integer month, Integer year) {
        if (month == null || month < 1 || month > 12) {
            return ResponseEntity.badRequest().body(Map.of("message", "month 1 dan 12 gacha bo'lishi kerak"));
        }

        LocalDate from = LocalDate.of(year, month, 1);
        LocalDate to = from.plusMonths(1);

        List<Map<String, Object>> data = datesRepo
                .findByOrganizationIdAndDateGreaterThanEqualAndDateLessThanOrderByDateAsc(orgId, from, to)
                .stream()
                .map(this::toListItem)
                .toList();

        return ResponseEntity.ok(data);
    }

    @Override
    @Transactional
    public HttpEntity<?> update(Integer orgId, Long id, DateUpdateRequest request) {
        boolean markHoliday = request.getIsHoliday() != null && request.getIsHoliday();

        OrganizationDate entity = datesRepo.findByIdAndOrganizationId(id, orgId).orElse(null);
        if (entity == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Sana topilmadi"));
        }

        entity.setKanikul(markHoliday);
        entity.setHoliday(markHoliday);
        datesRepo.save(entity);

        return ResponseEntity.ok(Map.of(
                "dateId", id,
                "message", "Sana muvaffaqiyatli yangilandi"
        ));
    }

    @Override
    public HttpEntity<?> download(Integer orgId) {
        List<Map<String, Object>> rows = datesRepo.findByOrganizationIdOrderByDateDesc(orgId)
                .stream()
                .map(this::toListItem)
                .toList();

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Dates");
            String[] cols = {"ID", "Date", "Is Holiday", "Organization ID"};
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
                r.createCell(1).setCellValue(String.valueOf(row.get("date") == null ? "" : row.get("date")));
                r.createCell(2).setCellValue(Boolean.TRUE.equals(row.get("isHoliday")) ? "Ha" : "Yo'q");
                r.createCell(3).setCellValue(((Number) row.get("organizationId")).intValue());
            }

            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);

            Path targetDir = Paths.get("src/main/resources/static/downloads");
            Files.createDirectories(targetDir);

            String fileName = "dates_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")) + ".xlsx";
            Path filePath = targetDir.resolve(fileName);
            workbook.write(Files.newOutputStream(filePath));

            String base = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
            return ResponseEntity.ok(Map.of("url", base + "/downloads/" + fileName));
        } catch (Exception e) {
            log.error("Dates excel xatoligi", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Excel yaratishda xatolik yuz berdi"));
        }
    }

    @Override
    public HttpEntity<?> capabilities(Integer orgId) {
        LocalDate today = LocalDate.now();
        OrganizationDate row = datesRepo.findFirstByOrganizationIdAndDate(orgId, today).orElse(null);

        boolean hasRecord = row != null;
        boolean isKanikul = row != null && row.isKanikul();

        return ResponseEntity.ok(Map.of(
                "date", today.toString(),
                "isKanikul", isKanikul,
                "hasRecord", hasRecord
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> generate(Integer orgId, Integer month, Integer year) {
        LocalDate from = LocalDate.of(year, month, 1);
        LocalDate to = from.plusMonths(1);

        List<OrganizationDate> existing = datesRepo
                .findByOrganizationIdAndDateGreaterThanEqualAndDateLessThanOrderByDateAsc(orgId, from, to);
        Set<LocalDate> existingDates = existing.stream()
                .map(OrganizationDate::getDate)
                .collect(Collectors.toSet());

        List<OrganizationDate> toSave = new ArrayList<>();
        LocalDate current = from;
        while (current.isBefore(to)) {
            if (!existingDates.contains(current)) {
                toSave.add(OrganizationDate.builder()
                        .organizationId(orgId)
                        .date(current)
                        .isHoliday(false)
                        .isKanikul(false)
                        .build());
            }
            current = current.plusDays(1);
        }

        datesRepo.saveAll(toSave);
        log.info("Sanalar yaratildi: orgId={}, month={}/{}, count={}", orgId, month, year, toSave.size());
        return ResponseEntity.ok(Map.of(
                "message", "Sanalar muvaffaqiyatli yaratildi",
                "created", toSave.size()
        ));
    }

    private Map<String, Object> toListItem(OrganizationDate entity) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", entity.getId());
        row.put("date", entity.getDate() == null ? null : entity.getDate().toString());
        row.put("isHoliday", entity.isHoliday() || entity.isKanikul());
        row.put("organizationId", entity.getOrganizationId());
        return row;
    }
}
