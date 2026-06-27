import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { fetchExchangeRates, convertCurrency, formatDualCurrency, getCurrencySymbol } from "../lib/currencyUtils";

const CAT_COLORS = {
  Food: "#E24B4A",
  Transport: "#D85A30",
  Rent: "#BA7517",
  Salary: "#1D9E75",
  Shopping: "#D4537E",
  Entertainment: "#7F77DD",
  Health: "#378ADD",
  default: "#888780",
};

const CATEGORIES = [
  "Food", "Transport", "Rent", "Salary", "Shopping",
  "Entertainment", "Health", "Freelance", "Other",
];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [customCat, setCustomCat] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Currency state
  const [userCurrency, setUserCurrency] = useState("USD");
  const [rates, setRates] = useState({});

  // LOAD USER CURRENCY & EXCHANGE RATES
  useEffect(() => {
    const loadCurrencyAndRates = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.currency) {
          setUserCurrency(user.user_metadata.currency);
        }
        const fetchedRates = await fetchExchangeRates("USD");
        setRates(fetchedRates);
      } catch (err) {
        console.error("Currency/rates error:", err);
      }
    };
    loadCurrencyAndRates();
  }, []);

  // FETCH TRANSACTIONS
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        setTransactions(data || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, []);

  // ADD TRANSACTION
  const addTransaction = async () => {
    const amt = parseFloat(amount);
    const cat = category === "Other" ? customCat.trim() : category;
    if (!cat || !amt || amt <= 0) return;
    
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("transactions")
        .insert([{
          user_id: user.id,
          type,
          category: cat,
          amount: amt,
          note: note.trim(),
        }])
        .select()
        .single();
      
      if (error) throw error;
      setTransactions((prev) => [data, ...prev]);
      setCategory("");
      setCustomCat("");
      setAmount("");
      setNote("");
    } catch (err) {
      console.error("Add error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE TRANSACTION
  const deleteTransaction = async (id) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // FILTER + SORT
  const visible = transactions
    .filter((t) => filterType === "all" || t.type === filterType)
    .filter((t) => filterCat === "all" || t.category === filterCat)
    .filter((t) => t.category.toLowerCase().includes(search.toLowerCase()) ||
      (t.note || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "oldest") return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "highest") return b.amount - a.amount;
      if (sortBy === "lowest") return a.amount - b.amount;
      return 0;
    });

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((a, t) => a + convertCurrency(t.amount, "USD", userCurrency, rates), 0);
    
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((a, t) => a + convertCurrency(t.amount, "USD", userCurrency, rates), 0);

  const uniqueCats = [...new Set(transactions.map((t) => t.category))];
  const fmt = (n) => getCurrencySymbol(userCurrency) + Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* HEADER */}
        <div style={s.topbar}>
          <div style={s.pageTitle}>Transactions</div>
          <div style={s.countPill}>{transactions.length} total • {userCurrency}</div>
        </div>

        {/* SUMMARY ROW */}
        <div style={s.summaryRow}>
          <div style={s.summaryCard}>
            <div style={s.sLabel}>Total income</div>
            <div style={{ ...s.sVal, color: "#1D9E75" }}>{fmt(totalIncome)}</div>
          </div>
          <div style={s.summaryCard}>
            <div style={s.sLabel}>Total expenses</div>
            <div style={{ ...s.sVal, color: "#E24B4A" }}>{fmt(totalExpenses)}</div>
          </div>
          <div style={s.summaryCard}>
            <div style={s.sLabel}>Net balance</div>
            <div style={{
              ...s.sVal,
              color: totalIncome - totalExpenses >= 0 ? "#1D9E75" : "#E24B4A"
            }}>
              {fmt(Math.abs(totalIncome - totalExpenses))}
            </div>
          </div>
          <div style={s.summaryCard}>
            <div style={s.sLabel}>Showing</div>
            <div style={{ ...s.sVal, color: "#7F77DD" }}>{visible.length}</div>
          </div>
        </div>

        <div style={s.cols}>

          {/* ADD FORM */}
          <div style={s.panel}>
            <div style={s.panelHd}>New transaction</div>

            <div style={s.seg}>
              {["expense", "income"].map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{ ...s.segBtn, ...(type === t ? s.segBtnActive : {}) }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div style={s.fieldLabel}>Category</div>
            <select
              style={s.input}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {category === "Other" && (
              <input
                style={s.input}
                placeholder="Enter category name"
                value={customCat}
                onChange={(e) => setCustomCat(e.target.value)}
              />
            )}

            <div style={s.fieldLabel}>Amount ({userCurrency})</div>
            <input
              style={s.input}
              type="number"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTransaction()}
            />

            <div style={s.fieldLabel}>Note (optional)</div>
            <input
              style={s.input}
              placeholder="e.g. Monthly groceries"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTransaction()}
            />

            <button
              style={{ ...s.addBtn, opacity: submitting ? 0.6 : 1 }}
              onClick={addTransaction}
              disabled={submitting}
            >
              {submitting ? "Adding..." : "+ Add transaction"}
            </button>
          </div>

          {/* LIST */}
          <div style={s.panel}>
            <div style={s.panelHd}>All transactions</div>

            {/* SEARCH */}
            <input
              style={{ ...s.input, marginBottom: 10 }}
              placeholder="Search by category or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* FILTERS */}
            <div style={s.filterRow}>
              {["all", "income", "expense"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  style={{ ...s.filterBtn, ...(filterType === f ? s.filterBtnActive : {}) }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* CATEGORY FILTER */}
            <div style={{ ...s.filterRow, marginBottom: 12, flexWrap: "wrap" }}>
              <button
                onClick={() => setFilterCat("all")}
                style={{ ...s.filterBtn, ...(filterCat === "all" ? s.filterBtnActive : {}) }}
              >
                All categories
              </button>
              {uniqueCats.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilterCat(c)}
                  style={{ ...s.filterBtn, ...(filterCat === c ? s.filterBtnActive : {}) }}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* SORT */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: "#64748b" }}>Sort:</span>
              <select
                style={{ ...s.input, marginBottom: 0, width: "auto", fontSize: 11, padding: "4px 8px" }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest amount</option>
                <option value="lowest">Lowest amount</option>
              </select>
            </div>

            {/* TX LIST */}
            <div style={s.txList}>
              {loading ? (
                <div style={s.empty}>Loading...</div>
              ) : visible.length === 0 ? (
                <div style={s.empty}>No transactions match your filters.</div>
              ) : (
                visible.map((t) => {
                  const isExp = t.type === "expense";
                  const dotClr = CAT_COLORS[t.category] || CAT_COLORS.default;
                  const amtClr = isExp ? "#E24B4A" : "#1D9E75";
                  const displayAmount = getCurrencySymbol(userCurrency) + Number(convertCurrency(t.amount, "USD", userCurrency, rates)).toLocaleString(undefined, { minimumFractionDigits:0, maximumFractionDigits:0 });
                  
                  return (
                    <div key={t.id} style={s.txRow}>
                      <div style={s.txLeft}>
                        <div style={{ ...s.txDot, background: dotClr }} />
                        <div>
                          <div style={s.txCat}>{t.category}</div>
                          <div style={s.txMeta}>
                            {t.type}
                            {t.note ? ` · ${t.note}` : ""}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ ...s.txAmt, color: amtClr, fontSize: 12 }}>
                          {isExp ? "-" : "+"}{displayAmount}
                        </div>
                        <button
                          onClick={() => deleteTransaction(t.id)}
                          style={s.deleteBtn}
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

const s = {
  page: { background: "#0b1120", minHeight: "100vh", color: "white", fontFamily: "sans-serif" },
  container: { padding: "24px 20px", maxWidth: "960px", margin: "0 auto" },
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" },
  pageTitle: { fontSize: 18, fontWeight: 500, color: "#f1f5f9" },
  countPill: { fontSize: 12, color: "#64748b", background: "#1e293b", border: "0.5px solid #334155", borderRadius: 20, padding: "5px 12px" },
  summaryRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: "1.25rem" },
  summaryCard: { background: "#1e293b", borderRadius: 12, border: "0.5px solid #334155", padding: "12px 14px" },
  sLabel: { fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: 4 },
  sVal: { fontSize: 19, fontWeight: 500 },
  cols: { display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 14 },
  panel: { background: "#1e293b", borderRadius: 12, border: "0.5px solid #334155", padding: 16 },
  panelHd: { fontSize: 11, fontWeight: 500, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 },
  seg: { display: "flex", background: "#0b1120", borderRadius: 8, border: "0.5px solid #334155", overflow: "hidden", marginBottom: 12 },
  segBtn: { flex: 1, padding: "7px", fontSize: 12, fontWeight: 500, border: "none", background: "transparent", color: "#64748b", cursor: "pointer" },
  segBtnActive: { background: "#7F77DD", color: "#fff", borderRadius: 7 },
  fieldLabel: { fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 500 },
  input: { width: "100%", marginBottom: 10, padding: "8px 10px", borderRadius: 8, border: "0.5px solid #475569", background: "#0b1120", color: "white", fontSize: 13, outline: "none" },
  addBtn: { width: "100%", padding: 9, background: "#7F77DD", color: "#fff", fontSize: 13, fontWeight: 500, border: "none", borderRadius: 8, cursor: "pointer", marginTop: 2 },
  filterRow: { display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" },
  filterBtn: { padding: "4px 10px", fontSize: 11, fontWeight: 500, border: "0.5px solid #334155", borderRadius: 20, background: "transparent", color: "#64748b", cursor: "pointer", whiteSpace: "nowrap" },
  filterBtnActive: { background: "#7F77DD", color: "#fff", border: "0.5px solid #7F77DD" },
  txList: { display: "flex", flexDirection: "column", gap: 5, maxHeight: 420, overflowY: "auto" },
  txRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 10px", borderRadius: 8, background: "#0b1120", border: "0.5px solid #334155" },
  txLeft: { display: "flex", alignItems: "center", gap: 9 },
  txDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  txCat: { fontSize: 13, fontWeight: 500, color: "#f1f5f9" },
  txMeta: { fontSize: 11, color: "#64748b", marginTop: 1 },
  txAmt: { fontSize: 13, fontWeight: 500 },
  deleteBtn: { background: "transparent", border: "none", color: "#475569", fontSize: 11, cursor: "pointer", padding: "2px 5px", borderRadius: 4 },
  empty: { textAlign: "center", padding: "2rem", color: "#64748b", fontSize: 13 },
};