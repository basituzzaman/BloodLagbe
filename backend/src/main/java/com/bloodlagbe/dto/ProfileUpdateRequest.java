package com.bloodlagbe.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ProfileUpdateRequest {
    private String name;
    private Integer age;
    private String gender;
    private String bloodType;
    private String district;
    private String email;
    private String phone;

    private String healthHistory;
    private LocalDate lastDonationDate;
}
