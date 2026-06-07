package com.farmintel.project.farmer;



import com.farmintel.project.crop.Crop;
import com.farmintel.project.reservation.Reservation;
import com.farmintel.project.transactions.Payment;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/farmer")
public class FarmerController {

    @Autowired
    private FarmerService service;

    // ================= CROPS =================

    @PostMapping("/crops")
    public Crop addCrop(@RequestBody CropRequest request) {
        return service.addCrop(request);
    }

    @GetMapping("/crops/{farmerId}")
    public List<Crop> getMyCrops(@PathVariable Integer farmerId) {
        return service.getFarmerCrops(farmerId);
    }

    @PutMapping("/crops/{cropId}")
    public Crop updateCrop(@PathVariable Integer cropId,
                           @RequestBody CropRequest request) {
        return service.updateCrop(cropId, request);
    }

    @DeleteMapping("/crops/{cropId}")
    public String deleteCrop(@PathVariable Integer cropId) {
        service.deleteCrop(cropId);
        return "Crop deleted";
    }

    // ================= RESERVATIONS =================

    @GetMapping("/reservations/{farmerId}")
    public List<Reservation> getReservations(@PathVariable Integer farmerId) {
        return service.getFarmerReservations(farmerId);
    }

    // ================= PAYMENTS =================

    @GetMapping("/payments/{farmerId}")
    public List<Payment> getPayments(@PathVariable Integer farmerId) {
        return service.getFarmerPayments(farmerId);
    }
}