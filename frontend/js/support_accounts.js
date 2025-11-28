// js/support_accounts.js

document.addEventListener("DOMContentLoaded", () => {
  const user = getCurrentUser();
  console.log("support_accounts - current user:", user);

  // Only support/admin should access
  if (!user || (user.role !== "support" && user.role !== "admin")) {
    window.location.href = "login.html";
    return;
  }

  const nameSpan = document.getElementById("support-user-name");
  if (nameSpan) {
    nameSpan.textContent = user.full_name || user.email || "Support Agent";
  }

  loadAllAccounts();
});

async function loadAllAccounts() {
  const tbody = document.querySelector("#accounts-table tbody");
  const errorEl = document.getElementById("accounts-error");

  if (!tbody) {
    console.error("support_accounts: #accounts-table tbody not found");
    return;
  }

  tbody.innerHTML = `
    <tr><td colspan="4" class="empty-msg">Loading accounts...</td></tr>
  `;
  if (errorEl) errorEl.textContent = "";

  // calls STAFF_BASE_URL + "/admin/accounts" → /staff/admin/accounts
  const { status, data } = await staffGet("/admin/accounts");
  console.log("GET /admin/accounts =>", status, data);

  tbody.innerHTML = "";

  if (status !== 200) {
    const msg = data?.msg || data?.error || "Failed to load accounts.";
    if (errorEl) errorEl.textContent = msg;
    else alert(msg);
    return;
  }

  if (!Array.isArray(data) || data.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="4" class="empty-msg">No accounts found.</td></tr>
    `;
    return;
  }

  data.forEach((a) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.id}</td>
      <td>${a.number ?? "-"}</td>
      <td>${a.status ?? "-"}</td>
      <td>${formatAmount(a.balance)}</td>
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
