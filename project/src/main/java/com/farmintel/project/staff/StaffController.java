package com.farmintel.project.staff;

import com.farmintel.project.auth.User;
import com.farmintel.project.crop.Crop;
import com.farmintel.project.crop.CropService;
import com.farmintel.project.farmer.FarmerHistory;
import com.farmintel.project.reservation.Reservation;
import com.farmintel.project.transactions.Payment;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/staff")
@CrossOrigin
public class StaffController {

    @Autowired
    private StaffService service;

    @Autowired
    private CropService cropService;

    // ================= USERS =================

    @GetMapping("/farmers")
    public List<User> farmers() { return service.getFarmers(); }

    @GetMapping("/customers")
    public List<User> customers() { return service.getCustomers(); }

    // ================= CROPS =================

    @GetMapping("/crops")
    public List<Crop> crops() { return service.getAllCrops(); }

    @PutMapping("/crops/{id}/status")
    public Crop updateStatus(@PathVariable Integer id, @RequestParam String status) {
        return service.updateCropStatus(id, status);
    }

    @PutMapping("/crops/{id}/price")
    public Crop updatePrice(@PathVariable Integer id, @RequestParam Double price) {
        return service.updateCropPrice(id, price);
    }

    // ✅ NEW — sell endpoint with customer tracking
    @PostMapping("/crops/sell")
    public Crop sellCrop(@RequestBody SellRequest request) {
        return service.sellCrop(request);
    }

    // ================= RESERVATIONS =================

    @GetMapping("/reservations")
    public List<Reservation> reservations() { return service.getReservations(); }

    @PutMapping("/reservations/{id}/status")
    public Reservation updateReservation(@PathVariable Long id, @RequestParam String status) {
        return service.updateReservationStatus(id, status);
    }

    // ================= PAYMENTS =================

    @GetMapping("/payments")
    public List<Payment> payments() { return service.getPayments(); }

    // ================= DASHBOARD =================

    @GetMapping("/dashboard")
    public DashboardResponse dashboard() { return service.getDashboard(); }

    // ================= CREATE FARMER =================

    @PostMapping("/farmers")
    public User createFarmer(@RequestBody User request) {
        return service.createFarmer(request);
    }

    // ================= CREATE CROP =================

    @PostMapping(value = "/crops", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Crop createCrop(
            @RequestParam("name") String name,
            @RequestParam("price") Double price,
            @RequestParam("quantity") Integer quantity,
            @RequestParam("shelfLifeDays") Integer shelfLifeDays,
            @RequestParam("farmerId") Integer farmerId,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "images", required = false) List<MultipartFile> images
    ) {
        List<MultipartFile> uploadImages = new ArrayList<>();
        if (images != null) {
            uploadImages.addAll(images);
        }
        if (image != null && !image.isEmpty()) {
            uploadImages.add(image);
        }

        return cropService.saveWithImages(name, price, quantity, shelfLifeDays, farmerId, uploadImages);
    }

    // ================= HISTORY =================

    @GetMapping("/history")
    public List<FarmerHistory> allHistory() { return service.getAllHistory(); }

    @GetMapping("/history/farmer/{farmerId}")
    public List<FarmerHistory> farmerHistory(@PathVariable Integer farmerId) {
        return service.getFarmerHistory(farmerId);
    }

    @PutMapping("/history/{id}/paid")
    public FarmerHistory markPaid(@PathVariable Long id) {
        return service.markHistoryPaid(id);
    }

    @PostMapping("/request-farmer-payout/history/{historyId}")
    public FarmerHistory requestFarmerPayout(@PathVariable Long historyId) {
        return service.requestFarmerPayout(historyId);
    }

    @PostMapping("/pay-farmer/history/{historyId}")
    public Payment payFarmerFromHistory(@PathVariable Long historyId) {
        return service.payFarmerFromHistory(historyId);
    }

    @GetMapping("/compensations/due")
    public List<UnsoldCropWarning> compensationWarnings() {
        return service.getUnsoldCropWarnings();
    }

    @PostMapping("/compensations/crops/{cropId}/pay")
    public Payment payUnsoldCropCompensation(@PathVariable Integer cropId) {
        return service.payUnsoldCropCompensation(cropId);
    }
}
