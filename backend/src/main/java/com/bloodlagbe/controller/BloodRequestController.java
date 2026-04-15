package com.bloodlagbe.controller;

import com.bloodlagbe.dto.BloodRequestCreateRequest;
import com.bloodlagbe.dto.BloodRequestDto;
import com.bloodlagbe.service.BloodRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class BloodRequestController {

    private final BloodRequestService bloodRequestService;

    public BloodRequestController(BloodRequestService bloodRequestService) {
        this.bloodRequestService = bloodRequestService;
    }

    // POST /api/request-blood
    @PostMapping("/request-blood")
    @PreAuthorize("hasAnyRole('USER','DONOR','ADMIN','RECEIVER')")
    public ResponseEntity<BloodRequestDto> requestBlood(@RequestBody BloodRequestCreateRequest request) {
        return ResponseEntity.ok(bloodRequestService.createRequest(request));
    }

    // POST /api/request/{id}/accept
    @PostMapping("/request/{id}/accept")
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<Void> accept(@PathVariable Long id) {
        bloodRequestService.acceptRequest(id);
        return ResponseEntity.ok().build();
    }

    // POST /api/request/{id}/reject
    @PostMapping("/request/{id}/reject")
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<Void> reject(@PathVariable Long id) {
        bloodRequestService.rejectRequest(id);
        return ResponseEntity.ok().build();
    }

    // GET /api/requests/incoming
    @GetMapping("/requests/incoming")
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<List<BloodRequestDto>> getIncomingRequests() {
        return ResponseEntity.ok(bloodRequestService.getMyIncomingRequests());
    }

    // GET /api/requests/outgoing
    @GetMapping("/requests/outgoing")
    @PreAuthorize("hasAnyRole('USER','DONOR','RECEIVER')")
    public ResponseEntity<List<BloodRequestDto>> getOutgoingRequests() {
        return ResponseEntity.ok(bloodRequestService.getMyOutgoingRequests());
    }

}
