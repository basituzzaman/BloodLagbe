package com.bloodlagbe.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private Long userId;
    private String name;
    private String role;
    private boolean approved;
}

