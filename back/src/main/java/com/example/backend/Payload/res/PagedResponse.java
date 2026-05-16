package com.example.backend.Payload.res;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Paginatsiyali ro'yxat response uchun universal wrapper.
 * <pre>
 * {
 *   "data": [...],
 *   "totalCount": 45,
 *   "page": 1,
 *   "limit": 20,
 *   "totalPages": 3
 * }
 * </pre>
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PagedResponse<T> {
    private List<T> data;
    private long totalCount;
    private int page;
    private int limit;
    private int totalPages;
}

