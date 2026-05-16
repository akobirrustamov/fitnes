package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_profiles")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    /** User bilan 1-to-1 bog'liq */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    // ── Director / Organization ──────────────────────────────────
    /** Tashkilotni boshqaruvchi shaxs ismi */
    private String directorName;

    /** Parol maslahatchi */
    private String passwordHint;

    /** Litsenziya kaliti */
    private String licenseKey;

    /** Mahsulot kaliti */
    private String productKey;

    /** Fayl yo'li */
    private String sourcePath;

    /** Telegram bot faolmi */
    @Column(nullable = false)
    private boolean telegramBotActive;

    /** Telefon raqami */
    private String phoneNumber;

    /** Faoliyat sohasi */
    private String businessSphere;

    /** Hisob balansi */
    @Column(precision = 18, scale = 2)
    private BigDecimal balance;

    /** Aktiv holati */
    @Column(nullable = false)
    private boolean active;

    /** Soft-delete flag */
    @Column(nullable = false)
    private boolean deleted;

    /** Navbat yuborish turi */
    private Integer sendTurn;

    /** Profil fotosi URL */
    private String photoUrl;

    /** Oxirgi kirish vaqti */
    private LocalDateTime lastLogin;

    /** Hudud ID */
    private Integer regionId;

    /** Hudud nomi (cache, Region entity kerak bo'lmasligi uchun) */
    private String regionName;

    /** Viloyat ID */
    private Integer provinceId;

    /** Viloyat nomi (Region uchun cache) */
    private String provinceName;

    /** Manzil */
    private String location;

    /** Admin ismi */
    private String adminName;

    /** Admin telefon raqami */
    private String adminPhoneNumber;

    /** Monitor ID */
    private Integer monitorId;

    // ── Super Admin extra ────────────────────────────────────────
    /** Qo'shimcha tavsif (super_admin uchun) */
    private String description;

    /** Yangilanish vaqti */
    private LocalDateTime updatedAt;
}

