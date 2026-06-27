import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";

const links = [
  { to: "/dashboard",    label: "Dashboard",    icon: "⊞" },
  { to: "/transactions", label: "Transactions", icon: "↕" },
  { to: "/budgets",      label: "Budgets",      icon: "◎" },
  { to: "/goals",        label: "Goals",        icon: "◈" },
  { to: "/analytics",    label: "Analytics",    icon: "∿" },
  { to: "/settings",     label: "Settings",     icon: "⚙" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const name = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const email = user?.email || "";

  return (
    <nav style={s.nav}>
      <div style={s.logo}>
        Budget<span style={{ color: "#7F77DD" }}>IQ</span>
      </div>

      <div style={s.links}>
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({ ...s.link, ...(isActive ? s.linkActive : {}) })}
          >
            <span style={s.icon}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      <div style={s.bottom}>
        <div style={s.userRow}>
          <div style={s.avatar}>{name.charAt(0).toUpperCase()}</div>
          <div>
            <div style={s.userName}>{name}</div>
            <div style={s.userEmail}>{email}</div>
          </div>
        </div>
        <button style={s.logout} onClick={handleLogout}>⇤ Logout</button>
      </div>
    </nav>
  );
}

const s = {
  nav: { width: 220, minHeight: "100vh", background: "#0f172a", borderRight: "0.5px solid #1e293b", display: "flex", flexDirection: "column", padding: "24px 16px", position: "sticky", top: 0, flexShrink: 0 },
  logo: { fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em", color: "white", marginBottom: 32, paddingLeft: 8 },
  links: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  link: { display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, fontSize: 13, fontWeight: 500, color: "#64748b", textDecoration: "none" },
  linkActive: { background: "#1e293b", color: "#f1f5f9" },
  icon: { fontSize: 15, width: 18, textAlign: "center", flexShrink: 0 },
  bottom: { marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 },
  userRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", borderRadius: 8, background: "#1e293b", border: "0.5px solid #334155" },
  avatar: { width: 30, height: 30, borderRadius: "50%", background: "#7F77DD", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, color: "#fff", flexShrink: 0 },
  userName: { fontSize: 12, fontWeight: 500, color: "#f1f5f9" },
  userEmail: { fontSize: 10, color: "#64748b", marginTop: 1 },
  logout: { padding: "9px 12px", background: "transparent", border: "0.5px solid #334155", borderRadius: 8, color: "#64748b", fontSize: 12, fontWeight: 500, cursor: "pointer", textAlign: "left", width: "100%" },
};