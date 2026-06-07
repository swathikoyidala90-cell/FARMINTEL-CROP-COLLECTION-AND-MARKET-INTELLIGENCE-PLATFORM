package com.farmintel.project.staff;

import com.farmintel.project.auth.User;
import com.farmintel.project.crop.Crop;

import java.time.LocalDate;

public class UnsoldCropWarning {

    private Crop crop;
    private User farmer;
    private LocalDate shelfLifeDate;
    private long daysRemaining;
    private int unsoldQuantity;
    private double cropValue;
    private double compensationAmount;

    public UnsoldCropWarning(Crop crop, User farmer, LocalDate shelfLifeDate,
                             long daysRemaining, int unsoldQuantity,
                             double cropValue, double compensationAmount) {
        this.crop = crop;
        this.farmer = farmer;
        this.shelfLifeDate = shelfLifeDate;
        this.daysRemaining = daysRemaining;
        this.unsoldQuantity = unsoldQuantity;
        this.cropValue = cropValue;
        this.compensationAmount = compensationAmount;
    }

    public Crop getCrop() { return crop; }
    public User getFarmer() { return farmer; }
    public LocalDate getShelfLifeDate() { return shelfLifeDate; }
    public long getDaysRemaining() { return daysRemaining; }
    public int getUnsoldQuantity() { return unsoldQuantity; }
    public double getCropValue() { return cropValue; }
    public double getCompensationAmount() { return compensationAmount; }
}
