package com.farmintel.project.farmer;

import com.farmintel.project.auth.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "farmer_history")
public class FarmerHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "farmer_id")
    @JsonIgnoreProperties({"role", "password"})
    private User farmer;

    // ✅ Customer who bought the crop
    @ManyToOne
    @JoinColumn(name = "customer_id")
    @JsonIgnoreProperties({"role", "password"})
    private User customer;

    @ManyToOne
    @JoinColumn(name = "staff_id")
    @JsonIgnoreProperties({"role", "password"})
    private User staff;

    private String cropName;
    private Double cropPrice;       // price per kg
    private Integer soldQuantity;   // how many kg this customer bought
    private Integer totalQuantity;  // original total stock
    private Double grossAmount;     // cropPrice * soldQuantity
    private Double platformFee;     // 5% retained by platform/admin
    private Double farmerPayout;    // 95% paid to farmer after admin approval
    private Double totalEarned;     // farmerPayout, kept for older UI compatibility
    private String status;          // COMPLETED / PENDING_PAYMENT / PAID
    private LocalDateTime payoutRequestedAt;
    private LocalDateTime payoutApprovedAt;
    private LocalDateTime completedAt;

    // ===== GETTERS & SETTERS =====

    public Long getId() { return id; }

    public User getFarmer() { return farmer; }
    public void setFarmer(User farmer) { this.farmer = farmer; }

    public User getCustomer() { return customer; }
    public void setCustomer(User customer) { this.customer = customer; }

    public User getStaff() { return staff; }
    public void setStaff(User staff) { this.staff = staff; }

    public String getCropName() { return cropName; }
    public void setCropName(String cropName) { this.cropName = cropName; }

    public Double getCropPrice() { return cropPrice; }
    public void setCropPrice(Double cropPrice) { this.cropPrice = cropPrice; }

    public Integer getSoldQuantity() { return soldQuantity; }
    public void setSoldQuantity(Integer soldQuantity) { this.soldQuantity = soldQuantity; }

    public Integer getTotalQuantity() { return totalQuantity; }
    public void setTotalQuantity(Integer totalQuantity) { this.totalQuantity = totalQuantity; }

    public Double getGrossAmount() { return grossAmount; }
    public void setGrossAmount(Double grossAmount) { this.grossAmount = grossAmount; }

    public Double getPlatformFee() { return platformFee; }
    public void setPlatformFee(Double platformFee) { this.platformFee = platformFee; }

    public Double getFarmerPayout() { return farmerPayout; }
    public void setFarmerPayout(Double farmerPayout) { this.farmerPayout = farmerPayout; }

    public Double getTotalEarned() { return totalEarned; }
    public void setTotalEarned(Double totalEarned) { this.totalEarned = totalEarned; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getPayoutRequestedAt() { return payoutRequestedAt; }
    public void setPayoutRequestedAt(LocalDateTime payoutRequestedAt) { this.payoutRequestedAt = payoutRequestedAt; }

    public LocalDateTime getPayoutApprovedAt() { return payoutApprovedAt; }
    public void setPayoutApprovedAt(LocalDateTime payoutApprovedAt) { this.payoutApprovedAt = payoutApprovedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
