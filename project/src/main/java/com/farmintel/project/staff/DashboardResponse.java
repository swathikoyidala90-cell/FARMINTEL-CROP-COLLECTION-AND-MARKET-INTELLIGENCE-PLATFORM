package com.farmintel.project.staff;

public class DashboardResponse {

    private int farmers;
    private int customers;
    private long crops;
    private long reservations;
    private double revenue;

    // 🔥 NEW FIELDS (your logic)
    private long unsoldCrops;
    private double compensation;

    // ===== GETTERS & SETTERS =====

    public int getFarmers() {
        return farmers;
    }

    public void setFarmers(int farmers) {
        this.farmers = farmers;
    }

    public int getCustomers() {
        return customers;
    }

    public void setCustomers(int customers) {
        this.customers = customers;
    }

    public long getCrops() {
        return crops;
    }

    public void setCrops(long crops) {
        this.crops = crops;
    }

    public long getReservations() {
        return reservations;
    }

    public void setReservations(long reservations) {
        this.reservations = reservations;
    }

    public double getRevenue() {
        return revenue;
    }

    public void setRevenue(double revenue) {
        this.revenue = revenue;
    }

    public long getUnsoldCrops() {
        return unsoldCrops;
    }

    public void setUnsoldCrops(long unsoldCrops) {
        this.unsoldCrops = unsoldCrops;
    }

    public double getCompensation() {
        return compensation;
    }

    public void setCompensation(double compensation) {
        this.compensation = compensation;
    }
}