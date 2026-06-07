package com.farmintel.project.farmer;


import com.farmintel.project.auth.User;
import com.farmintel.project.auth.UserRepository;
import com.farmintel.project.crop.*;
import com.farmintel.project.reservation.*;
import com.farmintel.project.transactions.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FarmerService {

    @Autowired
    private CropRepository cropRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private ReservationREpository reservationRepo;

    @Autowired
    private PaymentRepository paymentRepo;

    // ================= ADD CROP =================
    public Crop addCrop(CropRequest request) {

        User farmer = userRepo.findById(request.getFarmerId())
                .orElseThrow(() -> new RuntimeException("Farmer not found"));

        Crop crop = new Crop();
        crop.setName(request.getName());
        crop.setShelfLifeDays(request.getShelfLifeDays());
        crop.setPrice(request.getPrice());
        crop.setQuantity(request.getQuantity());
        crop.setImageUrls(request.getImageUrls());
        crop.setFarmer(farmer);
        crop.setStatus("PENDING");

        return cropRepo.save(crop);
    }

    // ================= VIEW CROPS =================
    public List<Crop> getFarmerCrops(Integer farmerId) {
        return cropRepo.findAll()
                .stream()
                .filter(c -> c.getFarmer().getId().equals(farmerId))
                .collect(Collectors.toList());
    }

    // ================= UPDATE CROP =================
    public Crop updateCrop(Integer cropId, CropRequest request) {

        Crop crop = cropRepo.findById(cropId)
                .orElseThrow(() -> new RuntimeException("Crop not found"));

        crop.setName(request.getName());
        crop.setShelfLifeDays(request.getShelfLifeDays());
        crop.setPrice(request.getPrice());
        crop.setQuantity(request.getQuantity());
        crop.setImageUrls(request.getImageUrls());

        return cropRepo.save(crop);
    }

    // ================= DELETE CROP =================
    public void deleteCrop(Integer cropId) {
        cropRepo.deleteById(cropId);
    }

    // ================= RESERVATIONS =================
    public List<Reservation> getFarmerReservations(Integer farmerId) {

        return reservationRepo.findAll()
                .stream()
                .filter(r -> r.getCrop() != null
                        && r.getCrop().getFarmer() != null
                        && r.getCrop().getFarmer().getId().equals(farmerId))
                .collect(Collectors.toList());
    }

    // ================= PAYMENTS =================
    public List<Payment> getFarmerPayments(Integer farmerId) {

        return paymentRepo.findAll()
                .stream()
                .filter(p -> {
                    if (p.getReservation() != null
                            && p.getReservation().getCrop() != null
                            && p.getReservation().getCrop().getFarmer() != null
                            && p.getReservation().getCrop().getFarmer().getId().equals(farmerId)) {
                        return true;
                    }

                    return p.getReservation() == null
                            && p.getCustomer() != null
                            && p.getCustomer().getId().equals(farmerId);
                })
                .collect(Collectors.toList());
    }
}
