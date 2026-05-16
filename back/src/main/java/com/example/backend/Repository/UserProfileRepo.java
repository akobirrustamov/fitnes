package com.example.backend.Repository;

import com.example.backend.Entity.User;
import com.example.backend.Entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserProfileRepo extends JpaRepository<UserProfile, UUID> {

    Optional<UserProfile> findByUser(User user);

    boolean existsByUser_NameAndUserIdNot(String name, UUID userId);
}

