package com.example.backend.Controller;

import com.example.backend.Payload.req.CategoryRequest;
import com.example.backend.Services.CategoryService.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/admin/categories")
public class CategoriesController {

    private final CategoryService categoryService;

    // ────────────────────────────────────────────────────────────
    //  GET /api/v1/admin/categories/getAll
    //  Auth: [super_admin]
    //  200 → [ { id, nameUz, nameRu, nameUzk, description,
    //             iconUrl, displayOrder, active, createdTime } ]
    // ────────────────────────────────────────────────────────────
    @GetMapping("/getAll")
    public HttpEntity<?> getAll() {
        return categoryService.getAll();
    }

    // ────────────────────────────────────────────────────────────
    //  GET /api/v1/admin/categories/getById?id=1
    //  Auth: [super_admin]
    //  200 → CategoryResponse
    //  404 → { errorCode: "A0008", message: "Kategoriya topilmadi" }
    // ────────────────────────────────────────────────────────────
    @GetMapping("/getById")
    public HttpEntity<?> getById(@RequestParam Integer id) {
        return categoryService.getById(id);
    }

    // ────────────────────────────────────────────────────────────
    //  POST /api/v1/admin/categories/create
    //  Auth: [super_admin]
    //  Body: CategoryRequest
    //  201 → { categoryId, message }
    //  400 → { errorCode: "A0009" }
    //  409 → { errorCode: "A0010" }
    // ────────────────────────────────────────────────────────────
    @PostMapping("/create")
    public HttpEntity<?> create(@RequestBody CategoryRequest request) {
        return categoryService.create(request);
    }

    // ────────────────────────────────────────────────────────────
    //  PUT /api/v1/admin/categories/update?id=1
    //  Auth: [super_admin]
    //  Body: CategoryRequest
    //  200 → { categoryId, message }
    //  404 → { errorCode: "A0011" }
    // ────────────────────────────────────────────────────────────
    @PutMapping("/update")
    public HttpEntity<?> update(@RequestParam Integer id,
                                @RequestBody CategoryRequest request) {
        return categoryService.update(id, request);
    }

    // ────────────────────────────────────────────────────────────
    //  DELETE /api/v1/admin/categories/delete?id=1
    //  Auth: [super_admin]
    //  200 → { message }
    //  404 → { errorCode: "A0012" }
    // ────────────────────────────────────────────────────────────
    @DeleteMapping("/delete")
    public HttpEntity<?> delete(@RequestParam Integer id) {
        return categoryService.delete(id);
    }
}

