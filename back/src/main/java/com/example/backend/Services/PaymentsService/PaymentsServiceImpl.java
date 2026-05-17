package com.example.backend.Services.PaymentsService;

import com.example.backend.Entity.Payment;
import com.example.backend.Entity.Person;
import com.example.backend.Payload.req.PaymentCreateRequest;
import com.example.backend.Repository.PaymentRepo;
import com.example.backend.Repository.PersonRepo;
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
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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
public class PaymentsServiceImpl implements PaymentsService {

    private final PaymentRepo paymentRepo;
    private final PersonRepo personRepo;

    @Override
    public HttpEntity<?> getAll(Integer orgId,
                                Long personId,
                                String category,
                                String paymentType,
                                Boolean isImportant,
                                int page,
                                int limit) {

        int safePage = Math.max(1, page);
        int safeLimit = Math.min(500, Math.max(1, limit));

        Specification<Payment> spec = buildSpecification(orgId, personId, category, paymentType, isImportant);
        Page<Payment> paymentPage = paymentRepo.findAll(
                spec,
                PageRequest.of(safePage - 1, safeLimit, Sort.by(Sort.Direction.DESC, "createdTime")));

        Map<Long, String> personNames = resolvePersonNames(paymentPage.getContent());
        List<Map<String, Object>> data = paymentPage.getContent().stream()
                .map(payment -> toListItem(payment, personNames.get(payment.getPersonId())))
                .toList();

        long safeTotal = paymentPage.getTotalElements();
        return ResponseEntity.ok(Map.of(
                "data", data,
                "totalCount", safeTotal,
                "page", safePage,
                "limit", safeLimit,
                "totalPages", paymentPage.getTotalPages()
        ));
    }

    @Override
    public HttpEntity<?> getById(Integer orgId, Long id) {
        Payment payment = paymentRepo.findByIdAndOrganizationId(id, orgId).orElse(null);
        if (payment == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "To'lov topilmadi"));
        }

        String personName = payment.getPersonId() == null
                ? ""
                : personRepo.findById(payment.getPersonId())
                .map(Person::getFullName)
                .orElse("");

        return ResponseEntity.ok(toListItem(payment, personName));
    }

    @Override
    @Transactional
    public HttpEntity<?> create(Integer orgId, PaymentCreateRequest request) {
        if (request.getPersonId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "personId majburiy"));
        }

        if (!personRepo.existsByIdAndOrganizationIdAndDeletedFalse(request.getPersonId(), orgId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Mijoz topilmadi"));
        }

        LocalDateTime now = LocalDateTime.now();
        BigDecimal amount = nvl(request.getPrice());

        Payment saved = paymentRepo.save(Payment.builder()
                .organizationId(orgId)
                .personId(request.getPersonId())
                .category(request.getCategory())
                .description(request.getDescription())
                .price(amount)
                .amount(amount)
                .paymentType(request.getPaymentType() == null ? "income" : request.getPaymentType())
                .isImportant(true)
                .paymentDate(now)
                .createdTime(now)
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", saved.getId(),
                "message", "To'lov muvaffaqiyatli yaratildi"
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> delete(Integer orgId, Long id) {
        Payment payment = paymentRepo.findByIdAndOrganizationId(id, orgId).orElse(null);
        if (payment == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "To'lov topilmadi"));
        }
        paymentRepo.delete(payment);
        return ResponseEntity.ok(Map.of("message", "To'lov muvaffaqiyatli o'chirildi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> settlePaymentsByPerson(Integer orgId, Long personId) {
        List<Payment> payments = paymentRepo.findAll(buildSpecification(orgId, personId, null, null, null));
        payments.forEach(payment -> payment.setImportant(false));
        paymentRepo.saveAll(payments);
        return ResponseEntity.ok(Map.of("message", "Barcha to'lovlar yopildi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> settlePayment(Integer orgId, Long id) {
        Payment payment = paymentRepo.findByIdAndOrganizationId(id, orgId).orElse(null);
        if (payment == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "To'lov topilmadi"));
        }
        payment.setImportant(false);
        paymentRepo.save(payment);
        return ResponseEntity.ok(Map.of("message", "To'lov yopildi"));
    }

    @Override
    public HttpEntity<?> downloadExcel(Integer orgId,
                                       Long personId,
                                       String category,
                                       String paymentType,
                                       Boolean isImportant) {

        Specification<Payment> spec = buildSpecification(orgId, personId, category, paymentType, isImportant);
        List<Payment> payments = paymentRepo.findAll(spec, Sort.by(Sort.Direction.DESC, "createdTime"));
        Map<Long, String> personNames = resolvePersonNames(payments);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Payments");
            String[] cols = {"ID", "Person", "Category", "Description", "Price", "Payment Type", "Important", "Created Time"};
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
            for (Payment payment : payments) {
                Map<String, Object> row = toListItem(payment, personNames.get(payment.getPersonId()));
                Row r = sheet.createRow(idx++);
                r.createCell(0).setCellValue(((Number) row.get("id")).longValue());
                r.createCell(1).setCellValue(String.valueOf(row.get("personName") == null ? "" : row.get("personName")));
                r.createCell(2).setCellValue(String.valueOf(row.get("category") == null ? "" : row.get("category")));
                r.createCell(3).setCellValue(String.valueOf(row.get("description") == null ? "" : row.get("description")));
                r.createCell(4).setCellValue(String.valueOf(row.get("price") == null ? "0" : row.get("price")));
                r.createCell(5).setCellValue(String.valueOf(row.get("paymentType") == null ? "" : row.get("paymentType")));
                r.createCell(6).setCellValue(Boolean.TRUE.equals(row.get("isImportant")) ? "Ha" : "Yo'q");
                r.createCell(7).setCellValue(String.valueOf(row.get("createdTime") == null ? "" : row.get("createdTime")));
            }

            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);

            Path targetDir = Paths.get("src/main/resources/static/downloads");
            Files.createDirectories(targetDir);

            String fileName = "payments_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")) + ".xlsx";
            Path filePath = targetDir.resolve(fileName);
            try (OutputStream out = Files.newOutputStream(filePath)) {
                workbook.write(out);
            }

            String base = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
            return ResponseEntity.ok(Map.of("url", base + "/downloads/" + fileName));
        } catch (Exception e) {
            log.error("Payments excel xatoligi", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Excel yaratishda xatolik yuz berdi"));
        }
    }

    private BigDecimal nvl(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private Specification<Payment> buildSpecification(Integer orgId,
                                                      Long personId,
                                                      String category,
                                                      String paymentType,
                                                      Boolean isImportant) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("organizationId"), orgId));

            if (personId != null) {
                predicates.add(cb.equal(root.get("personId"), personId));
            }
            if (category != null && !category.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("category")), category.trim().toLowerCase()));
            }
            if (paymentType != null && !paymentType.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("paymentType")), paymentType.trim().toLowerCase()));
            }
            if (isImportant != null) {
                predicates.add(cb.equal(root.get("isImportant"), isImportant));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Map<Long, String> resolvePersonNames(List<Payment> payments) {
        Set<Long> personIds = payments.stream()
                .map(Payment::getPersonId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());

        if (personIds.isEmpty()) {
            return Map.of();
        }

        return personRepo.findAllById(personIds).stream()
                .collect(Collectors.toMap(Person::getId, p -> p.getFullName() == null ? "" : p.getFullName()));
    }

    private Map<String, Object> toListItem(Payment payment, String personName) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", payment.getId());
        row.put("personId", payment.getPersonId());
        row.put("personName", personName == null ? "" : personName);
        row.put("category", payment.getCategory());
        row.put("description", payment.getDescription());
        row.put("price", payment.getPrice() != null ? payment.getPrice() : payment.getAmount());
        row.put("paymentType", payment.getPaymentType());
        row.put("isImportant", payment.isImportant());
        LocalDateTime created = payment.getCreatedTime() != null ? payment.getCreatedTime() : payment.getPaymentDate();
        row.put("createdTime", created == null ? null : created.toString());
        return row;
    }
}

