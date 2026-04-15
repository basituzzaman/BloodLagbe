package com.bloodlagbe.service;

import com.bloodlagbe.dto.AdminDonorDto;
import com.bloodlagbe.dto.AdminUserDto;
import com.bloodlagbe.dto.BloodAvailabilityStatDto;
import com.bloodlagbe.dto.BloodRequestDto;
import com.bloodlagbe.entity.Donor;
import com.bloodlagbe.entity.Notification;
import com.bloodlagbe.entity.User;
import com.bloodlagbe.repository.BloodRequestRepository;
import com.bloodlagbe.repository.DonorRepository;
import com.bloodlagbe.repository.NotificationRepository;
import com.bloodlagbe.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final DonorRepository donorRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final NotificationRepository notificationRepository;
    private final DonorService donorService;
    private final BloodRequestService bloodRequestService;

    public AdminService(UserRepository userRepository,
                        DonorRepository donorRepository,
                        BloodRequestRepository bloodRequestRepository,
                        NotificationRepository notificationRepository,
                        DonorService donorService,
                        BloodRequestService bloodRequestService) {
        this.userRepository = userRepository;
        this.donorRepository = donorRepository;
        this.bloodRequestRepository = bloodRequestRepository;
        this.notificationRepository = notificationRepository;
        this.donorService = donorService;
        this.bloodRequestService = bloodRequestService;
    }

    public List<AdminUserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .filter(user -> !"ADMIN".equals(user.getRole()))
                .map(this::toUserDto)
                .collect(Collectors.toList());
    }

    public List<AdminDonorDto> getAllDonors() {
        return donorRepository.findAll().stream()
                .map(this::toDonorDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void approveUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if ("ADMIN".equals(user.getRole())) {
            throw new IllegalArgumentException("Admin account cannot be modified");
        }
        user.setApproved(true);
        user.setRejected(false);
        userRepository.save(user);

        // Send approval notification based on role
        String message;
        if ("RECEIVER".equals(user.getRole())) {
            message = "Your account has been approved! You can now request blood from donors.";
        } else {
            message = "Your account has been approved! You can now apply as a donor.";
        }
        sendNotification(user, message);
    }

    @Transactional
    public void approveDonor(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if ("ADMIN".equals(user.getRole())) {
            throw new IllegalArgumentException("Admin account cannot be modified");
        }
        if (!user.isApproved()) {
            throw new IllegalStateException("Approve user first from /admin/users");
        }
        donorRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Donor profile not found"));
        user.setApproved(true);
        user.setRole("DONOR");
        userRepository.save(user);
        
        // Send donor approval notification
        sendNotification(user, "Congratulations! Your donor application has been approved. You can now receive blood requests.");
    }

    @Transactional
    public void rejectUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if ("ADMIN".equals(user.getRole())) {
            throw new IllegalArgumentException("Admin account cannot be modified");
        }
        donorRepository.findByUser(user).ifPresent(donorRepository::delete);
        user.setApproved(false);
        user.setRejected(true);
        user.setRole("USER");
        userRepository.save(user);

        // Send rejection notification
        sendNotification(user, "Your account registration has been rejected. Please contact admin for more information.");
    }

    @Transactional
    public void rejectDonor(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if ("ADMIN".equals(user.getRole())) {
            throw new IllegalArgumentException("Admin account cannot be modified");
        }
        donorRepository.findByUser(user).ifPresent(donorRepository::delete);
        user.setRole("USER");
        userRepository.save(user);
        
        // Send donor rejection notification
        sendNotification(user, "Your donor application has been rejected. You can reapply after 3 months.");
    }

    @Transactional
    public void deleteDonor(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if ("ADMIN".equals(user.getRole())) {
            throw new IllegalArgumentException("Admin account cannot be modified");
        }

        Donor donor = donorRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Donor profile not found"));

        // Deleting donor profile reverts the account to regular receiver/user.
        donorRepository.delete(donor);
        user.setRole("USER");
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if ("ADMIN".equals(user.getRole())) {
            throw new IllegalArgumentException("Admin account cannot be deleted");
        }

        donorRepository.findByUser(user).ifPresent(donor -> {
            bloodRequestRepository.deleteByDonor(donor);
            donorRepository.delete(donor);
        });

        bloodRequestRepository.deleteByRequester(user);
        notificationRepository.deleteByUser(user);
        userRepository.delete(user);
    }

    public List<BloodAvailabilityStatDto> getStatistics() {
        return donorService.getBloodAvailabilityStats();
    }

    public List<BloodRequestDto> getAllRequests() {
        return bloodRequestService.getAllRequests();
    }

    private AdminUserDto toUserDto(User user) {
        AdminUserDto dto = new AdminUserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setAge(user.getAge());
        dto.setGender(user.getGender());
        dto.setBloodType(user.getBloodType());
        dto.setDistrict(user.getDistrict());
        dto.setPhone(user.getPhone());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setApproved(user.isApproved());
        dto.setRejected(user.isRejected());
        dto.setDonorProfileExists(donorRepository.findByUser(user).isPresent());
        return dto;
    }

    private AdminDonorDto toDonorDto(Donor donor) {
        AdminDonorDto dto = new AdminDonorDto();
        dto.setDonorId(donor.getId());
        dto.setUserId(donor.getUser().getId());
        dto.setName(donor.getUser().getName());
        dto.setBloodType(donor.getUser().getBloodType());
        dto.setDistrict(donor.getUser().getDistrict());
        dto.setUserApproved(donor.getUser().isApproved());
        dto.setDonorApproved("DONOR".equals(donor.getUser().getRole()));
        dto.setAvailability(donor.isAvailability());
        dto.setDonationCount(donor.getDonationCount());
        boolean hasDoc = donor.getHealthDocumentPath() != null;
        dto.setHasHealthDocument(hasDoc);
        System.out.println("Donor ID " + donor.getId() + " hasHealthDocument: " + hasDoc + ", path: " + donor.getHealthDocumentPath());
        return dto;
    }

    private void sendNotification(User user, String message) {
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .status("UNREAD")
                .createdAt(Instant.now())
                .build();
        notificationRepository.save(notification);
    }

    public String getHealthDocumentPath(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Donor donor = donorRepository.findByUser(user).orElse(null);
        String path = donor != null ? donor.getHealthDocumentPath() : null;
        System.out.println("getHealthDocumentPath for userId " + userId + ": " + path);
        return path;
    }
}
