package com.farmintel.project.crop;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.farmintel.project.auth.User;
import com.farmintel.project.auth.UserRepository;
import com.farmintel.project.rating.RatingRepository;

import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class CropService {

    @Autowired
    private CropRepository cropRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RatingRepository ratingRepository;

    public Crop saveWithImages(String name,
                               Double price,
                               Integer quantity,
                               Integer shelfLifeDays,
                               Integer farmerId,
                               List<MultipartFile> images) {

        Crop crop = new Crop();
        crop.setName(name);
        crop.setPrice(price);
        crop.setQuantity(quantity);
        crop.setShelfLifeDays(shelfLifeDays);
        crop.setListedDate(LocalDate.now());
        crop.setStatus("PENDING");

        User user = userRepository.findById(farmerId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        crop.setFarmer(user);

        List<String> imageUrls = new ArrayList<>();
        String uploadDir = System.getProperty("user.dir") + "/uploads/";

        File uploadFolder = new File(uploadDir);
        if (!uploadFolder.exists()) {
            uploadFolder.mkdirs();
        }

        if (images != null) {
            for (MultipartFile file : images) {
                if (file.isEmpty()) continue;
                try {
                    String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
                    File dest = new File(uploadDir + fileName);
                    System.out.println("Saving image to: " + dest.getAbsolutePath());
                    file.transferTo(dest.getAbsoluteFile());
                    imageUrls.add("/uploads/" + fileName);
                } catch (IOException e) {
                    throw new RuntimeException("Image upload failed: " + e.getMessage());
                }
            }
        }

        crop.setImageUrls(imageUrls);

        return cropRepository.save(crop);
    }

    public List<Crop> getAll() {
        return attachRatings(cropRepository.findAll());
    }

    public Crop findById(Integer id) {
        return attachRating(cropRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Crop not found")));
    }

    public void delete(Integer id) {
        cropRepository.deleteById(id);
    }

    public List<Crop> getByFarmer(Integer farmerId) {
        return attachRatings(cropRepository.findByFarmerId(farmerId));
    }

    public List<Crop> attachRatings(List<Crop> crops) {
        crops.forEach(this::attachRating);
        return crops;
    }

    public Crop attachRating(Crop crop) {
        if (crop == null || crop.getId() == null) return crop;
        crop.setAvgRating(ratingRepository.findAverageByCropId(crop.getId()));
        crop.setRatingCount(ratingRepository.countByCropId(crop.getId()));
        return crop;
    }

    public Crop updateCrop(Integer id,
                           String name,
                           Double price,
                           Integer quantity,
                           Integer shelfLifeDays,
                           List<MultipartFile> images) {

        Crop crop = cropRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Crop not found"));

        crop.setName(name);
        crop.setPrice(price);
        crop.setQuantity(quantity);
        crop.setShelfLifeDays(shelfLifeDays);

        if (images != null && !images.isEmpty()) {

            List<String> imageUrls = new ArrayList<>();
            String uploadDir = System.getProperty("user.dir") + "/uploads/";

            File uploadFolder = new File(uploadDir);
            if (!uploadFolder.exists()) {
                uploadFolder.mkdirs();
            }

            for (MultipartFile file : images) {
                if (file.isEmpty()) continue;
                try {
                    String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
                    File dest = new File(uploadDir + fileName);
                    System.out.println("Saving image to: " + dest.getAbsolutePath());
                    file.transferTo(dest.getAbsoluteFile());
                    imageUrls.add("/uploads/" + fileName);
                } catch (IOException e) {
                    throw new RuntimeException("Image upload failed: " + e.getMessage());
                }
            }

            crop.setImageUrls(imageUrls);
        }

        return cropRepository.save(crop);
    }
}
