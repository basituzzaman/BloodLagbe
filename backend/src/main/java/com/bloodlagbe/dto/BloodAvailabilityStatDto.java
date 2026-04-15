package com.bloodlagbe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BloodAvailabilityStatDto {
    private String bloodType;
    private long availableDonors;
}

