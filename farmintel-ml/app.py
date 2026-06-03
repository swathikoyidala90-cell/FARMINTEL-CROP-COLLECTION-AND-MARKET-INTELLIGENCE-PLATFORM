from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd

app = Flask(__name__)

# ===== LOAD MODELS =====
price_model = joblib.load("models/price_model.pkl")
demand_model = joblib.load("models/demand_model.pkl")

le_crop = joblib.load("models/le_crop.pkl")
le_district = joblib.load("models/le_district.pkl")
le_market = joblib.load("models/le_market.pkl")

df_base = pd.read_csv("data/final_crop_data1.csv")

DEMAND_MAP = {0: "Low", 1: "Medium", 2: "High"}

# ===== MARKET COORDINATES =====
MARKET_COORDS = {
    "Guntur": (16.3067, 80.4365),
    "Vijayawada": (16.5062, 80.6480),
    "Kurnool": (15.8281, 78.0373),
    "Rajahmundry": (17.0005, 81.8040),
    "Nellore": (14.4426, 79.9865),
    "Ongole": (15.5057, 80.0499),
    "Visakhapatnam": (17.6868, 83.2185),
    "Tirupati": (13.6288, 79.4192)
}

# ===== SAFE ENCODER =====
def encode_safe(le, value):
    try:
        return int(le.transform([value])[0])
    except:
        return 0


# ===== MAIN API =====
@app.route("/predict/all-markets", methods=["POST"])
def predict_all_markets():
    try:
        data = request.get_json()

        crop = data.get("crop", "").strip()
        user_location = data.get("location", "").strip().lower()

        month = int(data.get("month", pd.Timestamp.now().month))
        year = int(data.get("year", pd.Timestamp.now().year))

        if not crop:
            return jsonify({"error": "crop required"}), 400

        subset = df_base[df_base["commodity"].str.lower() == crop.lower()]

        if subset.empty:
            return jsonify({"error": "crop not found"}), 404

        market_groups = subset.groupby(["market", "district"]).agg(
            min_price=("min_price", "mean"),
            max_price=("max_price", "mean")
        ).reset_index()

        results = []

        for _, row in market_groups.iterrows():

            market = row["market"]
            district = row["district"]

            features = np.array([[
                encode_safe(le_crop, crop),
                encode_safe(le_district, district),
                encode_safe(le_market, market),
                month,
                year,
                row["min_price"],
                row["max_price"]
            ]])

            predicted_price = float(price_model.predict(features)[0])
            demand_class = int(demand_model.predict(features)[0])
            demand = DEMAND_MAP[demand_class]

            # ===== SCORE =====
            weight = {"Low":1, "Medium":2, "High":3}[demand]
            score = predicted_price * weight

            # ===== LOCATION BOOST =====
            location_bonus = 0
            if user_location:
                if user_location in district.lower() or user_location in market.lower():
                    location_bonus = 1000

            final_score = score + location_bonus

            lat, lon = MARKET_COORDS.get(market, (16.5, 80.6))

            results.append({
                "market": market,
                "district": district,
                "price": round(predicted_price, 2),
                "demand": demand,
                "score": round(final_score, 2),
                "nearby": location_bonus > 0,
                "lat": lat,
                "lon": lon
            })

        results.sort(key=lambda x: x["score"], reverse=True)

        return jsonify({
            "crop": crop,
            "user_location": user_location,
            "best_market": results[0],
            "markets": results
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health")
def health():
    return jsonify({"status": "running"})


if __name__ == "__main__":
    app.run(debug=True)