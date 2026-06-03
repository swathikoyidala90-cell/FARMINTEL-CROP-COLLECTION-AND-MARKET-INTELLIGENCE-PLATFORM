import { useEffect, useState } from "react";
import "./farmer.css";
import { API_BASE_URL } from "../config";
import AnalyticsDashboard from "./AnalyticsDashboard";

const API = API_BASE_URL;

const cropImageUrl = path => {
  if (!path) return "";
  return path.startsWith("http") ? path : `${API}${path.startsWith("/") ? "" : "/"}${path}`;
};

function Toast({ msg }) {
  if (!msg) return null;
  return <div className="fd-toast">{msg}</div>;
}

function StatusBadge({ status }) {
  return <span className={`fd-badge ${status}`}>{status}</span>;
}

const soldAmount = history =>
  Number(history.grossAmount ?? (Number(history.cropPrice || 0) * Number(history.soldQuantity || 0)));

const platformFee = history =>
  Number(soldAmount(history) * 0.05);

const farmerPayout = history =>
  Number(soldAmount(history) - platformFee(history));

const formatMoney = value =>
  `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function StaffDashboard({ user, onLogout }) {

  const [tab, setTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState({});
  const [farmers, setFarmers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [crops, setCrops] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [history, setHistory] = useState([]);
  const [compensationWarnings, setCompensationWarnings] = useState([]);
  const [toast, setToast] = useState("");

  const [farmerForm, setFarmerForm] = useState({ name: "", email: "", password: "", phone: "", address: "" });
  const [cropForm, setCropForm] = useState({ name: "", price: "", quantity: "", shelfLifeDays: "", farmerId: "", image: null });

  //  Sell modal  now includes customer selection
  const [sellModal, setSellModal] = useState(null);
  const [sellQty, setSellQty] = useState("");
  const [sellCustomerId, setSellCustomerId] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const fetchData = async () => {
    try {
      const [d, f, c, cr, r, p, h, cw] = await Promise.all([
        fetch(`${API}/staff/dashboard`).then(r => r.json()),
        fetch(`${API}/staff/farmers`).then(r => r.json()),
        fetch(`${API}/staff/customers`).then(r => r.json()),
        fetch(`${API}/staff/crops`).then(r => r.json()),
        fetch(`${API}/staff/reservations`).then(r => r.json()),
        fetch(`${API}/staff/payments`).then(r => r.json()),
        fetch(`${API}/staff/history`).then(r => r.json()),
        fetch(`${API}/staff/compensations/due`).then(r => r.json()),
      ]);
      setDashboard(d || {});
      setFarmers(Array.isArray(f) ? f : []);
      setCustomers(Array.isArray(c) ? c : []);
      setCrops(Array.isArray(cr) ? cr : []);
      setReservations(Array.isArray(r) ? r : []);
      setPayments(Array.isArray(p) ? p : []);
      setHistory(Array.isArray(h) ? h : []);
      setCompensationWarnings(Array.isArray(cw) ? cw : []);
    } catch {
      showToast("Failed to load data");
    }
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id, status) => {
    await fetch(`${API}/staff/crops/${id}/status?status=${status}`, { method: "PUT" });
    showToast("Status updated");
    fetchData();
  };

  const updatePrice = async (id, price) => {
    await fetch(`${API}/staff/crops/${id}/price?price=${price}`, { method: "PUT" });
    showToast("Price updated");
    fetchData();
  };

  const updateReservation = async (id, status) => {
    await fetch(`${API}/staff/reservations/${id}/status?status=${status}`, { method: "PUT" });
    showToast("Reservation updated");
    fetchData();
  };

  const payCompensation = async (warning) => {
    if (!window.confirm(`Pay ${formatMoney(warning.compensationAmount)} compensation to ${warning.farmer?.name || "farmer"} for unsold ${warning.crop?.name}?`)) return;
    const response = await fetch(`${API}/staff/compensations/crops/${warning.crop.id}/pay`, { method: "POST" });
    if (!response.ok) {
      showToast("Failed to pay compensation");
      return;
    }
    showToast("Compensation paid to farmer");
    fetchData();
  };

  //  SELL  POST with customer id
  const submitSell = async () => {
    if (!sellQty || isNaN(sellQty) || Number(sellQty) <= 0) { showToast("Enter a valid quantity"); return; }
    if (Number(sellQty) > sellModal.quantity) { showToast(`Only ${sellModal.quantity} kg available`); return; }
    if (!sellCustomerId) { showToast("Please select the customer who bought this crop"); return; }

    try {
      await fetch(`${API}/staff/crops/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropId: sellModal.id,
          soldQuantity: Number(sellQty),
          customerId: Number(sellCustomerId),
          staffId: user?.id
        })
      });

      const remaining = sellModal.quantity - Number(sellQty);
      if (remaining <= 0) {
        showToast(`All ${sellModal.name} sold. Farmer payout request sent to admin.`);
      } else {
        showToast(`Sold ${sellQty} kg. Remaining: ${remaining} kg. Request sent to admin.`);
      }

      setSellModal(null);
      setSellQty("");
      setSellCustomerId("");
      fetchData();
    } catch {
      showToast("Failed to record sale");
    }
  };

  const createFarmer = async () => {
    if (!farmerForm.name || !farmerForm.email || !farmerForm.phone) { showToast("Name, email and phone are required"); return; }
    try {
      await fetch(`${API}/staff/farmers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(farmerForm)
      });
      showToast("Farmer added successfully");
      setFarmerForm({ name: "", email: "", password: "", phone: "", address: "" });
      fetchData();
    } catch {
      showToast("Failed to add farmer");
    }
  };

  const createCrop = async () => {
    if (!cropForm.name || !cropForm.price || !cropForm.quantity || !cropForm.shelfLifeDays || !cropForm.farmerId) { showToast("All fields are required"); return; }
    try {
      const formData = new FormData();
      formData.append("name", cropForm.name);
      formData.append("price", cropForm.price);
      formData.append("quantity", cropForm.quantity);
      formData.append("shelfLifeDays", cropForm.shelfLifeDays);
      formData.append("farmerId", cropForm.farmerId);
      if (cropForm.image) formData.append("image", cropForm.image);
      await fetch(`${API}/staff/crops`, { method: "POST", body: formData });
      showToast("Crop added successfully");
      setCropForm({ name: "", price: "", quantity: "", shelfLifeDays: "", farmerId: "", image: null });
      fetchData();
    } catch {
      showToast("Failed to add crop");
    }
  };

  const pendingCount = history.filter(h => h.status === "PENDING_PAYMENT").length;
  const pendingByFarmer = history
    .filter(h => h.status === "PENDING_PAYMENT")
    .reduce((totals, h) => {
      const farmer = h.farmer?.name || "Unknown farmer";
      totals[farmer] = (totals[farmer] || 0) + farmerPayout(h);
      return totals;
    }, {});

  return (
    <div className="fd-root">
      <header className="fd-header">
        <div className="fd-logo">Farm<span>Intel</span></div>
        <nav className="fd-nav">
          <button onClick={() => setTab("dashboard")} className={tab === "dashboard" ? "active" : ""}> Dashboard</button>
          <button onClick={() => setTab("farmers")} className={tab === "farmers" ? "active" : ""}> Farmers</button>
          <button onClick={() => setTab("customers")} className={tab === "customers" ? "active" : ""}> Customers</button>
          <button onClick={() => setTab("crops")} className={tab === "crops" ? "active" : ""}> Crops</button>
          <button onClick={() => setTab("reservations")} className={tab === "reservations" ? "active" : ""}> Reservations</button>
          <button onClick={() => setTab("payments")} className={tab === "payments" ? "active" : ""}> Payments</button>
          <button onClick={() => setTab("compensation")} className={tab === "compensation" ? "active" : ""}>
            Compensation {compensationWarnings.length > 0 && <span style={{ background: "#f87171", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", marginLeft: "4px" }}>{compensationWarnings.length}</span>}
          </button>
          <button onClick={() => setTab("history")} className={tab === "history" ? "active" : ""}>
             History {pendingCount > 0 && <span style={{ background: "#f87171", color: "#fff", borderRadius: "10px", padding: "1px 7px", fontSize: "11px", marginLeft: "4px" }}>{pendingCount}</span>}
          </button>
        </nav>
        <button className="fd-logout" onClick={onLogout}>Logout</button>
      </header>

      <main className="fd-body">

        {/* ===== DASHBOARD ===== */}
        {tab === "dashboard" && (
          <>
            <div className="fd-grid">
              <div className="fd-card"><div className="fd-card-body"><div>Farmers</div><div>{dashboard.farmers || 0}</div></div></div>
              <div className="fd-card"><div className="fd-card-body"><div>Customers</div><div>{dashboard.customers || 0}</div></div></div>
              <div className="fd-card"><div className="fd-card-body"><div>Crops</div><div>{dashboard.crops || 0}</div></div></div>
              <div className="fd-card"><div className="fd-card-body"><div>Revenue</div><div>Rs {dashboard.revenue || 0}</div></div></div>
            </div>
            {compensationWarnings.length > 0 && (
              <div className="fd-list-card" style={{ marginBottom: "16px", borderColor: "rgba(248,113,113,0.45)" }}>
                <div>
                  <div className="fd-list-label">Unsold crop warning</div>
                  <div className="fd-list-value">
                    {compensationWarnings.length} crop(s) are within one day of shelf life expiry and need 5% farmer compensation review.
                  </div>
                </div>
                <button className="fd-btn-secondary" onClick={() => setTab("compensation")}>Review</button>
              </div>
            )}
            <AnalyticsDashboard
              dashboard={dashboard}
              crops={crops}
              payments={payments}
              reservations={reservations}
              history={history}
            />
          </>
        )}

        {/* ===== FARMERS ===== */}
        {tab === "farmers" && (
          <>
            <div className="fd-form-card">
              <div className="fd-form-title">Add Farmer</div>
              <div className="fd-form-grid">
                <input className="fd-input" placeholder="Name" value={farmerForm.name} onChange={e => setFarmerForm({ ...farmerForm, name: e.target.value })} />
                <input className="fd-input" placeholder="Email" value={farmerForm.email} onChange={e => setFarmerForm({ ...farmerForm, email: e.target.value })} />
                <input className="fd-input" placeholder="Phone" value={farmerForm.phone} onChange={e => setFarmerForm({ ...farmerForm, phone: e.target.value })} />
                <input className="fd-input" placeholder="Address" value={farmerForm.address} onChange={e => setFarmerForm({ ...farmerForm, address: e.target.value })} />
                <input className="fd-input" placeholder="Password" type="password" value={farmerForm.password} onChange={e => setFarmerForm({ ...farmerForm, password: e.target.value })} />
              </div>
              <button className="fd-btn-primary" onClick={createFarmer}>Create Farmer</button>
            </div>
            <div className="fd-list-stack">
              {farmers.map(f => (
                <div key={f.id} className="fd-list-card">
                  <div><div className="fd-list-label">ID</div><div className="fd-list-value">{f.id}</div></div>
                  <div><div className="fd-list-label">Name</div><div className="fd-list-value">{f.name}</div></div>
                  <div><div className="fd-list-label">Email</div><div className="fd-list-value">{f.email}</div></div>
                  <div><div className="fd-list-label">Address</div><div className="fd-list-value">{f.address || "N/A"}</div></div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ===== CUSTOMERS ===== */}
        {tab === "customers" && (
          <div className="fd-list-stack">
            {customers.map(c => (
              <div key={c.id} className="fd-list-card">
                <div><div className="fd-list-label">ID</div><div className="fd-list-value">{c.id}</div></div>
                <div><div className="fd-list-label">Name</div><div className="fd-list-value">{c.name}</div></div>
                <div><div className="fd-list-label">Email</div><div className="fd-list-value">{c.email}</div></div>
                <div><div className="fd-list-label">Phone</div><div className="fd-list-value">{c.phone || "N/A"}</div></div>
              </div>
            ))}
          </div>
        )}

        {/* ===== CROPS ===== */}
        {tab === "crops" && (
          <>
            <div className="fd-form-card">
              <div className="fd-form-title">Add Crop for Farmer</div>
              <div className="fd-form-grid">
                <input className="fd-input" placeholder="Crop Name" value={cropForm.name} onChange={e => setCropForm({ ...cropForm, name: e.target.value })} />
                <input className="fd-input" placeholder="Price ()" type="number" value={cropForm.price} onChange={e => setCropForm({ ...cropForm, price: e.target.value })} />
                <input className="fd-input" placeholder="Quantity (kg)" type="number" value={cropForm.quantity} onChange={e => setCropForm({ ...cropForm, quantity: e.target.value })} />
                <input className="fd-input" placeholder="Shelf Life (days)" type="number" value={cropForm.shelfLifeDays} onChange={e => setCropForm({ ...cropForm, shelfLifeDays: e.target.value })} />
                <select className="fd-input" value={cropForm.farmerId} onChange={e => setCropForm({ ...cropForm, farmerId: e.target.value })}>
                  <option value="">Select Farmer</option>
                  {farmers.map(f => <option key={f.id} value={f.id}>{f.name} (ID: {f.id})</option>)}
                </select>
                <input type="file" className="fd-input" accept="image/*" onChange={e => setCropForm({ ...cropForm, image: e.target.files[0] })} />
              </div>
              <button className="fd-btn-primary" onClick={createCrop}>Add Crop</button>
            </div>

            <div className="fd-grid">
              {crops.map(c => (
                <div key={c.id} className="fd-card">
                  {c.imageUrls?.[0]
                    ? <img src={cropImageUrl(c.imageUrls[0])} className="fd-card-img" alt={c.name} />
                    : <div className="fd-card-img-placeholder"></div>
                  }
                  <div className="fd-card-body">
                    <div className="fd-card-name">{c.name}</div>
                    <div className="fd-card-meta">
                      <div className="fd-card-price">{c.price}</div>
                      <div className="fd-card-qty">Qty: {c.quantity} kg</div>
                      <div className="fd-card-shelf"> {c.shelfLifeDays ?? "N/A"} days</div>
                    </div>
                    <div className="fd-card-farmer"> {c.farmer?.name || "N/A"}</div>
                    <StatusBadge status={c.status} />
                    <div className="fd-card-actions">
                      <button onClick={() => updateStatus(c.id, "APPROVED")}>Approve</button>
                      <button onClick={() => updateStatus(c.id, "REJECTED")}>Reject</button>
                      <button onClick={() => { const p = prompt("Enter new price:"); if (p) updatePrice(c.id, p); }}>Edit Price</button>
                      <button
                        style={{ background: "rgba(251,191,36,0.15)", borderColor: "#fbbf24", color: "#fbbf24" }}
                        onClick={() => { setSellModal(c); setSellQty(""); setSellCustomerId(""); }}
                      >
                         Mark as Sold
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ===== RESERVATIONS ===== */}
        {tab === "reservations" && (
          <div className="fd-list-stack">
            {reservations.map(r => (
              <div key={r.id} className="fd-list-card">
                <div><div className="fd-list-label">ID</div><div className="fd-list-value">{r.id}</div></div>
                <div><div className="fd-list-label">Crop</div><div className="fd-list-value">{r.crop?.name || "N/A"}</div></div>
                <div><div className="fd-list-label">Customer</div><div className="fd-list-value">{r.customer?.name || "N/A"}</div></div>
                <div><div className="fd-list-label">Quantity</div><div className="fd-list-value">{r.quantity}</div></div>
                <div><div className="fd-list-label">Status</div><div><StatusBadge status={r.status} /></div></div>
                <div className="fd-card-actions">
                  <button onClick={() => updateReservation(r.id, "CONFIRMED")}>Confirm</button>
                  <button onClick={() => updateReservation(r.id, "CANCELLED")}>Cancel</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== PAYMENTS ===== */}
        {tab === "payments" && (
          <div className="fd-list-stack">
            {payments.map(p => (
              <div key={p.id} className="fd-list-card">
                <div><div className="fd-list-label">ID</div><div className="fd-list-value">{p.id}</div></div>
                <div><div className="fd-list-label">Amount</div><div className="fd-list-amount">{formatMoney(p.amount)}</div></div>
                <div><div className="fd-list-label">Type</div><div className="fd-list-value">{p.paymentType || "PAYMENT"}</div></div>
                <div><div className="fd-list-label">Status</div><div><StatusBadge status={p.status} /></div></div>
                <div><div className="fd-list-label">Customer</div><div className="fd-list-value">{p.reservation?.customer?.name || p.customer?.name || "N/A"}</div></div>
                <div><div className="fd-list-label">Crop</div><div className="fd-list-value">{p.reservation?.crop?.name || "Farmer payout"}</div></div>
                <div><div className="fd-list-label">Farmer</div><div className="fd-list-value">{p.reservation?.crop?.farmer?.name || p.customer?.name || "N/A"}</div></div>
                <div><div className="fd-list-label">Time</div><div className="fd-list-value">{p.paymentDate ? new Date(p.paymentDate).toLocaleString("en-IN") : "N/A"}</div></div>
              </div>
            ))}
          </div>
        )}

        {/* ===== COMPENSATION ===== */}
        {tab === "compensation" && (
          <div className="fd-list-stack">
            <div className="fd-section-title">Unsold Crop Compensation Warnings</div>
            {compensationWarnings.length === 0 ? (
              <div className="fd-empty"><p>No compensation warnings right now</p></div>
            ) : compensationWarnings.map(w => (
              <div key={w.crop?.id} className="fd-list-card" style={{ borderLeft: "3px solid #f87171" }}>
                <div>
                  <div className="fd-list-label">Crop</div>
                  <div className="fd-list-value">{w.crop?.name || "N/A"}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>{w.unsoldQuantity} kg unsold</div>
                </div>
                <div>
                  <div className="fd-list-label">Farmer</div>
                  <div className="fd-list-value">{w.farmer?.name || "N/A"}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>{w.farmer?.email || ""}</div>
                </div>
                <div><div className="fd-list-label">Shelf Life Date</div><div className="fd-list-value">{w.shelfLifeDate || "N/A"}</div></div>
                <div><div className="fd-list-label">Crop Value</div><div className="fd-list-amount">{formatMoney(w.cropValue)}</div></div>
                <div><div className="fd-list-label">5% Compensation</div><div className="fd-list-amount">{formatMoney(w.compensationAmount)}</div></div>
                <button className="fd-btn-primary" onClick={() => payCompensation(w)}>Pay Compensation</button>
              </div>
            ))}
          </div>
        )}

        {/* ===== HISTORY ===== */}
        {tab === "history" && (
          <>
            <div className="fd-section-title">Sales History  Customer  Crop  Farmer</div>
            {Object.keys(pendingByFarmer).length > 0 && (
              <div className="fd-list-card" style={{ marginBottom: "16px", borderColor: "rgba(251,191,36,0.35)" }}>
                <div>
                  <div className="fd-list-label">Pending farmer payments</div>
                  <div className="fd-list-value">
                    {Object.entries(pendingByFarmer).map(([farmer, amount]) => `${farmer}: ${formatMoney(amount)}`).join(" | ")}
                  </div>
                </div>
              </div>
            )}
            {history.length === 0 ? (
              <div className="fd-empty"><div className="fd-empty-icon"></div><p>No completed sales yet</p></div>
            ) : (
              <div className="fd-list-stack">
                {history.map(h => (
                  <div key={h.id} className="fd-list-card" style={{
                    borderLeft: h.status === "PENDING_PAYMENT"
                      ? "3px solid #fbbf24"
                      : h.status === "PAID"
                        ? "3px solid #4ade80"
                        : "3px solid #334155"
                  }}>
                    {/* Customer */}
                    <div>
                      <div className="fd-list-label">Customer</div>
                      <div className="fd-list-value"> {h.customer?.name || "Walk-in"}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{h.customer?.email || ""}</div>
                    </div>

                    {/* Crop */}
                    <div>
                      <div className="fd-list-label">Crop</div>
                      <div className="fd-list-value"> {h.cropName}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{formatMoney(h.cropPrice)}/kg</div>
                    </div>

                    {/* Farmer */}
                    <div>
                      <div className="fd-list-label">Farmer</div>
                      <div className="fd-list-value"> {h.farmer?.name || "N/A"}</div>
                    </div>

                    <div>
                      <div className="fd-list-label">Handled By</div>
                      <div className="fd-list-value">{h.staff?.name || "Current staff"}</div>
                    </div>

                    {/* Qty sold */}
                    <div>
                      <div className="fd-list-label">Qty Sold</div>
                      <div className="fd-list-value">{h.soldQuantity} kg</div>
                    </div>

                    {/* Total */}
                    <div>
                      <div className="fd-list-label">Customer Paid</div>
                      <div className="fd-list-amount">{formatMoney(soldAmount(h))}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        5% fee: {formatMoney(platformFee(h))}
                      </div>
                    </div>

                    <div>
                      <div className="fd-list-label">Farmer Payout</div>
                      <div className="fd-list-amount">{formatMoney(farmerPayout(h))}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>95% after admin approval</div>
                    </div>

                    {/* Date */}
                    <div>
                      <div className="fd-list-label">Date</div>
                      <div className="fd-list-value" style={{ fontSize: "13px" }}>
                        {h.completedAt ? new Date(h.completedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
                      </div>
                    </div>

                    {/* Status + payment */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                      <StatusBadge status={h.status} />
                      {h.status === "PENDING_PAYMENT" && (
                        <div style={{ fontSize: "12px", color: "#fbbf24" }}>Waiting for admin approval</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </main>

      {/* ===== SELL MODAL ===== */}
      {sellModal && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000
        }}>
          <div className="fd-form-card" style={{ width: "420px", margin: 0 }}>
            <h3 style={{ marginBottom: "6px", color: "#fff", fontFamily: "Syne, sans-serif" }}>
               Record Sale  {sellModal.name}
            </h3>
            <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "20px" }}>
              Available: <strong style={{ color: "#4ade80" }}>{sellModal.quantity} kg</strong>
              &nbsp;&nbsp;
              Price: <strong style={{ color: "#4ade80" }}>{sellModal.price}/kg</strong>
              &nbsp;&nbsp;
              Farmer: <strong style={{ color: "#e2e8f0" }}>{sellModal.farmer?.name}</strong>
            </p>

            {/* Customer select */}
            <div style={{ marginBottom: "4px", fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Who bought this?
            </div>
            <select
              value={sellCustomerId}
              onChange={e => setSellCustomerId(e.target.value)}
              style={{ marginBottom: "14px" }}
            >
              <option value="">-- Select Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
              ))}
            </select>

            {/* Quantity */}
            <div style={{ marginBottom: "4px", fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Quantity sold (kg)
            </div>
            <input
              className="fd-input"
              type="number"
              placeholder={`Max ${sellModal.quantity} kg`}
              value={sellQty}
              onChange={e => setSellQty(e.target.value)}
              style={{ marginBottom: "12px" }}
            />

            {/* Live preview */}
            {sellQty && !isNaN(sellQty) && Number(sellQty) > 0 && sellCustomerId && (
              <div style={{
                background: "rgba(74,222,128,0.07)",
                border: "1px solid rgba(74,222,128,0.2)",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "16px",
                fontSize: "13px",
                color: "#94a3b8"
              }}>
                <div style={{ marginBottom: "4px" }}>
                  Customer: <strong style={{ color: "#e2e8f0" }}>{customers.find(c => String(c.id) === String(sellCustomerId))?.name}</strong>
                </div>
                <div style={{ marginBottom: "4px" }}>
                  Customer paid: <strong style={{ color: "#4ade80" }}>{formatMoney(sellModal.price * Number(sellQty))}</strong>
                </div>
                <div style={{ marginBottom: "4px" }}>
                  FarmIntel 5% commission: <strong style={{ color: "#fbbf24" }}>{formatMoney(sellModal.price * Number(sellQty) * 0.05)}</strong>
                </div>
                <div style={{ marginBottom: "4px" }}>
                  Farmer payout after admin approval: <strong style={{ color: "#4ade80" }}>{formatMoney(sellModal.price * Number(sellQty) * 0.95)}</strong>
                </div>
                <div>
                  {Number(sellQty) >= sellModal.quantity
                    ? <span style={{ color: "#fbbf24" }}> Crop fully sold  will be archived to history</span>
                    : <span>Remaining stock: {sellModal.quantity - Number(sellQty)} kg</span>
                  }
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={submitSell}>Confirm Sale</button>
              <button
                onClick={() => { setSellModal(null); setSellQty(""); setSellCustomerId(""); }}
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast msg={toast} />
    </div>
  );
}
