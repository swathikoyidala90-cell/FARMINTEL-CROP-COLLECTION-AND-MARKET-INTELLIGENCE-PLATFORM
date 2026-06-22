package com.farmintel.project.auth;

import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173","https://farmintel-crop-collection-and-market-intelligence-ab5tyapqt.vercel.app"})
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public Map<String, Object> register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email is required");
        }

        User user = authService.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        user.setPassword(passwordEncoder.encode("Swathi@9014"));
        authService.save(user);

        return Map.of("message", "Password reset to Swathi@9014");
    }

    @PostMapping("/staff/login")
    public Map<String, Object> staffLogin(@RequestBody LoginRequest request) {
        Map<String, Object> res = authService.login(request);

        if (!"STAFF".equals(res.get("role"))) {
            throw new RuntimeException("Access denied. Not a staff user");
        }

        return res;
    }

    @PostMapping("/staff/forgot")
    public String staffForgot(@RequestParam String email) {
        return authService.staffForgotPassword(email);
    }

    @PostMapping("/staff/reset")
    public String resetPassword(
            @RequestParam String token,
            @RequestParam String newPassword) {
        return authService.resetPassword(token, newPassword);
    }
}
