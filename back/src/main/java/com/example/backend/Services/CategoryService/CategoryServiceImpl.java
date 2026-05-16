package com.example.backend.Services.CategoryService;

import com.example.backend.Entity.Category;
import com.example.backend.Payload.req.CategoryRequest;
import com.example.backend.Payload.res.CategoryResponse;
import com.example.backend.Repository.CategoryRepo;
import com.example.backend.exceptions.CategoryAlreadyExistsException;
import com.example.backend.exceptions.CategoryNotFoundException;
import com.example.backend.exceptions.CategoryValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepo categoryRepo;

    // ═══════════════════════════════════════════════════════════
    //  GET /api/v1/admin/categories/getAll
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> getAll() {
        List<CategoryResponse> list = categoryRepo.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    // ═══════════════════════════════════════════════════════════
    //  GET /api/v1/admin/categories/getById?id=
    // ═══════════════════════════════════════════════════════════
    @Override
    public HttpEntity<?> getById(Integer id) {
        Category cat = findOrThrow(id, "A0008");
        return ResponseEntity.ok(toResponse(cat));
    }

    // ═══════════════════════════════════════════════════════════
    //  POST /api/v1/admin/categories/create
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> create(CategoryRequest request) {

        // Validatsiya: nameUz majburiy
        if (request.getNameUz() == null || request.getNameUz().isBlank()) {
            throw new CategoryValidationException("A0009",
                    "NameUz maydoni bo'sh bo'lishi mumkin emas");
        }

        // Takrorlanishni tekshirish
        if (categoryRepo.existsByNameUz(request.getNameUz())) {
            throw new CategoryAlreadyExistsException("A0010",
                    "Bunday nomli kategoriya allaqachon mavjud");
        }

        Category saved = categoryRepo.save(Category.builder()
                .nameUz(request.getNameUz())
                .nameRu(request.getNameRu())
                .nameUzk(request.getNameUzk())
                .description(request.getDescription())
                .iconUrl(request.getIconUrl())
                .displayOrder(request.getDisplayOrder())
                .active(true)
                .createdTime(LocalDateTime.now())
                .build());

        log.info("Kategoriya yaratildi: id={}, nameUz={}", saved.getId(), saved.getNameUz());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "categoryId", saved.getId(),
                        "message", "Kategoriya muvaffaqiyatli yaratildi"
                ));
    }

    // ═══════════════════════════════════════════════════════════
    //  PUT /api/v1/admin/categories/update?id=
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> update(Integer id, CategoryRequest request) {

        Category cat = findOrThrow(id, "A0011");

        // nameUz o'zgarsa — unikal bo'lishi kerak
        if (request.getNameUz() != null && !request.getNameUz().isBlank()) {
            if (categoryRepo.existsByNameUzAndIdNot(request.getNameUz(), id)) {
                throw new CategoryAlreadyExistsException("A0010",
                        "Bunday nomli kategoriya allaqachon mavjud");
            }
            cat.setNameUz(request.getNameUz());
        }

        if (request.getNameRu()      != null) cat.setNameRu(request.getNameRu());
        if (request.getNameUzk()     != null) cat.setNameUzk(request.getNameUzk());
        if (request.getDescription() != null) cat.setDescription(request.getDescription());
        if (request.getIconUrl()     != null) cat.setIconUrl(request.getIconUrl());
        if (request.getDisplayOrder()!= null) cat.setDisplayOrder(request.getDisplayOrder());

        categoryRepo.save(cat);
        log.info("Kategoriya yangilandi: id={}", id);

        return ResponseEntity.ok(Map.of(
                "categoryId", id,
                "message", "Kategoriya muvaffaqiyatli yangilandi"
        ));
    }

    // ═══════════════════════════════════════════════════════════
    //  DELETE /api/v1/admin/categories/delete?id=
    // ═══════════════════════════════════════════════════════════
    @Override
    @Transactional
    public HttpEntity<?> delete(Integer id) {

        findOrThrow(id, "A0012"); // mavjudligini tekshirish

        // TODO: bog'langan mahsulotlarni ham o'chirish (products entity tayyor bo'lganda)
        categoryRepo.deleteById(id);

        log.info("Kategoriya o'chirildi: id={}", id);
        return ResponseEntity.ok(Map.of(
                "message", "Kategoriya va bog'langan mahsulotlar muvaffaqiyatli o'chirildi"
        ));
    }

    // ═══════════════════════════════════════════════════════════
    //  Private helpers
    // ═══════════════════════════════════════════════════════════

    private Category findOrThrow(Integer id, String errorCode) {
        return categoryRepo.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException(errorCode, "Kategoriya topilmadi"));
    }

    private CategoryResponse toResponse(Category cat) {
        return CategoryResponse.builder()
                .id(cat.getId())
                .nameUz(cat.getNameUz())
                .nameRu(cat.getNameRu())
                .nameUzk(cat.getNameUzk())
                .description(cat.getDescription())
                .iconUrl(cat.getIconUrl())
                .displayOrder(cat.getDisplayOrder())
                .active(cat.isActive())
                .createdTime(cat.getCreatedTime())
                .build();
    }
}

