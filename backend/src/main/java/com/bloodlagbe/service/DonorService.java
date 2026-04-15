package com.bloodlagbe.service;

import com.bloodlagbe.dto.BloodAvailabilityStatDto;
import com.bloodlagbe.dto.DonorApplyRequest;
import com.bloodlagbe.dto.DonorAvailabilityUpdateRequest;
import com.bloodlagbe.dto.DonorDetailDto;
import com.bloodlagbe.dto.DonorSummaryDto;
import com.bloodlagbe.entity.Donor;
import com.bloodlagbe.entity.User;
import com.bloodlagbe.repository.DonorRepository;
import com.bloodlagbe.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DonorService {

    private static final Set<String> DISQUALIFYING_SYMPTOMS = Set.of(
            "HIV", "HEPATITIS", "LOW HEMOGLOBIN", "RECENT SURGERY", "SERIOUS DISEASE"
    );

    private static final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/health_documents/";

    private final DonorRepository donorRepository;
    private final UserRepository userRepository;

    public DonorService(DonorRepository donorRepository, UserRepository userRepository) {
        this.donorRepository = donorRepository;
        this.userRepository = userRepository;
    }

    public List<DonorSummaryDto> searchDonors(String bloodType, String district) {
        String bt = (bloodType == null || bloodType.isBlank()) ? null : bloodType;
        String dist = (district == null || district.isBlank()) ? null : district;
        Long currentUserId = getCurrentUser().map(User::getId).orElse(null);

        List<Donor> donors = donorRepository.searchDonors(bt, dist);
        List<DonorSummaryDto> result = new ArrayList<>();

        for (Donor donor : donors) {
            User user = donor.getUser();
            if (currentUserId != null && currentUserId.equals(user.getId())) {
                continue;
            }
            DonorSummaryDto dto = new DonorSummaryDto();
            dto.setId(donor.getId());
            dto.setUserId(user.getId());
            dto.setName(user.getName());
            dto.setAge(user.getAge());
            dto.setGender(user.getGender());
            dto.setBloodType(user.getBloodType());
            dto.setDistrict(user.getDistrict());
            dto.setAvailability(donor.isAvailability());
            dto.setDonationCount(donor.getDonationCount());
            dto.setRank(calculateRank(donor.getDonationCount()));
            result.add(dto);
        }

        return result;
    }

    public DonorDetailDto getDonorDetails(Long donorId, boolean fullInfo) {
        Donor donor = donorRepository.findById(donorId)
                .orElseThrow(() -> new IllegalArgumentException("Donor not found"));
        User user = donor.getUser();

        DonorDetailDto dto = new DonorDetailDto();
        dto.setId(donor.getId());
        dto.setUserId(user.getId());
        dto.setName(user.getName());
        dto.setAge(user.getAge());
        dto.setGender(user.getGender());
        dto.setBloodType(user.getBloodType());
        dto.setDistrict(user.getDistrict());
        dto.setAvailability(donor.isAvailability());
        dto.setDonationCount(donor.getDonationCount());
        dto.setRank(calculateRank(donor.getDonationCount()));
        dto.setHasHealthDocument(donor.getHealthDocumentPath() != null);

        if (fullInfo) {
            dto.setPhone(user.getPhone());
            dto.setHealthHistory(donor.getHealthHistory());
            dto.setLastDonationDate(donor.getLastDonationDate());
        }

        return dto;
    }

    @Transactional
    public void updateAvailability(DonorAvailabilityUpdateRequest request) {
        User currentUser = getCurrentUser()
                .orElseThrow(() -> new IllegalStateException("User not found"));

        Donor donor = donorRepository.findByUser(currentUser)
                .orElseThrow(() -> new IllegalStateException("Donor profile not found"));

        donor.setAvailability(request.isAvailability());
        donorRepository.save(donor);
    }

    @Transactional
    public void applyAsDonor(DonorApplyRequest request) {
        applyAsDonor(request, null);
    }

    @Transactional
    public void applyAsDonor(DonorApplyRequest request, MultipartFile file) {
        User currentUser = getCurrentUser()
                .orElseThrow(() -> new IllegalStateException("User not found"));

        // Prevent duplicate donor profiles
        if (donorRepository.findByUser(currentUser).isPresent()) {
            throw new IllegalStateException("Donor profile already exists");
        }

        // Validate symptoms
        if (request.getSymptoms() != null && !request.getSymptoms().isBlank()) {
            List<String> items = Arrays.stream(request.getSymptoms().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());

            for (String item : items) {
                String upper = item.toUpperCase(Locale.ROOT);
                if (DISQUALIFYING_SYMPTOMS.contains(upper)) {
                    throw new IllegalArgumentException("Applicant is not eligible to donate blood due to health conditions");
                }
            }
        }

        Donor donor = Donor.builder()
                .user(currentUser)
                .healthHistory(request.getHealthHistory())
                .lastDonationDate(request.getLastDonationDate())
                // Start as unavailable until admin approves and donor manually enables
                .availability(false)
                .donationCount(0)
                .build();

        donorRepository.save(donor);

        // Handle health document upload if provided
        if (file != null && !file.isEmpty()) {
            try {
                System.out.println("Processing health document upload...");
                System.out.println("File name: " + file.getOriginalFilename());
                System.out.println("File size: " + file.getSize() + " bytes");
                System.out.println("Content type: " + file.getContentType());

                // Validate file
                String contentType = file.getContentType();
                if (contentType == null || !contentType.equals("application/pdf")) {
                    throw new IllegalArgumentException("Only PDF files are allowed");
                }

                if (file.getSize() > 5 * 1024 * 1024) {
                    throw new IllegalArgumentException("File size exceeds 5MB limit");
                }

                // Create upload directory if it doesn't exist
                Path uploadPath = Paths.get(UPLOAD_DIR);
                System.out.println("Upload directory: " + uploadPath.toAbsolutePath());
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                    System.out.println("Created upload directory");
                }

                // Use donor ID as filename (deterministic)
                String filename = "donor_" + donor.getId() + ".pdf";
                Path filePath = uploadPath.resolve(filename);

                // Save file (will overwrite if exists due to same donor ID)
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                System.out.println("File saved to: " + filePath.toAbsolutePath());

                // Update donor record with file path
                donor.setHealthDocumentPath(filePath.toString());
                donorRepository.save(donor);
                System.out.println("Donor record updated with health document path");
            } catch (Exception e) {
                System.out.println("Error uploading health document: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to upload health document: " + e.getMessage(), e);
            }
        } else {
            System.out.println("No health document file provided");
        }
    }

    @Transactional
    public void deleteDonor(Long donorId) {
        Donor donor = donorRepository.findById(donorId)
                .orElseThrow(() -> new IllegalArgumentException("Donor not found"));

        // Delete health document file if exists
        String healthDocPath = donor.getHealthDocumentPath();
        if (healthDocPath != null) {
            try {
                Path file = Paths.get(healthDocPath);
                if (Files.exists(file)) {
                    Files.delete(file);
                    System.out.println("Deleted health document file: " + healthDocPath);
                }
            } catch (Exception e) {
                System.out.println("Failed to delete health document file: " + e.getMessage());
                // Proceed anyway
            }
        }

        donorRepository.delete(donor);
    }

    public List<BloodAvailabilityStatDto> getBloodAvailabilityStats() {
        List<Object[]> rows = donorRepository.countAvailableByBloodType();
        List<BloodAvailabilityStatDto> result = new ArrayList<>();
        for (Object[] row : rows) {
            String bloodType = (String) row[0];
            Long count = (Long) row[1];
            result.add(new BloodAvailabilityStatDto(bloodType, count));
        }
        return result;
    }

    private Optional<User> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        String email = auth.getName();
        return userRepository.findByEmail(email);
    }

    private String calculateRank(int donationCount) {
        if (donationCount >= 20) return "Platinum";
        if (donationCount >= 10) return "Gold";
        if (donationCount >= 5) return "Silver";
        if (donationCount >= 1) return "Bronze";
        return "New";
    }

    @Transactional
    public String uploadHealthDocument(MultipartFile file) throws Exception {
        User currentUser = getCurrentUser()
                .orElseThrow(() -> new IllegalStateException("User not found"));

        Donor donor = donorRepository.findByUser(currentUser)
                .orElseThrow(() -> new IllegalStateException("Donor profile not found"));

        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new IllegalArgumentException("Only PDF files are allowed");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds 5MB limit");
        }

        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Delete old file if exists
        String oldPath = donor.getHealthDocumentPath();
        if (oldPath != null) {
            try {
                Path oldFile = Paths.get(oldPath);
                if (Files.exists(oldFile)) {
                    Files.delete(oldFile);
                    System.out.println("Deleted old health document: " + oldPath);
                }
            } catch (Exception e) {
                System.out.println("Failed to delete old health document: " + e.getMessage());
                // Proceed anyway
            }
        }

        // Use donor ID as filename
        String filename = "donor_" + donor.getId() + ".pdf";
        Path filePath = uploadPath.resolve(filename);

        // Save file
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Update donor record
        donor.setHealthDocumentPath(filePath.toString());
        donorRepository.save(donor);

        return filename;
    }

    /**
     * Cleanup orphaned health document files that don't match any donor's current path
     * This should be run once to clean up old UUID-based filenames
     */
    @Transactional
    public void cleanupOrphanedHealthDocuments() {
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                System.out.println("Upload directory does not exist, nothing to clean up");
                return;
            }

            // Get all valid file paths from database
            Set<String> validPaths = donorRepository.findAll().stream()
                    .map(Donor::getHealthDocumentPath)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            System.out.println("Valid health document paths in database: " + validPaths.size());

            // List all files in upload directory
            List<Path> allFiles = Files.list(uploadPath)
                    .filter(Files::isRegularFile)
                    .collect(Collectors.toList());

            System.out.println("Total files in upload directory: " + allFiles.size());

            int deletedCount = 0;
            for (Path file : allFiles) {
                String filePath = file.toString();
                if (!validPaths.contains(filePath)) {
                    try {
                        Files.delete(file);
                        System.out.println("Deleted orphaned file: " + filePath);
                        deletedCount++;
                    } catch (Exception e) {
                        System.out.println("Failed to delete orphaned file: " + filePath + " - " + e.getMessage());
                    }
                }
            }

            System.out.println("Cleanup complete. Deleted " + deletedCount + " orphaned files.");
        } catch (Exception e) {
            System.out.println("Error during cleanup: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
