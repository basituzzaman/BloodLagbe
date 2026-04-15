package com.bloodlagbe.config;

import com.bloodlagbe.entity.User;
import com.bloodlagbe.repository.UserRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminSeeder {

    @Bean
    public ApplicationRunner seedDefaultAdmin(UserRepository userRepository,
                                             PasswordEncoder passwordEncoder) {
        return args -> {
            String adminEmail = "admin@bloodlagbe.com";
            if (userRepository.existsByEmail(adminEmail)) {
                return;
            }

            User admin = User.builder()
                    .name("System Admin")
                    .age(30)
                    .gender("Other")
                    .bloodType("O+")
                    .district("Dhaka")
                    .phone("01000000000")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("admin123"))
                    .role("ADMIN")
                    .approved(true)
                    .build();

            userRepository.save(admin);
        };
    }
}

