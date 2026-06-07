package com.farmintel.project.farmer;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FarmerHistoryRepository extends JpaRepository<FarmerHistory, Long> {
    List<FarmerHistory> findByFarmerId(Integer farmerId);
    List<FarmerHistory> findByCustomerId(Integer customerId);
    List<FarmerHistory> findByStatus(String status);
}