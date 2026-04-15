package com.bloodlagbe.repository;

import com.bloodlagbe.entity.BloodRequest;
import com.bloodlagbe.entity.Donor;
import com.bloodlagbe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BloodRequestRepository extends JpaRepository<BloodRequest, Long> {

    List<BloodRequest> findByRequester(User requester);

    List<BloodRequest> findByDonor(Donor donor);

    List<BloodRequest> findByRequesterOrderByCreatedAtDesc(User requester);

    List<BloodRequest> findByDonorOrderByCreatedAtDesc(Donor donor);

    void deleteByRequester(User requester);

    void deleteByDonor(Donor donor);
}
