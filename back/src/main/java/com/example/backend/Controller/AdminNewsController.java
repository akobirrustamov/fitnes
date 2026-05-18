package com.example.backend.Controller;

import com.example.backend.Payload.req.NewsCreateRequest;
import com.example.backend.Payload.req.NewsUpdateRequest;
import com.example.backend.Services.NewsService.NewsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/news")
@RequiredArgsConstructor
public class AdminNewsController {

    private final NewsService newsService;

    /**
     * GET /api/v1/admin/news/getAll
     * Barcha yangiliklar ro'yxati (admin uchun)
     */
    @GetMapping("/getAll")
    public HttpEntity<?> getAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        // Admin uchun null orgId o'tkazing (boshqa ma'lumotlar uchun foydalaniladi)
        return newsService.getAll(null, page, pageSize, null);
    }

    /**
     * POST /api/v1/admin/news/create
     * Yangi yangilik yaratish
     */
    @PostMapping("/create")
    public HttpEntity<?> create(@RequestBody NewsCreateRequest request) {
        return newsService.create(request);
    }

    /**
     * PUT /api/v1/admin/news/update
     * Mavjud yangilikni yangilash
     */
    @PutMapping("/update")
    public HttpEntity<?> update(
            @RequestParam Long id,
            @RequestBody NewsUpdateRequest request) {
        return newsService.update(id, request);
    }

    /**
     * DELETE /api/v1/admin/news/delete
     * Yangilikni o'chirish
     */
    @DeleteMapping("/delete")
    public HttpEntity<?> delete(@RequestParam Long id) {
        return newsService.delete(id);
    }
}
