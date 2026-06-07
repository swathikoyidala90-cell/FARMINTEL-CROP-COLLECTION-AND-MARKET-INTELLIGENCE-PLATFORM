package com.farmintel.project.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Integer> {

    // ✅ Login
    Optional<User> findByEmail(String email);

    // ✅ Admin: filter users by role (VERY USEFUL)
    List<User> findByRole_Name(String roleName);
    Optional<User> findByResetToken(String token);
    
}