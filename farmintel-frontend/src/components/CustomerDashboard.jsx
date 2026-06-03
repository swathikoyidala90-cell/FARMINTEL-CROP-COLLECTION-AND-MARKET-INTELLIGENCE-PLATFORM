import { useEffect, useMemo, useState } from "react";
import "./farmer.css";
import { API_BASE_URL } from "../config";
import { findCropPrice } from "../data/andhraCropPrices";

const API = API_BASE_URL;

function Toast({ msg }) {
  if (!msg) return null;
  return <div className="fd-toast">{msg}</div>;
}

const money = value => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
const lineTotal = (crop, quantity) => Number(crop?.price || 0) * Number(quantity || 0);
const discountAmount = total => Number(total || 0) * 0.05;
const discountedTotal = total => Number(total || 0) - discountAmount(total);
const reservationDeposit = total => discountedTotal(total) * 0.02;
const cleanQuantity = value => {
  const quantity = Math.floor(Number(value));
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
};
const imageFor = crop => {
  const path = crop.imageUrls?.[0];
  if (!path) return "";
  return path.startsWith("http") ? path : `${API}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function CustomerDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("shop");
  const [crops, setCrops] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState("");
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [filters, setFilters] = useState({ search: "", maxPrice: "", minRating: "", sort: "featured" });
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const readErrorMessage = async (response, fallback) => {
    try {
      const text = await response.text();
      if (text) return text;
    } catch {
      // Keep the fallback if the backend sent no readable body.
    }
    return fallback;
  };

  const fetchJson = async url => {
    const response = await fetch(url);
    if (!response.ok) return [];
    return response.json();
  };

  const fetchData = async () => {
    try {
      const [cropData, reservationData, paymentData] = await Promise.all([
        fetchJson(`${API}/customer/crops`),
        fetchJson(`${API}/customer/reservations/${user.id}`),
        fetchJson(`${API}/customer/payments/${user.id}`),
      ]);
      setCrops(Array.isArray(cropData) ? cropData : []);
      setReservations(Array.isArray(reservationData) ? reservationData : []);
      setPayments(Array.isArray(paymentData) ? paymentData : []);
      setProfile(prev => ({ ...prev, ...user }));
    } catch {
      showToast("Failed to load customer data");
    }
  };

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  const filteredCrops = useMemo(() => {
    return [...crops]
      .filter(crop => crop.name?.toLowerCase().includes(filters.search.toLowerCase()))
      .filter(crop => filters.maxPrice ? Number(crop.price || 0) <= Number(filters.maxPrice) : true)
      .filter(crop => filters.minRating ? Number(crop.avgRating || 0) >= Number(filters.minRating) : true)
      .sort((a, b) => {
        if (filters.sort === "priceLow") return Number(a.price || 0) - Number(b.price || 0);
        if (filters.sort === "priceHigh") return Number(b.price || 0) - Number(a.price || 0);
        if (filters.sort === "stock") return Number(b.quantity || 0) - Number(a.quantity || 0);
        return Number(b.avgRating || 0) - Number(a.avgRating || 0);
      });
  }, [crops, filters]);

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.crop.price || 0) * Number(item.quantity || 0), 0);
  const cartDiscount = discountAmount(cartTotal);
  const cartPayable = discountedTotal(cartTotal);
  const cartDeposit = reservationDeposit(cartTotal);
  const cartCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const addToCart = crop => {
    const quantity = cleanQuantity(prompt(`Quantity for ${crop.name} (kg):`, "1"));
    if (!quantity) {
      showToast("Enter a valid quantity");
      return;
    }
    setCart(current => {
      const available = Number(crop.quantity || 0);
      const existing = current.find(item => item.crop.id === crop.id);
      const nextQuantity = (existing?.quantity || 0) + quantity;
      if (nextQuantity > available) {
        showToast(`Only ${available} kg available`);
        return current;
      }
      showToast("Added to cart");
      if (existing) {
        return current.map(item => item.crop.id === crop.id ? { ...item, quantity: nextQuantity } : item);
      }
      return [...current, { crop, quantity }];
    });
  };

  const reserveNow = async (crop, quantity, { refresh = true, notify = true } = {}) => {
    const selectedQuantity = cleanQuantity(quantity);
    if (!selectedQuantity) throw new Error("Enter a valid quantity");
    if (selectedQuantity > Number(crop.quantity || 0)) throw new Error(`Only ${crop.quantity || 0} kg available`);

    const params = new URLSearchParams({
      customerId: String(user.id),
      cropId: String(crop.id),
      quantity: String(selectedQuantity),
    });
    const response = await fetch(`${API}/customer/reserve?${params.toString()}`, { method: "POST" });
    if (!response.ok) throw new Error(await readErrorMessage(response, "Reservation failed"));
    const reservation = await response.json();
    if (notify) showToast(`Reserved ${selectedQuantity} kg of ${crop.name}. Deposit paid: ${money(reservation.reservationPaymentAmount)}`);
    if (refresh) fetchData();
    return reservation;
  };

  const checkoutCart = async () => {
    if (!cart.length) return;
    try {
      await Promise.all(cart.map(item => reserveNow(item.crop, item.quantity, { refresh: false, notify: false })));
      setCart([]);
      setTab("reserved");
      showToast("Cart reserved successfully");
      fetchData();
    } catch (error) {
      showToast(error.message || "Checkout failed");
    }
  };

  const rateCrop = async (cropId, rating) => {
    const response = await fetch(`${API}/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cropId, userId: user.id, rating, review: "" }),
    });
    if (!response.ok) throw new Error(await readErrorMessage(response, "Rating failed"));
    showToast("Rating saved");
    fetchData();
  };

  const confirmPayment = async () => {
    const response = await fetch(`${API}/customer/pay?reservationId=${paymentModal.id}&method=${paymentMethod}`, { method: "POST" });
    if (!response.ok) {
      showToast(await readErrorMessage(response, "Payment failed"));
      return;
    }
    setPaymentSuccess(true);
    showToast("Payment successful");
    fetchData();
  };

  const cancelReservation = async (order) => {
    if (!window.confirm(`Cancel this reservation? Staff will refund half of the reservation payment: ${money((order.reservationPaymentAmount || 0) * 0.5)}.`)) return;
    const response = await fetch(`${API}/customer/cancel?reservationId=${order.id}&method=STAFF_REFUND`, { method: "POST" });
    if (!response.ok) {
      showToast(await readErrorMessage(response, "Cancellation failed"));
      return;
    }
    const refund = await response.json();
    showToast(`Cancelled. Refund due from staff: ${money(refund.amount)}`);
    fetchData();
  };

  const saveProfile = async () => {
    const response = await fetch(`${API}/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (response.ok) {
      const updated = await response.json();
      localStorage.setItem("user", JSON.stringify(updated));
      showToast("Profile updated");
    } else {
      showToast(await readErrorMessage(response, "Profile update failed"));
    }
  };

  return (
    <div className="fd-root customer-store">
      <header className="fd-header">
        <div className="fd-logo">Farm<span>Intel</span><span className="fd-logo-role">Market</span></div>
        <nav className="fd-nav">
          <button onClick={() => setTab("shop")} className={tab === "shop" ? "active" : ""}>Shop</button>
          <button onClick={() => setTab("cart")} className={tab === "cart" ? "active" : ""}>Cart ({cartCount})</button>
          <button onClick={() => setTab("reserved")} className={tab === "reserved" ? "active" : ""}>Orders</button>
          <button onClick={() => setTab("history")} className={tab === "history" ? "active" : ""}>Payments</button>
          <button onClick={() => setTab("profile")} className={tab === "profile" ? "active" : ""}>Profile</button>
        </nav>
        <button className="fd-logout" onClick={onLogout}>Logout</button>
      </header>

      <main className="fd-body">
        {tab === "shop" && (
          <>
            <section className="store-hero">
              <div>
                <p>Fresh Andhra farm produce</p>
                <h1>Buy directly from verified local farms</h1>
                <div className="store-offer-banner">Secure payment recorded for staff and admin review</div>
              </div>
              <div className="store-hero-summary">
                <span>{crops.length} crops live</span>
                <strong>{money(cartTotal)}</strong>
                <span>{cartCount} kg selected</span>
                <button className="fd-btn-primary" onClick={() => setTab("cart")}>View cart</button>
              </div>
            </section>

            <div className="store-toolbar">
              <input className="fd-input" placeholder="Search crops" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
              <input className="fd-input" type="number" placeholder="Max price per kg" value={filters.maxPrice} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })} />
              <input className="fd-input" type="number" placeholder="Min rating" value={filters.minRating} onChange={e => setFilters({ ...filters, minRating: e.target.value })} />
              <select className="fd-select" value={filters.sort} onChange={e => setFilters({ ...filters, sort: e.target.value })}>
                <option value="featured">Featured</option>
                <option value="priceLow">Price: low to high</option>
                <option value="priceHigh">Price: high to low</option>
                <option value="stock">Stock available</option>
              </select>
            </div>

            <div className="store-grid">
              {filteredCrops.map(crop => {
                const priceIntel = findCropPrice(crop.name);
                return (
                  <article key={crop.id} className="store-product-card">
                    {imageFor(crop)
                      ? <img src={imageFor(crop)} alt={crop.name} />
                      : <div className="store-product-placeholder">{crop.name?.slice(0, 1) || "F"}</div>
                    }
                    <div className="store-product-body">
                      <div className="store-product-top">
                        <h3>{crop.name}</h3>
                        <span>{money(crop.price)}/kg</span>
                      </div>
                      <p>{crop.quantity || 0} kg available  Shelf life {crop.shelfLifeDays || "N/A"} days</p>
                      <p>Rating {crop.avgRating || 0}/5  Farmer {crop.farmer?.name || "Verified farm"}</p>
                      {priceIntel && (
                        <div className="store-intel">
                          <span>{priceIntel.market}, {priceIntel.district}</span>
                          <strong>Market {money(priceIntel.marketPricePerKg)}  Predicted {money(priceIntel.predictedPricePerKg)}/kg</strong>
                        </div>
                      )}
                      <div className="store-actions">
                        <button className="fd-btn-primary" onClick={() => addToCart(crop)}>Add to cart</button>
                        <button className="fd-btn-secondary" onClick={async () => {
                          const qty = cleanQuantity(prompt("Reserve quantity (kg):", "1"));
                          if (!qty) {
                            showToast("Enter a valid quantity");
                            return;
                          }
                          try {
                            await reserveNow(crop, qty);
                            setTab("reserved");
                          } catch (error) {
                            showToast(error.message || "Reservation failed");
                          }
                        }}>Reserve</button>
                        <button className="fd-btn-secondary" onClick={async () => {
                          const rating = cleanQuantity(prompt("Rate this crop from 1 to 5:"));
                          if (rating < 1 || rating > 5) {
                            showToast("Rating must be from 1 to 5");
                            return;
                          }
                          try {
                            await rateCrop(crop.id, rating);
                          } catch (error) {
                            showToast(error.message || "Rating failed");
                          }
                        }}>Rate</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {tab === "cart" && (
          <section className="store-cart">
            <div className="fd-section-title">Shopping Cart</div>
            {cart.length === 0 ? <div className="fd-empty-state">Your cart is empty</div> : (
              <>
                <div className="fd-list-stack">
                  {cart.map(item => (
                    <div className="fd-list-card" key={item.crop.id}>
                      <div><div className="fd-list-label">Crop</div><div className="fd-list-value">{item.crop.name}</div></div>
                      <div><div className="fd-list-label">Quantity</div><div className="fd-list-value">{item.quantity} kg</div></div>
                      <div><div className="fd-list-label">Price</div><div className="fd-list-amount">{money(item.crop.price * item.quantity)}</div></div>
                      <button className="fd-btn-secondary" onClick={() => setCart(cart.filter(row => row.crop.id !== item.crop.id))}>Remove</button>
                    </div>
                  ))}
                </div>
                <div className="store-checkout">
                  <div><span>Subtotal</span><strong>{money(cartTotal)}</strong></div>
                  <div><span>5% discount</span><strong>-{money(cartDiscount)}</strong></div>
                  <div><span>Total after discount</span><strong>{money(cartPayable)}</strong></div>
                  <div><span>Pay now to reserve (2%)</span><strong>{money(cartDeposit)}</strong></div>
                  <p>Reservation only takes the 2% deposit. The remaining balance is paid when you confirm the order.</p>
                  <button className="fd-btn-primary" onClick={checkoutCart}>Reserve and pay 2%</button>
                </div>
              </>
            )}
          </section>
        )}

        {tab === "reserved" && (
          <div className="fd-list-stack">
            {reservations.length === 0 ? <div className="fd-empty-state">No orders yet</div> : reservations.map(order => (
              <div key={order.id} className="fd-list-card">
                <div><div className="fd-list-label">Crop</div><div className="fd-list-value">{order.crop?.name || "N/A"}</div></div>
                <div><div className="fd-list-label">Quantity</div><div className="fd-list-value">{order.quantity} kg</div></div>
                <div><div className="fd-list-label">Status</div><span className={`fd-badge ${order.status}`}>{order.status}</span></div>
                <div><div className="fd-list-label">Total after discount</div><div className="fd-list-amount">{money(order.payableAmount || discountedTotal(lineTotal(order.crop, order.quantity)))}</div></div>
                <div><div className="fd-list-label">Reservation paid</div><div className="fd-list-value">{money(order.reservationPaymentAmount)}</div></div>
                <div><div className="fd-list-label">Balance</div><div className="fd-list-amount">{money(order.balanceAmount)}</div></div>
                {["RESERVED", "CONFIRMED"].includes(order.status) && (
                  <div className="fd-card-actions">
                    <button className="fd-btn-pay" onClick={() => { setPaymentModal(order); setPaymentSuccess(false); }}>Confirm and pay balance</button>
                    <button className="fd-btn-secondary" onClick={() => cancelReservation(order)}>Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "history" && (
          <div className="fd-list-stack">
            {payments.length === 0 ? <div className="fd-empty-state">No payment history yet</div> : payments.map(payment => (
              <div key={payment.id} className="fd-list-card">
                <div><div className="fd-list-label">Crop</div><div className="fd-list-value">{payment.reservation?.crop?.name || "Farm order"}</div></div>
                <div><div className="fd-list-label">Method</div><div className="fd-list-value">{payment.paymentMethod}</div></div>
                <div><div className="fd-list-label">Type</div><div className="fd-list-value">{payment.paymentType || "PAYMENT"}</div></div>
                <div><div className="fd-list-label">Amount</div><div className="fd-list-amount">{money(payment.amount)}</div></div>
                <span className={`fd-badge ${payment.status}`}>{payment.status}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "profile" && (
          <div className="fd-form-card">
            <h3>Delivery Profile</h3>
            <input value={profile.name || ""} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Name" />
            <input value={profile.email || ""} onChange={e => setProfile({ ...profile, email: e.target.value })} placeholder="Email" />
            <input value={profile.phone || ""} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="Phone" />
            <input value={profile.address || ""} onChange={e => setProfile({ ...profile, address: e.target.value })} placeholder="Delivery address" />
            <button onClick={saveProfile}>Save profile</button>
          </div>
        )}
      </main>

      {paymentModal && (
        <div className="store-modal-backdrop">
          <div className="store-payment-modal">
            {!paymentSuccess ? (
              <>
                <h3>Complete Payment</h3>
                <p>{paymentModal.crop?.name}  {paymentModal.quantity} kg</p>
                <div className="fd-pay-summary">
                  <div className="fd-pay-summary-row"><span>Subtotal</span><span>{money(paymentModal.totalAmount || lineTotal(paymentModal.crop, paymentModal.quantity))}</span></div>
                  <div className="fd-pay-summary-row"><span>5% discount</span><span>-{money(paymentModal.discountAmount || discountAmount(lineTotal(paymentModal.crop, paymentModal.quantity)))}</span></div>
                  <div className="fd-pay-summary-row"><span>Reservation paid</span><span>{money(paymentModal.reservationPaymentAmount)}</span></div>
                  <div className="fd-pay-summary-row total"><span>Balance to pay</span><span>{money(paymentModal.balanceAmount)}</span></div>
                </div>
                <select className="fd-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="CASH">Cash</option>
                </select>
                <button className="fd-btn-primary" onClick={confirmPayment}>Pay balance</button>
                <button className="fd-btn-secondary" onClick={() => setPaymentModal(null)}>Cancel</button>
              </>
            ) : (
              <>
                <h3>Payment successful</h3>
                <p>Your order payment has been recorded.</p>
                <button className="fd-btn-primary" onClick={() => setPaymentModal(null)}>Close</button>
              </>
            )}
          </div>
        </div>
      )}

      <Toast msg={toast} />
    </div>
  );
}
