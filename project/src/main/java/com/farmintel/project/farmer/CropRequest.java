package com.farmintel.project.farmer;


import java.util.List;

public class CropRequest {

    private String name;
    private Integer shelfLifeDays;
    private Double price;
    private Integer quantity;
    private Integer farmerId;
    private List<String> imageUrls;

    // getters & setters

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getShelfLifeDays() { return shelfLifeDays; }
    public void setShelfLifeDays(Integer shelfLifeDays) { this.shelfLifeDays = shelfLifeDays; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Integer getFarmerId() { return farmerId; }
    public void setFarmerId(Integer farmerId) { this.farmerId = farmerId; }

    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
}
