package com.example.backend.Services.SettingsService;

import com.example.backend.Entity.ApiSettings;
import com.example.backend.Repository.ApiSettingsRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SettingsServiceImpl implements SettingsService {

    private final ApiSettingsRepo settingsRepo;

    @Override
    public HttpEntity<?> getByOrgId(Integer orgId) {
        ApiSettings s = settingsRepo.findByOrganizationId(orgId)
                .orElse(defaultSettings(orgId));
        return ResponseEntity.ok(toMap(s));
    }

    @Override
    public HttpEntity<?> update(Integer orgId, Map<String, Object> body, boolean superAdmin) {
        ApiSettings s = settingsRepo.findByOrganizationId(orgId)
                .orElse(defaultSettings(orgId));

        if (superAdmin) {
            if (body.containsKey("max_users_count"))
                s.setMaxUsersCount(toInt(body.get("max_users_count")));
            if (body.containsKey("max_terminals_count"))
                s.setMaxTerminalsCount(toInt(body.get("max_terminals_count")));
            if (body.containsKey("max_graphics_count"))
                s.setMaxGraphicsCount(toInt(body.get("max_graphics_count")));
        }
        if (body.containsKey("opening_time"))
            s.setOpeningTime((String) body.get("opening_time"));
        if (body.containsKey("closing_time"))
            s.setClosingTime((String) body.get("closing_time"));
        if (body.containsKey("price_per_user"))
            s.setPricePerUser(toLong(body.get("price_per_user")));

        settingsRepo.save(s);
        return ResponseEntity.ok(Map.of("message", "Sozlamalar saqlandi."));
    }

    private ApiSettings defaultSettings(Integer orgId) {
        return ApiSettings.builder()
                .organizationId(orgId)
                .openingTime("08:00")
                .closingTime("22:00")
                .maxUsersCount(500)
                .maxTerminalsCount(5)
                .maxGraphicsCount(10)
                .pricePerUser(0L)
                .build();
    }

    private Map<String, Object> toMap(ApiSettings s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("organization_id", s.getOrganizationId());
        m.put("opening_time", s.getOpeningTime());
        m.put("closing_time", s.getClosingTime());
        m.put("max_users_count", s.getMaxUsersCount());
        m.put("max_terminals_count", s.getMaxTerminalsCount());
        m.put("max_graphics_count", s.getMaxGraphicsCount());
        m.put("price_per_user", s.getPricePerUser());
        return m;
    }

    private Integer toInt(Object v) {
        if (v == null) return 0;
        return v instanceof Number ? ((Number) v).intValue() : Integer.parseInt(v.toString());
    }

    private Long toLong(Object v) {
        if (v == null) return 0L;
        return v instanceof Number ? ((Number) v).longValue() : Long.parseLong(v.toString());
    }
}
