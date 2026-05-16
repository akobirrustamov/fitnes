package com.example.backend.Services.MarketService;

import com.example.backend.Payload.req.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketServiceImpl implements MarketService {

    private final JdbcTemplate jdbc;
    private final Map<String, Boolean> columnExistsCache = new ConcurrentHashMap<>();

    @Override
    public HttpEntity<?> getAll(Integer orgId, Integer categoryId, int page, int limit) {
        ensureMarketTables();

        int safePage = Math.max(1, page);
        int safeLimit = Math.min(500, Math.max(1, limit));

        StringBuilder where = new StringBuilder(" WHERE p.organization_id=? AND p.deleted=false ");
        List<Object> params = new ArrayList<>();
        params.add(orgId);
        if (categoryId != null) {
            where.append(" AND p.category_id=? ");
            params.add(categoryId);
        }

        Long total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM market_products p " + where,
                Long.class,
                params.toArray()
        );

        List<Object> listParams = new ArrayList<>(params);
        listParams.add(safeLimit);
        listParams.add((safePage - 1L) * safeLimit);

        List<Map<String, Object>> data = jdbc.query(
                "SELECT p.id, p.name, p.description, p.photo_url, p.price, p.stock_count, p.active, p.barcode, p.category_id, " +
                        "COALESCE(c.name_uz, c.nameUz, '') AS category_name, p.created_time " +
                        "FROM market_products p " +
                        "LEFT JOIN categories c ON c.id = p.category_id " +
                        where +
                        " ORDER BY p.created_time DESC LIMIT ? OFFSET ?",
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("name", rs.getString("name"));
                    row.put("description", rs.getString("description"));
                    row.put("photoUrl", rs.getString("photo_url"));
                    row.put("price", rs.getBigDecimal("price"));
                    row.put("stockCount", rs.getInt("stock_count"));
                    row.put("active", rs.getBoolean("active"));
                    row.put("barcode", rs.getString("barcode"));
                    row.put("categoryId", rs.getObject("category_id") == null ? null : rs.getInt("category_id"));
                    row.put("categoryName", rs.getString("category_name"));
                    Object created = rs.getObject("created_time");
                    row.put("createdTime", created == null ? null : created.toString());
                    return row;
                },
                listParams.toArray()
        );

        long safeTotal = total == null ? 0L : total;
        return ResponseEntity.ok(Map.of(
                "data", data,
                "totalCount", safeTotal,
                "page", safePage,
                "limit", safeLimit,
                "totalPages", (int) Math.ceil(safeTotal / (double) safeLimit)
        ));
    }

    @Override
    public HttpEntity<?> getById(Integer orgId, Long id) {
        ensureMarketTables();

        List<Map<String, Object>> rows = jdbc.query(
                "SELECT p.id, p.name, p.description, p.photo_url, p.price, p.stock_count, p.active, p.barcode, p.category_id, " +
                        "COALESCE(c.name_uz, c.nameUz, '') AS category_name " +
                        "FROM market_products p " +
                        "LEFT JOIN categories c ON c.id = p.category_id " +
                        "WHERE p.id=? AND p.organization_id=? AND p.deleted=false",
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getLong("id"));
                    row.put("name", rs.getString("name"));
                    row.put("description", rs.getString("description"));
                    row.put("photoUrl", rs.getString("photo_url"));
                    row.put("price", rs.getBigDecimal("price"));
                    row.put("stockCount", rs.getInt("stock_count"));
                    row.put("active", rs.getBoolean("active"));
                    row.put("barcode", rs.getString("barcode"));
                    row.put("categoryId", rs.getObject("category_id") == null ? null : rs.getInt("category_id"));
                    row.put("categoryName", rs.getString("category_name"));
                    return row;
                },
                id, orgId
        );

        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Mahsulot topilmadi"));
        }
        return ResponseEntity.ok(rows.get(0));
    }

    @Override
    @Transactional
    public HttpEntity<?> create(Integer orgId, MarketProductCreateRequest request) {
        ensureMarketTables();

        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "name majburiy"));
        }

        Long id = jdbc.queryForObject(
                "INSERT INTO market_products(organization_id, category_id, name, description, photo_url, price, stock_count, active, barcode, created_time, deleted) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), false) RETURNING id",
                Long.class,
                orgId,
                request.getCategoryId(),
                request.getName(),
                request.getDescription(),
                request.getPhotoUrl(),
                nvl(request.getPrice()),
                request.getStockCount() == null ? 0 : Math.max(0, request.getStockCount()),
                request.getActive() == null || request.getActive(),
                request.getBarcode()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", id,
                "message", "Mahsulot muvaffaqiyatli qo'shildi"
        ));
    }

    @Override
    @Transactional
    public HttpEntity<?> update(Integer orgId, Long id, MarketProductUpdateRequest request) {
        ensureMarketTables();

        if (!productExists(orgId, id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Mahsulot topilmadi"));
        }

        Integer stock = request.getStockCount();
        if (stock != null && stock < 0) stock = 0;

        jdbc.update(
                "UPDATE market_products SET " +
                        "category_id = COALESCE(?, category_id), " +
                        "name = COALESCE(?, name), " +
                        "description = COALESCE(?, description), " +
                        "photo_url = COALESCE(?, photo_url), " +
                        "price = COALESCE(?, price), " +
                        "stock_count = COALESCE(?, stock_count), " +
                        "active = COALESCE(?, active), " +
                        "barcode = COALESCE(?, barcode), " +
                        "updated_time = NOW() " +
                        "WHERE id=? AND organization_id=? AND deleted=false",
                request.getCategoryId(),
                request.getName(),
                request.getDescription(),
                request.getPhotoUrl(),
                request.getPrice(),
                stock,
                request.getActive(),
                request.getBarcode(),
                id,
                orgId
        );

        return ResponseEntity.ok(Map.of("message", "Mahsulot muvaffaqiyatli yangilandi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> delete(Integer orgId, Long id) {
        ensureMarketTables();

        if (!productExists(orgId, id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Mahsulot topilmadi"));
        }

        jdbc.update("UPDATE market_products SET deleted=true, active=false, updated_time=NOW() WHERE id=? AND organization_id=?", id, orgId);
        return ResponseEntity.ok(Map.of("message", "Mahsulot muvaffaqiyatli o'chirildi"));
    }

    @Override
    @Transactional
    public HttpEntity<?> sell(Integer orgId, MarketSellRequest request) {
        ensureMarketTables();

        if (request.getPersonId() == null || !personExists(orgId, request.getPersonId())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Mijoz topilmadi"));
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "items bo'sh bo'lishi mumkin emas"));
        }

        BigDecimal totalPrice = BigDecimal.ZERO;

        for (MarketSellItemRequest item : request.getItems()) {
            if (item.getProductId() == null || item.getAmount() == null || item.getAmount() <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "Sotuv elementi noto'g'ri"));
            }

            Map<String, Object> product = jdbc.queryForMap(
                    "SELECT id, name, price, stock_count FROM market_products WHERE id=? AND organization_id=? AND deleted=false AND active=true",
                    item.getProductId(), orgId
            );

            int stock = ((Number) product.get("stock_count")).intValue();
            if (stock < item.getAmount()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "message", "Stock yetarli emas",
                        "productId", item.getProductId()
                ));
            }

            BigDecimal unitPrice = item.getPrice() != null ? item.getPrice() : (BigDecimal) product.get("price");
            totalPrice = totalPrice.add(unitPrice.multiply(BigDecimal.valueOf(item.getAmount())));
        }

        Long saleId = jdbc.queryForObject(
                "INSERT INTO market_sales(organization_id, person_id, total_price, paid_amount, created_time) VALUES (?, ?, ?, ?, NOW()) RETURNING id",
                Long.class,
                orgId,
                request.getPersonId(),
                totalPrice,
                nvl(request.getPaidAmount())
        );

        for (MarketSellItemRequest item : request.getItems()) {
            Map<String, Object> product = jdbc.queryForMap(
                    "SELECT id, name, price, stock_count FROM market_products WHERE id=? AND organization_id=? AND deleted=false",
                    item.getProductId(), orgId
            );

            BigDecimal unitPrice = item.getPrice() != null ? item.getPrice() : (BigDecimal) product.get("price");
            String productName = item.getProductName() != null ? item.getProductName() : String.valueOf(product.get("name"));

            jdbc.update(
                    "INSERT INTO market_sale_items(sale_id, product_id, product_name, amount, price) VALUES (?, ?, ?, ?, ?)",
                    saleId,
                    item.getProductId(),
                    productName,
                    item.getAmount(),
                    unitPrice
            );

            jdbc.update(
                    "UPDATE market_products SET stock_count = stock_count - ?, updated_time = NOW() WHERE id=? AND organization_id=?",
                    item.getAmount(),
                    item.getProductId(),
                    orgId
            );
        }

        BigDecimal paidAmount = nvl(request.getPaidAmount());
        BigDecimal debtForSale = totalPrice.subtract(paidAmount).max(BigDecimal.ZERO);

        insertPayment(orgId, request.getPersonId(), "market", "income", paidAmount, "Market mahsulotlari sotuvi");

        if (hasColumn("persons", "debt") && debtForSale.compareTo(BigDecimal.ZERO) > 0) {
            jdbc.update("UPDATE persons SET debt = COALESCE(debt,0) + ? WHERE id=? AND organization_id=?",
                    debtForSale, request.getPersonId(), orgId);
        }

        return ResponseEntity.ok(Map.of(
                "message", "Mahsulotlar muvaffaqiyatli sotildi",
                "totalPrice", totalPrice,
                "paidAmount", paidAmount,
                "debt", debtForSale
        ));
    }

    private void ensureMarketTables() {
        jdbc.execute("CREATE TABLE IF NOT EXISTS market_products (" +
                "id BIGSERIAL PRIMARY KEY," +
                "organization_id INTEGER NOT NULL," +
                "category_id INTEGER," +
                "name VARCHAR(255) NOT NULL," +
                "description VARCHAR(1000)," +
                "photo_url VARCHAR(500)," +
                "price DECIMAL(18,2) NOT NULL DEFAULT 0," +
                "stock_count INTEGER NOT NULL DEFAULT 0," +
                "active BOOLEAN NOT NULL DEFAULT true," +
                "barcode VARCHAR(100)," +
                "created_time TIMESTAMP NOT NULL DEFAULT NOW()," +
                "updated_time TIMESTAMP," +
                "deleted BOOLEAN NOT NULL DEFAULT false" +
                ")");
        jdbc.execute("CREATE INDEX IF NOT EXISTS idx_market_products_org ON market_products(organization_id)");
        jdbc.execute("CREATE INDEX IF NOT EXISTS idx_market_products_category ON market_products(category_id)");

        jdbc.execute("CREATE TABLE IF NOT EXISTS market_sales (" +
                "id BIGSERIAL PRIMARY KEY," +
                "organization_id INTEGER NOT NULL," +
                "person_id BIGINT NOT NULL," +
                "total_price DECIMAL(18,2) NOT NULL," +
                "paid_amount DECIMAL(18,2) NOT NULL DEFAULT 0," +
                "created_time TIMESTAMP NOT NULL DEFAULT NOW()" +
                ")");
        jdbc.execute("CREATE INDEX IF NOT EXISTS idx_market_sales_org ON market_sales(organization_id)");

        jdbc.execute("CREATE TABLE IF NOT EXISTS market_sale_items (" +
                "id BIGSERIAL PRIMARY KEY," +
                "sale_id BIGINT NOT NULL REFERENCES market_sales(id) ON DELETE CASCADE," +
                "product_id BIGINT NOT NULL," +
                "product_name VARCHAR(255)," +
                "amount INTEGER NOT NULL," +
                "price DECIMAL(18,2) NOT NULL" +
                ")");
        jdbc.execute("CREATE INDEX IF NOT EXISTS idx_market_sale_items_sale ON market_sale_items(sale_id)");
    }

    private boolean productExists(Integer orgId, Long id) {
        Boolean exists = jdbc.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM market_products WHERE id=? AND organization_id=? AND deleted=false)",
                Boolean.class,
                id,
                orgId
        );
        return Boolean.TRUE.equals(exists);
    }

    private boolean personExists(Integer orgId, Long personId) {
        Boolean exists = jdbc.queryForObject(
                "SELECT EXISTS(SELECT 1 FROM persons WHERE id=? AND organization_id=? AND deleted=false)",
                Boolean.class,
                personId,
                orgId
        );
        return Boolean.TRUE.equals(exists);
    }

    private BigDecimal nvl(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private void insertPayment(Integer orgId,
                               Long personId,
                               String category,
                               String paymentType,
                               BigDecimal amount,
                               String description) {

        List<String> cols = new ArrayList<>(List.of("organization_id", "person_id"));
        List<Object> vals = new ArrayList<>(List.of(orgId, personId));

        if (hasColumn("payments", "category")) {
            cols.add("category");
            vals.add(category);
        }
        if (hasColumn("payments", "payment_type")) {
            cols.add("payment_type");
            vals.add(paymentType);
        }
        if (hasColumn("payments", "amount")) {
            cols.add("amount");
            vals.add(amount);
        }
        if (hasColumn("payments", "price")) {
            cols.add("price");
            vals.add(amount);
        }
        if (hasColumn("payments", "description")) {
            cols.add("description");
            vals.add(description);
        }
        if (hasColumn("payments", "is_important")) {
            cols.add("is_important");
            vals.add(true);
        }
        if (hasColumn("payments", "created_time")) {
            cols.add("created_time");
            vals.add(LocalDateTime.now());
        }
        if (hasColumn("payments", "payment_date")) {
            cols.add("payment_date");
            vals.add(LocalDateTime.now());
        }

        String placeholders = String.join(",", Collections.nCopies(cols.size(), "?"));
        jdbc.update("INSERT INTO payments(" + String.join(",", cols) + ") VALUES(" + placeholders + ")", vals.toArray());
    }

    private boolean hasColumn(String table, String column) {
        String key = table + "." + column;
        return columnExistsCache.computeIfAbsent(key, k -> {
            try {
                Boolean exists = jdbc.queryForObject(
                        "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = ? AND column_name = ?)",
                        Boolean.class,
                        table,
                        column
                );
                return Boolean.TRUE.equals(exists);
            } catch (Exception e) {
                return false;
            }
        });
    }
}

