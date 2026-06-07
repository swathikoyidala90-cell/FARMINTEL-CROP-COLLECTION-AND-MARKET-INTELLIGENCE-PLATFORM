package com.farmintel.project.adminstaff;

import com.farmintel.project.auth.User;
import com.farmintel.project.crop.Crop;
import com.farmintel.project.farmer.FarmerHistory;
import com.farmintel.project.transactions.Payment;
import com.farmintel.project.reservation.Reservation;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private AdminService service;

    // ================= USERS =================

    @GetMapping("/users")
    public List<User> allUsers() { return service.getAllUsers(); }

    @GetMapping("/farmers")
    public List<User> farmers() { return service.getUsersByRole("FARMER"); }

    @GetMapping("/customers")
    public List<User> customers() { return service.getUsersByRole("CUSTOMER"); }

    // ================= CROPS =================

    @GetMapping("/crops")
    public List<Crop> crops() { return service.getAllCrops(); }

    @DeleteMapping("/crop/{id}")
    public String deleteCrop(@PathVariable Integer id) {
        service.deleteCrop(id);
        return "Crop deleted";
    }

    @GetMapping("/sold-crops")
    public List<Crop> soldCrops() { return service.getSoldCrops(); }

    // ================= PAYMENTS =================

    @GetMapping("/payments")
    public List<Payment> payments() { return service.getAllPayments(); }

    @PostMapping("/pay-farmer")
    public Payment payFarmer(@RequestBody FarmerPaymentRequest request) {
        return service.payFarmer(request);
    }

    // ✅ NEW — Pay farmer directly from a history record
    @PostMapping("/pay-farmer/history/{historyId}")
    public Payment payFarmerFromHistory(@PathVariable Long historyId) {
        return service.payFarmerFromHistory(historyId);
    }

    // ================= RESERVATIONS =================

    @GetMapping("/reservations")
    public List<Reservation> reservations() { return service.getAllReservations(); }

    // ================= HISTORY =================

    @GetMapping("/history")
    public List<FarmerHistory> allHistory() { return service.getAllHistory(); }

    @GetMapping("/history/pending")
    public List<FarmerHistory> pendingPayments() { return service.getPendingHistory(); }

    // ================= DASHBOARD =================

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        return Map.of(
                "totalRevenue", service.getTotalRevenue(),
                "totalOrders", service.getTotalOrders(),
                "farmers", service.getTotalFarmers(),
                "customers", service.getTotalCustomers(),
                "staff", service.getTotalStaff()
        );
    }

    @GetMapping("/revenue-graph")
    public Map<String, Double> revenueGraph() { return service.getRevenueByDate(); }

    @PostMapping("/create-staff")
    public User createStaff(@RequestBody User staff) {
        staff.setPassword(passwordEncoder.encode(staff.getPassword()));
        staff.setRole(service.getRoleByName("STAFF"));
        return service.saveUser(staff);
    }

    @GetMapping("/staff")
    public List<User> staff() {
        try {
            return service.getUsersByRole("STAFF");
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }
}