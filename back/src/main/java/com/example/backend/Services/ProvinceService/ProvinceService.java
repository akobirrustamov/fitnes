package com.example.backend.Services.ProvinceService;

import com.example.backend.Payload.req.ProvinceChangePasswordRequest;
import com.example.backend.Payload.req.ProvinceCreateRequest;
import com.example.backend.Payload.req.ProvinceUpdateRequest;
import org.springframework.http.HttpEntity;

public interface ProvinceService {

    HttpEntity<?> getAll(Boolean active);

    HttpEntity<?> getById(Integer id);

    HttpEntity<?> add(ProvinceCreateRequest request);

    HttpEntity<?> update(Integer id, ProvinceUpdateRequest request);

    HttpEntity<?> delete(Integer id);

    HttpEntity<?> setActive(Integer id, Boolean active);

    HttpEntity<?> download(Boolean active);

    HttpEntity<?> changePassword(Integer id, ProvinceChangePasswordRequest request);
}

