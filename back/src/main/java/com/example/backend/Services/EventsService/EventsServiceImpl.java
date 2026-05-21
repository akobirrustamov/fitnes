package com.example.backend.Services.EventsService;

import com.example.backend.Projection.EventRowProjection;
import com.example.backend.Repository.EventEntryRepo;
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
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventsServiceImpl implements EventsService {

    private final EventEntryRepo eventEntryRepo;

    @Override
    public HttpEntity<?> getAll(Integer orgId,
                                Long personId,
                                Long terminalId,
                                String eventType,
                                String startDate,
                                String endDate,
                                int page,
                                int limit) {

        int safePage = Math.max(1, page);
        int safeLimit = Math.min(500, Math.max(1, limit));

        String direction = toDirection(eventType);
        LocalDateTime from = parseDateTime(startDate);
        LocalDateTime to = parseDateTime(endDate);

        Page<EventRowProjection> pageResult = eventEntryRepo.findFiltered(
                orgId,
                personId,
                terminalId,
                direction,
                from,
                to,
                PageRequest.of(safePage - 1, safeLimit)
        );

        List<Map<String, Object>> data = pageResult.getContent().stream()
                .map(this::toFullRow)
                .toList();

        return ResponseEntity.ok(Map.of(
                "data", data,
                "totalCount", pageResult.getTotalElements(),
                "page", safePage,
                "limit", safeLimit,
                "totalPages", pageResult.getTotalPages()
        ));
    }

    @Override
    public HttpEntity<?> getById(Integer orgId, Long id) {
        return eventEntryRepo.findDetail(orgId, id)
                .<HttpEntity<?>>map(row -> ResponseEntity.ok(toDetailRow(row)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Hodisa topilmadi")));
    }

    @Override
    public HttpEntity<?> getLastByPerson(Integer orgId, Long personId) {
        return eventEntryRepo.findLastByPerson(orgId, personId)
                .<HttpEntity<?>>map(row -> ResponseEntity.ok(Map.of(
                        "id", row.getId(),
                        "type", toType(row.getDirection()),
                        "datetime", row.getDatetime() == null ? null : row.getDatetime().toString(),
                        "terminalName", row.getTerminalName()
                )))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Hodisa topilmadi")));
    }

    @Override
    public HttpEntity<?> getToday(Integer orgId,
                                  Long terminalId,
                                  String eventType,
                                  int page,
                                  int limit) {
        String start = LocalDate.now().atStartOfDay().toString();
        String end = LocalDate.now().plusDays(1).atStartOfDay().toString();
        return getAll(orgId, null, terminalId, eventType, start, end, page, limit);
    }

    @Override
    public HttpEntity<?> downloadExcel(Integer orgId,
                                       Long personId,
                                       Long terminalId,
                                       String eventType,
                                       String startDate,
                                       String endDate) {

        String direction = toDirection(eventType);
        LocalDateTime from = parseDateTime(startDate);
        LocalDateTime to = parseDateTime(endDate);

        List<Map<String, Object>> rows = eventEntryRepo.findFilteredForExport(orgId, personId, terminalId, direction, from, to)
                .stream()
                .map(this::toExportRow)
                .toList();

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Events");
            String[] cols = {"ID", "Person", "Terminal", "Type", "Datetime", "Description"};
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
                r.createCell(1).setCellValue(String.valueOf(row.get("personName") == null ? "" : row.get("personName")));
                r.createCell(2).setCellValue(String.valueOf(row.get("terminalName") == null ? "" : row.get("terminalName")));
                r.createCell(3).setCellValue(String.valueOf(row.get("type") == null ? "" : row.get("type")));
                r.createCell(4).setCellValue(String.valueOf(row.get("datetime") == null ? "" : row.get("datetime")));
                r.createCell(5).setCellValue(String.valueOf(row.get("description") == null ? "" : row.get("description")));
            }

            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            byte[] bytes = baos.toByteArray();

            String fileName = "kirishlar_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".xlsx";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDisposition(ContentDisposition.attachment().filename(fileName).build());
            headers.setContentLength(bytes.length);
            return new ResponseEntity<>(bytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            log.error("Events excel xatoligi", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Excel yaratishda xatolik yuz berdi"));
        }
    }

    private String toDirection(String eventType) {
        if (eventType == null || eventType.isBlank()) return null;
        String norm = eventType.trim().toLowerCase();
        if ("enter".equals(norm) || "in".equals(norm)) return "IN";
        if ("exit".equals(norm) || "out".equals(norm)) return "OUT";
        return null;
    }

    private String toType(String direction) {
        return "IN".equalsIgnoreCase(direction) ? "enter" : "exit";
    }

    private String toDescription(String direction) {
        return "IN".equalsIgnoreCase(direction) ? "Kirish" : "Chiqish";
    }

    private LocalDateTime parseDateTime(String val) {
        if (val == null || val.isBlank()) return null;
        try {
            String t = val.trim();
            if (t.length() == 10) return LocalDate.parse(t).atStartOfDay();
            return LocalDateTime.parse(t.replace(" ", "T"));
        } catch (Exception e) {
            return null;
        }
    }

    private Map<String, Object> toFullRow(EventRowProjection row) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", row.getId());
        m.put("personId", row.getPersonId());
        m.put("personName", row.getPersonName());
        m.put("personPhoto", row.getPersonPhoto());
        m.put("terminalId", row.getTerminalId());
        m.put("terminalName", row.getTerminalName());
        m.put("type", toType(row.getDirection()));
        m.put("datetime", row.getDatetime() == null ? null : row.getDatetime().toString());
        m.put("description", toDescription(row.getDirection()));
        return m;
    }

    private Map<String, Object> toDetailRow(EventRowProjection row) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", row.getId());
        m.put("personId", row.getPersonId());
        m.put("personName", row.getPersonName());
        m.put("terminalId", row.getTerminalId());
        m.put("terminalName", row.getTerminalName());
        m.put("type", toType(row.getDirection()));
        m.put("datetime", row.getDatetime() == null ? null : row.getDatetime().toString());
        m.put("description", toDescription(row.getDirection()));
        return m;
    }

    private Map<String, Object> toExportRow(EventRowProjection row) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", row.getId());
        m.put("personName", row.getPersonName());
        m.put("terminalName", row.getTerminalName());
        m.put("type", toType(row.getDirection()));
        m.put("datetime", row.getDatetime() == null ? null : row.getDatetime().toString());
        m.put("description", toDescription(row.getDirection()));
        return m;
    }
}
