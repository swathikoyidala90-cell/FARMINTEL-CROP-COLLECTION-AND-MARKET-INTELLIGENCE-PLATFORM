package com.farmintel.project.reservation;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.farmintel.project.transactions.Payment;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    @Autowired
    private ReservationService service;

    // ✅ FIXED (use IDs internally but map to entities in service)
    @PostMapping
    public Reservation create(
            @RequestParam Long customerId,
            @RequestParam Long cropId,
            @RequestParam int quantity
    ) {
        return service.createReservation(customerId, cropId, quantity);
    }

    @GetMapping("/{customerId}")
    public List<Reservation> getAll(@PathVariable Long customerId) {
        return service.getCustomerReservations(customerId);
    }

    @GetMapping("/farmer/{farmerId}")
    public List<Reservation> getFarmerReservations(@PathVariable Integer farmerId) {
        return service.getFarmerReservations(farmerId);
    }

    @PostMapping("/pay-farmer/history/{historyId}")
public Payment payFarmerFromHistory(@PathVariable Long historyId) {
    return service.payFarmerFromHistory(historyId);
}
}
