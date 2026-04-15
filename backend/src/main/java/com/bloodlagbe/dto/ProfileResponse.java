package com.bloodlagbe.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ProfileResponse {
    private Long id;
    private String name;
    private Integer age;
    private String gender;
    private String bloodType;
    private String district;
    private String email;
    private String phone;
    private String role;
    private boolean approved;

    private boolean donorProfileExists;
    private String healthHistory;
    private LocalDate lastDonationDate;
    private Boolean availability;
    private Integer donationCount;
}
