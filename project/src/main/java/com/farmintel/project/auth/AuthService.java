package com.farmintel.project.auth;

import com.farmintel.project.*;
import com.farmintel.project.staff.StaffService;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private StaffService staffService;
    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ✅ REGISTER
    public Map<String, Object> register(RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        Role role = roleRepository
                .findByName(request.getRole().toUpperCase().trim())
                .orElseThrow(() -> new RuntimeException("Role not found"));

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // ✅ encode
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setRole(role);

        userRepository.save(user);

        return Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "role", user.getRole().getName()
        );
    }

    // ✅ LOGIN (FIXED)
    public Map<String, Object> login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ✅ FIX: use passwordEncoder
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        return Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "role", user.getRole().getName()
        );
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public void save(User user) {
        userRepository.save(user);
    }
    public String staffForgotPassword(String email) {
    return staffService.staffForgotPassword(email);
}
public String resetPassword(String token, String newPassword) {
    return staffService.resetPassword(token, newPassword);
}
}