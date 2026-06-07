package com.farmintel.project.adminstaff;

import com.farmintel.project.auth.Role;
import com.farmintel.project.auth.RoleRepository;
import com.farmintel.project.auth.User;
import com.farmintel.project.auth.UserRepository;
import com.farmintel.project.crop.Crop;
import com.farmintel.project.crop.CropRepository;
import com.farmintel.project.crop.CropService;
import com.farmintel.project.farmer.FarmerHistory;
import com.farmintel.project.farmer.FarmerHistoryRepository;
import com.farmintel.project.transactions.Payment;
import com.farmintel.project.transactions.PaymentRepository;
import com.farmintel.project.reservation.Reservation;
import com.farmintel.project.reservation.ReservationREpository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    private static final double PLATFORM_COMMISSION_RATE = 0.05;

    @Autowired private UserRepository userRepo;
    @Autowired private CropRepository cropRepo;
    @Autowired private PaymentRepository paymentRepo;
    @Autowired private ReservationREpository reservationRepo;
    @Autowired private RoleRepository roleRepo;
    @Autowired private FarmerHistoryRepository historyRepo;
    @Autowired private CropService cropService;

    // ================= USERS =================

    public List<User> getAllUsers() { return userRepo.findAll(); }

    public List<User> getUsersByRole(String role) {
        return userRepo.findAll().stream()
                .filter(u -> u.getRole() != null &&
                        u.getRole().getName() != null &&
                        u.getRole().getName().equalsIgnoreCase(role))
                .toList();
    }

    // ================= CROPS =================

    public List<Crop> getAllCrops() { return cropService.attachRatings(cropRepo.findAll()); }

    public void deleteCrop(Integer id) { cropRepo.deleteById(id); }

    public List<Crop> getSoldCrops() {
        return cropRepo.findAll().stream()
                .filter(c -> "SOLD".equalsIgnoreCase(c.getStatus()))
                .map(cropService::attachRating)
                .toList();
    }

    // ================= PAYMENTS =================

    public List<Payment> getAllPayments() { return paymentRepo.findAll(); }

    // ✅ Pay farmer directly from a history record
    private Payment payFarmerFromHistoryLegacy(Long historyId) {
        FarmerHistory h = historyRepo.findById(historyId)
                .orElseThrow(() -> new RuntimeException("History record not found"));

        if ("PAID".equalsIgnoreCase(h.getStatus())) {
            throw new RuntimeException("Already paid");
        }

        Payment payment = new Payment();
        payment.setCustomer(h.getFarmer()); // farmer receives payment
        payment.setAmount(calculateSoldAmount(h));
        payment.setPaymentMethod("BANK_TRANSFER");
        payment.setStatus("SUCCESS");
        payment.setPaymentDate(LocalDateTime.now());
        paymentRepo.save(payment);

        // Mark history as PAID
        h.setStatus("PAID");
        h.setTotalEarned(calculateSoldAmount(h));
        historyRepo.save(h);

        return payment;
    }

    // ✅ Legacy pay-farmer (by crop selection)
    public Payment payFarmer(FarmerPaymentRequest request) {
        User farmer = userRepo.findById(request.getFarmerId())
                .orElseThrow(() -> new RuntimeException("Farmer not found"));

        Crop crop = cropRepo.findById(request.getCropId())
                .orElseThrow(() -> new RuntimeException("Crop not found"));

        Payment payment = new Payment();
        payment.setCustomer(farmer);
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getMethod());
        payment.setStatus("SUCCESS");
        payment.setPaymentDate(LocalDateTime.now());

        if (crop.getQuantity() != null && crop.getQuantity() <= 0) {
            crop.setStatus("PAID");
        }
        cropRepo.save(crop);

        return paymentRepo.save(payment);
    }

    // ================= RESERVATIONS =================

    public List<Reservation> getAllReservations() { return reservationRepo.findAll(); }

    // ================= HISTORY =================

    public List<FarmerHistory> getAllHistory() { return historyRepo.findAll(); }

    public List<FarmerHistory> getPendingHistory() {
        return historyRepo.findByStatus("PENDING_PAYMENT");
    }

    // ================= ANALYTICS =================

    public double getTotalRevenue() {
        return paymentRepo.findAll().stream()
                .filter(p -> "SUCCESS".equalsIgnoreCase(p.getStatus()))
                .mapToDouble(Payment::getAmount)
                .sum();
    }

    public long getTotalOrders() { return reservationRepo.count(); }
    public long getTotalFarmers() { return getUsersByRole("FARMER").size(); }
    public long getTotalCustomers() { return getUsersByRole("CUSTOMER").size(); }
    public long getTotalStaff() { return getUsersByRole("STAFF").size(); }

    public Map<String, Double> getRevenueByDate() {
        return paymentRepo.findAll().stream()
                .filter(p -> "SUCCESS".equalsIgnoreCase(p.getStatus()))
                .collect(
                    java.util.stream.Collectors.groupingBy(
                        p -> p.getPaymentDate().toLocalDate().toString(),
                        java.util.stream.Collectors.summingDouble(p -> p.getAmount())
                    )
                );
    }

    public User saveUser(User user) { return userRepo.save(user); }

    public Role getRoleByName(String name) {
        return roleRepo.findByName(name)
                .orElseThrow(() -> new RuntimeException("Role not found"));
    }
    // ================= PAYMENTS =================

public Payment payFarmerFromHistory(Long historyId) {

    FarmerHistory h = historyRepo.findById(historyId)
            .orElseThrow(() -> new RuntimeException("History record not found"));

    if ("PAID".equalsIgnoreCase(h.getStatus())) {
        throw new RuntimeException("Already paid");
    }

    applyPayoutAmounts(h);

    Payment payment = new Payment();
    payment.setCustomer(h.getFarmer());
    payment.setAmount(h.getFarmerPayout());
    payment.setPaymentMethod("ADMIN_APPROVED_TRANSFER");
    payment.setPaymentType("FARMER_PAYOUT");
    payment.setStatus("SUCCESS");
    payment.setPaymentDate(LocalDateTime.now());

    paymentRepo.save(payment);

    h.setStatus("PAID");
    h.setPayoutApprovedAt(LocalDateTime.now());
    historyRepo.save(h);

    return payment;
}

private double calculateSoldAmount(FarmerHistory history) {
    double pricePerKg = history.getCropPrice() == null ? 0 : history.getCropPrice();
    int soldQuantity = history.getSoldQuantity() == null ? 0 : history.getSoldQuantity();
    return pricePerKg * soldQuantity;
}

private double calculatePlatformFee(double grossAmount) {
    return grossAmount * PLATFORM_COMMISSION_RATE;
}

private double calculateFarmerPayout(double grossAmount) {
    return grossAmount - calculatePlatformFee(grossAmount);
}

private void applyPayoutAmounts(FarmerHistory history) {
    double grossAmount = calculateSoldAmount(history);
    double platformFee = calculatePlatformFee(grossAmount);
    double farmerPayout = calculateFarmerPayout(grossAmount);
    history.setGrossAmount(grossAmount);
    history.setPlatformFee(platformFee);
    history.setFarmerPayout(farmerPayout);
    history.setTotalEarned(farmerPayout);
}
}
