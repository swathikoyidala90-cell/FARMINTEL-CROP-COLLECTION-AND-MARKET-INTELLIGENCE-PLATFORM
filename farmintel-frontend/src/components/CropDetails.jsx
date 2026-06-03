import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./farmer.css";

const API = API_BASE_URL;

export default function CropDetails() {
  const { id } = useParams();
  const locationState = useLocation();
  const user = locationState.state?.user;

  const [crop, setCrop] = useState(null);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const cropRes = await fetch(`${API}/crops/${id}`);
      const cropData = await cropRes.json();
      setCrop(cropData);

      const loc = user?.location || "Andhra Pradesh";
      const predRes = await fetch(`${API}/api/analytics/best-market?crop=${encodeURIComponent(cropData.name)}&location=${encodeURIComponent(loc)}`);
      const predData = await predRes.json();
      setPrediction(predData);
    };
    fetchData();
  }, [id, user]);

  if (!crop) return <div className="fd-body">Loading...</div>;

  return (
    <div className="fd-root">
      <div className="fd-body">
        <h2>{crop.name}</h2>
        
        <div className="fd-grid">
          {crop.imageUrls?.map((img, i) => (
            <img key={i} src={`${API}${img.startsWith('/') ? '' : '/'}${img}`} className="fd-card-img" alt="" />
          ))}
        </div>

        <div className="fd-form-card">
          <p>Price: {crop.price}</p>
          <p>Quantity: {crop.quantity}</p>
          <p>Status: {crop.status}</p>
        </div>

        <div className="fd-form-card">
          <h3>Best Market Prediction</h3>
          {/* FIXED: Now correctly accesses the nested best_market object */}
          {prediction && prediction.best_market ? (
            <>
              <p>Market: {prediction.best_market.market}</p>
              <p>Price: {prediction.best_market.price}</p>
              <p>Location: {prediction.best_market.district}</p>
            </>
          ) : <p>Loading prediction...</p>}
        </div>
      </div>
    </div>
  );
}
