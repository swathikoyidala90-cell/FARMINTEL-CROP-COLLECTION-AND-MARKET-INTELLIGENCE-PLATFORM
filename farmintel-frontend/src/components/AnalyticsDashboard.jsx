import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { andhraCropPrices } from "../data/andhraCropPrices";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Tooltip, Legend);

const money = value => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
const soldAmount = history =>
  Number(history.grossAmount ?? (Number(history.cropPrice || 0) * Number(history.soldQuantity || 0)));
const farmerPayout = history =>
  Number(soldAmount(history) * 0.95);

export default function AnalyticsDashboard({ dashboard = {}, crops = [], payments = [], reservations = [], history = [] }) {
  const approved = crops.filter(crop => crop.status === "APPROVED").length;
  const pending = crops.filter(crop => crop.status === "PENDING").length;
  const rejected = crops.filter(crop => crop.status === "REJECTED").length;
  const stockValue = crops.reduce((sum, crop) => sum + Number(crop.price || 0) * Number(crop.quantity || 0), 0);
  const pendingFarmerPayout = history
    .filter(item => item.status === "PENDING_PAYMENT")
    .reduce((sum, item) => sum + farmerPayout(item), 0);

  const cropTotals = crops.reduce((acc, crop) => {
    acc[crop.name] = (acc[crop.name] || 0) + Number(crop.quantity || 0);
    return acc;
  }, {});
  const topCrops = Object.entries(cropTotals).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const priceLeaders = [...andhraCropPrices].sort((a, b) => b.predictedPricePerKg - a.predictedPricePerKg).slice(0, 6);

  const successfulPayments = payments.filter(payment => payment.status === "SUCCESS");
  const revenueByDate = successfulPayments.reduce((acc, payment) => {
    const key = payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "Today";
    acc[key] = (acc[key] || 0) + Number(payment.amount || 0);
    return acc;
  }, {});
  const revenueLabels = Object.keys(revenueByDate).slice(-7);
  const revenueValues = revenueLabels.map(label => revenueByDate[label]);

  return (
    <section className="fd-analytics-panel">
      <div className="fd-section-title">Analytics Dashboard</div>

      <div className="fd-metrics-grid">
        <div className="fd-metric"><div className="fd-metric-label">Stock Value</div><div className="fd-metric-value">{money(stockValue)}</div></div>
        <div className="fd-metric"><div className="fd-metric-label">Pending Payout</div><div className="fd-metric-value warn">{money(pendingFarmerPayout)}</div></div>
        <div className="fd-metric"><div className="fd-metric-label">Reservations</div><div className="fd-metric-value">{dashboard.reservations || reservations.length || 0}</div></div>
        <div className="fd-metric"><div className="fd-metric-label">Live Crops</div><div className="fd-metric-value">{dashboard.crops || crops.length || 0}</div></div>
      </div>

      <div className="fd-analytics-grid">
        <div className="fd-chart-card">
          <div className="fd-chart-card-title">Crop Stock By Quantity</div>
          <Bar
            data={{
              labels: topCrops.map(([name]) => name),
              datasets: [{ label: "kg", data: topCrops.map(([, qty]) => qty), backgroundColor: "#22c55e" }],
            }}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        </div>

        <div className="fd-chart-card">
          <div className="fd-chart-card-title">Crop Approval Mix</div>
          <Doughnut
            data={{
              labels: ["Approved", "Pending", "Rejected"],
              datasets: [{ data: [approved, pending, rejected], backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"] }],
            }}
          />
        </div>

        <div className="fd-chart-card">
          <div className="fd-chart-card-title">Revenue Trend</div>
          <Line
            data={{
              labels: revenueLabels.length ? revenueLabels : ["No payments"],
              datasets: [{ label: "Revenue", data: revenueValues.length ? revenueValues : [0], borderColor: "#3b82f6", backgroundColor: "#3b82f6", tension: 0.35 }],
            }}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        </div>

        <div className="fd-chart-card">
          <div className="fd-chart-card-title">Andhra Predicted Price Leaders</div>
          {priceLeaders.map(item => (
            <div className="fd-trend-row" key={item.crop}>
              <div className="fd-trend-name">{item.crop}</div>
              <div className="fd-trend-bar-wrap">
                <div className="fd-trend-bar" style={{ width: `${Math.min(100, item.predictedPricePerKg / 1.8)}%` }} />
              </div>
              <div className="fd-trend-val">Rs {item.predictedPricePerKg}/kg</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
