export const andhraCropPrices = [
  { crop: "Paddy", market: "Guntur", district: "Guntur", marketPricePerKg: 28, predictedPricePerKg: 31, demand: "High" },
  { crop: "Rice", market: "Vijayawada", district: "NTR", marketPricePerKg: 45, predictedPricePerKg: 49, demand: "High" },
  { crop: "Maize", market: "Kurnool", district: "Kurnool", marketPricePerKg: 23, predictedPricePerKg: 26, demand: "Medium" },
  { crop: "Groundnut", market: "Anantapur", district: "Anantapuramu", marketPricePerKg: 66, predictedPricePerKg: 72, demand: "High" },
  { crop: "Red Chilli", market: "Guntur", district: "Guntur", marketPricePerKg: 155, predictedPricePerKg: 172, demand: "High" },
  { crop: "Turmeric", market: "Duggirala", district: "Guntur", marketPricePerKg: 118, predictedPricePerKg: 130, demand: "High" },
  { crop: "Cotton", market: "Adoni", district: "Kurnool", marketPricePerKg: 68, predictedPricePerKg: 74, demand: "Medium" },
  { crop: "Mango", market: "Nuzvid", district: "Eluru", marketPricePerKg: 42, predictedPricePerKg: 55, demand: "High" },
  { crop: "Banana", market: "Tadepalligudem", district: "West Godavari", marketPricePerKg: 20, predictedPricePerKg: 26, demand: "High" },
  { crop: "Tomato", market: "Madanapalle", district: "Annamayya", marketPricePerKg: 18, predictedPricePerKg: 32, demand: "High" },
  { crop: "Onion", market: "Kurnool", district: "Kurnool", marketPricePerKg: 24, predictedPricePerKg: 35, demand: "High" },
  { crop: "Green Gram", market: "Vijayawada", district: "NTR", marketPricePerKg: 82, predictedPricePerKg: 92, demand: "Medium" },
  { crop: "Black Gram", market: "Tenali", district: "Guntur", marketPricePerKg: 88, predictedPricePerKg: 98, demand: "Medium" },
  { crop: "Bengal Gram", market: "Nandyal", district: "Nandyal", marketPricePerKg: 62, predictedPricePerKg: 70, demand: "Medium" },
  { crop: "Sugarcane", market: "Anakapalle", district: "Anakapalli", marketPricePerKg: 3, predictedPricePerKg: 4, demand: "Medium" },
  { crop: "Coconut", market: "Rajahmundry", district: "East Godavari", marketPricePerKg: 28, predictedPricePerKg: 36, demand: "High" },
  { crop: "Cashew", market: "Palasa", district: "Srikakulam", marketPricePerKg: 108, predictedPricePerKg: 126, demand: "High" },
  { crop: "Brinjal", market: "Vijayawada", district: "NTR", marketPricePerKg: 22, predictedPricePerKg: 30, demand: "Medium" },
  { crop: "Okra", market: "Guntur", district: "Guntur", marketPricePerKg: 28, predictedPricePerKg: 38, demand: "High" },
  { crop: "Jowar", market: "Kadapa", district: "YSR Kadapa", marketPricePerKg: 31, predictedPricePerKg: 36, demand: "Medium" },
];

export function findCropPrice(cropName) {
  if (!cropName) return null;
  const query = cropName.toLowerCase().trim();
  return andhraCropPrices.find(item =>
    item.crop.toLowerCase() === query ||
    item.crop.toLowerCase().includes(query) ||
    query.includes(item.crop.toLowerCase())
  );
}
