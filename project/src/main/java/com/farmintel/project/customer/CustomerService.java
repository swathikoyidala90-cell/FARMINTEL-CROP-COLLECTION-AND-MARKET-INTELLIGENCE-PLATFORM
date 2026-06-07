package com.farmintel.project.customer;

import com.farmintel.project.auth.User;
import com.farmintel.project.auth.UserRepository;
import com.farmintel.project.crop.*;
import com.farmintel.project.farmer.FarmerHistory;
import com.farmintel.project.farmer.FarmerHistoryRepository;
import com.farmintel.project.reservation.*;
import com.farmintel.project.transactions.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private static final double PLATFORM_COMMISSION_RATE = 0.05;
    private static final double CUSTOMER_DISCOUNT_RATE = 0.05;
    private static final double RESERVATION_PAYMENT_RATE = 0.02;
    private static final double CANCELLATION_REFUND_RATE = 0.50;

    @Autowired private CropRepository cropRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private ReservationREpository reservationRepo;
    @Autowired private PaymentRepository paymentRepo;
    @Autowired private FarmerHistoryRepository historyRepo;
    @Autowired private CropService cropService;

    // ================= CROPS =================
    public List<Crop> getAvailableCrops() {
        return cropService.attachRatings(cropRepo.findByStatus("APPROVED"));
    }

    // ================= RESERVE =================
    public Reservation reserveCrop(Long customerId, Long cropId, int quantity) {

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
        r.setCustomer(customer);
        r.setCrop(crop);
        r.setQuantity(quantity);
        r.setReservationDate(LocalDate.now());
        r.setExpiryDate(LocalDate.now().plusDays(crop.getShelfLifeDays()));
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
        deposit.setStatus("SUCCESS");
        deposit.setPaymentMethod("RESERVATION");
        deposit.setPaymentType("RESERVATION_DEPOSIT");
        deposit.setPaymentDate(LocalDateTime.now());
        paymentRepo.save(deposit);

        return saved;
    }

    // ================= GET RESERVATIONS =================
    public List<Reservation> getCustomerReservations(Long customerId) {
        return reservationRepo.findByUserId(customerId);
    }

    // ================= PAYMENT =================
    public Payment makePayment(Long reservationId, String method) {

        Reservation r = reservationRepo.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        if ("COMPLETED".equalsIgnoreCase(r.getStatus())) {
            return paymentRepo.findByReservationId(reservationId).stream()
                    .filter(payment -> "SUCCESS".equalsIgnoreCase(payment.getStatus()))
                    .filter(payment -> "ORDER_BALANCE".equalsIgnoreCase(payment.getPaymentType()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Reservation already paid"));
        }
        if ("CANCELLED".equalsIgnoreCase(r.getStatus())) {
            throw new RuntimeException("Cancelled reservations cannot be paid");
        }
        if (r.getCrop() == null || r.getCrop().getFarmer() == null) {
            throw new RuntimeException("Reservation crop or farmer not found");
        }
        int availableQuantity = r.getCrop().getQuantity() == null ? 0 : r.getCrop().getQuantity();
        if (r.getQuantity() > availableQuantity) {
            throw new RuntimeException("Not enough stock for this reservation");
        }

        Payment p = new Payment();
        p.setReservation(r);
        p.setCustomer(r.getCustomer());

        ensureReservationAmounts(r);
        double finalPayment = r.getBalanceAmount();
        double platformFee = r.getPayableAmount() * PLATFORM_COMMISSION_RATE;
        double farmerPayout = r.getPayableAmount() - platformFee;

        p.setAmount(finalPayment);
        p.setPaymentType("ORDER_BALANCE");
        r.setPaidAmount(r.getPaidAmount() + finalPayment);
        r.setStatus("COMPLETED");

        p.setStatus("SUCCESS");
        p.setPaymentMethod(method);
        p.setPaymentDate(LocalDateTime.now());

        reservationRepo.save(r);
        Payment savedPayment = paymentRepo.save(p);

        FarmerHistory history = new FarmerHistory();
        history.setFarmer(r.getCrop().getFarmer());
        history.setCustomer(r.getCustomer());
        history.setCropName(r.getCrop().getName());
        history.setCropPrice(r.getCrop().getPrice());
        history.setSoldQuantity(r.getQuantity());
        history.setTotalQuantity(availableQuantity);
        history.setGrossAmount(r.getPayableAmount());
        history.setPlatformFee(platformFee);
        history.setFarmerPayout(farmerPayout);
        history.setTotalEarned(farmerPayout);
        history.setStatus("PENDING_PAYMENT");
        history.setPayoutRequestedAt(LocalDateTime.now());
        history.setCompletedAt(LocalDateTime.now());
        historyRepo.save(history);

        int remaining = availableQuantity - r.getQuantity();
        r.getCrop().setQuantity(Math.max(remaining, 0));
        if (remaining <= 0) {
            r.getCrop().setStatus("SOLD");
        }
        cropRepo.save(r.getCrop());

        return savedPayment;
    }

    public Payment cancelReservation(Long reservationId, String method) {
        Reservation r = reservationRepo.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));
        if ("COMPLETED".equalsIgnoreCase(r.getStatus())) {
            throw new RuntimeException("Completed orders cannot be cancelled");
        }
        if ("CANCELLED".equalsIgnoreCase(r.getStatus())) {
            return paymentRepo.findByReservationId(reservationId).stream()
                    .filter(payment -> "CANCELLATION_REFUND".equalsIgnoreCase(payment.getPaymentType()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Reservation already cancelled"));
        }

        ensureReservationAmounts(r);
        double refundAmount = r.getReservationPaymentAmount() * CANCELLATION_REFUND_RATE;
        r.setRefundAmount(refundAmount);
        r.setStatus("CANCELLED");
        r.setCancelledAt(LocalDateTime.now());
        reservationRepo.save(r);

        Payment refund = new Payment();
        refund.setReservation(r);
        refund.setCustomer(r.getCustomer());
        refund.setAmount(refundAmount);
        refund.setStatus("REFUNDED");
        refund.setPaymentMethod(method == null || method.isBlank() ? "STAFF_REFUND" : method);
        refund.setPaymentType("CANCELLATION_REFUND");
        refund.setPaymentDate(LocalDateTime.now());
        return paymentRepo.save(refund);
    }

    private void ensureReservationAmounts(Reservation r) {
        if (r.getPayableAmount() > 0) {
            return;
        }
        double totalAmount = r.getQuantity() * (r.getCrop().getPrice() == null ? 0 : r.getCrop().getPrice());
        double discountAmount = totalAmount * CUSTOMER_DISCOUNT_RATE;
        double payableAmount = totalAmount - discountAmount;
        double reservationPayment = payableAmount * RESERVATION_PAYMENT_RATE;
        r.setTotalAmount(totalAmount);
        r.setDiscountAmount(discountAmount);
        r.setPayableAmount(payableAmount);
        r.setReservationPaymentAmount(reservationPayment);
        r.setPaidAmount(Math.max(r.getPaidAmount(), reservationPayment));
    }

    // ================= PAYMENTS =================
    public List<Payment> getCustomerPayments(Long customerId) {
        return paymentRepo.findByCustomerId(customerId);
    }
}
