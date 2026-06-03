import "./style.css";
export default function Dashboard({ user }) {
  return (
    <div className="center">
      <div className="card">
        <h2>Welcome {user.name}</h2>
        <p>Role: {user.role}</p>

        {user.role === "ADMIN" && <p>Admin Panel</p>}
        {user.role === "STAFF" && <p>Staff Panel</p>}
        {user.role === "FARMER" && <p>Farmer Panel</p>}
        {user.role === "CUSTOMER" && <p>Customer Panel</p>}
      </div>
    </div>
  );
}