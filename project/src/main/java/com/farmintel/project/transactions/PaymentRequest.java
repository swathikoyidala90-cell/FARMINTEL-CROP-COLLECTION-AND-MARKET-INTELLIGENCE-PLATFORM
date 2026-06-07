package com.farmintel.project.transactions;

import com.farmintel.project.*;
public class PaymentRequest {

    private Long reservationId;
    private String method;

    public Long getReservationId() {
        return reservationId;
    }

    public void setReservationId(Long reservationId) {
        this.reservationId = reservationId;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }
}