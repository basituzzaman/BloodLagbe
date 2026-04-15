package com.bloodlagbe.dto;

import lombok.Data;

@Data
public class DonorSummaryDto {
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
}
