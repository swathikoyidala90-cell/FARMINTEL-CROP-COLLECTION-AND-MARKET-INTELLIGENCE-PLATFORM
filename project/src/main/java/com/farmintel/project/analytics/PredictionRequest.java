package com.farmintel.project.analytics;

public class PredictionRequest {

    private String crop;
    private int month;
    private int year;

    public String getCrop() { return crop; }
    public void setCrop(String crop) { this.crop = crop; }

    public int getMonth() { return month; }
    public void setMonth(int month) { this.month = month; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }
}