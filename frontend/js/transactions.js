let allTransactions = [];

document.addEventListener("DOMContentLoaded", loadTransactions);

async function loadTransactions() {
  const container = document.getElementById("transactions-container");
  container.innerHTML = "<p>Loading...</p>";

  try {
    // If your backend route is different, tell me — I’ll adjust.
    const data = await apiGet("/transactions");

    allTransactions = data;
    renderTransactions(data);

  } catch (err) {
    container.innerHTML = `<p class="error-msg">Failed to load transactions.</p>`;
  }
}

function applyFilters() {
  let filtered = [...allTransactions];

  const from = document.getElementById("filter-from").value;
  const to = document.getElementById("filter-to").value;
  const type = document.getElementById("filter-type").value;
  const min = parseFloat(document.getElementById("filter-min").value) || 0;
  const max = parseFloat(document.getElementById("filter-max").value) || Infinity;

  filtered = filtered.filter(txn => {
    const date = new Date(txn.timestamp);

    if (from && date < new Date(from)) return false;
    if (to && date > new Date(to)) return false;

    if (type && txn.type !== type) return false;

    if (txn.amount < min || txn.amount > max) return false;

    return true;
  });

  renderTransactions(filtered);
}

function renderTransactions(list) {
  const container = document.getElementById("transactions-container");
  container.innerHTML = "";

  if (!list.length) {
    container.innerHTML = `<div class="no-results">No transactions found.</div>`;
    return;
  }

  list.forEach(txn => {
    const card = document.createElement("div");
    card.className = "transaction-card";

    card.innerHTML = `
      <div class="txn-header">
        <span class="txn-type ${txn.type}">${txn.type.toUpperCase()}</span>
        <span>$${txn.amount.toFixed(2)}</span>
      </div>

      <p>${txn.description || "No description"}</p>

      <p class="txn-date">${new Date(txn.timestamp).toLocaleString()}</p>

      <p class="txn-accounts">
        From: <strong>${txn.sender_account_id || "-"}</strong>  
        <br>
        To: <strong>${txn.receiver_account_id || "-"}</strong>
      </p>
    `;

    container.appendChild(card);
  });
}
