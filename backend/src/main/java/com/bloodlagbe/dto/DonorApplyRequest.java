package com.bloodlagbe.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class DonorApplyRequest {
    private String healthHistory;
    private LocalDate lastDonationDate;
    // Comma-separated list of symptoms from UI (e.g. "HIV,Hepatitis")
    private String symptoms;
}

