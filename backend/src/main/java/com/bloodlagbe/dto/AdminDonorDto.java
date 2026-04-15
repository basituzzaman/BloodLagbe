package com.bloodlagbe.dto;

import lombok.Data;

@Data
public class AdminDonorDto {
    private Long donorId;
    private Long userId;
    private String name;
    private String bloodType;
    private String district;
    private boolean userApproved;
    private boolean donorApproved;
    private boolean availability;
    private int donationCount;
    private boolean hasHealthDocument;
}
