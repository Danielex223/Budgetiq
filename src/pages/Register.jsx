import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    if (!name.trim() || !email.trim() || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
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
        <div style={s.subtitle}>Create your account</div>

        {error && <div style={s.error}>{error}</div>}

        <div style={s.fieldLabel}>Full name</div>
        <input style={s.input} placeholder="Daniel Udo" value={name} onChange={(e) => setName(e.target.value)} />

        <div style={s.fieldLabel}>Email</div>
        <input style={s.input} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />

        <div style={s.fieldLabel}>Password</div>
        <input style={s.input} type="password" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />

        <div style={s.fieldLabel}>Confirm password</div>
        <input
          style={s.input}
          type="password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRegister()}
        />

        <button
          style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <div style={s.footer}>
          Already have an account?{" "}
          <Link to="/" style={s.link}>Sign in</Link>
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