package com.bloodlagbe.repository;

import com.bloodlagbe.entity.Notification;
import com.bloodlagbe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    void deleteByUser(User user);
}
