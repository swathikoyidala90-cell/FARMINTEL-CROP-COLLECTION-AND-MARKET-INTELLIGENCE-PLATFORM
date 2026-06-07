package com.farmintel.project.rating;

import com.farmintel.project.crop.CropRepository;
import com.farmintel.project.auth.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RatingService {

    @Autowired private RatingRepository repo;
    @Autowired private CropRepository cropRepo;
    @Autowired private UserRepository userRepo;

    public Rating addRating(Long cropId, Long userId, int rating, String review) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be from 1 to 5");
        }

        Rating r = new Rating();
        r.setCrop(cropRepo.findById(cropId.intValue())
                .orElseThrow(() -> new RuntimeException("Crop not found")));
        r.setCustomer(userRepo.findById(userId.intValue())
                .orElseThrow(() -> new RuntimeException("Customer not found")));
        r.setRating(rating);
        r.setReview(review == null ? "" : review);
        r.setCreatedAt(LocalDateTime.now());

        return repo.save(r);
    }

    public double getAverageRating(Long cropId) {
        List<Rating> list = repo.findByCropId(cropId);

        return list.stream()
                .mapToInt(Rating::getRating)
                .average()
                .orElse(0);
    }
}
