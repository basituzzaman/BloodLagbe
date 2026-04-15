package com.bloodlagbe.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class DonorDetailDto {
    private Long id;
    private Long userId;
    private String name;
    private Integer age;
    private String gender;
    private String bloodType;
    private String district;
    private boolean availability;
    private String rank;
    private int donationCount;
    private String phone;
    private String healthHistory;
    private LocalDate lastDonationDate;
    private boolean hasHealthDocument;
}
