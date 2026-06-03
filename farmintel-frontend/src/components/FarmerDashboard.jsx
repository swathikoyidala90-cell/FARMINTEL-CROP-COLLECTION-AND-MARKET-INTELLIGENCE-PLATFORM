import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./farmer.css";

const API = API_BASE_URL;

const cropImageUrl = path => {
  if (!path) return "";
  return path.startsWith("http") ? path : `${API}${path.startsWith("/") ? "" : "/"}${path}`;
};

// ---- Helper Components ----
const EmptyState = ({ icon, text }) => (
  <div className="fd-empty">{icon} {text}</div>
);

function Toast({ msg, type }) {
  if (!msg) return null;
  return <div className={`fd-toast${type === "error" ? " error" : ""}`}>{msg}</div>;
}

function StatusBadge({ status }) {
  return <span className={`fd-badge ${status}`}>{status}</span>;
}

// ---- Main Component ----
export default function FarmerDashboard({ user, onLogout }) {
  const navigate = useNavigate();

  const [tab, setTab] = useState("crops");

  const [crops, setCrops] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [payments, setPayments] = useState([]);

  const [form, setForm] = useState({
    name: "",
    price: "",
    quantity: "",
    shelfLifeDays: ""
  });

  const [files, setFiles] = useState([]);
  const [editFiles, setEditFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [editPreviewUrls, setEditPreviewUrls] = useState([]);

  const [editingCrop, setEditingCrop] = useState(null);
  const [editForm, setEditForm] = useState({});

  //  PROFILE STATE (USING ADDRESS)
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    address: user?.address || ""
  });

  const [toast, setToast] = useState({ msg: "", type: "" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3000);
  };

  // ---- Fetch Data ----
  const fetchData = async () => {
    if (!user?.id) return;

    try {
      const [c, r, p] = await Promise.all([
        fetch(`${API}/crops/farmer/${user.id}`).then(res => res.json()),
        fetch(`${API}/api/reservations/farmer/${user.id}`).then(res => res.json()),
        fetch(`${API}/farmer/payments/${user.id}`).then(res => res.json()),
      ]);

      setCrops(Array.isArray(c) ? c : []);
      setReservations(Array.isArray(r) ? r : []);
      setPayments(Array.isArray(p) ? p : []);

    } catch {
      showToast("Failed to load data", "error");
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  useEffect(() => {
    const urls = editFiles.map(file => URL.createObjectURL(file));
    setEditPreviewUrls(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [editFiles]);

  // ---- File Upload ----
  const handleFileChange = (e, setter) => {
    setter(Array.from(e.target.files || []));
    e.target.value = "";
  };

  // ---- Add Crop ----
  const addCrop = async () => {
    const fd = new FormData();

    Object.entries(form).forEach(([key, val]) => fd.append(key, val));
    fd.append("farmerId", user.id);

    for (const file of files) {
      fd.append("images", file);
    }

    await fetch(`${API}/crops/upload`, {
      method: "POST",
      body: fd
    });

    showToast("Crop added");
    setForm({ name: "", price: "", quantity: "", shelfLifeDays: "" });
    setFiles([]);
    fetchData();
  };

  // ---- Update Crop ----
  const updateCrop = async () => {
    const fd = new FormData();

    Object.entries(editForm).forEach(([key, val]) => fd.append(key, val));

    for (const file of editFiles) {
      fd.append("images", file);
    }

    await fetch(`${API}/crops/${editingCrop.id}`, {
      method: "PUT",
      body: fd
    });

    setEditingCrop(null);
    setEditFiles([]);
    showToast("Crop updated");
    fetchData();
  };

  // ---- Update Profile (ADDRESS) ----
  const updateProfile = async () => {
    const res = await fetch(`${API}/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile)
    });

    const updatedUser = await res.json();

    //  update local storage
    localStorage.setItem("user", JSON.stringify(updatedUser));

    showToast("Profile updated");
  };

  // ---- UI ----
  return (
    <div className="fd-root">

      {/* HEADER */}
      <header className="fd-header">
        <div className="fd-logo">Farm<span>Intel</span></div>

        <nav className="fd-nav">
          <button onClick={() => setTab("crops")} className={tab === "crops" ? "active" : ""}>
             Crops
          </button>

          <button onClick={() => setTab("reservations")} className={tab === "reservations" ? "active" : ""}>
             Reservations
          </button>

          <button onClick={() => setTab("payments")} className={tab === "payments" ? "active" : ""}>
             Payments
          </button>

          {/*  NEW PROFILE TAB */}
          <button onClick={() => setTab("profile")} className={tab === "profile" ? "active" : ""}>
             Profile
          </button>
        </nav>

        <button className="fd-logout" onClick={onLogout}>Logout</button>
      </header>

      {/* BODY */}
      <main className="fd-body">

        {/* ===== CROPS ===== */}
        {tab === "crops" && (
          <>
            <div className="fd-form-card fd-crop-editor">
              <h3>Add Crop Details</h3>
              <div className="fd-form-grid">
                <input className="fd-input" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <input className="fd-input" placeholder="Price" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                <input className="fd-input" placeholder="Qty" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                <input className="fd-input" placeholder="Shelf Life" type="number" value={form.shelfLifeDays} onChange={e => setForm({ ...form, shelfLifeDays: e.target.value })} />
              </div>

              <label className="fd-photo-picker">
                <span>Add crop picture</span>
                <small>{files.length ? `${files.length} picture${files.length > 1 ? "s" : ""} selected` : "JPG or PNG, visible on crop cards"}</small>
                <input type="file" multiple accept="image/*" onChange={e => handleFileChange(e, setFiles)} />
              </label>

              {previewUrls.length > 0 && (
                <div className="fd-photo-preview-grid">
                  {previewUrls.map((url, index) => (
                    <img key={url} src={url} alt={`Selected crop ${index + 1}`} />
                  ))}
                </div>
              )}

              <button onClick={addCrop}>Add Crop</button>
            </div>

            {editingCrop && (
              <div className="fd-form-card fd-crop-editor fd-edit-crop-card">
                <h3>Edit Crop Details</h3>
                <div className="fd-edit-layout">
                  <div className="fd-current-photo">
                    {cropImageUrl(editingCrop.imageUrls?.[0])
                      ? <img src={cropImageUrl(editingCrop.imageUrls[0])} alt={editingCrop.name} />
                      : <div className="fd-card-img-placeholder">No photo</div>
                    }
                  </div>

                  <div>
                    <label className="fd-form-row">
                      <span className="fd-form-label">Crop Name</span>
                      <input className="fd-input" value={editForm.name || ""} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                    </label>
                    <label className="fd-form-row">
                      <span className="fd-form-label">Price</span>
                      <input className="fd-input" type="number" value={editForm.price || ""} onChange={e => setEditForm({ ...editForm, price: e.target.value })} />
                    </label>
                    <label className="fd-form-row">
                      <span className="fd-form-label">Quantity</span>
                      <input className="fd-input" type="number" value={editForm.quantity || ""} onChange={e => setEditForm({ ...editForm, quantity: e.target.value })} />
                    </label>
                    <label className="fd-form-row">
                      <span className="fd-form-label">Shelf Life</span>
                      <input className="fd-input" type="number" value={editForm.shelfLifeDays || ""} onChange={e => setEditForm({ ...editForm, shelfLifeDays: e.target.value })} />
                    </label>

                    <label className="fd-photo-picker">
                      <span>Edit crop picture</span>
                      <small>{editFiles.length ? `${editFiles.length} new picture${editFiles.length > 1 ? "s" : ""} selected` : "Choose a new picture to replace the current one"}</small>
                      <input type="file" multiple accept="image/*" onChange={e => handleFileChange(e, setEditFiles)} />
                    </label>

                    {editPreviewUrls.length > 0 && (
                      <div className="fd-photo-preview-grid">
                        {editPreviewUrls.map((url, index) => (
                          <img key={url} src={url} alt={`New crop ${index + 1}`} />
                        ))}
                      </div>
                    )}

                    <div className="fd-edit-actions">
                      <button onClick={updateCrop}>Save Crop Details</button>
                      <button type="button" className="fd-btn-secondary" onClick={() => { setEditingCrop(null); setEditFiles([]); }}>Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="fd-grid">
              {crops.map(c => (
                <div key={c.id} className="fd-card">

                  {c.imageUrls?.[0]
                    ? <img src={cropImageUrl(c.imageUrls[0])} className="fd-card-img" alt={c.name} />
                    : <div className="fd-card-img-placeholder"></div>
                  }

                  <div className="fd-card-body">
                    <div>{c.name}</div>
                    <div>{c.price}</div>

                    <StatusBadge status={c.status} />

                    {/* VIEW */}
                    <button onClick={() => navigate(`/crop/${c.id}`, { state: { user } })}>
                      View
                    </button>

                    {/* EDIT */}
                    <button onClick={() => {
                      setEditingCrop(c);
                      setEditForm(c);
                      setEditFiles([]);
                    }}>
                      Edit Details & Picture
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ===== PROFILE ===== */}
        {tab === "profile" && (
          <div className="fd-form-card">

            <h3>Edit Profile</h3>

            <input
              value={profile.name}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
              placeholder="Name"
            />

            <input
              value={profile.email}
              onChange={e => setProfile({ ...profile, email: e.target.value })}
              placeholder="Email"
            />

            <input
              value={profile.address}
              onChange={e => setProfile({ ...profile, address: e.target.value })}
              placeholder="Address (Used for ML)"
            />

            <button onClick={updateProfile}>Save Profile</button>

          </div>
        )}

{/* ===== RESERVATIONS ===== */}
{tab === "reservations" && (
  <div className="fd-list-stack">

    {reservations.length === 0 && (
      <EmptyState icon="" text="No reservations yet" />
    )}

    {reservations.map(r => (
      <div key={r.id} className="fd-list-card">

        <div>
          <div className="fd-list-label">Crop</div>
          <div className="fd-list-value">{r.crop.name}</div>
        </div>

        <div>
          <div className="fd-list-label">Customer</div>
          <div>{r.customer?.name || "Unknown"}</div>
        </div>

        <div>
          <div className="fd-list-label">Quantity</div>
          <div>{r.quantity}</div>
        </div>

        <div>
          <div className="fd-list-label">Reserved On</div>
          <div>{r.reservationDate}</div>
        </div>

        <div>
          <div className="fd-list-label">Expiry</div>
          <div>{r.expiryDate}</div>
        </div>

        <StatusBadge status={r.status} />

      </div>
    ))}

  </div>
)}

{tab === "payments" && (
  <div className="fd-list-stack">
    {payments.length === 0 && (
      <EmptyState icon="" text="No payments yet" />
    )}

    {payments.map(p => (
      <div key={p.id} className="fd-list-card">
        <div>
          <div className="fd-list-label">Amount</div>
          <div className="fd-list-amount">Rs {p.amount}</div>
        </div>
        <div>
          <div className="fd-list-label">Method</div>
          <div className="fd-list-value">{p.paymentMethod || "N/A"}</div>
        </div>
        <div>
          <div className="fd-list-label">Status</div>
          <StatusBadge status={p.status || "SUCCESS"} />
        </div>
      </div>
    ))}
  </div>
)}
      </main>

      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}
