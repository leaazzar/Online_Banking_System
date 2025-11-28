// js/support_transactions.js

document.addEventListener("DOMContentLoaded", () => {
  const user = getCurrentUser();
  console.log("support_transactions - current user:", user);

  if (!user || (user.role !== "support" && user.role !== "admin")) {
    window.location.href = "login.html";
    return;
  }

  const nameSpan = document.getElementById("support-user-name");
  if (nameSpan) {
    nameSpan.textContent = user.full_name || user.email || "Support Agent";
  }

  loadAllTransactions();
});

async function loadAllTransactions() {
  const tbody = document.querySelector("#tx-table tbody");
  const errorEl = document.getElementById("tx-error");

  if (!tbody) {
    console.error("support_transactions: #tx-table tbody not found");
    return;
  }

  tbody.innerHTML = `
    <tr><td colspan="5" class="empty-msg">Loading transactions...</td></tr>
  `;
  if (errorEl) errorEl.textContent = "";

  // calls STAFF_BASE_URL + "/admin/transactions" → /staff/admin/transactions
  const { status, data } = await staffGet("/admin/transactions");
  console.log("GET /admin/transactions =>", status, data);

  tbody.innerHTML = "";

  if (status !== 200) {
    const msg = data?.msg || data?.error || "Failed to load transactions.";
    if (errorEl) errorEl.textContent = msg;
    else alert(msg);
    return;
  }

  if (!Array.isArray(data) || data.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5" class="empty-msg">No transactions found.</td></tr>
    `;
    return;
  }

  data.forEach((t) => {
    const tr = document.createElement("tr");

    const fromTo = `${t.sender ?? "-"} → ${t.receiver ?? "-"}`;
    const ts = t.timestamp ? new Date(t.timestamp).toLocaleString() : "-";

    tr.innerHTML = `
      <td>${t.id}</td>
      <td>${fromTo}</td>
      <td>${t.type ?? "-"}</td>
      <td>${formatAmount(t.amount)}</td>
      <td>${ts}</td>
    `;

    tbody.appendChild(tr);
  });
}

function formatAmount(v) {
  if (v == null) return "-";
  const num = Number(v);
  if (Number.isNaN(num)) return v;
  return num.toFixed(2);
}
