package com.bloodlagbe.service;

import com.bloodlagbe.dto.AuthResponse;
import com.bloodlagbe.dto.LoginRequest;
import com.bloodlagbe.dto.RegisterRequest;
import com.bloodlagbe.entity.Donor;
import com.bloodlagbe.entity.User;
import com.bloodlagbe.repository.DonorRepository;
import com.bloodlagbe.repository.UserRepository;
import com.bloodlagbe.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final DonorRepository donorRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository,
                       DonorRepository donorRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.donorRepository = donorRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Phone already in use");
        }

        String accountType = request.getAccountType() == null ? "USER" : request.getAccountType().trim().toUpperCase();
        System.out.println("DEBUG: Full RegisterRequest = " + request.toString());
        System.out.println("DEBUG: Received accountType = " + accountType);
        String role = "RECEIVER".equals(accountType) ? "RECEIVER" : "DONOR".equals(accountType) ? "USER" : "USER";
        System.out.println("DEBUG: Setting role = " + role);

        User user = User.builder()
                .name(request.getName())
                .age(request.getAge())
                .gender(request.getGender())
                .bloodType(request.getBloodType())
                .district(request.getDistrict())
                .phone(request.getPhone())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .approved(false)
                .build();

        user = userRepository.save(user);
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!user.isApproved()) {
            throw new IllegalArgumentException("Your account is pending approval. Please wait for admin approval.");
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole());
        claims.put("userId", user.getId());

        String token = jwtTokenProvider.generateToken(user.getEmail(), claims);

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUserId(user.getId());
        response.setName(user.getName());
        response.setRole(user.getRole());
        response.setApproved(user.isApproved());

        return response;
    }
}
