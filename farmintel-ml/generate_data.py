import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

os.makedirs("data", exist_ok=True)
np.random.seed(42)

crops = [
    "Tomato", "Rice", "Onion", "Chilli", "Groundnut",
    "Maize", "Potato", "Cotton", "Sugarcane",
    "Turmeric", "Wheat", "Banana", "Mango"
]

markets = [
    ("Guntur", "Guntur"),
    ("Vijayawada", "Krishna"),
    ("Kurnool", "Kurnool"),
    ("Rajahmundry", "East Godavari"),
    ("Nellore", "Nellore"),
    ("Ongole", "Prakasam"),
    ("Visakhapatnam", "Visakhapatnam"),
    ("Tirupati", "Chittoor")
]

peak_season = {
    "Tomato": [2,3,4], "Rice": [10,11], "Onion": [3,4,5],
    "Chilli": [1,2], "Groundnut": [9,10], "Maize": [7,8],
    "Potato": [12,1], "Cotton": [11,12], "Sugarcane": [2,3],
    "Turmeric": [1,2], "Wheat": [4,5], "Banana": [6,7], "Mango": [5,6]
}

data = []

for crop in crops:
    for market, district in markets:
        for i in range(120):

            date = datetime.now() - timedelta(days=np.random.randint(0, 365*3))
            month = date.month

            base_price = np.random.randint(500, 5000)

            if month in peak_season[crop]:
                demand = "High"
                price = base_price * np.random.uniform(1.3, 1.8)
            elif month in [(m+6)%12 for m in peak_season[crop]]:
                demand = "Low"
                price = base_price * np.random.uniform(0.5, 0.8)
            else:
                demand = "Medium"
                price = base_price * np.random.uniform(0.9, 1.2)

            min_price = price * np.random.uniform(0.7, 0.9)
            max_price = price * np.random.uniform(1.1, 1.4)

            data.append({
                "state": "Andhra Pradesh",
                "district": district,
                "market": market,
                "commodity": crop,
                "arrival_date": date.strftime("%Y-%m-%d"),
                "min_price": round(min_price,2),
                "max_price": round(max_price,2),
                "modal_price": round(price,2),
                "demand_label": demand
            })

df = pd.DataFrame(data).sample(frac=1).reset_index(drop=True)
df.to_csv("data/final_crop_data1.csv", index=False)

print("✅ Data Generated:", len(df))