package com.farmintel.project.reservation;

import com.farmintel.project.auth.User;
import com.farmintel.project.crop.Crop;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private User user;

    @ManyToOne
    private Crop crop;

    private int quantity;
    private LocalDate reservationDate;
    private LocalDate expiryDate;
    private String status;
    private Double totalAmount;
    private Double discountAmount;
    private Double payableAmount;
    private Double reservationPaymentAmount;
    private Double paidAmount;
    private Double refundAmount;
    private LocalDateTime cancelledAt;

   @JsonProperty("customer")
public User getCustomer() {
    return user;
}
    public void setCustomer(User customer) { this.user = customer; }

    public Long getId() { return id; }
    public Crop getCrop() { return crop; }
    public void setCrop(Crop crop) { this.crop = crop; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public LocalDate getReservationDate() { return reservationDate; }
    public void setReservationDate(LocalDate reservationDate) { this.reservationDate = reservationDate; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public double getTotalAmount() { return totalAmount == null ? 0 : totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }

    public double getDiscountAmount() { return discountAmount == null ? 0 : discountAmount; }
    public void setDiscountAmount(double discountAmount) { this.discountAmount = discountAmount; }

    public double getPayableAmount() { return payableAmount == null ? 0 : payableAmount; }
    public void setPayableAmount(double payableAmount) { this.payableAmount = payableAmount; }

    public double getReservationPaymentAmount() { return reservationPaymentAmount == null ? 0 : reservationPaymentAmount; }
    public void setReservationPaymentAmount(double reservationPaymentAmount) { this.reservationPaymentAmount = reservationPaymentAmount; }

    public double getPaidAmount() { return paidAmount == null ? 0 : paidAmount; }
    public void setPaidAmount(double paidAmount) { this.paidAmount = paidAmount; }

    public double getRefundAmount() { return refundAmount == null ? 0 : refundAmount; }
    public void setRefundAmount(double refundAmount) { this.refundAmount = refundAmount; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }

    public double getBalanceAmount() {
        return Math.max(getPayableAmount() - getPaidAmount(), 0);
    }
}
