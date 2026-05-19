package com.example.backend.Services.MarketService;

import com.example.backend.Entity.*;
import com.example.backend.Payload.req.*;
import com.example.backend.Repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketServiceImpl implements MarketService {

    private final MarketProductRepo marketProductRepo;
    private final MarketSaleRepo marketSaleRepo;
    private final MarketSaleItemRepo marketSaleItemRepo;
    private final CategoryRepo categoryRepo;
    private final PersonRepo personRepo;
    private final PaymentRepo paymentRepo;

    @Override
    public HttpEntity<?> getAll(Integer orgId, Integer categoryId, int page, int limit) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(500, Math.max(1, limit));

        Page<MarketProduct> productsPage = categoryId == null
                ? marketProductRepo.findByOrganizationIdAndDeletedFalseOrderByCreatedTimeDesc(orgId, PageRequest.of(safePage - 1, safeLimit))
                : marketProductRepo.findByOrganizationIdAndCategoryIdAndDeletedFalseOrderByCreatedTimeDesc(orgId, categoryId, PageRequest.of(safePage - 1, safeLimit));

        Map<Integer, String> categoryNames = buildCategoryNameMap(productsPage.getContent());

        List<Map<String, Object>> data = productsPage.getContent().stream().map(p -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", p.getId());
            row.put("name", p.getName());
            row.put("description", p.getDescription());
            row.put("photoUrl", p.getPhotoUrl());
            row.put("price", p.getPrice());
            row.put("stockCount", p.getStockCount());
            row.put("active", p.isActive());
            row.put("barcode", p.getBarcode());
            row.put("categoryId", p.getCategoryId());
            row.put("categoryName", p.getCategoryId() == null ? "" : categoryNames.getOrDefault(p.getCategoryId(), ""));
            row.put("createdTime", p.getCreatedTime() == null ? null : p.getCreatedTime().toString());
            return row;
        }).toList();

        return ResponseEntity.ok(Map.of(
                "data", data,
                "totalCount", productsPage.getTotalElements(),
                "page", safePage,
                "limit", safeLimit,
                "totalPages", productsPage.getTotalPages()
        ));
    }

    @Override
    public HttpEntity<?> getById(Integer orgId, Long id) {
        MarketProduct p = marketProductRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId).orElse(null);
        if (p == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Mahsulot topilmadi"));
        }

        String categoryName = "";
        if (p.getCategoryId() != null) {
            categoryName = categoryRepo.findById(p.getCategoryId()).map(Category::getNameUz).orElse("");
        }

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", p.getId());
        row.put("name", p.getName());
        row.put("description", p.getDescription());
        row.put("photoUrl", p.getPhotoUrl());
        row.put("price", p.getPrice());
        row.put("stockCount", p.getStockCount());
        row.put("active", p.isActive());
        row.put("barcode", p.getBarcode());
        row.put("categoryId", p.getCategoryId());
        row.put("categoryName", categoryName);
        return ResponseEntity.ok(row);
    }

    @Override
    @Transactional
    public HttpEntity<?> create(Integer orgId, MarketProductCreateRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "name majburiy"));
        }

        MarketProduct saved = marketProductRepo.save(MarketProduct.builder()
                .organizationId(orgId)
                .categoryId(request.getCategoryId())
                .name(request.getName())
                .description(request.getDescription())
                .photoUrl(request.getPhotoUrl())
                .price(nvl(request.getPrice()))
                .stockCount(request.getStockCount() == null ? 0 : Math.max(0, request.getStockCount()))
                .active(request.getActive() == null || request.getActive())
                .barcode(request.getBarcode())
                .createdTime(LocalDateTime.now())
                .updatedTime(null)
                .deleted(false)
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", saved.getId(),
                "message", "Mahsulot muvaffaqiyatli qo'shildi"
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> update(Integer orgId, Long id, MarketProductUpdateRequest request) {
        MarketProduct p = marketProductRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId).orElse(null);
        if (p == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Mahsulot topilmadi"));
        }

        if (request.getCategoryId() != null) p.setCategoryId(request.getCategoryId());
        if (request.getName() != null) p.setName(request.getName());
        if (request.getDescription() != null) p.setDescription(request.getDescription());
        if (request.getPhotoUrl() != null) p.setPhotoUrl(request.getPhotoUrl());
        if (request.getPrice() != null) p.setPrice(request.getPrice());
        if (request.getStockCount() != null) p.setStockCount(Math.max(0, request.getStockCount()));
        if (request.getActive() != null) p.setActive(request.getActive());
        if (request.getBarcode() != null) p.setBarcode(request.getBarcode());
        p.setUpdatedTime(LocalDateTime.now());

        marketProductRepo.save(p);

        return ResponseEntity.ok(Map.of("message", "Mahsulot muvaffaqiyatli yangilandi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> delete(Integer orgId, Long id) {
        MarketProduct p = marketProductRepo.findByIdAndOrganizationIdAndDeletedFalse(id, orgId).orElse(null);
        if (p == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Mahsulot topilmadi"));
        }

        p.setDeleted(true);
        p.setActive(false);
        p.setUpdatedTime(LocalDateTime.now());
        marketProductRepo.save(p);

        return ResponseEntity.ok(Map.of("message", "Mahsulot muvaffaqiyatli o'chirildi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> sell(Integer orgId, MarketSellRequest request) {
        if (request.getPersonId() == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Mijoz topilmadi"));
        }

        Person person = personRepo.findByIdAndOrganizationIdAndDeletedFalse(request.getPersonId(), orgId).orElse(null);
        if (person == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Mijoz topilmadi"));
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "items bo'sh bo'lishi mumkin emas"));
        }

        Map<Long, MarketProduct> selectedProducts = new HashMap<>();
        BigDecimal totalPrice = BigDecimal.ZERO;

        for (MarketSellItemRequest item : request.getItems()) {
            if (item.getProductId() == null || item.getAmount() == null || item.getAmount() <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "Sotuv elementi noto'g'ri"));
            }

            MarketProduct product = marketProductRepo
                    .findByIdAndOrganizationIdAndDeletedFalseAndActiveTrue(item.getProductId(), orgId)
                    .orElse(null);
            if (product == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "message", "Mahsulot topilmadi",
                        "productId", item.getProductId()
                ));
            }
            if (product.getStockCount() < item.getAmount()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "message", "Stock yetarli emas",
                        "productId", item.getProductId()
                ));
            }

            selectedProducts.put(item.getProductId(), product);
            BigDecimal unitPrice = item.getPrice() != null ? item.getPrice() : nvl(product.getPrice());
            totalPrice = totalPrice.add(unitPrice.multiply(BigDecimal.valueOf(item.getAmount())));
        }

        BigDecimal paidAmount = nvl(request.getPaidAmount());

        MarketSale sale = marketSaleRepo.save(MarketSale.builder()
                .organizationId(orgId)
                .personId(person.getId())
                .totalPrice(totalPrice)
                .paidAmount(paidAmount)
                .createdTime(LocalDateTime.now())
                .build());

        for (MarketSellItemRequest item : request.getItems()) {
            MarketProduct product = selectedProducts.get(item.getProductId());
            BigDecimal unitPrice = item.getPrice() != null ? item.getPrice() : nvl(product.getPrice());
            String productName = item.getProductName() != null ? item.getProductName() : product.getName();

            marketSaleItemRepo.save(MarketSaleItem.builder()
                    .saleId(sale.getId())
                    .productId(product.getId())
                    .productName(productName)
                    .amount(item.getAmount())
                    .price(unitPrice)
                    .build());

            product.setStockCount(product.getStockCount() - item.getAmount());
            product.setUpdatedTime(LocalDateTime.now());
            marketProductRepo.save(product);
        }

        BigDecimal debtForSale = totalPrice.subtract(paidAmount).max(BigDecimal.ZERO);

        paymentRepo.save(Payment.builder()
                .organizationId(orgId)
                .personId(person.getId())
                .category("market")
                .amount(paidAmount)
                .price(paidAmount)
                .paymentType("income")
                .isImportant(true)
                .description("Market mahsulotlari sotuvi")
                .paymentDate(LocalDateTime.now())
                .createdTime(LocalDateTime.now())
                .build());

        if (debtForSale.compareTo(BigDecimal.ZERO) > 0) {
            person.setDebt(nvl(person.getDebt()).add(debtForSale));
            person.setUpdatedTime(LocalDateTime.now());
            personRepo.save(person);
        }

        return ResponseEntity.ok(Map.of(
                "message", "Mahsulotlar muvaffaqiyatli sotildi",
                "totalPrice", totalPrice,
                "paidAmount", paidAmount,
                "debt", debtForSale
        ));
    }

    @Override
    public HttpEntity<?> getSales(Integer orgId, int page, int limit) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(200, Math.max(1, limit));

        Page<MarketSale> salesPage = marketSaleRepo.findByOrganizationIdOrderByCreatedTimeDesc(
                orgId, PageRequest.of(safePage - 1, safeLimit));

        List<Map<String, Object>> data = salesPage.getContent().stream().map(sale -> {
            List<MarketSaleItem> items = marketSaleItemRepo.findBySaleId(sale.getId());

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", sale.getId());
            row.put("personId", sale.getPersonId());
            row.put("totalPrice", sale.getTotalPrice());
            row.put("paidAmount", sale.getPaidAmount());
            row.put("debt", sale.getTotalPrice().subtract(sale.getPaidAmount()).max(BigDecimal.ZERO));
            row.put("createdTime", sale.getCreatedTime() == null ? null : sale.getCreatedTime().toString());
            row.put("items", items.stream().map(item -> {
                Map<String, Object> itemRow = new LinkedHashMap<>();
                itemRow.put("id", item.getId());
                itemRow.put("productId", item.getProductId());
                itemRow.put("productName", item.getProductName());
                itemRow.put("amount", item.getAmount());
                itemRow.put("price", item.getPrice());
                return itemRow;
            }).toList());
            return row;
        }).toList();

        return ResponseEntity.ok(Map.of(
                "data", data,
                "totalCount", salesPage.getTotalElements(),
                "page", safePage,
                "limit", safeLimit,
                "totalPages", salesPage.getTotalPages()
        ));
    }

    @Override
    public HttpEntity<?> getSuggestions(Integer categoryId) {
        List<String> names = categoryId != null
                ? marketProductRepo.findDistinctNamesByCategoryId(categoryId)
                : marketProductRepo.findAllDistinctNames();
        return ResponseEntity.ok(names);
    }

    private BigDecimal nvl(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private Map<Integer, String> buildCategoryNameMap(List<MarketProduct> products) {
        Set<Integer> ids = new HashSet<>();
        for (MarketProduct p : products) {
            if (p.getCategoryId() != null) ids.add(p.getCategoryId());
        }

        Map<Integer, String> map = new HashMap<>();
        if (!ids.isEmpty()) {
            for (Category c : categoryRepo.findAllById(ids)) {
                map.put(c.getId(), c.getNameUz() == null ? "" : c.getNameUz());
            }
        }
        return map;
    }
}

