package com.bloodlagbe.repository;

import com.bloodlagbe.entity.Donor;
import com.bloodlagbe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DonorRepository extends JpaRepository<Donor, Long> {

    Optional<Donor> findByUser(User user);

    @Query("SELECT d FROM Donor d " +
            "WHERE d.user.role = 'DONOR' AND d.user.approved = true " +
            "AND (:bloodType IS NULL OR d.user.bloodType = :bloodType) " +
            "AND (:district IS NULL OR d.user.district = :district)")
    List<Donor> searchDonors(@Param("bloodType") String bloodType,
                             @Param("district") String district);

    @Query("SELECT d.user.bloodType, COUNT(d) FROM Donor d " +
            "WHERE d.availability = true AND d.user.role = 'DONOR' AND d.user.approved = true " +
            "GROUP BY d.user.bloodType")
    List<Object[]> countAvailableByBloodType();
}


