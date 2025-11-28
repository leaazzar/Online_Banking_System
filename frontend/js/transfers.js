document.addEventListener("DOMContentLoaded", loadAccounts);

let accounts = [];

async function loadAccounts() {
  const status = document.getElementById("status");
  status.innerHTML = "";

  try {
    const data = await apiGet("/accounts");

    accounts = data; // Backend returns a list, not {accounts: []}

    fillDropDowns();
  } catch (err) {
    status.innerHTML = `<div class="error-msg">Could not load accounts.</div>`;
  }
}

function fillDropDowns() {
  const internalFrom = document.getElementById("internal-from");
  const internalTo = document.getElementById("internal-to");
  const externalFrom = document.getElementById("external-from");

  internalFrom.innerHTML = "";
  internalTo.innerHTML = "";
  externalFrom.innerHTML = "";

  accounts.forEach(acc => {
    const option = `<option value="${acc.id}">${acc.type.toUpperCase()} - ${acc.account_number} ($${acc.balance})</option>`;

    internalFrom.innerHTML += option;
    externalFrom.innerHTML += option;
  });

  // Internal TO list is same but filtered
  accounts.forEach(acc => {
    internalTo.innerHTML += `<option value="${acc.id}">${acc.type.toUpperCase()} - ${acc.account_number} ($${acc.balance})</option>`;
  });
}

function switchTab(tab) {
  document.getElementById("internal-transfer").style.display = tab === "internal" ? "block" : "none";
  document.getElementById("external-transfer").style.display = tab === "external" ? "block" : "none";

  document.getElementById("tab-internal").classList.toggle("active", tab === "internal");
  document.getElementById("tab-external").classList.toggle("active", tab === "external");
}

async function submitInternal() {
  const status = document.getElementById("status");

  const body = {
    from_account_id: parseInt(document.getElementById("internal-from").value),
    to_account_id: parseInt(document.getElementById("internal-to").value),
    amount: parseFloat(document.getElementById("internal-amount").value),
    description: document.getElementById("internal-desc").value
  };

  try {
    const res = await apiPost("/transfers/internal", body);
    status.innerHTML = `<div class="success-msg">Transfer successful!</div>`;
    loadAccounts();

  } catch (err) {
    status.innerHTML = `<div class="error-msg">${err?.msg || "Transfer failed"}</div>`;
  }
}

async function submitExternal() {
  const status = document.getElementById("status");

  const body = {
    from_account_id: parseInt(document.getElementById("external-from").value),
    to_account_number: document.getElementById("external-number").value,
    amount: parseFloat(document.getElementById("external-amount").value),
    description: document.getElementById("external-desc").value
  };

  try {
    const res = await apiPost("/transfers/external", body);
    status.innerHTML = `<div class="success-msg">External transfer sent!</div>`;
    loadAccounts();

  } catch (err) {
    status.innerHTML = `<div class="error-msg">${err?.msg || "Transfer failed"}</div>`;
  }
}
