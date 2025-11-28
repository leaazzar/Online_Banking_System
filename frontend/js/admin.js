document.addEventListener("DOMContentLoaded", () => {
  loadAdminData();

  const form = document.getElementById("role-form");
  if (form) form.addEventListener("submit", handleRoleChange);
});

async function loadAdminData() {
  const token = getAccessToken();
  if (!token) return;

  // load accounts
  const accounts = await staffGet("/admin/accounts", token);
  displayAccounts(accounts.data);

  // load transactions
  const tx = await staffGet("/admin/transactions", token);
  displayTransactions(tx.data);

  // load logs
  const logs = await staffGet("/logs", token);
  displayLogs(logs.data);
}

async function handleRoleChange(event) {
  event.preventDefault();

  const userId = document.getElementById("role-user-id").value;
  const newRole = document.getElementById("role-select").value;
  const token = getAccessToken();

  const { status, data } = await authPatch(`/users/${userId}/role`, { role: newRole }, token);

  if (status === 200) {
    alert(`User ${data.user_id} is now ${data.role}`);
  } else {
    alert(data.error || "Failed to update role");
  }
}

function displayAccounts(accounts) {
  const list = document.getElementById("admin-accounts");
  list.innerHTML = accounts
    .map(
      (a) =>
        `<li>Acc #${a.number} — Balance: ${a.balance} — Status: ${a.status}</li>`
    )
    .join("");
}

function displayTransactions(txs) {
  const list = document.getElementById("admin-transactions");
  list.innerHTML = txs
    .map(
      (t) =>
        `<li>ID ${t.id} — ${t.amount} (${t.type}) — ${t.timestamp}</li>`
    )
    .join("");
}

function displayLogs(logs) {
  const list = document.getElementById("admin-logs");
  list.innerHTML = logs
    .map(
      (l) =>
        `<li>[${l.created_at}] User ${l.user_id} — ${l.action}: ${l.details}</li>`
    )
    .join("");
}
