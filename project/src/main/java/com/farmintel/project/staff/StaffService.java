package com.farmintel.project.staff;

import com.farmintel.project.auth.Role;
import com.farmintel.project.auth.RoleRepository;
import com.farmintel.project.auth.User;
import com.farmintel.project.auth.UserRepository;
import com.farmintel.project.crop.Crop;
import com.farmintel.project.crop.CropRepository;
import com.farmintel.project.farmer.FarmerHistory;
import com.farmintel.project.farmer.FarmerHistoryRepository;
import com.farmintel.project.reservation.Reservation;
import com.farmintel.project.reservation.ReservationREpository;
import com.farmintel.project.transactions.Payment;
import com.farmintel.project.transactions.PaymentRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StaffService {

    @Autowired private UserRepository userRepo;
    @Autowired private CropRepository cropRepo;
    @Autowired private ReservationREpository reservationRepo;
    @Autowired private PaymentRepository paymentRepo;
    @Autowired private RoleRepository roleRepo;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private FarmerHistoryRepository historyRepo;

    private static final String UPLOAD_DIR = "uploads/";
    private static final double PLATFORM_COMMISSION_RATE = 0.05;
    private static final double UNSOLD_COMPENSATION_RATE = 0.05;
    private static final double CANCELLATION_REFUND_RATE = 0.50;

    // ================= USERS =================

    public List<User> getFarmers() {
        return userRepo.findAll().stream()
                .filter(u -> u.getRole() != null && "FARMER".equalsIgnoreCase(u.getRole().getName()))
                .collect(Collectors.toList());
    }

    public List<User> getCustomers() {
        return userRepo.findAll().stream()
                .filter(u -> u.getRole() != null && "CUSTOMER".equalsIgnoreCase(u.getRole().getName()))
                .collect(Collectors.toList());
    }

    // ================= CROPS =================

    public List<Crop> getAllCrops() {
        return cropRepo.findAll();
    }

    public Crop updateCropStatus(Integer id, String status) {
        Crop crop = cropRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Crop not found"));
        crop.setStatus(status);
        return cropRepo.save(crop);
    }

    public Crop updateCropPrice(Integer id, Double price) {
        Crop crop = cropRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Crop not found"));
        crop.setPrice(price);
        return cropRepo.save(crop);
    }

    public void deleteCrop(Integer id) {
        cropRepo.deleteById(id);
    }

    // ✅ SELL — record which customer bought, how much, archive if fully sold
    public Crop sellCrop(SellRequest req) {
        Crop crop = cropRepo.findById(req.getCropId())
                .orElseThrow(() -> new RuntimeException("Crop not found"));

        User customer = null;
        if (req.getCustomerId() != null) {
            customer = userRepo.findById(req.getCustomerId()).orElse(null);
        }

        User staff = null;
        if (req.getStaffId() != null) {
            staff = userRepo.findById(req.getStaffId()).orElse(null);
        }

        int soldQty = req.getSoldQuantity() == null ? 0 : req.getSoldQuantity();
        int availableQty = crop.getQuantity() == null ? 0 : crop.getQuantity();
        if (soldQty <= 0) {
            throw new RuntimeException("Sold quantity must be greater than zero");
        }
        if (soldQty > availableQty) {
            throw new RuntimeException("Sold quantity cannot be greater than available stock");
        }

        int remaining = availableQty - soldQty;
        double grossAmount = calculateSoldAmount(crop.getPrice(), soldQty);
        double platformFee = calculatePlatformFee(grossAmount);
        double farmerPayout = calculateFarmerPayout(grossAmount);

        // ✅ Always archive this sale with customer info
        FarmerHistory history = new FarmerHistory();
        history.setFarmer(crop.getFarmer());
        history.setCustomer(customer);
        history.setStaff(staff);
        history.setCropName(crop.getName());
        history.setCropPrice(crop.getPrice());
        history.setSoldQuantity(soldQty);
        history.setTotalQuantity(availableQty);
        history.setGrossAmount(grossAmount);
        history.setPlatformFee(platformFee);
        history.setFarmerPayout(farmerPayout);
        history.setTotalEarned(farmerPayout);
        history.setStatus("PENDING_PAYMENT");  // admin must approve before farmer receives money
        history.setPayoutRequestedAt(LocalDateTime.now());
        history.setCompletedAt(LocalDateTime.now());
        historyRepo.save(history);

        if (remaining <= 0) {
            // All sold — delete crop
            crop.setQuantity(0);
            cropRepo.delete(crop);
        } else {
            // Partially sold — update remaining quantity
            crop.setQuantity(remaining);
            crop.setStatus("APPROVED");
            cropRepo.save(crop);
        }

        return crop;
    }

    // ================= RESERVATIONS =================

    public List<Reservation> getReservations() {
        return reservationRepo.findAll();
    }

    public Reservation updateReservationStatus(Long id, String status) {
        Reservation r = reservationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));
        if ("CANCELLED".equalsIgnoreCase(status) && !"CANCELLED".equalsIgnoreCase(r.getStatus())) {
            double reservationPayment = r.getReservationPaymentAmount();
            if (reservationPayment <= 0 && r.getPayableAmount() > 0) {
                reservationPayment = r.getPayableAmount() * 0.02;
                r.setReservationPaymentAmount(reservationPayment);
            }
            double refundAmount = reservationPayment * CANCELLATION_REFUND_RATE;
            r.setRefundAmount(refundAmount);
            r.setCancelledAt(LocalDateTime.now());

            Payment refund = new Payment();
            refund.setReservation(r);
            refund.setCustomer(r.getCustomer());
            refund.setAmount(refundAmount);
            refund.setStatus("REFUNDED");
            refund.setPaymentMethod("STAFF_REFUND");
            refund.setPaymentType("CANCELLATION_REFUND");
            refund.setPaymentDate(LocalDateTime.now());
            paymentRepo.save(refund);
        }
        r.setStatus(status);
        return reservationRepo.save(r);
    }

    // ================= PAYMENTS =================

    public List<Payment> getPayments() {
        return paymentRepo.findAll();
    }

    // ================= DASHBOARD =================

    public DashboardResponse getDashboard() {
        DashboardResponse res = new DashboardResponse();
        res.setFarmers(getFarmers().size());
        res.setCustomers(getCustomers().size());
        res.setCrops(cropRepo.count());
        res.setReservations(reservationRepo.count());
        res.setRevenue(
            paymentRepo.findAll().stream()
                .filter(p -> "SUCCESS".equalsIgnoreCase(p.getStatus()))
                .mapToDouble(Payment::getAmount)
                .sum()
        );
        res.setUnsoldCrops(
            cropRepo.findAll().stream()
                .filter(c -> !"SOLD".equalsIgnoreCase(c.getStatus()))
                .count()
        );
        return res;
    }

    // ================= CREATE FARMER =================

    public User createFarmer(User request) {
        Role role = roleRepo.findByName("FARMER")
                .orElseThrow(() -> new RuntimeException("Role FARMER not found"));
        request.setRole(role);
        request.setPassword(passwordEncoder.encode(request.getPassword()));
        return userRepo.save(request);
    }

    // ================= CREATE CROP =================

    public Crop createCrop(String name, Double price, Integer quantity,
                           Integer shelfLifeDays, Integer farmerId, MultipartFile image) {
        User farmer = userRepo.findById(farmerId)
                .orElseThrow(() -> new RuntimeException("Farmer not found"));

        Crop crop = new Crop();
        crop.setName(name);
        crop.setPrice(price);
        crop.setQuantity(quantity);
        crop.setShelfLifeDays(shelfLifeDays);
        crop.setListedDate(LocalDate.now());
        crop.setFarmer(farmer);
        crop.setStatus("PENDING");

        if (image != null && !image.isEmpty()) {
            try {
                File dir = new File(UPLOAD_DIR);
                if (!dir.exists()) dir.mkdirs();
                String filename = System.currentTimeMillis() + "_" + image.getOriginalFilename();
                File dest = new File(UPLOAD_DIR + filename);
                image.transferTo(dest);
                crop.setImageUrls(List.of("/" + UPLOAD_DIR + filename));
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        return cropRepo.save(crop);
    }

    // ================= HISTORY =================

    public List<FarmerHistory> getAllHistory() {
        return historyRepo.findAll();
    }

    public List<UnsoldCropWarning> getUnsoldCropWarnings() {
        LocalDate today = LocalDate.now();
        return cropRepo.findAll().stream()
                .filter(crop -> crop.getQuantity() != null && crop.getQuantity() > 0)
                .filter(crop -> !crop.isCompensationPaid())
                .filter(crop -> crop.getShelfLifeDays() != null)
                .map(crop -> {
                    LocalDate listedDate = crop.getListedDate() == null ? today : crop.getListedDate();
                    LocalDate shelfLifeDate = listedDate.plusDays(crop.getShelfLifeDays());
                    long daysRemaining = ChronoUnit.DAYS.between(today, shelfLifeDate);
                    int unsoldQuantity = crop.getQuantity() == null ? 0 : crop.getQuantity();
                    double cropValue = calculateSoldAmount(crop.getPrice(), unsoldQuantity);
                    double compensation = cropValue * UNSOLD_COMPENSATION_RATE;
                    return new UnsoldCropWarning(
                            crop,
                            crop.getFarmer(),
                            shelfLifeDate,
                            daysRemaining,
                            unsoldQuantity,
                            cropValue,
                            compensation
                    );
                })
                .filter(warning -> warning.getDaysRemaining() <= 1)
                .collect(Collectors.toList());
    }

    public Payment payUnsoldCropCompensation(Integer cropId) {
        Crop crop = cropRepo.findById(cropId)
                .orElseThrow(() -> new RuntimeException("Crop not found"));
        if (crop.getFarmer() == null) {
            throw new RuntimeException("Crop farmer not found");
        }
        if (crop.isCompensationPaid()) {
            throw new RuntimeException("Compensation already paid for this crop");
        }

        int unsoldQuantity = crop.getQuantity() == null ? 0 : crop.getQuantity();
        double cropValue = calculateSoldAmount(crop.getPrice(), unsoldQuantity);
        double compensationAmount = cropValue * UNSOLD_COMPENSATION_RATE;

        Payment payment = new Payment();
        payment.setCustomer(crop.getFarmer());
        payment.setAmount(compensationAmount);
        payment.setPaymentMethod("STAFF_COMPENSATION");
        payment.setPaymentType("UNSOLD_CROP_COMPENSATION");
        payment.setStatus("SUCCESS");
        payment.setPaymentDate(LocalDateTime.now());
        paymentRepo.save(payment);

        crop.setCompensationPaid(true);
        crop.setStatus("COMPENSATED");
        cropRepo.save(crop);

        FarmerHistory history = new FarmerHistory();
        history.setFarmer(crop.getFarmer());
        history.setStaff(null);
        history.setCropName(crop.getName());
        history.setCropPrice(crop.getPrice());
        history.setSoldQuantity(0);
        history.setTotalQuantity(unsoldQuantity);
        history.setGrossAmount(cropValue);
        history.setPlatformFee(0.0);
        history.setFarmerPayout(compensationAmount);
        history.setTotalEarned(compensationAmount);
        history.setStatus("COMPENSATION_PAID");
        history.setCompletedAt(LocalDateTime.now());
        historyRepo.save(history);

        return payment;
    }

    public List<FarmerHistory> getFarmerHistory(Integer farmerId) {
        return historyRepo.findByFarmerId(farmerId);
    }

    // ✅ Mark history entry as PAID (called by admin after payment)
    public FarmerHistory markHistoryPaid(Long historyId) {
        throw new RuntimeException("Only admin can approve farmer payouts");
    }

    public Payment payFarmerFromHistory(Long historyId) {
        throw new RuntimeException("Only admin can approve farmer payouts");
    }

    public FarmerHistory requestFarmerPayout(Long historyId) {
        FarmerHistory h = historyRepo.findById(historyId)
                .orElseThrow(() -> new RuntimeException("History record not found"));

        if (!"PAID".equalsIgnoreCase(h.getStatus())) {
            applyPayoutAmounts(h);
            h.setStatus("PENDING_PAYMENT");
            if (h.getPayoutRequestedAt() == null) {
                h.setPayoutRequestedAt(LocalDateTime.now());
            }
        }

        return historyRepo.save(h);
    }

    private double calculateSoldAmount(FarmerHistory history) {
        double pricePerKg = history.getCropPrice() == null ? 0 : history.getCropPrice();
        int soldQuantity = history.getSoldQuantity() == null ? 0 : history.getSoldQuantity();
        return calculateSoldAmount(pricePerKg, soldQuantity);
    }

    private double calculateSoldAmount(Double pricePerKg, int soldQuantity) {
        return (pricePerKg == null ? 0 : pricePerKg) * soldQuantity;
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

    public String staffForgotPassword(String email) {
    User user = userRepo.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

    // TEMP LOGIC
    return "Reset link sent to: " + email;
}

public String resetPassword(String token, String newPassword) {
    User user = userRepo.findByEmail(token)
            .orElseThrow(() -> new RuntimeException("User not found"));

    user.setPassword(passwordEncoder.encode(newPassword));
    userRepo.save(user);

    return "Password reset successful";
}
}
