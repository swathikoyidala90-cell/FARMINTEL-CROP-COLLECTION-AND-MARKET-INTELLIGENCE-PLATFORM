package com.farmintel.project.transactions;

import com.farmintel.project.reservation.Reservation;
import com.farmintel.project.reservation.ReservationREpository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class PaymentService {

    private static final double PLATFORM_COMMISSION_RATE = 0.05;
    private static final double CUSTOMER_DISCOUNT_RATE = 0.05;
    private static final double RESERVATION_PAYMENT_RATE = 0.02;

    @Autowired
    private PaymentRepository paymentRepo;

    @Autowired
    private ReservationREpository reservationRepo;

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

        Payment p = new Payment();

        p.setReservation(r);              // ✅ FIXED
        p.setCustomer(r.getCustomer());   // ✅ FIXED

        ensureReservationAmounts(r);
        double amount = r.getBalanceAmount();
        p.setAmount(amount);
        p.setPaymentType("ORDER_BALANCE");

        p.setStatus("SUCCESS");
        p.setPaymentMethod(method);
        p.setPaymentDate(LocalDateTime.now());

        r.setPaidAmount(r.getPaidAmount() + amount);
        r.setStatus("COMPLETED");
        reservationRepo.save(r);

        return paymentRepo.save(p);
    }
    public double calculateFarmerAmount(double pricePerKg, int quantity) {
    double total = pricePerKg * quantity;
    return total * (1 - PLATFORM_COMMISSION_RATE);
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
}
