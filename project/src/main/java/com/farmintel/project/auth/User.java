package com.farmintel.project.auth;
import com.farmintel.project.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(length = 15)
    private String phone;

    @ManyToOne
@JoinColumn(name = "role_id")
@JsonIgnoreProperties({"users"}) // ✅ FIX LOOP
private Role role;
    @Column
private String address;
// ADD THESE FIELDS
private String resetToken;
private Long resetTokenExpiry;
public String getResetToken(){
    return resetToken;
}
public void setResetToken(String resetToken){
    this.resetToken=resetToken;
}
public Long getResetTokenExpiry(){
    return resetTokenExpiry;
}
public void setResetTokenExpiry(Long resetTokenExpiry){
    this.resetTokenExpiry=resetTokenExpiry;
}
public String getAddress() { return address; }
public void setAddress(String address) { this.address = address; }
    // ✅ GETTERS & SETTERS

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}