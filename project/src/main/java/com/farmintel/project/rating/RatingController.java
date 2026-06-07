package com.farmintel.project.rating;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/ratings", "/api/ratings"})
public class RatingController {

    @Autowired private RatingService service;

    @PostMapping
    public Rating rate(
            @RequestParam(required = false) Long cropId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false, defaultValue = "") String review,
            @RequestBody(required = false) RatingRequest request
    ) {
        Long resolvedCropId = cropId != null ? cropId : request == null ? null : request.getCropId();
        Long resolvedUserId = userId != null ? userId : request == null ? null : request.getUserId();
        Integer resolvedRating = rating != null ? rating : request == null ? null : request.getRating();
        String resolvedReview = review != null && !review.isBlank()
                ? review
                : request == null ? "" : request.getReview();

        if (resolvedCropId == null || resolvedUserId == null || resolvedRating == null) {
            throw new IllegalArgumentException("cropId, userId, and rating are required");
        }
        return service.addRating(resolvedCropId, resolvedUserId, resolvedRating, resolvedReview == null ? "" : resolvedReview);
    }

    @GetMapping("/{cropId}")
    public double getAvg(@PathVariable Long cropId) {
        return service.getAverageRating(cropId);
    }

    public static class RatingRequest {
        private Long cropId;
        private Long userId;
        private Integer rating;
        private String review;

        public Long getCropId() { return cropId; }
        public void setCropId(Long cropId) { this.cropId = cropId; }

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public Integer getRating() { return rating; }
        public void setRating(Integer rating) { this.rating = rating; }

        public String getReview() { return review; }
        public void setReview(String review) { this.review = review; }
    }
}
