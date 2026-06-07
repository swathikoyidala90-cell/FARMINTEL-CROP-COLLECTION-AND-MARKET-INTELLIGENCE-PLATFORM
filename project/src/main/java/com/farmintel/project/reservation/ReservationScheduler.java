package com.farmintel.project.reservation;

import com.farmintel.project.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class ReservationScheduler {

    @Autowired
    private ReservationREpository reservationRepo;

    // 🔥 Runs every 1 minute
    @Scheduled(fixedRate = 60000)
    public void updateExpiredReservations() {

        System.out.println("⏳ Checking for expired reservations...");

        List<Reservation> all = reservationRepo.findAll();
        LocalDate today = LocalDate.now();

        for (Reservation r : all) {

            // ⚠️ Avoid NullPointer crash
            if (r.getExpiryDate() == null || r.getStatus() == null) {
                continue;
            }

            // 🔥 Expiry logic
            if (r.getExpiryDate().isBefore(today) && r.getStatus().equals("RESERVED")) {

                r.setStatus("EXPIRED");
                reservationRepo.save(r);

                System.out.println("❌ Reservation ID " + r.getId() + " expired");
            }
        }
    }
}