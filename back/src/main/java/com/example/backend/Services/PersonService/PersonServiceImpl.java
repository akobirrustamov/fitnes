package com.example.backend.Services.PersonService;

import com.example.backend.Entity.EventEntry;
import com.example.backend.Entity.Payment;
import com.example.backend.Entity.Person;
import com.example.backend.Payload.req.*;
import com.example.backend.Projection.EventRowProjection;
import com.example.backend.Repository.EventEntryRepo;
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
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import jakarta.persistence.criteria.Predicate;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class PersonServiceImpl implements PersonService {

    private final PersonRepo personRepo;
    private final PaymentRepo paymentRepo;
    private final EventEntryRepo eventEntryRepo;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;

    @Override
    public HttpEntity<?> getAll(Integer orgId,
                                Boolean isClient,
                                Boolean active,
                                Boolean isExpired,
                                Boolean hasAccessCount,
                                Integer trainerId,
                                String search,
                                int page,
                                int limit) {

        int safePage = Math.max(page, 1);
        int safeLimit = Math.min(Math.max(limit, 1), 500);
        Boolean clientFilter = (isClient == null) ? Boolean.TRUE : isClient;

        if (search != null && !search.isBlank() && search.trim().length() < 3) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "search kamida 3 ta belgidan iborat bo'lishi kerak"
            ));
        }

        Page<Person> personPage = personRepo.findAll(
                buildPersonSpecification(orgId, clientFilter, active, isExpired, hasAccessCount, trainerId, search),
                PageRequest.of(safePage - 1, safeLimit, Sort.by(Sort.Direction.DESC, "createdTime")));

        List<Map<String, Object>> data = personPage.getContent().stream()
                .map(this::toPersonListItem)
                .toList();

        return ResponseEntity.ok(Map.of(
                "data", data,
                "totalCount", personPage.getTotalElements(),
                "page", safePage,
                "limit", safeLimit,
                "totalPages", personPage.getTotalPages()
        ));
    }

    @Override
    public HttpEntity<?> getById(Integer orgId, Long id) {
        Person person = personRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId).orElse(null);
        if (person == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shaxs topilmadi"));
        }

        List<Map<String, Object>> recentPayments = paymentRepo
                .findAll(buildPaymentSpecification(orgId, id, null, null, null),
                        PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdTime")))
                .getContent()
                .stream()
                .map(this::toPaymentListItem)
                .toList();

        List<Map<String, Object>> recentEvents = eventEntryRepo.findTop10ByPerson(orgId, id).stream()
                .map(this::toEventItem)
                .toList();

        return ResponseEntity.ok(Map.of(
                "person", toPersonDetailItem(person),
                "recentPayments", recentPayments,
                "recentEvents", recentEvents
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> create(Integer orgId, PersonCreateRequest request) {
        if (request.getFullname() == null || request.getFullname().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "fullname majburiy"));
        }

        Person saved = personRepo.save(Person.builder()
                .organizationId(orgId)
                .fullName(request.getFullname())
                .photoUrl(request.getPhotoUrl())
                .phoneNumber(request.getPhoneNumber())
                .gender(request.getGender())
                .birthDate(request.getBirthDate())
                .location(request.getLocation())
                .graphicId(request.getGraphicId())
                .active(request.getActive() == null || request.getActive())
                .isStaff(request.getIsClient() != null ? !request.getIsClient() : false)
                .accessCount(0)
                .debt(BigDecimal.ZERO)
                .deleted(false)
                .createdTime(LocalDateTime.now())
                .updatedTime(null)
                .build());

        createPersonTask(orgId, saved.getId(), "add");
        createPersonTask(orgId, saved.getId(), "photo");

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", saved.getId(),
                "message", "Shaxs muvaffaqiyatli yaratildi va terminallarga yuklandi"
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> update(Integer orgId, Long id, PersonUpdateRequest request) {
        Person person = personRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId).orElse(null);
        if (person == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shaxs topilmadi"));
        }

        if (request.getFullname() != null && !request.getFullname().isBlank()) person.setFullName(request.getFullname());
        if (request.getActive() != null) person.setActive(request.getActive());
        if (request.getPhoneNumber() != null) person.setPhoneNumber(request.getPhoneNumber());
        if (request.getGender() != null) person.setGender(request.getGender());
        if (request.getBirthDate() != null) person.setBirthDate(request.getBirthDate());
        if (request.getLocation() != null) person.setLocation(request.getLocation());
        if (request.getGraphicId() != null) person.setGraphicId(request.getGraphicId());
        person.setUpdatedTime(LocalDateTime.now());
        personRepo.save(person);

        createPersonTask(orgId, id, "update");
        return ResponseEntity.ok(Map.of("message", "Shaxs muvaffaqiyatli yangilandi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> delete(Integer orgId, Long id) {
        Person person = personRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId).orElse(null);
        if (person == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shaxs topilmadi"));
        }

        person.setDeleted(true);
        person.setActive(false);
        person.setUpdatedTime(LocalDateTime.now());
        personRepo.save(person);

        paymentRepo.deleteAll(paymentRepo.findByOrganizationIdAndPersonId(orgId, id));

        createPersonTask(orgId, id, "delete");
        return ResponseEntity.ok(Map.of("message", "Shaxs muvaffaqiyatli o'chirildi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> updatePhoto(Integer orgId, Long id, PersonPhotoUpdateRequest request) {
        Person person = personRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId).orElse(null);
        if (person == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shaxs topilmadi"));
        }
        person.setPhotoUrl(request.getPhotoUrl());
        person.setUpdatedTime(LocalDateTime.now());
        personRepo.save(person);
        createPersonTask(orgId, id, "photo");
        return ResponseEntity.ok(Map.of("message", "Rasm muvaffaqiyatli yangilandi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> extendSubscription(Integer orgId, Long id, PersonExtendSubscriptionRequest request) {
        Person person = personRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId).orElse(null);
        if (person == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shaxs topilmadi"));
        }

        BigDecimal price = nvl(request.getPrice());
        BigDecimal paidAmount = nvl(request.getPaidAmount());
        BigDecimal addedDebt = price.subtract(paidAmount).max(BigDecimal.ZERO);
        BigDecimal oldDebt = nvl(person.getDebt());
        BigDecimal newDebt = oldDebt.add(addedDebt);

        person.setSubscriptionEnd(request.getEndDate());
        if (request.getAccessCount() != null) person.setAccessCount(request.getAccessCount());
        person.setDebt(newDebt);
        person.setUpdatedTime(LocalDateTime.now());
        personRepo.save(person);

        paymentRepo.save(buildPayment(orgId, id, "zal", "expense", price, "Obuna narxi"));
        paymentRepo.save(buildPayment(orgId, id, "zal", "income", paidAmount, "Obuna to'lovi"));

        createPersonTask(orgId, id, "update");

        return ResponseEntity.ok(Map.of(
                "message", "Obuna muvaffaqiyatli uzaytirildi",
                "endDate", request.getEndDate(),
                "accessCount", request.getAccessCount(),
                "debt", newDebt
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> payDebt(Integer orgId, Long id, PersonDebtPayRequest request) {
        Person person = personRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId).orElse(null);
        if (person == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shaxs topilmadi"));
        }

        BigDecimal amount = nvl(request.getAmount());
        String category = (request.getCategory() == null || request.getCategory().isBlank()) ? "zal" : request.getCategory();
        paymentRepo.save(buildPayment(orgId, id, category, "income", amount, "Qarz to'lovi"));

        return ResponseEntity.ok(Map.of(
                "message", "Qarz muvaffaqiyatli to'landi",
                "paidAmount", amount,
                "remainingDebt", nvl(person.getDebt())
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> clearAllDebts(Integer orgId, Long id) {
        Person person = personRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId).orElse(null);
        if (person == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shaxs topilmadi"));
        }

        person.setDebt(BigDecimal.ZERO);
        person.setUpdatedTime(LocalDateTime.now());
        personRepo.save(person);

        List<Payment> payments = paymentRepo.findAll(buildPaymentSpecification(orgId, id, null, null, null));
        payments.forEach(payment -> payment.setImportant(false));
        paymentRepo.saveAll(payments);

        return ResponseEntity.ok(Map.of("message", "Barcha qarzlar muvaffaqiyatli tozalandi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> assignTrainer(Integer orgId, Long id, PersonAssignTrainerRequest request) {
        Person person = personRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId).orElse(null);
        if (person == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shaxs topilmadi"));
        }
        person.setTrainerId(request.getTrainerId() == null ? null : request.getTrainerId().longValue());
        person.setUpdatedTime(LocalDateTime.now());
        personRepo.save(person);
        return ResponseEntity.ok(Map.of("message", "Murabbiy muvaffaqiyatli biriktirildi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> refreshInFaceID(Integer orgId, Long id) {
        if (!personRepo.existsByIdAndOrganizationIdAndDeletedFalse(id, orgId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shaxs topilmadi"));
        }

        createPersonTask(orgId, id, "delete");
        createPersonTask(orgId, id, "add");
        createPersonTask(orgId, id, "photo");

        return ResponseEntity.ok(Map.of("message", "Mijoz barcha terminallarda yangilandi"));
    }

    @Override
    public HttpEntity<?> downloadExcel(Integer orgId, Boolean isClient) {
        Boolean clientFilter = (isClient == null) ? Boolean.TRUE : isClient;
        List<Person> persons = personRepo.findAll(
                buildPersonSpecification(orgId, clientFilter, null, null, null, null, null),
                Sort.by(Sort.Direction.DESC, "id"));

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Persons");
            String[] cols = {"ID", "Fullname", "Phone", "Active", "Subscription End", "Debt"};
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
            for (Person person : persons) {
                Row r = sheet.createRow(idx++);
                r.createCell(0).setCellValue(person.getId());
                r.createCell(1).setCellValue(Objects.toString(person.getFullName(), ""));
                r.createCell(2).setCellValue(Objects.toString(person.getPhoneNumber(), ""));
                r.createCell(3).setCellValue(person.isActive() ? "Ha" : "Yo'q");
                r.createCell(4).setCellValue(person.getSubscriptionEnd() == null ? "" : person.getSubscriptionEnd().toString());
                r.createCell(5).setCellValue(person.getDebt() == null ? "0" : person.getDebt().toString());
            }

            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            byte[] bytes = baos.toByteArray();

            String label = Boolean.FALSE.equals(clientFilter) ? "xodimlar" : "mijozlar";
            String fileName = label + "_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".xlsx";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDisposition(ContentDisposition.attachment().filename(fileName).build());
            headers.setContentLength(bytes.length);

            return new ResponseEntity<>(bytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            log.error("Excel yaratishda xato", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Excel yaratishda xatolik yuz berdi"));
        }
    }

    private BigDecimal nvl(BigDecimal val) {
        return val == null ? BigDecimal.ZERO : val;
    }

    private void createPersonTask(Integer orgId, Long personId, String action) {
        try {
            // Use a savepoint so that if the function doesn't exist, the outer
            // @Transactional transaction stays valid (PostgreSQL aborts the whole
            // transaction on any SQL error — savepoint lets us roll back partially).
            jdbc.execute("SAVEPOINT sp_person_task");
            jdbc.update("SELECT create_person_tasks(?, ?, ?)", orgId, personId, action);
            jdbc.execute("RELEASE SAVEPOINT sp_person_task");
        } catch (Exception e) {
            log.warn("create_person_tasks ishlamadi (orgId={}, personId={}, action={}): {}",
                    orgId, personId, action, e.getMessage());
            try { jdbc.execute("ROLLBACK TO SAVEPOINT sp_person_task"); } catch (Exception ignored) {}
        }
    }

    private Payment buildPayment(Integer orgId,
                                 Long personId,
                                 String category,
                                 String paymentType,
                                 BigDecimal amount,
                                 String description) {
        LocalDateTime now = LocalDateTime.now();
        return Payment.builder()
                .organizationId(orgId)
                .personId(personId)
                .category(category)
                .amount(nvl(amount))
                .price(nvl(amount))
                .paymentType(paymentType)
                .isImportant(true)
                .description(description)
                .paymentDate(now)
                .createdTime(now)
                .build();
    }

    private Specification<Person> buildPersonSpecification(Integer orgId,
                                                           Boolean isClient,
                                                           Boolean active,
                                                           Boolean isExpired,
                                                           Boolean hasAccessCount,
                                                           Integer trainerId,
                                                           String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("organizationId"), orgId));
            predicates.add(cb.isFalse(root.get("deleted")));

            if (isClient != null) {
                predicates.add(cb.equal(root.get("isStaff"), !isClient));
            }
            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }
            if (isExpired != null) {
                if (Boolean.TRUE.equals(isExpired)) {
                    predicates.add(cb.and(
                            cb.isNotNull(root.get("subscriptionEnd")),
                            cb.lessThan(root.get("subscriptionEnd"), cb.currentDate())));
                } else {
                    predicates.add(cb.or(
                            cb.isNull(root.get("subscriptionEnd")),
                            cb.greaterThanOrEqualTo(root.get("subscriptionEnd"), cb.currentDate())));
                }
            }
            if (hasAccessCount != null) {
                predicates.add(Boolean.TRUE.equals(hasAccessCount)
                        ? cb.gt(cb.coalesce(root.get("accessCount"), 0), 0)
                        : cb.equal(cb.coalesce(root.get("accessCount"), 0), 0));
            }
            if (trainerId != null) {
                predicates.add(cb.equal(root.get("trainerId"), trainerId.longValue()));
            }
            if (search != null && !search.isBlank()) {
                String q = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), q),
                        cb.like(cb.lower(cb.coalesce(root.get("phoneNumber"), "")), q)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Specification<Payment> buildPaymentSpecification(Integer orgId,
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
                predicates.add(cb.equal(cb.lower(cb.coalesce(root.get("category"), "")), category.trim().toLowerCase()));
            }
            if (paymentType != null && !paymentType.isBlank()) {
                predicates.add(cb.equal(cb.lower(cb.coalesce(root.get("paymentType"), "")), paymentType.trim().toLowerCase()));
            }
            if (isImportant != null) {
                predicates.add(cb.equal(root.get("isImportant"), isImportant));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Map<String, Object> toPersonListItem(Person person) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", person.getId());
        row.put("fullname", person.getFullName());
        row.put("photoUrl", person.getPhotoUrl());
        row.put("phoneNumber", person.getPhoneNumber());
        row.put("gender", person.getGender());
        row.put("birthDate", person.getBirthDate() == null ? null : person.getBirthDate().toString());
        row.put("location", person.getLocation());
        row.put("graphicId", person.getGraphicId());
        row.put("active", person.isActive());
        row.put("isClient", !person.isStaff());
        row.put("subscriptionEndDate", person.getSubscriptionEnd() == null ? null : person.getSubscriptionEnd().toString());
        row.put("accessCount", person.getAccessCount());
        row.put("debt", person.getDebt() == null ? BigDecimal.ZERO : person.getDebt());
        row.put("trainerId", person.getTrainerId() == null ? null : person.getTrainerId().intValue());
        row.put("createdTime", person.getCreatedTime() == null ? null : person.getCreatedTime().toString());
        return row;
    }

    private Map<String, Object> toPersonDetailItem(Person person) {
        return toPersonListItem(person);
    }

    private Map<String, Object> toPaymentListItem(Payment payment) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", payment.getId());
        row.put("category", payment.getCategory());
        row.put("price", payment.getPrice() != null ? payment.getPrice() : payment.getAmount());
        row.put("paymentType", payment.getPaymentType());
        row.put("createdTime", payment.getCreatedTime() == null ? null : payment.getCreatedTime().toString());
        return row;
    }

    private Map<String, Object> toEventItem(EventRowProjection event) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", event.getId());
        row.put("type", "IN".equalsIgnoreCase(event.getDirection()) ? "enter" : "exit");
        row.put("datetime", event.getDatetime() == null ? null : event.getDatetime().toString());
        row.put("terminalName", event.getTerminalName());
        return row;
    }
}

