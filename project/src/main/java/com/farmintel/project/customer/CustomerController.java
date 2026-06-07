package com.farmintel.project.customer;

import com.farmintel.project.crop.Crop;
import com.farmintel.project.reservation.Reservation;
import com.farmintel.project.transactions.Payment;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/customer")
public class CustomerController {

    @Autowired
    private CustomerService service;

    // ================= CROPS =================
    @GetMapping("/crops")
    public List<Crop> getAvailableCrops() {
        return service.getAvailableCrops();
    }

    // ================= RESERVE =================
    @PostMapping("/reserve")
    public Reservation reserve(
            @RequestParam Long customerId,
            @RequestParam Long cropId,
            @RequestParam int quantity
    ) {
        return service.reserveCrop(customerId, cropId, quantity);
    }

    @GetMapping("/reservations/{customerId}")
    public List<Reservation> getMyReservations(@PathVariable Long customerId) {
        return service.getCustomerReservations(customerId);
    }

    // ================= PAYMENT =================
    @PostMapping("/pay")
    public Payment pay(
            @RequestParam Long reservationId,
            @RequestParam String method
    ) {
        return service.makePayment(reservationId, method);
    }

    @PostMapping("/cancel")
    public Payment cancel(
            @RequestParam Long reservationId,
            @RequestParam(defaultValue = "STAFF_REFUND") String method
    ) {
        return service.cancelReservation(reservationId, method);
    }

    @GetMapping("/payments/{customerId}")
    public List<Payment> getPayments(@PathVariable Long customerId) {
        return service.getCustomerPayments(customerId);
    }
}
