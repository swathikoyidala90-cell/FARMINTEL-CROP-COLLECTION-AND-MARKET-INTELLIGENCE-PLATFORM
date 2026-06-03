import { useEffect, useState } from "react";
import "./farmer.css";
import { API_BASE_URL } from "../config";
import AnalyticsDashboard from "./AnalyticsDashboard";

const API = `${API_BASE_URL}/api/admin`;

function EmptyState({ icon, text }) {
  return <div className="fd-empty-state">{icon} {text}</div>;
}

function StatusBadge({ status }) {
  return <span className={`fd-badge ${status}`}>{status}</span>;
}

function RatingSummary({ rating = 0, count = 0 }) {
  const roundedRating = Math.round(Number(rating || 0));

  return (
    <div className="store-product-rating admin-product-rating">
      <div className="store-star-row read-only" aria-label={`${Number(rating || 0).toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} type="button" className={star <= roundedRating ? "active" : ""} disabled>
            ★
          </button>
        ))}
      </div>
      <span>{Number(rating || 0).toFixed(1)}/5</span>
      <span>{Number(count || 0)} rating{Number(count || 0) === 1 ? "" : "s"}</span>
    </div>
  );
}

const soldAmount = history =>
  Number(history.grossAmount ?? (Number(history.cropPrice || 0) * Number(history.soldQuantity || 0)));

const platformFee = history =>
  Number(soldAmount(history) * 0.05);

const farmerPayout = history =>
  Number(soldAmount(history) - platformFee(history));

const formatMoney = value =>
  `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function AdminDashboard({ onLogout }) {

  const [tab, setTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState({});
  const [farmers, setFarmers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [crops, setCrops] = useState([]);
  const [staff, setStaff] = useState([]);
  const [history, setHistory] = useState([]);

  const [staffForm, setStaffForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [payResult, setPayResult] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("ALL"); // ALL | PENDING_PAYMENT | PAID

  const generatePassword = () => {
    setGeneratedPassword("STAFF@" + Math.floor(1000 + Math.random() * 9000));
  };

  const createStaff = async () => {
    if (!staffForm.name || !staffForm.email) { alert("Name and Email required"); return; }
    const password = generatedPassword || "STAFF@123";
    try {
      await fetch(`${API}/create-staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...staffForm, password, role: { name: "STAFF" } })
      });
      alert(`Staff created! Password: ${password}`);
      setStaffForm({ name: "", email: "", phone: "", address: "" });
      setGeneratedPassword("");
      fetchData();
    } catch {
      alert("Error creating staff");
    }
  };

  const paySoldAmountFromHistory = async (historyRecord) => {
    const amount = farmerPayout(historyRecord);
    const farmerName = historyRecord.farmer?.name || "this farmer";

    if (!window.confirm(`Approve ${formatMoney(amount)} payout to ${farmerName}? FarmIntel keeps ${formatMoney(platformFee(historyRecord))} as 5% commission.`)) return;

    try {
      const res = await fetch(`${API}/pay-farmer/history/${historyRecord.id}`, { method: "POST" });
      if (res.ok) {
        const payment = await res.json();
        setPayResult(`Paid ${formatMoney(payment.amount || amount)} to ${farmerName}`);
        fetchData();
      } else {
        setPayResult("Payment failed");
      }
    } catch {
      setPayResult("Network error");
    }

    setTimeout(() => setPayResult(null), 4000);
  };

  const fetchData = async () => {
    try {
      const res = await Promise.all([
        fetch(`${API}/dashboard`),
        fetch(`${API}/farmers`),
        fetch(`${API}/customers`),
        fetch(`${API}/payments`),
        fetch(`${API}/crops`),
        fetch(`${API}/staff`),
        fetch(`${API}/history`)
      ]);
      const data = await Promise.all(res.map(r => r.ok ? r.json() : []));
      const [d, f, c, p, cr, s, h] = data;
      const safe = x => Array.isArray(x) ? x : [];
      setDashboard(d || {});
      setFarmers(safe(f));
      setCustomers(safe(c));
      setPayments(safe(p).filter(payment => payment.reservation));
      setCrops(safe(cr));
      setStaff(safe(s));
      setHistory(safe(h));
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const pendingCount = history.filter(h => h.status === "PENDING_PAYMENT").length;
  const pendingByFarmer = history
    .filter(h => h.status === "PENDING_PAYMENT")
    .reduce((totals, h) => {
      const farmer = h.farmer?.name || "Unknown farmer";
      totals[farmer] = (totals[farmer] || 0) + farmerPayout(h);
      return totals;
    }, {});

  const filteredHistory = historyFilter === "ALL"
    ? history
    : history.filter(h => h.status === historyFilter);

  return (
    <div className="fd-root">

      <header className="fd-header">
        <div className="fd-logo">Admin<span>Panel</span></div>
        <nav className="fd-nav">
          {[
            { key: "dashboard", label: " Dashboard" },
            { key: "users", label: " Users" },
            { key: "payments", label: " Payments" },
            { key: "crops", label: " Crops" },
            { key: "staff", label: " Staff" },
            { key: "history", label: ` History${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={tab === t.key ? "active" : ""}>
              {t.label}
            </button>
          ))}
        </nav>
        <button className="fd-logout" onClick={onLogout}>Logout</button>
      </header>

      <main className="fd-body">

        {/* ===== DASHBOARD ===== */}
        {tab === "dashboard" && (
          <>
            <div className="fd-section-title">Overview</div>
            <div className="fd-grid">
              {[
                { label: "Total Revenue", value: `${dashboard.totalRevenue || 0}` },
                { label: "Total Orders", value: dashboard.totalOrders || 0 },
                { label: "Farmers", value: dashboard.farmers || 0 },
                { label: "Customers", value: dashboard.customers || 0 },
                { label: "Staff", value: dashboard.staff || 0 },
              ].map(card => (
                <div key={card.label} className="fd-card">
                  <div className="fd-card-body"><div>{card.label}</div><h3>{card.value}</h3></div>
                </div>
              ))}
              {pendingCount > 0 && (
                <div className="fd-card" style={{ borderColor: "rgba(251,191,36,0.4)" }}>
                  <div className="fd-card-body">
                          <div>Admin Approval Requests</div>
                    <h3 style={{ color: "#fbbf24" }}>{pendingCount}</h3>
                    <button
                      style={{ marginTop: "8px", fontSize: "12px" }}
                      onClick={() => setTab("history")}
                    >
                      View & Pay 
                    </button>
                  </div>
                </div>
              )}
            </div>
            <AnalyticsDashboard
              dashboard={dashboard}
              crops={crops}
              payments={payments}
              history={history}
            />
          </>
        )}

        {/* ===== USERS ===== */}
        {tab === "users" && (
          <>
            <div className="fd-section-title">Farmers</div>
            {farmers.length === 0 ? <EmptyState icon="" text="No farmers" /> : (
              <div className="fd-list-stack">
                {farmers.map(u => (
                  <div key={u.id} className="fd-list-card">
                    <div><div className="fd-list-label">Name</div><div className="fd-list-value">{u.name}</div></div>
                    <div><div className="fd-list-label">Email</div><div className="fd-list-value">{u.email}</div></div>
                  </div>
                ))}
              </div>
            )}
            <div className="fd-section-title" style={{ marginTop: "32px" }}>Customers</div>
            {customers.length === 0 ? <EmptyState icon="" text="No customers" /> : (
              <div className="fd-list-stack">
                {customers.map(u => (
                  <div key={u.id} className="fd-list-card">
                    <div><div className="fd-list-label">Name</div><div className="fd-list-value">{u.name}</div></div>
                    <div><div className="fd-list-label">Email</div><div className="fd-list-value">{u.email}</div></div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== PAYMENTS ===== */}
        {tab === "payments" && (
          <>
            <div className="fd-section-title">Payments</div>
            {payments.length === 0 ? <EmptyState icon="" text="No payments" /> : (
              <div className="fd-list-stack">
                {payments.map(p => (
                  <div key={p.id} className="fd-list-card">
                    <div><div className="fd-list-label">Amount</div><div className="fd-list-amount">{formatMoney(p.amount)}</div></div>
                    <div><div className="fd-list-label">Method</div><div className="fd-list-value">{p.paymentMethod || "N/A"}</div></div>
                    <div><div className="fd-list-label">Customer</div><div className="fd-list-value">{p.reservation?.customer?.name || p.customer?.name || "N/A"}</div></div>
                    <div><div className="fd-list-label">Crop</div><div className="fd-list-value">{p.reservation?.crop?.name || "Farmer payout"}</div></div>
                    <div><div className="fd-list-label">Farmer</div><div className="fd-list-value">{p.reservation?.crop?.farmer?.name || p.customer?.name || "N/A"}</div></div>
                    <div><div className="fd-list-label">Time</div><div className="fd-list-value">{p.paymentDate ? new Date(p.paymentDate).toLocaleString("en-IN") : "N/A"}</div></div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== CROPS ===== */}
        {tab === "crops" && (
          <>
            <div className="fd-section-title">Crops</div>
            {crops.length === 0 ? <EmptyState icon="" text="No crops" /> : (
              <div className="fd-grid">
                {crops.map(c => (
                  <div key={c.id} className="fd-card">
                    <div className="fd-card-body">
                      <div className="fd-card-name">{c.name}</div>
                      <div>{c.price}</div>
                      <RatingSummary rating={c.avgRating} count={c.ratingCount} />
                      <StatusBadge status={c.status} />
                      <div style={{ fontSize: "13px", color: "#64748b", marginTop: "6px" }}> {c.farmer?.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== STAFF ===== */}
        {tab === "staff" && (
          <>
            <div className="fd-section-title">Create Staff</div>
            <div className="fd-form-card">
              <input placeholder="Name" value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} />
              <input placeholder="Email" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} />
              <input placeholder="Phone" value={staffForm.phone} onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })} />
              <input placeholder="Address" value={staffForm.address} onChange={e => setStaffForm({ ...staffForm, address: e.target.value })} />
              <button onClick={generatePassword}>Generate Password</button>
              {generatedPassword && (
                <div style={{ fontSize: "13px", color: "#4ade80" }}>Password: <b>{generatedPassword}</b></div>
              )}
              <br /><br />
              <button onClick={createStaff}>Create Staff</button>
            </div>
            <div className="fd-section-title">Staff List</div>
            {staff.length === 0 ? <EmptyState icon="" text="No staff" /> : (
              <div className="fd-list-stack">
                {staff.map(s => (
                  <div key={s.id} className="fd-list-card">
                    <div><div className="fd-list-label">Name</div><div className="fd-list-value">{s.name}</div></div>
                    <div><div className="fd-list-label">Email</div><div className="fd-list-value">{s.email}</div></div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== HISTORY + PAY FARMER ===== */}
        {tab === "history" && (
          <>
            <div className="fd-section-title">Sales History  Pay Farmers</div>
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

            {payResult && (
              <div style={{
                background: payResult.startsWith("") ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)",
                border: `1px solid ${payResult.startsWith("") ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)"}`,
                borderRadius: "10px", padding: "12px 18px", marginBottom: "20px",
                fontSize: "14px", color: payResult.startsWith("") ? "#4ade80" : "#f87171"
              }}>
                {payResult}
              </div>
            )}

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
              {["ALL", "PENDING_PAYMENT", "PAID"].map(f => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  style={{
                    padding: "7px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: "600",
                    border: "1px solid",
                    background: historyFilter === f
                      ? f === "PENDING_PAYMENT" ? "#fbbf24" : f === "PAID" ? "#4ade80" : "#e2e8f0"
                      : "transparent",
                    borderColor: historyFilter === f
                      ? "transparent"
                      : f === "PENDING_PAYMENT" ? "rgba(251,191,36,0.4)" : f === "PAID" ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.15)",
                    color: historyFilter === f
                      ? "#0d1117"
                      : f === "PENDING_PAYMENT" ? "#fbbf24" : f === "PAID" ? "#4ade80" : "#94a3b8",
                    cursor: "pointer"
                  }}
                >
                  {f === "ALL" ? "All" : f === "PENDING_PAYMENT" ? ` Pending (${pendingCount})` : " Paid"}
                </button>
              ))}
            </div>

            {filteredHistory.length === 0 ? (
              <EmptyState icon="" text="No records" />
            ) : (
              <div className="fd-list-stack">
                {filteredHistory.map(h => (
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
                      <div className="fd-list-label">Crop Bought</div>
                      <div className="fd-list-value"> {h.cropName}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{formatMoney(h.cropPrice)}/kg</div>
                    </div>

                    {/* Farmer */}
                    <div>
                      <div className="fd-list-label">Farmer</div>
                      <div className="fd-list-value"> {h.farmer?.name || "N/A"}</div>
                    </div>

                    <div>
                      <div className="fd-list-label">Staff Candidate</div>
                      <div className="fd-list-value">{h.staff?.name || "N/A"}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        Requested {h.payoutRequestedAt ? new Date(h.payoutRequestedAt).toLocaleString("en-IN") : "after sale"}
                      </div>
                    </div>

                    {/* Qty */}
                    <div>
                      <div className="fd-list-label">Qty Sold</div>
                      <div className="fd-list-value">{h.soldQuantity} kg</div>
                    </div>

                    {/* Amount owed to farmer */}
                    <div>
                      <div className="fd-list-label">Customer Paid</div>
                      <div className="fd-list-amount">{formatMoney(soldAmount(h))}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        5% commission: {formatMoney(platformFee(h))}
                      </div>
                    </div>

                    <div>
                      <div className="fd-list-label">Approve Farmer Payout</div>
                      <div className="fd-list-amount">{formatMoney(farmerPayout(h))}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        95% of sold amount
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <div className="fd-list-label">Date</div>
                      <div className="fd-list-value" style={{ fontSize: "13px" }}>
                        {h.completedAt ? new Date(h.completedAt).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric"
                        }) : "N/A"}
                      </div>
                    </div>

                    {/* Status + Pay button */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                      <StatusBadge status={h.status} />
                      {h.status === "PENDING_PAYMENT" && (
                        <button
                          onClick={() => paySoldAmountFromHistory(h)}
                          style={{
                            background: "#4ade80", color: "#0d1117",
                            border: "none", borderRadius: "8px",
                            padding: "7px 16px", fontFamily: "Syne, sans-serif",
                            fontWeight: "700", fontSize: "13px", cursor: "pointer",
                            whiteSpace: "nowrap"
                          }}
                        >
                          Approve {formatMoney(farmerPayout(h))}
                        </button>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}
