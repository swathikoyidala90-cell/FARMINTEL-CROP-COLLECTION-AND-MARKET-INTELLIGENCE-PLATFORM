package com.farmintel.project.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"})
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @PutMapping("/{id}")
    public User updateUser(@PathVariable Integer id, @RequestBody User updated) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(updated.getName());
        user.setEmail(updated.getEmail());
        user.setAddress(updated.getAddress());
        return userRepository.save(user);
    }
}
