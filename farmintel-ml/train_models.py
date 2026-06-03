import pandas as pd
import numpy as np
import joblib
import os

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

os.makedirs("models", exist_ok=True)

df = pd.read_csv("data/final_crop_data1.csv")
df.columns = df.columns.str.strip().str.lower()

df["arrival_date"] = pd.to_datetime(df["arrival_date"])
df["month"] = df["arrival_date"].dt.month
df["year"] = df["arrival_date"].dt.year

# Encoding
le_crop = LabelEncoder()
le_district = LabelEncoder()
le_market = LabelEncoder()

df["crop_enc"] = le_crop.fit_transform(df["commodity"])
df["district_enc"] = le_district.fit_transform(df["district"])
df["market_enc"] = le_market.fit_transform(df["market"])

df["demand"] = df["demand_label"].map({"Low":0,"Medium":1,"High":2})

joblib.dump(le_crop, "models/le_crop.pkl")
joblib.dump(le_district, "models/le_district.pkl")
joblib.dump(le_market, "models/le_market.pkl")

features = ["crop_enc","district_enc","market_enc","month","year","min_price","max_price"]

# Price model
X = df[features]
y = df["modal_price"]

price_model = LinearRegression()
price_model.fit(X, y)
joblib.dump(price_model, "models/price_model.pkl")

# Demand model
X2 = df[features]
y2 = df["demand"]

demand_model = RandomForestClassifier(n_estimators=100)
demand_model.fit(X2, y2)
joblib.dump(demand_model, "models/demand_model.pkl")

print("✅ Models trained")