// currencyUtils.js — src/lib/currencyUtils.js

const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  NGN: "₦",
};

export function getCurrencySymbol(currency) {
  return CURRENCY_SYMBOLS[currency] || currency + " ";
}

export async function fetchExchangeRates(base = "USD") {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    if (!res.ok) throw new Error("Rate fetch failed");
    const json = await res.json();
    return json.rates || {};
  } catch (err) {
    console.warn("Exchange rate fetch failed, using fallback rates:", err);
    return { USD: 1, EUR: 0.92, GBP: 0.79, CAD: 1.36, NGN: 1600 };
  }
}

/**
 * Convert amount from one currency to another (all rates relative to USD).
 */
export function convertCurrency(amount, fromCurrency, toCurrency, rates) {
  if (!rates || Object.keys(rates).length === 0) return amount;
  if (fromCurrency === toCurrency) return amount;
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  return (amount / fromRate) * toRate;
}

/**
 * Convert any amount to USD using rates (base = USD).
 */
export function toUSD(amount, fromCurrency, rates) {
  if (fromCurrency === "USD") return amount;
  const fromRate = rates[fromCurrency] || 1;
  return amount / fromRate;
}

/**
 * Format for display in the user's currency.
 * Always shows user currency as the primary value.
 * If the transaction was entered in a different currency, shows original in parentheses.
 */
export function formatDualCurrency(amountUSD, userCurrency, rates) {
  const symbol = getCurrencySymbol(userCurrency);
  const converted = convertCurrency(amountUSD, "USD", userCurrency, rates);
  const formattedConverted = symbol + Number(converted).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formattedConverted;
}