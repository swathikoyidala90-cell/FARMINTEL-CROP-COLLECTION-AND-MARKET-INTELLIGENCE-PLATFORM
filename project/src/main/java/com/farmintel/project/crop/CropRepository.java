package com.farmintel.project.crop;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CropRepository extends JpaRepository<Crop, Integer> {

    // ✅ Farmer crops
    List<Crop> findByFarmerId(Integer farmerId);

    // ✅ Filter by status (APPROVED, PENDING, REJECTED)
    List<Crop> findByStatus(String status);

    // ✅ Farmer + status (optional use)
    List<Crop> findByFarmerIdAndStatus(Integer farmerId, String status);
}