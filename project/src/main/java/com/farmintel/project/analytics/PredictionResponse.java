package com.farmintel.project.analytics;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class PredictionResponse {

    private String crop;

    @JsonProperty("best_market")   // 🔥 FIX
    private MarketResult bestMarket;

    private List<MarketResult> markets;

    public static class MarketResult {

        private String market;
        private String district;
        private double price;
        private String demand;

        public String getMarket() { return market; }
        public void setMarket(String market) { this.market = market; }

        public String getDistrict() { return district; }
        public void setDistrict(String district) { this.district = district; }

        public double getPrice() { return price; }
        public void setPrice(double price) { this.price = price; }

        public String getDemand() { return demand; }
        public void setDemand(String demand) { this.demand = demand; }
    }

    public String getCrop() { return crop; }
    public void setCrop(String crop) { this.crop = crop; }

    public MarketResult getBestMarket() { return bestMarket; }
    public void setBestMarket(MarketResult bestMarket) { this.bestMarket = bestMarket; }

    public List<MarketResult> getMarkets() { return markets; }
    public void setMarkets(List<MarketResult> markets) { this.markets = markets; }
}