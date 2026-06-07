package com.farmintel.project.crop;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/crops")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"})
public class CropController {

    @Autowired
    private CropService cropService;

    @PostMapping("/upload")
    public Crop uploadCrop(
            @RequestParam("name") String name,
            @RequestParam("price") Double price,
            @RequestParam("quantity") Integer quantity,
            @RequestParam("shelfLifeDays") Integer shelfLifeDays,
            @RequestParam("farmerId") Integer farmerId,
            @RequestParam(value = "images", required = false) List<MultipartFile> images
    ) {
        return cropService.saveWithImages(name, price, quantity, shelfLifeDays, farmerId, images);
    }

    @GetMapping
    public List<Crop> getAll() {
        return cropService.getAll();
    }

    @GetMapping("/{id}")
    public Crop getById(@PathVariable Integer id) {
        return cropService.findById(id);
    }

    @GetMapping("/farmer/{id}")
    public List<Crop> getByFarmer(@PathVariable Integer id) {
        return cropService.getByFarmer(id);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id) {
        cropService.delete(id);
        return "Deleted successfully";
    }

    @PutMapping("/{id}")
    public Crop updateCrop(
            @PathVariable Integer id,
            @RequestParam String name,
            @RequestParam Double price,
            @RequestParam Integer quantity,
            @RequestParam Integer shelfLifeDays,
            @RequestParam(value = "images", required = false) List<MultipartFile> images
    ) {
        return cropService.updateCrop(id, name, price, quantity, shelfLifeDays, images);
    }
}
