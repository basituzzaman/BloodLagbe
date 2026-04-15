package com.bloodlagbe.service;

import com.bloodlagbe.dto.BloodRequestCreateRequest;
import com.bloodlagbe.dto.BloodRequestDto;
import com.bloodlagbe.entity.BloodRequest;
import com.bloodlagbe.entity.Donor;
import com.bloodlagbe.entity.User;
import com.bloodlagbe.repository.BloodRequestRepository;
import com.bloodlagbe.repository.DonorRepository;
import com.bloodlagbe.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BloodRequestService {

    private final BloodRequestRepository bloodRequestRepository;
    private final DonorRepository donorRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public BloodRequestService(BloodRequestRepository bloodRequestRepository,
                               DonorRepository donorRepository,
                               UserRepository userRepository,
                               NotificationService notificationService) {
        this.bloodRequestRepository = bloodRequestRepository;
        this.donorRepository = donorRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public BloodRequestDto createRequest(BloodRequestCreateRequest request) {
        User requester = getCurrentUser()
                .orElseThrow(() -> new IllegalStateException("User not found"));

        Donor donor = donorRepository.findById(request.getDonorId())
                .orElseThrow(() -> new IllegalArgumentException("Donor not found"));

        if (requester.getId().equals(donor.getUser().getId())) {
            throw new IllegalArgumentException("You cannot send a blood request to yourself");
        }
        donorRepository.findByUser(requester).ifPresent(myDonorProfile -> {
            if (myDonorProfile.getId().equals(donor.getId())) {
                throw new IllegalArgumentException("You cannot send a blood request to yourself");
            }
        });
        if (!donor.isAvailability()) {
            throw new IllegalStateException("This donor is currently unavailable");
        }

        BloodRequest bloodRequest = BloodRequest.builder()
                .requester(requester)
                .donor(donor)
                .requestFor(request.getRequestFor())
                .status("PENDING")
                .build();

        bloodRequestRepository.save(bloodRequest);

        notificationService.sendNotification(
                donor.getUser(),
                "New blood request from " + requester.getName() + " (" + requester.getBloodType() + ")"
        );

        return toDto(bloodRequest);
    }

    @Transactional
    public void acceptRequest(Long requestId) {
        User currentUser = getCurrentUser()
                .orElseThrow(() -> new IllegalStateException("User not found"));

        BloodRequest request = bloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (!request.getDonor().getUser().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Only the selected donor can accept this request");
        }

        if (!"PENDING".equals(request.getStatus())) {
            throw new IllegalStateException("Request is not pending");
        }

        request.setStatus("ACCEPTED");

        Donor donor = request.getDonor();
        donor.setDonationCount(donor.getDonationCount() + 1);
        donor.setAvailability(false);
        donor.setLastDonationDate(LocalDate.now());

        bloodRequestRepository.save(request);
        donorRepository.save(donor);

        notificationService.sendNotification(
                request.getRequester(),
                "Your blood request to donor " + donor.getUser().getName() + " has been accepted."
        );
    }

    @Transactional
    public void rejectRequest(Long requestId) {
        User currentUser = getCurrentUser()
                .orElseThrow(() -> new IllegalStateException("User not found"));

        BloodRequest request = bloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (!request.getDonor().getUser().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Only the selected donor can reject this request");
        }

        if (!"PENDING".equals(request.getStatus())) {
            throw new IllegalStateException("Request is not pending");
        }

        request.setStatus("REJECTED");
        bloodRequestRepository.save(request);

        notificationService.sendNotification(
                request.getRequester(),
                "Your blood request to donor " + request.getDonor().getUser().getName() + " has been rejected."
        );
    }

    public List<BloodRequestDto> getAllRequests() {
        return bloodRequestRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<BloodRequestDto> getMyIncomingRequests() {
        User currentUser = getCurrentUser()
                .orElseThrow(() -> new IllegalStateException("User not found"));
        Donor donor = donorRepository.findByUser(currentUser)
                .orElseThrow(() -> new IllegalStateException("Donor profile not found"));

        return bloodRequestRepository.findByDonorOrderByCreatedAtDesc(donor).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<BloodRequestDto> getMyOutgoingRequests() {
        User currentUser = getCurrentUser()
                .orElseThrow(() -> new IllegalStateException("User not found"));
        return bloodRequestRepository.findByRequesterOrderByCreatedAtDesc(currentUser).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private Optional<User> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        String email = auth.getName();
        return userRepository.findByEmail(email);
    }

    private BloodRequestDto toDto(BloodRequest request) {
        BloodRequestDto dto = new BloodRequestDto();
        dto.setId(request.getId());
        dto.setRequesterId(request.getRequester().getId());
        dto.setRequesterName(request.getRequester().getName());
        dto.setRequesterPhone(request.getRequester().getPhone());
        dto.setRequesterBloodType(request.getRequester().getBloodType());
        dto.setRequesterDistrict(request.getRequester().getDistrict());
        dto.setDonorId(request.getDonor().getId());
        dto.setDonorName(request.getDonor().getUser().getName());
        dto.setRequestFor(request.getRequestFor());
        dto.setStatus(request.getStatus());
        dto.setCreatedAt(request.getCreatedAt());
        return dto;
    }
}
