package com.farmintel.project.transactions;

import com.farmintel.project.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService service;

    @PostMapping
public Payment pay(@RequestBody PaymentRequest request) {
    return service.makePayment(
        request.getReservationId(),
        request.getMethod()
    );
}
}