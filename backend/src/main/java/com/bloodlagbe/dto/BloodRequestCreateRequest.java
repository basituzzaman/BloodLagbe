package com.bloodlagbe.dto;

import lombok.Data;

@Data
public class BloodRequestCreateRequest {
    private Long donorId;
    // "MYSELF" or "ANOTHER"
    private String requestFor;
}

