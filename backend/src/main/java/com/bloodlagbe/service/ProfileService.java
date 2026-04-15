package com.bloodlagbe.service;

import com.bloodlagbe.dto.ProfileResponse;
import com.bloodlagbe.dto.ProfileUpdateRequest;
import com.bloodlagbe.entity.Donor;
import com.bloodlagbe.entity.User;
import com.bloodlagbe.repository.DonorRepository;
import com.bloodlagbe.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final DonorRepository donorRepository;

    public ProfileService(UserRepository userRepository, DonorRepository donorRepository) {
        this.userRepository = userRepository;
        this.donorRepository = donorRepository;
    }

    public ProfileResponse getMyProfile() {
        User user = getCurrentUser();
        return toProfileResponse(user);
    }

    @Transactional
    public ProfileResponse updateMyProfile(ProfileUpdateRequest request) {
        User user = getCurrentUser();

        if (request.getEmail() != null && userRepository.existsByEmailAndIdNot(request.getEmail(), user.getId())) {
            throw new IllegalArgumentException("Email already in use");
        }
        if (request.getPhone() != null && userRepository.existsByPhoneAndIdNot(request.getPhone(), user.getId())) {
            throw new IllegalArgumentException("Phone already in use");
        }

        if (request.getName() != null) user.setName(request.getName());
        if (request.getAge() != null) user.setAge(request.getAge());
        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getBloodType() != null) user.setBloodType(request.getBloodType());
        if (request.getDistrict() != null) user.setDistrict(request.getDistrict());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getPhone() != null) user.setPhone(request.getPhone());

        userRepository.save(user);

        donorRepository.findByUser(user).ifPresent(donor -> {
            donor.setHealthHistory(request.getHealthHistory());
            donor.setLastDonationDate(request.getLastDonationDate());
            donorRepository.save(donor);
        });

        return toProfileResponse(user);
    }

    private ProfileResponse toProfileResponse(User user) {
        ProfileResponse response = new ProfileResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setAge(user.getAge());
        response.setGender(user.getGender());
        response.setBloodType(user.getBloodType());
        response.setDistrict(user.getDistrict());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setRole(user.getRole());
        response.setApproved(user.isApproved());

        Donor donor = donorRepository.findByUser(user).orElse(null);
        if (donor != null) {
            response.setDonorProfileExists(true);
            response.setHealthHistory(donor.getHealthHistory());
            response.setLastDonationDate(donor.getLastDonationDate());
            response.setAvailability(donor.isAvailability());
            response.setDonationCount(donor.getDonationCount());
        } else {
            response.setDonorProfileExists(false);
        }

        return response;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("User not authenticated");
        }
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }
}
