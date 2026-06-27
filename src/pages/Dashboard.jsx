import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getCurrencySymbol, convertCurrency, fetchExchangeRates } from "../lib/currencyUtils";

const CAT_COLORS = { Food:"#E24B4A", Transport:"#D85A30", Rent:"#BA7517", Salary:"#1D9E75", Shopping:"#D4537E", Entertainment:"#7F77DD", Health:"#378ADD", default:"#888780" };
const BAR_COLORS = ["#7F77DD","#D4537E","#E24B4A","#D85A30","#378ADD","#BA7517"];
const today = new Date().toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [filter, setFilter] = useState("all");
  const [userCurrency, setUserCurrency] = useState("USD");
  const [rates, setRates] = useState({});
  const [savingsTarget, setSavingsTarget] = useState(20);

  useEffect(() => {
    const loadAll = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const currency = user?.user_metadata?.currency || "USD";
      setUserCurrency(currency);
      setSavingsTarget(Number(user?.user_metadata?.savings_goal) || 20);
      const fetchedRates = await fetchExchangeRates("USD");
      setRates(fetchedRates);

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setTransactions(data || []);
      setLoading(false);
    };
    loadAll();
  }, []);

  const addTransaction = async () => {
    const amt = parseFloat(amount);
    if (!category.trim() || !amt || amt <= 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("transactions")
      .insert([{ user_id: user.id, type, category: category.trim(), amount: amt, note: "" }])
      .select()
      .single();
    if (!error) setTransactions((prev) => [data, ...prev]);
    setCategory("");
    setAmount("");
  };

  const deleteTransaction = async (id) => {
    await supabase.from("transactions").delete().eq("id", id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const fmt = (n) => getCurrencySymbol(userCurrency) + Number(n).toLocaleString(undefined, { minimumFractionDigits:0, maximumFractionDigits:0 });

  const income = transactions.filter((t) => t.type === "income").reduce((a, t) => a + convertCurrency(t.amount, "USD", userCurrency, rates), 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((a, t) => a + convertCurrency(t.amount, "USD", userCurrency, rates), 0);
  const balance = income - expenses;
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;
  const expenseTxs = transactions.filter((t) => t.type === "expense");

  const categoryTotals = {};
  expenseTxs.forEach((t) => { categoryTotals[t.category] = (categoryTotals[t.category] || 0) + convertCurrency(t.amount, "USD", userCurrency, rates); });
  const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const totalExp = sortedCats.reduce((a, [, v]) => a + v, 0) || 1;
  const filteredTxs = transactions.filter((t) => filter === "all" ? true : t.type === filter);

  const metrics = [
    { label:"Balance", value: fmt(Math.abs(balance)), sub: balance >= 0 ? "positive balance" : "overspent", color: balance >= 0 ? "#1D9E75" : "#E24B4A", icon:"💼" },
    { label:"Income", value: fmt(income), sub: `${transactions.filter((t) => t.type==="income").length} sources`, color:"#1D9E75", icon:"⬇️" },
    { label:"Expenses", value: fmt(expenses), sub: `${expenseTxs.length} items`, color:"#E24B4A", icon:"⬆️" },
    { label:"Savings rate", value: `${savingsRate}%`, sub: savingsRate >= savingsTarget ? "on track" : `target ${savingsTarget}%`, color: savingsRate >= savingsTarget ? "#1D9E75" : "#E24B4A", icon:"📊" },
  ];

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.topbar}>
          <div style={s.pageTitle}>Dashboard</div>
          <div style={s.datePill}>{today}</div>
        </div>

        <div style={s.grid4}>
          {metrics.map((m) => (
            <div key={m.label} style={{ ...s.mcard, borderLeft: `3px solid ${m.color}` }}>
              <div style={{ fontSize:16, marginBottom:8 }}>{m.icon}</div>
              <div style={s.mLabel}>{m.label}</div>
              <div style={{ ...s.mVal, color: m.color }}>{m.value}</div>
              <div style={s.mSub}>{m.sub}</div>
            </div>
          ))}
        </div>

        <div style={s.cols}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={s.panel}>
              <div style={s.panelHd}>New transaction</div>
              <div style={s.seg}>
                {["expense","income"].map((t) => (
                  <button key={t} onClick={() => setType(t)} style={{ ...s.segBtn, ...(type===t ? s.segBtnActive : {}) }}>
                    {t.charAt(0).toUpperCase()+t.slice(1)}
                  </button>
                ))}
              </div>
              <input style={s.input} placeholder="Category (e.g. Rent)" value={category} onChange={(e) => setCategory(e.target.value)} onKeyDown={(e) => e.key==="Enter" && addTransaction()} />
              <input style={s.input} type="number" min="0" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={(e) => e.key==="Enter" && addTransaction()} />
              <button style={s.addBtn} onClick={addTransaction}>+ Add transaction</button>
            </div>

            <div style={s.panel}>
              <div style={s.panelHd}>Spending breakdown</div>
              {sortedCats.length === 0 ? <div style={s.empty}>No expenses yet.</div> : sortedCats.map(([cat, amt], i) => {
                const pct = Math.round((amt / totalExp) * 100);
                const clr = BAR_COLORS[i % BAR_COLORS.length];
                return (
                  <div key={cat} style={{ marginBottom:10 }}>
                    <div style={s.barRow}>
                      <span style={{ color:"#f1f5f9", fontWeight:500 }}>{cat}</span>
                      <span style={{ color:"#64748b", fontSize:12 }}>{fmt(amt)} · {pct}%</span>
                    </div>
                    <div style={s.barTrack}><div style={{ ...s.barFill, width:`${pct}%`, background:clr }} /></div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={s.panel}>
            <div style={{ ...s.panelHd, justifyContent:"space-between", marginBottom:10 }}>
              <span>Transactions</span>
              <span style={{ fontSize:11, color:"#64748b" }}>{transactions.length} total</span>
            </div>
            <div style={s.filterRow}>
              {["all","income","expense"].map((f) => (
                <button key={f} onClick={() => setFilter(f)} style={{ ...s.filterBtn, ...(filter===f ? s.filterBtnActive : {}) }}>
                  {f.charAt(0).toUpperCase()+f.slice(1)}
                </button>
              ))}
            </div>
            <div style={s.txList}>
              {loading ? <div style={s.empty}>Loading...</div> : filteredTxs.length === 0 ? <div style={s.empty}>No transactions yet.</div> : filteredTxs.map((t) => {
                const isExp = t.type === "expense";
                const dotClr = CAT_COLORS[t.category] || CAT_COLORS.default;
                const amtClr = isExp ? "#E24B4A" : "#1D9E75";
                return (
                  <div key={t.id} style={s.txRow}>
                    <div style={s.txLeft}>
                      <div style={{ ...s.txDot, background:dotClr }} />
                      <div>
                        <div style={s.txCat}>{t.category}</div>
                        <div style={s.txType}>{t.type}</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ ...s.txAmt, color:amtClr }}>{isExp?"-":"+"}{fmt(convertCurrency(t.amount, "USD", userCurrency, rates))}</div>
                      <button onClick={() => deleteTransaction(t.id)} style={s.deleteBtn}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
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
  datePill:{ fontSize:12, color:"#64748b", background:"#1e293b", border:"0.5px solid #334155", borderRadius:20, padding:"5px 12px" },
  grid4:{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))", gap:10, marginBottom:"1.25rem" },
  mcard:{ background:"#1e293b", borderRadius:12, border:"0.5px solid #334155", padding:"14px 16px" },
  mLabel:{ fontSize:11, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:500, marginBottom:4 },
  mVal:{ fontSize:21, fontWeight:500, lineHeight:1 },
  mSub:{ fontSize:11, color:"#64748b", marginTop:5 },
  cols:{ display:"grid", gridTemplateColumns:"1fr 1.1fr", gap:14 },
  panel:{ background:"#1e293b", borderRadius:12, border:"0.5px solid #334155", padding:16 },
  panelHd:{ fontSize:11, fontWeight:500, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:14, display:"flex", alignItems:"center", gap:6 },
  seg:{ display:"flex", background:"#0b1120", borderRadius:8, border:"0.5px solid #334155", overflow:"hidden", marginBottom:8 },
  segBtn:{ flex:1, padding:"7px", fontSize:12, fontWeight:500, border:"none", background:"transparent", color:"#64748b", cursor:"pointer" },
  segBtnActive:{ background:"#7F77DD", color:"#fff", borderRadius:7 },
  input:{ width:"100%", marginBottom:8, padding:"8px 10px", borderRadius:8, border:"0.5px solid #475569", background:"#0b1120", color:"white", fontSize:13, outline:"none" },
  addBtn:{ width:"100%", padding:9, background:"#7F77DD", color:"#fff", fontSize:13, fontWeight:500, border:"none", borderRadius:8, cursor:"pointer" },
  filterRow:{ display:"flex", gap:6, marginBottom:12 },
  filterBtn:{ padding:"4px 12px", fontSize:11, fontWeight:500, border:"0.5px solid #334155", borderRadius:20, background:"transparent", color:"#64748b", cursor:"pointer" },
  filterBtnActive:{ background:"#7F77DD", color:"#fff", border:"0.5px solid #7F77DD" },
  barRow:{ display:"flex", justifyContent:"space-between", marginBottom:5 },
  barTrack:{ background:"#0b1120", borderRadius:4, height:7, overflow:"hidden" },
  barFill:{ height:"100%", borderRadius:4, transition:"width 0.5s cubic-bezier(.4,0,.2,1)" },
  txList:{ display:"flex", flexDirection:"column", gap:5, maxHeight:340, overflowY:"auto" },
  txRow:{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 10px", borderRadius:8, background:"#0b1120", border:"0.5px solid #334155" },
  txLeft:{ display:"flex", alignItems:"center", gap:9 },
  txDot:{ width:8, height:8, borderRadius:"50%", flexShrink:0 },
  txCat:{ fontSize:13, fontWeight:500, color:"#f1f5f9" },
  txType:{ fontSize:11, color:"#64748b" },
  txAmt:{ fontSize:13, fontWeight:500 },
  deleteBtn:{ background:"transparent", border:"none", color:"#475569", fontSize:11, cursor:"pointer", padding:"2px 5px", borderRadius:4 },
  empty:{ textAlign:"center", padding:"2rem", color:"#64748b", fontSize:13 },
};