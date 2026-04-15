package com.bloodlagbe.controller;

import com.bloodlagbe.dto.AdminDonorDto;
import com.bloodlagbe.dto.AdminUserDto;
import com.bloodlagbe.dto.BloodAvailabilityStatDto;
import com.bloodlagbe.dto.BloodRequestDto;
import com.bloodlagbe.service.AdminService;
import com.bloodlagbe.service.DonorService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final DonorService donorService;

    public AdminController(AdminService adminService, DonorService donorService) {
        this.adminService = adminService;
        this.donorService = donorService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDto>> getUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/donors")
    public ResponseEntity<List<AdminDonorDto>> getDonors() {
        return ResponseEntity.ok(adminService.getAllDonors());
    }

    @PutMapping("/approve-user")
    public ResponseEntity<Void> approveUser(@RequestParam Long userId) {
        adminService.approveUser(userId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/reject-user")
    public ResponseEntity<Void> rejectUser(@RequestParam Long userId) {
        adminService.rejectUser(userId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/approve-donor")
    public ResponseEntity<Void> approveDonor(@RequestParam Long userId) {
        adminService.approveDonor(userId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/reject-donor")
    public ResponseEntity<Void> rejectDonor(@RequestParam Long userId) {
        adminService.rejectDonor(userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/donors/{userId}")
    public ResponseEntity<Void> deleteDonor(@PathVariable Long userId) {
        adminService.deleteDonor(userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/statistics")
    public ResponseEntity<List<BloodAvailabilityStatDto>> getStatistics() {
        return ResponseEntity.ok(adminService.getStatistics());
    }

    @GetMapping("/requests")
    public ResponseEntity<List<BloodRequestDto>> getRequests() {
        return ResponseEntity.ok(adminService.getAllRequests());
    }

    @GetMapping("/donor/{userId}/health-document")
    public ResponseEntity<byte[]> downloadHealthDocument(@PathVariable Long userId) {
        try {
            System.out.println("Downloading health document for user ID: " + userId);
            String filePath = adminService.getHealthDocumentPath(userId);
            System.out.println("File path from database: " + filePath);
            if (filePath == null) {
                System.out.println("No health document found for user ID: " + userId);
                return ResponseEntity.notFound().build();
            }

            Path path = Paths.get(filePath);
            System.out.println("Attempting to read file: " + path.toAbsolutePath());
            if (!Files.exists(path)) {
                System.out.println("File does not exist at path: " + path.toAbsolutePath());
                return ResponseEntity.notFound().build();
            }
            byte[] fileContent = Files.readAllBytes(path);
            System.out.println("File read successfully, size: " + fileContent.length + " bytes");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "health_document.pdf");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(fileContent);
        } catch (Exception e) {
            System.out.println("Error downloading health document: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // POST /api/admin/cleanup-health-documents
    @PostMapping("/cleanup-health-documents")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> cleanupHealthDocuments() {
        donorService.cleanupOrphanedHealthDocuments();
        return ResponseEntity.ok("Cleanup completed");
    }
}
