import "./style.css";
export default function RoleSelect({ onSelect }) {
  const roles = ["FARMER", "CUSTOMER", "STAFF", "ADMIN"];

  return (
    <div className="center">
      <div className="card">
        <h2>Select Role</h2>

        {roles.map((r) => (
          <button key={r} onClick={() => onSelect(r)}>
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}