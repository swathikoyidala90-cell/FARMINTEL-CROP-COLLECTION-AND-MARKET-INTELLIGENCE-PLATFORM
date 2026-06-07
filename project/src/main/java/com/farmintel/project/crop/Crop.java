package com.farmintel.project.crop;

import com.farmintel.project.auth.User;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "crops")
public class Crop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    private Integer shelfLifeDays;

    private Double price;
    private Integer quantity;
    private LocalDate listedDate;
    private Boolean compensationPaid = false;

    @Transient
    private Double avgRating = 0.0;

    @Transient
    private Long ratingCount = 0L;

    @ElementCollection
    private List<String> imageUrls;

    
@ManyToOne
@JoinColumn(name = "farmer_id")
@JsonIgnoreProperties({"role"}) // ✅ FIX LOOP
private User farmer;
    @Column(nullable = false)
    private String status = "PENDING"; // PENDING / APPROVED / REJECTED
    // ✅ GETTERS & SETTERS

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getShelfLifeDays() {
        return shelfLifeDays;
    }

    public void setShelfLifeDays(Integer shelfLifeDays) {
        this.shelfLifeDays = shelfLifeDays;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public LocalDate getListedDate() {
        return listedDate;
    }

    public void setListedDate(LocalDate listedDate) {
        this.listedDate = listedDate;
    }

    public boolean isCompensationPaid() {
        return Boolean.TRUE.equals(compensationPaid);
    }

    public void setCompensationPaid(boolean compensationPaid) {
        this.compensationPaid = compensationPaid;
    }

    public Double getAvgRating() {
        return avgRating;
    }

    public void setAvgRating(Double avgRating) {
        this.avgRating = avgRating == null ? 0.0 : avgRating;
    }

    public Long getRatingCount() {
        return ratingCount;
    }

    public void setRatingCount(Long ratingCount) {
        this.ratingCount = ratingCount == null ? 0L : ratingCount;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public User getFarmer() {
        return farmer;
    }

    public void setFarmer(User farmer) {
        this.farmer = farmer;
    }
    public String getStatus() {
    return status;
}

public void setStatus(String status) {
    this.status = status;
}
}
