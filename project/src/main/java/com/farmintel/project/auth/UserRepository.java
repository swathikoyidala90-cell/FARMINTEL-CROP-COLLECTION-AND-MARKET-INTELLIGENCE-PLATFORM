package com.farmintel.project.auth;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    // Fetch the user, their role, and their crops in a single database hit
    @EntityGraph(attributePaths = {"role", "crops"})
    List<User> findByRole_Name(String roleName);

    Optional<User> findByResetToken(String token);
}