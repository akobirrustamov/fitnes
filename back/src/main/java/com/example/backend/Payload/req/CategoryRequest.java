package com.example.backend.Payload.req;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CategoryRequest {

    private String nameUz;
    private String nameRu;
    private String nameUzk;
    private String description;
    private String iconUrl;
    private Integer displayOrder;
}

