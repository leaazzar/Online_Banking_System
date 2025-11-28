document.addEventListener("DOMContentLoaded", () => {
  loadAllTransactions().catch(err =>
    console.error("Error loading admin transactions:", err)
  );
});

async function loadAllTransactions() {
  const tbody = document.getElementById("tx-body");
  tbody.innerHTML = `<tr><td colspan="6">Loading...</td></tr>`;

  try {
    // Staff API → /staff/admin/transactions
    const txs = await staffApiGet("/admin/transactions");

    if (!Array.isArray(txs) || txs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">No transactions found.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";

    txs.forEach(t => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${t.id}</td>
        <td>${t.amount}</td>
        <td>${t.type}</td>
        <td>${t.sender ?? "-"}</td>
        <td>${t.receiver ?? "-"}</td>
        <td>${formatDate(t.timestamp)}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Failed to load transactions:", err);
    tbody.innerHTML = `<tr><td colspan="6">Error loading transactions.</td></tr>`;
  }
}

function formatDate(str) {
  const d = new Date(str);
  return d.toLocaleString();
}
