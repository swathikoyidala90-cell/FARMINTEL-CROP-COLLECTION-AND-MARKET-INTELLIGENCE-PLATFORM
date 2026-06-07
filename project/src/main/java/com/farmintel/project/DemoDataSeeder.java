package com.farmintel.project;

import com.farmintel.project.auth.Role;
import com.farmintel.project.auth.RoleRepository;
import com.farmintel.project.auth.User;
import com.farmintel.project.auth.UserRepository;
import com.farmintel.project.crop.Crop;
import com.farmintel.project.crop.CropRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class DemoDataSeeder implements CommandLineRunner {

    private static final String FARMER_PASSWORD = "Farmer@123";

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CropRepository cropRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(RoleRepository roleRepository,
                          UserRepository userRepository,
                          CropRepository cropRepository,
                          PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.cropRepository = cropRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        Role farmerRole = role("FARMER");
        role("CUSTOMER");
        role("STAFF");
        role("ADMIN");

        User anil = farmer("Anil Kumar", "anil.farmer@farmintel.com", "9876501001", "Guntur, Andhra Pradesh", farmerRole);
        User kavitha = farmer("Kavitha Reddy", "kavitha.farmer@farmintel.com", "9876501002", "Vijayawada, Andhra Pradesh", farmerRole);
        User ramesh = farmer("Ramesh Naidu", "ramesh.farmer@farmintel.com", "9876501003", "Chittoor, Andhra Pradesh", farmerRole);
        User lakshmi = farmer("Lakshmi Devi", "lakshmi.farmer@farmintel.com", "9876501004", "Nellore, Andhra Pradesh", farmerRole);

        crop(anil, "Chillies", 68.0, 420, 12);
        crop(anil, "Turmeric", 74.0, 260, 25);
        crop(kavitha, "Tomato", 32.0, 510, 6);
        crop(kavitha, "Brinjal", 38.0, 340, 7);
        crop(ramesh, "Mango", 96.0, 280, 10);
        crop(ramesh, "Groundnut", 58.0, 650, 30);
        crop(lakshmi, "Paddy", 24.0, 1200, 45);
        crop(lakshmi, "Banana", 42.0, 390, 8);
    }

    private Role role(String name) {
        return roleRepository.findByName(name).orElseGet(() -> {
            Role role = new Role();
            role.setName(name);
            return roleRepository.save(role);
        });
    }

    private User farmer(String name, String email, String phone, String address, Role role) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(FARMER_PASSWORD));
            user.setPhone(phone);
            user.setAddress(address);
            user.setRole(role);
            return userRepository.save(user);
        });
    }

    private void crop(User farmer, String name, Double price, Integer quantity, Integer shelfLifeDays) {
        boolean exists = cropRepository.findByFarmerId(farmer.getId()).stream()
                .anyMatch(crop -> name.equalsIgnoreCase(crop.getName()));

        if (exists) {
            return;
        }

        Crop crop = new Crop();
        crop.setName(name);
        crop.setPrice(price);
        crop.setQuantity(quantity);
        crop.setShelfLifeDays(shelfLifeDays);
        crop.setListedDate(LocalDate.now());
        crop.setStatus("APPROVED");
        crop.setImageUrls(List.of());
        crop.setFarmer(farmer);
        cropRepository.save(crop);
    }
}
