package com.farmintel.project.reservation;

import com.farmintel.project.auth.User;
import com.farmintel.project.auth.UserRepository;
import com.farmintel.project.crop.Crop;
import com.farmintel.project.crop.CropRepository;
import com.farmintel.project.farmer.FarmerHistory;
import com.farmintel.project.farmer.FarmerHistoryRepository;
import com.farmintel.project.transactions.Payment;
import com.farmintel.project.transactions.PaymentRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReservationService {

    private static final double PLATFORM_COMMISSION_RATE = 0.05;
    private static final double CUSTOMER_DISCOUNT_RATE = 0.05;
    private static final double RESERVATION_PAYMENT_RATE = 0.02;

    @Autowired
    private ReservationREpository reservationRepo;
    @Autowired
    private FarmerHistoryRepository historyRepo;
    @Autowired
    private CropRepository cropRepo;
@Autowired
private PaymentRepository paymentRepo;
    @Autowired
    private UserRepository userRepo;   // ✅ NEW

    // ✅ CREATE RESERVATION
    public Reservation createReservation(Long customerId, Long cropId, int quantity) {

        User customer = userRepo.findById(customerId.intValue())
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Crop crop = cropRepo.findById(cropId.intValue())
                .orElseThrow(() -> new RuntimeException("Crop not found"));
        if (quantity <= 0) {
            throw new RuntimeException("Quantity must be greater than zero");
        }
        int availableQuantity = crop.getQuantity() == null ? 0 : crop.getQuantity();
        if (quantity > availableQuantity) {
            throw new RuntimeException("Not enough stock for this reservation");
        }
        double totalAmount = quantity * (crop.getPrice() == null ? 0 : crop.getPrice());
        double discountAmount = totalAmount * CUSTOMER_DISCOUNT_RATE;
        double payableAmount = totalAmount - discountAmount;
        double reservationPayment = payableAmount * RESERVATION_PAYMENT_RATE;

        Reservation r = new Reservation();

        r.setCustomer(customer);   // ✅ FIXED
        r.setCrop(crop);           // ✅ FIXED
        r.setQuantity(quantity);

        LocalDate today = LocalDate.now();
        r.setReservationDate(today);

        LocalDate expiry = today.plusDays(crop.getShelfLifeDays());
        r.setExpiryDate(expiry);

        r.setStatus("RESERVED");
        r.setTotalAmount(totalAmount);
        r.setDiscountAmount(discountAmount);
        r.setPayableAmount(payableAmount);
        r.setReservationPaymentAmount(reservationPayment);
        r.setPaidAmount(reservationPayment);

        Reservation saved = reservationRepo.save(r);

        Payment deposit = new Payment();
        deposit.setReservation(saved);
        deposit.setCustomer(customer);
        deposit.setAmount(reservationPayment);
        deposit.setPaymentMethod("RESERVATION");
        deposit.setPaymentType("RESERVATION_DEPOSIT");
        deposit.setStatus("SUCCESS");
        deposit.setPaymentDate(LocalDateTime.now());
        paymentRepo.save(deposit);

        return saved;
    }

    // ✅ GET CUSTOMER RESERVATIONS
    public List<Reservation> getCustomerReservations(Long customerId) {

        return reservationRepo.findAll()
                .stream()
                .filter(r -> r.getCustomer().getId().equals(customerId.intValue()))
                .collect(Collectors.toList());
    }

    public List<Reservation> getFarmerReservations(Integer farmerId) {

        return reservationRepo.findAll()
                .stream()
                .filter(r -> r.getCrop() != null
                        && r.getCrop().getFarmer() != null
                        && r.getCrop().getFarmer().getId().equals(farmerId))
                .collect(Collectors.toList());
    }

    // ✅ AUTO EXPIRE LOGIC
    @Scheduled(fixedRate = 60000)
    public void updateExpiredReservations() {

        List<Reservation> all = reservationRepo.findAll();
        LocalDate today = LocalDate.now();

        for (Reservation r : all) {
            if (r.getExpiryDate().isBefore(today) && r.getStatus().equals("RESERVED")) {
                r.setStatus("EXPIRED");
                reservationRepo.save(r);
            }
        }
    }
    
public void reduceCropQuantity(Crop crop, int quantity) {

    int remaining = crop.getQuantity() - quantity;

    if (remaining < 0) {
        throw new RuntimeException("Not enough stock");
    }

    crop.setQuantity(remaining);

    if (remaining == 0) {
        crop.setStatus("SOLD");
    }

    cropRepo.save(crop);
}
public double calculateFarmerAmount(double price, int quantity) {

    double total = price * quantity;
    return total * (1 - PLATFORM_COMMISSION_RATE);
}
// ================= PAYMENTS =================

public Payment payFarmerFromHistory(Long historyId) {
    throw new RuntimeException("Only admin can approve farmer payouts");
}
}
