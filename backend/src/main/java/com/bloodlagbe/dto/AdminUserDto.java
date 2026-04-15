package com.bloodlagbe.dto;

import lombok.Data;

@Data
public class AdminUserDto {
    private Long id;
    private String name;
    private Integer age;
    private String gender;
    private String bloodType;
    private String district;
    private String phone;
    private String email;
    private String role;
    private boolean approved;
    private boolean rejected;
    private boolean donorProfileExists;
}
