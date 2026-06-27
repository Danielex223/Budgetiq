import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    navigate("/dashboard");
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>Budget<span style={{ color: "#7F77DD" }}>IQ</span></div>
        <div style={s.subtitle}>Sign in to your account</div>

        {error && <div style={s.error}>{error}</div>}

        <div style={s.fieldLabel}>Email</div>
        <input
          style={s.input}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <div style={s.fieldLabel}>Password</div>
        <input
          style={s.input}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <button
          style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div style={s.footer}>
          Don't have an account?{" "}
          <Link to="/register" style={s.link}>Create one</Link>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { background: "#0b1120", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" },
  card: { background: "#1e293b", border: "0.5px solid #334155", borderRadius: 16, padding: "36px 32px", width: "100%", maxWidth: 380 },
  logo: { fontSize: 24, fontWeight: 500, color: "white", letterSpacing: "-0.02em", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#64748b", marginBottom: 24 },
  error: { background: "rgba(226,75,74,0.12)", border: "0.5px solid rgba(226,75,74,0.4)", color: "#E24B4A", fontSize: 12, padding: "9px 12px", borderRadius: 8, marginBottom: 14 },
  fieldLabel: { fontSize: 11, color: "#64748b", fontWeight: 500, marginBottom: 4 },
  input: { width: "100%", marginBottom: 12, padding: "10px 12px", borderRadius: 8, border: "0.5px solid #475569", background: "#0b1120", color: "white", fontSize: 13, outline: "none" },
  btn: { width: "100%", padding: 10, background: "#7F77DD", color: "#fff", fontSize: 14, fontWeight: 500, border: "none", borderRadius: 8, cursor: "pointer", marginTop: 4 },
  footer: { marginTop: 20, fontSize: 12, color: "#64748b", textAlign: "center" },
  link: { color: "#7F77DD", textDecoration: "none", fontWeight: 500 },
};