package com.farmintel.project.reservation;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReservationREpository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByUserId(Long userId);
}