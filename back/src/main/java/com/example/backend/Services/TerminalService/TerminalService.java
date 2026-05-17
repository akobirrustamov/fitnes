package com.example.backend.Services.TerminalService;

import com.example.backend.Payload.req.TerminalAddRequest;
import com.example.backend.Payload.req.TerminalUpdateRequest;
import org.springframework.http.HttpEntity;

public interface TerminalService {
    HttpEntity<?> getAll(Integer orgId, String part, int page, int pageSize);

    HttpEntity<?> getById(Integer orgId, Long id);

    HttpEntity<?> download(Integer orgId, String part);

    HttpEntity<?> add(Integer orgId, TerminalAddRequest request);

    HttpEntity<?> update(Integer orgId, Long id, TerminalUpdateRequest request);

    HttpEntity<?> delete(Integer orgId, Long id);

    HttpEntity<?> reset(Integer orgId, Long id);
}

