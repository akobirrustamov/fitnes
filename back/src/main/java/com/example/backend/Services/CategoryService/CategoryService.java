package com.example.backend.Services.CategoryService;

import com.example.backend.Payload.req.CategoryRequest;
import org.springframework.http.HttpEntity;

public interface CategoryService {

    /** GET /api/v1/admin/categories/getAll */
    HttpEntity<?> getAll();

    /** GET /api/v1/admin/categories/getById?id= */
    HttpEntity<?> getById(Integer id);

    /** POST /api/v1/admin/categories/create */
    HttpEntity<?> create(CategoryRequest request);

    /** PUT /api/v1/admin/categories/update?id= */
    HttpEntity<?> update(Integer id, CategoryRequest request);

    /** DELETE /api/v1/admin/categories/delete?id= */
    HttpEntity<?> delete(Integer id);
}

