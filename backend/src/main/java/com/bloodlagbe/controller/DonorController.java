package com.bloodlagbe.controller;

import com.bloodlagbe.dto.BloodAvailabilityStatDto;
import com.bloodlagbe.dto.DonorApplyRequest;
import com.bloodlagbe.dto.DonorAvailabilityUpdateRequest;
import com.bloodlagbe.dto.DonorDetailDto;
import com.bloodlagbe.dto.DonorSummaryDto;
import com.bloodlagbe.service.DonorService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class DonorController {

    private final DonorService donorService;

    public DonorController(DonorService donorService) {
        this.donorService = donorService;
    }

    // GET /api/donors?bloodType=O+&district=Dhaka - Public access for visitors
    @GetMapping("/donors")
    public ResponseEntity<List<DonorSummaryDto>> getDonors(
            @RequestParam(required = false) String bloodType,
            @RequestParam(required = false) String district) {
        return ResponseEntity.ok(donorService.searchDonors(bloodType, district));
    }

    // GET /api/donors/{id}
    @GetMapping("/donors/{id}")
    public ResponseEntity<DonorDetailDto> getDonorDetails(@PathVariable Long id,
                                                          Authentication authentication) {
        boolean fullInfo = authentication != null && authentication.isAuthenticated();
        return ResponseEntity.ok(donorService.getDonorDetails(id, fullInfo));
    }

    // PUT /api/donor/availability
    @PutMapping("/donor/availability")
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<Void> updateAvailability(@RequestBody DonorAvailabilityUpdateRequest request) {
        donorService.updateAvailability(request);
        return ResponseEntity.ok().build();
    }

    // POST /api/donor/apply
    @PostMapping("/donor/apply")
    @PreAuthorize("hasAnyRole('USER','DONOR','RECEIVER')")
    public ResponseEntity<Void> applyAsDonor(
            @RequestParam("healthHistory") String healthHistory,
            @RequestParam(value = "lastDonationDate", required = false) String lastDonationDate,
            @RequestParam(value = "symptoms", required = false) String symptoms,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        DonorApplyRequest request = new DonorApplyRequest();
        request.setHealthHistory(healthHistory);
        request.setSymptoms(symptoms);
        if (lastDonationDate != null && !lastDonationDate.isEmpty()) {
            request.setLastDonationDate(java.time.LocalDate.parse(lastDonationDate));
        }
        donorService.applyAsDonor(request, file);
        return ResponseEntity.ok().build();
    }

    // GET /api/donors/stats/availability
    @GetMapping("/donors/stats/availability")
    public ResponseEntity<List<BloodAvailabilityStatDto>> getAvailabilityStats() {
        return ResponseEntity.ok(donorService.getBloodAvailabilityStats());
    }

    // DELETE /api/donors/{id}
    @DeleteMapping("/donors/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDonor(@PathVariable Long id) {
        donorService.deleteDonor(id);
        return ResponseEntity.ok().build();
    }

    // POST /api/donor/health-document
    @PostMapping("/donor/health-document")
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<String> uploadHealthDocument(@RequestParam("file") MultipartFile file) {
        try {
            String filename = donorService.uploadHealthDocument(file);
            return ResponseEntity.ok(filename);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

