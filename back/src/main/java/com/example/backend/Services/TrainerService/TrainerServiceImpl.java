package com.example.backend.Services.TrainerService;

import com.example.backend.Entity.Payment;
import com.example.backend.Entity.Person;
import com.example.backend.Entity.Trainer;
import com.example.backend.Payload.req.*;
import com.example.backend.Repository.PaymentRepo;
import com.example.backend.Repository.PersonRepo;
import com.example.backend.Repository.TrainerRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrainerServiceImpl implements TrainerService {

    private final TrainerRepo trainerRepo;
    private final PersonRepo personRepo;
    private final PaymentRepo paymentRepo;

    @Override
    public HttpEntity<?> getAll(Integer orgId) {
        List<Trainer> trainers = trainerRepo.findByOrganizationIdAndDeletedFalseOrderByCreatedTimeDesc(orgId);

        List<Map<String, Object>> data = trainers.stream().map(trainer -> {
            long studentsCount = personRepo.countByOrganizationIdAndDeletedFalseAndTrainerId(orgId, trainer.getId());
            BigDecimal expectedIncome = nvl(trainer.getPrice()).multiply(BigDecimal.valueOf(studentsCount));
            BigDecimal actualIncome = nvl(paymentRepo.sumIncomeThisMonthByTrainer(orgId, trainer.getId()));

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", trainer.getId());
            row.put("fullname", trainer.getFullname());
            row.put("photoUrl", trainer.getPhotoUrl());
            row.put("achievements", trainer.getAchievements());
            row.put("price", trainer.getPrice());
            row.put("phoneNumber", trainer.getPhoneNumber());
            row.put("specialization", trainer.getSpecialization());
            row.put("experienceYears", trainer.getExperienceYears());
            row.put("active", trainer.isActive());
            row.put("studentsCount", studentsCount);
            row.put("expectedIncomeThisMonth", expectedIncome);
            row.put("actualIncomeThisMonth", actualIncome);
            row.put("createdTime", trainer.getCreatedTime() == null ? null : trainer.getCreatedTime().toString());
            return row;
        }).toList();

        return ResponseEntity.ok(data);
    }

    @Override
    public HttpEntity<?> getById(Integer orgId, Long id) {
        Trainer trainer = trainerRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElse(null);
        if (trainer == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Murabbiy topilmadi"));
        }

        List<Person> students = personRepo.findByOrganizationIdAndDeletedFalseAndTrainerIdOrderByIdDesc(orgId, id);
        List<Map<String, Object>> studentItems = students.stream().map(student -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", student.getId());
            row.put("fullname", student.getFullName());
            row.put("photoUrl", student.getPhotoUrl());
            row.put("subscriptionEndDate", student.getSubscriptionEnd() == null ? null : student.getSubscriptionEnd().toString());
            return row;
        }).toList();

        Map<String, Object> trainerMap = new LinkedHashMap<>();
        trainerMap.put("id", trainer.getId());
        trainerMap.put("fullname", trainer.getFullname());
        trainerMap.put("photoUrl", trainer.getPhotoUrl());
        trainerMap.put("price", trainer.getPrice());
        trainerMap.put("studentsCount", students.size());

        return ResponseEntity.ok(Map.of(
                "trainer", trainerMap,
                "students", studentItems
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> create(Integer orgId, TrainerCreateRequest request) {
        if (request.getFullname() == null || request.getFullname().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "fullname majburiy"));
        }

        Trainer saved = trainerRepo.save(Trainer.builder()
                .organizationId(orgId)
                .fullname(request.getFullname())
                .photoUrl(request.getPhotoUrl())
                .achievements(request.getAchievements())
                .price(nvl(request.getPrice()))
                .phoneNumber(request.getPhoneNumber())
                .specialization(request.getSpecialization())
                .experienceYears(request.getExperienceYears())
                .bio(request.getBio())
                .active(request.getActive() == null || request.getActive())
                .createdTime(LocalDateTime.now())
                .updatedTime(null)
                .deleted(false)
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", saved.getId(),
                "message", "Murabbiy muvaffaqiyatli qo'shildi"
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> update(Integer orgId, Long id, TrainerUpdateRequest request) {
        Trainer trainer = trainerRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElse(null);
        if (trainer == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Murabbiy topilmadi"));
        }

        if (request.getFullname() != null && !request.getFullname().isBlank()) trainer.setFullname(request.getFullname());
        if (request.getPhotoUrl() != null) trainer.setPhotoUrl(request.getPhotoUrl());
        if (request.getAchievements() != null) trainer.setAchievements(request.getAchievements());
        if (request.getPrice() != null) trainer.setPrice(request.getPrice());
        if (request.getPhoneNumber() != null) trainer.setPhoneNumber(request.getPhoneNumber());
        if (request.getSpecialization() != null) trainer.setSpecialization(request.getSpecialization());
        if (request.getExperienceYears() != null) trainer.setExperienceYears(request.getExperienceYears());
        if (request.getBio() != null) trainer.setBio(request.getBio());
        if (request.getActive() != null) trainer.setActive(request.getActive());
        trainer.setUpdatedTime(LocalDateTime.now());

        trainerRepo.save(trainer);

        return ResponseEntity.ok(Map.of("message", "Murabbiy muvaffaqiyatli yangilandi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> delete(Integer orgId, Long id) {
        Trainer trainer = trainerRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElse(null);
        if (trainer == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Murabbiy topilmadi"));
        }

        personRepo.clearTrainerByTrainerId(orgId, id);
        trainer.setDeleted(true);
        trainer.setActive(false);
        trainer.setUpdatedTime(LocalDateTime.now());
        trainerRepo.save(trainer);

        return ResponseEntity.ok(Map.of("message", "Murabbiy muvaffaqiyatli o'chirildi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> addStudent(Integer orgId, Long trainerId, TrainerAddStudentRequest request) {
        if (!trainerRepo.existsByIdAndOrganizationIdAndDeletedFalse(trainerId, orgId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Murabbiy topilmadi"));
        }

        Person person = personRepo.findByIdAndOrganizationIdAndDeletedFalse(request.getPersonId(), orgId)
                .orElse(null);
        if (person == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shogird topilmadi"));
        }

        person.setTrainerId(trainerId);
        person.setUpdatedTime(LocalDateTime.now());
        personRepo.save(person);

        return ResponseEntity.ok(Map.of("message", "Shogird muvaffaqiyatli qo'shildi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> removeStudent(Integer orgId, Long trainerId, Long personId) {
        if (!trainerRepo.existsByIdAndOrganizationIdAndDeletedFalse(trainerId, orgId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Murabbiy topilmadi"));
        }

        Person person = personRepo.findByIdAndOrganizationIdAndDeletedFalse(personId, orgId)
                .orElse(null);
        if (person == null || person.getTrainerId() == null || !trainerId.equals(person.getTrainerId())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shogird topilmadi"));
        }

        person.setTrainerId(null);
        person.setUpdatedTime(LocalDateTime.now());
        personRepo.save(person);

        return ResponseEntity.ok(Map.of("message", "Shogird muvaffaqiyatli uzildi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> extendStudentSubscription(Integer orgId,
                                                   Long trainerId,
                                                   TrainerExtendStudentSubscriptionRequest request) {
        if (!trainerRepo.existsByIdAndOrganizationIdAndDeletedFalse(trainerId, orgId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Murabbiy topilmadi"));
        }

        Person person = personRepo.findByIdAndOrganizationIdAndDeletedFalse(request.getPersonId(), orgId)
                .orElse(null);
        if (person == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Shogird topilmadi"));
        }

        BigDecimal price = nvl(request.getPrice());
        BigDecimal paid = nvl(request.getPaidAmount());

        LocalDate oldEnd = person.getSubscriptionEnd();
        LocalDate start = oldEnd != null && oldEnd.isAfter(LocalDate.now()) ? oldEnd : LocalDate.now();
        LocalDate newEndDate = start.plusMonths(1);

        BigDecimal oldDebt = nvl(person.getDebt());
        BigDecimal newDebt = oldDebt.add(price.subtract(paid).max(BigDecimal.ZERO));

        person.setSubscriptionEnd(newEndDate);
        person.setDebt(newDebt);
        person.setTrainerId(trainerId);
        person.setUpdatedTime(LocalDateTime.now());
        personRepo.save(person);

        paymentRepo.save(Payment.builder()
                .organizationId(orgId)
                .personId(person.getId())
                .category("trainer")
                .amount(price)
                .price(price)
                .paymentType("expense")
                .isImportant(true)
                .description("Murabbiy obuna narxi")
                .paymentDate(LocalDateTime.now())
                .createdTime(LocalDateTime.now())
                .build());

        paymentRepo.save(Payment.builder()
                .organizationId(orgId)
                .personId(person.getId())
                .category("trainer")
                .amount(paid)
                .price(paid)
                .paymentType("income")
                .isImportant(true)
                .description("Murabbiy obuna to'lovi")
                .paymentDate(LocalDateTime.now())
                .createdTime(LocalDateTime.now())
                .build());

        return ResponseEntity.ok(Map.of(
                "message", "Obuna muvaffaqiyatli uzaytirildi",
                "newEndDate", newEndDate,
                "debt", newDebt
        ));
    }

    private BigDecimal nvl(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
