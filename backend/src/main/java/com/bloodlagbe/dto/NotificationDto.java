package com.bloodlagbe.dto;

import lombok.Data;

import java.time.Instant;

@Data
public class NotificationDto {
    private Long id;
    private String message;
    private String status;
    private Instant createdAt;
}

