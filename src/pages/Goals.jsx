import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const fmt = (n) => "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits:0, maximumFractionDigits:0 });
const COLORS = ["#7F77DD","#1D9E75","#378ADD","#D4537E","#BA7517","#D85A30"];

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [depositId, setDepositId] = useState(null);
  const [depositAmt, setDepositAmt] = useState("");

  useEffect(() => {
    supabase.from("goals").select("*").order("created_at", { ascending:true })
      .then(({ data }) => { setGoals(data || []); setLoading(false); });
  }, []);

  const addGoal = async () => {
    const t = parseFloat(target);
    const sv = parseFloat(saved) || 0;
    if (!name.trim() || !t || t <= 0) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("goals").insert([{ user_id:user.id, name:name.trim(), target:t, saved:sv }]).select().single();
    if (!error) setGoals((prev) => [...prev, data]);
    setName(""); setTarget(""); setSaved("");
    setSubmitting(false);
  };

  const deleteGoal = async (id) => {
    await supabase.from("goals").delete().eq("id", id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const deposit = async (goal) => {
    const amt = parseFloat(depositAmt);
    if (!amt || amt <= 0) return;
    const newSaved = goal.saved + amt;
    const { data, error } = await supabase.from("goals").update({ saved:newSaved }).eq("id", goal.id).select().single();
    if (!error) setGoals((prev) => prev.map((g) => g.id===goal.id ? data : g));
    setDepositId(null); setDepositAmt("");
  };

  const totalTarget = goals.reduce((a, g) => a + g.target, 0);
  const totalSaved = goals.reduce((a, g) => a + g.saved, 0);
  const completed = goals.filter((g) => g.saved >= g.target).length;

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.topbar}>
          <div style={s.pageTitle}>Goals</div>
          <div style={s.pill}>{goals.length} goals</div>
        </div>

        <div style={s.summaryRow}>
          {[
            { label:"Total target", val:fmt(totalTarget), color:"#7F77DD" },
            { label:"Total saved", val:fmt(totalSaved), color:"#1D9E75" },
            { label:"Remaining", val:fmt(Math.max(totalTarget-totalSaved,0)), color:"#E24B4A" },
            { label:"Completed", val:completed, color:"#1D9E75" },
          ].map((m) => (
            <div key={m.label} style={s.summaryCard}>
              <div style={s.sLabel}>{m.label}</div>
              <div style={{ ...s.sVal, color:m.color }}>{m.val}</div>
            </div>
          ))}
        </div>

        <div style={s.cols}>
          <div style={s.panel}>
            <div style={s.panelHd}>New goal</div>
            <div style={s.fieldLabel}>Goal name</div>
            <input style={s.input} placeholder="e.g. Emergency fund" value={name} onChange={(e) => setName(e.target.value)} />
            <div style={s.fieldLabel}>Target amount</div>
            <input style={s.input} type="number" min="0" placeholder="0.00" value={target} onChange={(e) => setTarget(e.target.value)} />
            <div style={s.fieldLabel}>Already saved (optional)</div>
            <input style={s.input} type="number" min="0" placeholder="0.00" value={saved} onChange={(e) => setSaved(e.target.value)} onKeyDown={(e) => e.key==="Enter" && addGoal()} />
            <button style={{ ...s.addBtn, opacity:submitting?0.6:1 }} onClick={addGoal} disabled={submitting}>
              {submitting ? "Saving..." : "+ Add goal"}
            </button>
          </div>

          <div style={s.panel}>
            <div style={s.panelHd}>Your goals</div>
            {loading ? <div style={s.empty}>Loading...</div> : goals.length===0 ? <div style={s.empty}>No goals yet. Add one to get started.</div> : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {goals.map((g, i) => {
                  const pct = Math.min(Math.round((g.saved/g.target)*100),100);
                  const done = g.saved >= g.target;
                  const clr = done ? "#1D9E75" : COLORS[i%COLORS.length];
                  return (
                    <div key={g.id} style={s.goalCard}>
                      <div style={s.goalTop}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ ...s.dot, background:clr }} />
                          <span style={s.goalName}>{g.name}</span>
                          {done && <span style={s.doneTag}>✓ complete</span>}
                        </div>
                        <button onClick={() => deleteGoal(g.id)} style={s.deleteBtn}>✕</button>
                      </div>
                      <div style={s.barTrack}><div style={{ ...s.barFill, width:`${pct}%`, background:clr }} /></div>
                      <div style={s.goalMeta}>
                        <span style={{ color:clr, fontWeight:500 }}>{fmt(g.saved)} saved</span>
                        <span style={{ color:"#64748b" }}>of {fmt(g.target)} · {pct}%</span>
                      </div>
                      {!done && (depositId===g.id ? (
                        <div style={{ display:"flex", gap:6, marginTop:8 }}>
                          <input style={{ ...s.input, marginBottom:0, flex:1 }} type="number" min="0" placeholder="Amount" value={depositAmt} onChange={(e) => setDepositAmt(e.target.value)} onKeyDown={(e) => e.key==="Enter" && deposit(g)} />
                          <button style={s.depositConfirm} onClick={() => deposit(g)}>Add</button>
                          <button style={s.cancelBtn} onClick={() => { setDepositId(null); setDepositAmt(""); }}>✕</button>
                        </div>
                      ) : (
                        <button style={s.depositBtn} onClick={() => setDepositId(g.id)}>+ Add savings</button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:{ background:"#0b1120", minHeight:"100vh", color:"white", fontFamily:"sans-serif" },
  container:{ padding:"24px 20px", maxWidth:"960px", margin:"0 auto" },
  topbar:{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem" },
  pageTitle:{ fontSize:18, fontWeight:500, color:"#f1f5f9" },
  pill:{ fontSize:12, color:"#64748b", background:"#1e293b", border:"0.5px solid #334155", borderRadius:20, padding:"5px 12px" },
  summaryRow:{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))", gap:10, marginBottom:"1.25rem" },
  summaryCard:{ background:"#1e293b", borderRadius:12, border:"0.5px solid #334155", padding:"12px 14px" },
  sLabel:{ fontSize:11, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:500, marginBottom:4 },
  sVal:{ fontSize:19, fontWeight:500 },
  cols:{ display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:14 },
  panel:{ background:"#1e293b", borderRadius:12, border:"0.5px solid #334155", padding:16 },
  panelHd:{ fontSize:11, fontWeight:500, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:14 },
  fieldLabel:{ fontSize:11, color:"#64748b", marginBottom:4, fontWeight:500 },
  input:{ width:"100%", marginBottom:10, padding:"8px 10px", borderRadius:8, border:"0.5px solid #475569", background:"#0b1120", color:"white", fontSize:13, outline:"none" },
  addBtn:{ width:"100%", padding:9, background:"#7F77DD", color:"#fff", fontSize:13, fontWeight:500, border:"none", borderRadius:8, cursor:"pointer" },
  goalCard:{ background:"#0b1120", borderRadius:10, border:"0.5px solid #334155", padding:"12px 14px" },
  goalTop:{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 },
  goalName:{ fontSize:14, fontWeight:500, color:"#f1f5f9" },
  doneTag:{ fontSize:10, fontWeight:500, background:"rgba(29,158,117,0.15)", color:"#1D9E75", borderRadius:20, padding:"2px 8px" },
  dot:{ width:8, height:8, borderRadius:"50%", flexShrink:0 },
  barTrack:{ background:"#1e293b", borderRadius:4, height:7, overflow:"hidden", marginBottom:8 },
  barFill:{ height:"100%", borderRadius:4, transition:"width 0.5s cubic-bezier(.4,0,.2,1)" },
  goalMeta:{ display:"flex", justifyContent:"space-between", fontSize:12 },
  depositBtn:{ marginTop:10, width:"100%", padding:"6px", background:"transparent", border:"0.5px solid #334155", color:"#64748b", fontSize:12, borderRadius:7, cursor:"pointer" },
  depositConfirm:{ padding:"8px 12px", background:"#1D9E75", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:500 },
  cancelBtn:{ padding:"8px 10px", background:"transparent", border:"0.5px solid #334155", color:"#64748b", borderRadius:8, cursor:"pointer", fontSize:12 },
  deleteBtn:{ background:"transparent", border:"none", color:"#475569", fontSize:11, cursor:"pointer", padding:"2px 5px", borderRadius:4 },
  empty:{ textAlign:"center", padding:"2rem", color:"#64748b", fontSize:13 },
};