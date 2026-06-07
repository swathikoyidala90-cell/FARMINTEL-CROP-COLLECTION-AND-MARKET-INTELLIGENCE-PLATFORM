package com.farmintel.project.auth;

import jakarta.validation.constraints.*;

public class RegisterRequest {

    @NotBlank
    private String name;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Pattern(
        regexp = "^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Z].{7,}$",
        message = "Password must be at least 8 characters, start with capital, include number & special char"
    )
    private String password;

    private String phone;

    @NotBlank
    private String role;

    private String address;

    // ✅ getters & setters

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
}