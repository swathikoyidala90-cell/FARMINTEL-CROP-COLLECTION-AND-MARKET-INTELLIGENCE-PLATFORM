package com.farmintel.project.analytics;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

    private final String FLASK_URL = "http://localhost:5000/predict/all-markets";
    private static final List<Map<String, Object>> ANDHRA_PRICE_BOOK = List.of(
            crop("Paddy", "Guntur", "Guntur", 28, 31),
            crop("Rice", "Vijayawada", "NTR", 45, 49),
            crop("Maize", "Kurnool", "Kurnool", 23, 26),
            crop("Groundnut", "Anantapur", "Anantapuramu", 66, 72),
            crop("Red Chilli", "Guntur", "Guntur", 155, 172),
            crop("Turmeric", "Duggirala", "Guntur", 118, 130),
            crop("Cotton", "Adoni", "Kurnool", 68, 74),
            crop("Mango", "Nuzvid", "Eluru", 42, 55),
            crop("Banana", "Tadepalligudem", "West Godavari", 20, 26),
            crop("Tomato", "Madanapalle", "Annamayya", 18, 32),
            crop("Onion", "Kurnool", "Kurnool", 24, 35),
            crop("Green Gram", "Vijayawada", "NTR", 82, 92),
            crop("Black Gram", "Tenali", "Guntur", 88, 98),
            crop("Bengal Gram", "Nandyal", "Nandyal", 62, 70),
            crop("Sugarcane", "Anakapalle", "Anakapalli", 3, 4),
            crop("Coconut", "Rajahmundry", "East Godavari", 28, 36),
            crop("Cashew", "Palasa", "Srikakulam", 108, 126),
            crop("Brinjal", "Vijayawada", "NTR", 22, 30),
            crop("Okra", "Guntur", "Guntur", 28, 38),
            crop("Jowar", "Kadapa", "YSR Kadapa", 31, 36)
    );

    public Map<String, Object> getBestMarket(String crop, String location) {

        RestTemplate restTemplate = new RestTemplate();

        Map<String, Object> request = new HashMap<>();
        request.put("crop", crop);
        request.put("location", location);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(request, headers);

        try {
            ResponseEntity<Map> response =
                    restTemplate.postForEntity(
                            FLASK_URL,
                            entity,
                            Map.class
                    );

            return response.getBody();
        } catch (Exception ex) {
            return getAndhraPrices(crop);
        }
    }

    public Map<String, Object> getAndhraPrices(String crop) {
        String query = crop == null ? "" : crop.trim().toLowerCase();
        List<Map<String, Object>> matches = ANDHRA_PRICE_BOOK.stream()
                .filter(item -> query.isBlank()
                        || item.get("crop").toString().toLowerCase().contains(query)
                        || query.contains(item.get("crop").toString().toLowerCase()))
                .sorted(Comparator.comparing(item -> item.get("crop").toString()))
                .toList();

        List<Map<String, Object>> data = matches.isEmpty() ? ANDHRA_PRICE_BOOK : matches;
        Map<String, Object> best = data.stream()
                .max(Comparator.comparingDouble(item -> ((Number) item.get("predictedPricePerKg")).doubleValue()))
                .orElse(null);

        return Map.of(
                "crop", crop == null || crop.isBlank() ? "All crops" : crop,
                "state", "Andhra Pradesh",
                "unit", "kg",
                "updatedOn", LocalDate.now().toString(),
                "best_market", best == null ? Map.of() : best,
                "markets", data
        );
    }

    private static Map<String, Object> crop(String crop, String market, String district,
                                            double marketPricePerKg, double predictedPricePerKg) {
        Map<String, Object> item = new HashMap<>();
        item.put("crop", crop);
        item.put("market", market);
        item.put("district", district);
        item.put("marketPricePerKg", marketPricePerKg);
        item.put("predictedPricePerKg", predictedPricePerKg);
        item.put("price", predictedPricePerKg);
        item.put("demand", predictedPricePerKg >= marketPricePerKg * 1.08 ? "High" : "Medium");
        item.put("score", predictedPricePerKg);
        return item;
    }
}
