import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, accuracy_score
import joblib
import os

os.makedirs("models", exist_ok=True)

# ── Load Data ──────────────────────────────────────────────
df = pd.read_csv("data/crop_data.csv")
print("Columns:", df.columns.tolist())

# ── Parse date and extract month number ───────────────────
df["month_parsed"] = pd.to_datetime(df["month"])
df["month_num"]    = df["month_parsed"].dt.month
df["year"]         = df["month_parsed"].dt.year

# ── Encode categorical columns ────────────────────────────
le_crop  = LabelEncoder()
le_state = LabelEncoder()

df["crop_encoded"]  = le_crop.fit_transform(df["commodity_name"])
df["state_encoded"] = le_state.fit_transform(df["state_name"])

joblib.dump(le_crop,  "models/le_crop.pkl")
joblib.dump(le_state, "models/le_state.pkl")
print("✅ Encoders saved.")

# ── 1. Price Prediction — Linear Regression ───────────────
features_price = ["crop_encoded", "state_encoded", "month_num", "year", "avg_min_price", "avg_max_price"]
target_price   = "avg_modal_price"

X_p = df[features_price]
y_p = df[target_price]

X_train, X_test, y_train, y_test = train_test_split(X_p, y_p, test_size=0.2, random_state=42)

price_model = LinearRegression()
price_model.fit(X_train, y_train)

preds = price_model.predict(X_test)
rmse  = np.sqrt(mean_squared_error(y_test, preds))
print(f"✅ Price Model RMSE: {rmse:.2f}")

joblib.dump(price_model, "models/price_model.pkl")
print("✅ Price model saved.")

# ── 2. Demand Level — Random Forest ───────────────────────
df = df.dropna(subset=["change"])

df["demand_level"] = pd.cut(
    df["change"],
    bins=[-999, -10, 10, 999],
    labels=[0, 1, 2]
)

# Drop any NaN produced by pd.cut
df = df.dropna(subset=["demand_level"])
df["demand_level"] = df["demand_level"].astype(int)

features_demand = ["crop_encoded", "state_encoded", "month_num", "year", "avg_modal_price"]
target_demand   = "demand_level"

X_d = df[features_demand]
y_d = df[target_demand]

X_train2, X_test2, y_train2, y_test2 = train_test_split(X_d, y_d, test_size=0.2, random_state=42)

demand_model = RandomForestClassifier(n_estimators=100, random_state=42)
demand_model.fit(X_train2, y_train2)

preds2 = demand_model.predict(X_test2)
print(f"✅ Demand Model Accuracy: {accuracy_score(y_test2, preds2)*100:.1f}%")

joblib.dump(demand_model, "models/demand_model.pkl")
print("✅ Demand model saved.")
print("\n🎉 All models trained and saved successfully!")