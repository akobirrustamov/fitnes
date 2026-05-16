package com.example.backend.Payload.req;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProfileUpdateRequest {

    /** Tashkilot / admin ismi */
    private String name;

    /** Tashkilotni boshqaruvchi shaxs ismi */
    private String directorName;

    /** Parol maslahatchi */
    private String passwordHint;

    /** Faoliyat sohasi */
    private String businessSphere;

    /** Telefon raqami */
    private String phoneNumber;

    /** Profil fotosurati URL */
    private String photoUrl;

    /** Fayl yo'li (faqat director uchun) */
    private String sourcePath;

    /** Manzil */
    private String location;

    /** Tavsif (faqat super_admin uchun) */
    private String description;
}

