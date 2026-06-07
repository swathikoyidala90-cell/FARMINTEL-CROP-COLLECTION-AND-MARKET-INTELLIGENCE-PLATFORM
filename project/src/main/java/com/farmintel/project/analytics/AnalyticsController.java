package com.farmintel.project.analytics;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")

public class AnalyticsController {

    @Autowired
    private AnalyticsService service;

    @GetMapping("/best-market")
    public Map<String, Object> getBestMarket(
            @RequestParam String crop,
            @RequestParam(required = false) String location
    ) {
        return service.getBestMarket(crop, location);
    }
    @GetMapping("/markets")
    public Map<String, Object> getMarkets(
            @RequestParam String crop,
            @RequestParam(required = false) String location
    ) {
        return service.getBestMarket(crop, location);
    }

    @GetMapping("/andhra-prices")
    public Map<String, Object> getAndhraPrices(
            @RequestParam(required = false) String crop
    ) {
        return service.getAndhraPrices(crop);
    }
}
