document.addEventListener("DOMContentLoaded", () => {
  loadAccounts().catch(err => console.error("Error loading accounts:", err));
});

async function loadAccounts() {
  const tbody = document.getElementById("accounts-body");
  tbody.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;

  try {
    // Staff API → /staff/admin/accounts
    const accounts = await staffApiGet("/admin/accounts");

    if (!Array.isArray(accounts) || accounts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No accounts found.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";

    accounts.forEach(acc => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${acc.id}</td>
        <td>${acc.number}</td>
        <td>${acc.balance}</td>
        <td>${acc.status}</td>
        <td>
          <button class="btn"
                  onclick="changeAccountStatus(${acc.id}, 'freeze')">
            Freeze
          </button>
          <button class="btn"
                  onclick="changeAccountStatus(${acc.id}, 'unfreeze')">
            Unfreeze
          </button>
          <button class="btn danger"
                  onclick="changeAccountStatus(${acc.id}, 'close')">
            Close
          </button>
        </td>
      `;

      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Failed to load accounts:", err);
    tbody.innerHTML = `<tr><td colspan="5">Error loading accounts.</td></tr>`;
  }
}

async function changeAccountStatus(accountId, action) {
  let path;
  if (action === "freeze") {
    path = `/accounts/${accountId}/freeze`;
  } else if (action === "unfreeze") {
    path = `/accounts/${accountId}/unfreeze`;
  } else if (action === "close") {
    if (!confirm("Are you sure you want to permanently close this account?")) {
      return;
    }
    path = `/accounts/${accountId}/close`;
  } else {
    console.error("Unknown action", action);
    return;
  }

  try {
    await staffApiPatch(path, {}); // body is empty, backend ignores
    await loadAccounts();          // refresh table
  } catch (err) {
    console.error(`Failed to ${action} account ${accountId}:`, err);
    alert(`Failed to ${action} account. Check console for details.`);
  }
}
