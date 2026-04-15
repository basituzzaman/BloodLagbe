package com.bloodlagbe.dto;

import lombok.Data;

import java.time.Instant;

@Data
public class BloodRequestDto {
    private Long id;
    private Long requesterId;
    private String requesterName;
    private String requesterPhone;
    private String requesterBloodType;
    private String requesterDistrict;
    private Long donorId;
    private String donorName;
    private String requestFor;
    private String status;
    private Instant createdAt;
}
