document.addEventListener("DOMContentLoaded", loadAuditorData);

async function loadAuditorData() {
  const token = getAccessToken();

  const accounts = await staffGet("/auditor/accounts", token);
  const tx = await staffGet("/auditor/transactions", token);
  const logs = await staffGet("/logs", token);

  document.getElementById("auditor-accounts").innerHTML =
    accounts.data.map(
      (a) => `<li>#${a.number} — Balance: ${a.balance} — ${a.status}</li>`
    ).join("");

  document.getElementById("auditor-transactions").innerHTML =
    tx.data.map(
      (t) => `<li>ID ${t.id} — ${t.amount} (${t.type}) at ${t.timestamp}</li>`
    ).join("");

  document.getElementById("auditor-logs").innerHTML =
    logs.data.map(
      (l) =>
        `<li>[${l.created_at}] User ${l.user_id} — ${l.action}: ${l.details}</li>`
    ).join("");
}
