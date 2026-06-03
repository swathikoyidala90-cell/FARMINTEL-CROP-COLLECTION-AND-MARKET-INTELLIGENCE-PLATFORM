import joblib
import pandas as pd

def get_prediction(month, district_name, commodity_name, price):
    # 1. Load the model and the encoders
    model = joblib.load('models/demand_model.pkl')
    dist_encoder = joblib.load('models/dist_encoder.pkl')
    comm_encoder = joblib.load('models/comm_encoder.pkl')
    
    # 2. Convert NAMES to NUMBERS automatically using the saved encoders
    # Note: .transform() expects a list, so we use [district_name]
    dist_code = dist_encoder.transform([district_name])[0]
    comm_code = comm_encoder.transform([commodity_name])[0]
    
    # 3. Prepare input for the model
    input_data = pd.DataFrame({
        'Month': [month],
        'District_Encoded': [dist_code],
        'Commodity_Encoded': [comm_code],
        'Price': [price]
    })
    
    # 4. Predict
    prediction = model.predict(input_data)[0]
    
    return prediction

# Test it
result = get_prediction(5, "Guntur", "Tomato", 1800)
print(f"Predicted Arrival Quantity: {result:.2f}")