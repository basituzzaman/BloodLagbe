package com.bloodlagbe.service;

import com.bloodlagbe.dto.NotificationDto;
import com.bloodlagbe.entity.Notification;
import com.bloodlagbe.entity.User;
import com.bloodlagbe.repository.NotificationRepository;
import com.bloodlagbe.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void sendNotification(User user, String message) {
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .status("UNREAD")
                .build();
        notificationRepository.save(notification);
    }

    public List<NotificationDto> getMyNotifications() {
        User currentUser = getCurrentUser()
                .orElseThrow(() -> new IllegalStateException("User not found"));
        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(currentUser);
        return notifications.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        User currentUser = getCurrentUser()
                .orElseThrow(() -> new IllegalStateException("User not found"));

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("Cannot modify notification of another user");
        }

        notification.setStatus("READ");
        notificationRepository.save(notification);
    }

    private NotificationDto toDto(Notification notification) {
        NotificationDto dto = new NotificationDto();
        dto.setId(notification.getId());
        dto.setMessage(notification.getMessage());
        dto.setStatus(notification.getStatus());
        dto.setCreatedAt(notification.getCreatedAt());
        return dto;
    }

    private Optional<User> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        String email = auth.getName();
        return userRepository.findByEmail(email);
    }
}

