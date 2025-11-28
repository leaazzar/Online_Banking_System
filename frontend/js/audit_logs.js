// ============================
// ROLE PROTECTION (runs immediately)
// ============================
const user = getCurrentUser();
if (!user || (user.role !== "admin" && user.role !== "auditor")) {
  alert("Unauthorized access.");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("Audit logs page loaded.");
  loadAuditLogs().catch(err => console.error("Error loading logs:", err));
});

async function loadAuditLogs() {
  const table = document.getElementById("logs-table");
  table.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;

  try {
    console.log("Calling staffApiGet for /auditor/audit-logs");

    // ✅ STAFF API, not apiGet
    const logs = await staffApiGet("/auditor/audit-logs");

    console.log("Logs response:", logs);

    if (!Array.isArray(logs) || logs.length === 0) {
      table.innerHTML = `<tr><td colspan="5">No logs found.</td></tr>`;
      return;
    }

    table.innerHTML = "";

    logs.forEach(log => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${log.id}</td>
        <td>${log.user_name || "Unknown"}</td>
        <td>${log.action}</td>
        <td>${log.details || "-"}</td>
        <td>${formatDate(log.created_at)}</td>
      `;

      table.appendChild(row);
    });

  } catch (err) {
    console.error("Audit log load error:", err);
    table.innerHTML = `<tr><td colspan="5">Error loading logs.</td></tr>`;
  }
}

function formatDate(str) {
  const d = new Date(str);
  return d.toLocaleString();
}
