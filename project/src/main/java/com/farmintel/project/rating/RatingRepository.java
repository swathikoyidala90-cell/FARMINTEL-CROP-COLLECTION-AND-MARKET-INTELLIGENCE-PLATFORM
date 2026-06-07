package com.farmintel.project.rating;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    List<Rating> findByCropId(Long cropId);

    @Query("select coalesce(avg(r.rating), 0) from Rating r where r.crop.id = :cropId")
    Double findAverageByCropId(@Param("cropId") Integer cropId);

    @Query("select count(r) from Rating r where r.crop.id = :cropId")
    Long countByCropId(@Param("cropId") Integer cropId);
}
