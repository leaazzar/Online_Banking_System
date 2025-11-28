document.addEventListener("DOMContentLoaded", () => {
  loadDashboardStats();
});

async function loadDashboardStats() {
  const totalBalanceEl = document.getElementById("total-balance");
  const activeAccountsEl = document.getElementById("active-accounts");
  const recentTransactionsEl = document.getElementById("recent-transactions");

  if (!totalBalanceEl || !activeAccountsEl || !recentTransactionsEl) return;

  try {
    // ACCOUNTS
    const accounts = await apiGet("/accounts");   // customer_api

    const activeAccounts = accounts.filter(a => a.status === "active");
    const totalBalance = activeAccounts.reduce(
      (sum, a) => sum + (a.balance || 0),
      0
    );

    totalBalanceEl.textContent = `$${totalBalance.toFixed(2)}`;
    activeAccountsEl.textContent = activeAccounts.length.toString();
  } catch (err) {
    console.error("Failed to load accounts:", err);
  }

  try {
    const transactions = await apiGet("/transactions?limit=5");

    recentTransactionsEl.textContent = Array.isArray(transactions)
      ? transactions.length.toString()
      : "0";
  } catch (err) {
    console.error("Failed to load transactions:", err);
  }
}
