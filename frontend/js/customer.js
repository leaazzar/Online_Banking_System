document.addEventListener("DOMContentLoaded", () => {
  loadAccounts();
  loadTransactions();

  const ticketForm = document.getElementById("ticket-form");
  if (ticketForm) ticketForm.addEventListener("submit", createTicket);

  const transferForm = document.getElementById("transfer-form");
  if (transferForm) transferForm.addEventListener("submit", makeTransfer);
});

async function loadAccounts() {
  const token = getAccessToken();
  const { data } = await customerGet("/accounts", token);

  document.getElementById("cust-accounts").innerHTML =
    data.map(
      (a) => `<li>#${a.account_number} — ${a.balance} (${a.status})</li>`
    ).join("");
}

async function loadTransactions() {
  const token = getAccessToken();
  const { data } = await customerGet("/transactions", token);

  document.getElementById("cust-transactions").innerHTML =
    data.map(
      (t) => `<li>${t.amount} — ${t.type} — ${t.timestamp}</li>`
    ).join("");
}

async function createTicket(event) {
  event.preventDefault();

  const token = getAccessToken();
  const subject = document.getElementById("ticket-subject").value;
  const description = document.getElementById("ticket-description").value;

  await customerPost("/tickets", { subject, description }, token);

  alert("Ticket created");
}

async function makeTransfer(event) {
  event.preventDefault();

  const token = getAccessToken();
  const body = {
    from_account: document.getElementById("transfer-from").value,
    to_account: document.getElementById("transfer-to").value,
    amount: document.getElementById("transfer-amount").value,
  };

  await customerPost("/transfer", body, token);
  alert("Transfer completed");
function renderAccount(account) {
    return `
    <div class="card" style="padding:20px;">
        <h3>${account.type} • ${account.account_number}</h3>
        <p style="font-size:26px; color:#3f63ff;">$${account.balance.toFixed(2)}</p>

        <h4>Recent Transactions</h4>
        <ul>
            ${account.recent.slice(0,5).map(t => `
                <li>${t.type.toUpperCase()} - $${t.amount} (${t.date})</li>
            `).join("")}
        </ul>

        <div style="margin-top:20px;">
            <a class="action-btn" href="transfer.html?from=${account.id}">
                Transfer Money
            </a>
        </div>
    </div>
    `;
}

}
