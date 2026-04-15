package com.bloodlagbe.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private Integer age;
    private String gender;
    private String bloodType;
    private String district;
    private String phone;
    private String email;
    private String password;
    // RECEIVER (default) or DONOR
    private String accountType;

    @Override
    public String toString() {
        return "RegisterRequest{name='" + name + "', email='" + email + "', accountType='" + accountType + "'}";
    }
}
