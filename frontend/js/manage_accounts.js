document.addEventListener("DOMContentLoaded", init);

async function init() {
    const params = new URLSearchParams(location.search);
    const userId = params.get("user_id");

    if (!userId) {
        alert("Missing user_id");
        return;
    }

    loadAccounts(userId);
}

async function loadAccounts(userId) {
    const tbody = document.getElementById("accounts-body");
    tbody.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;

    try {
        const accounts = await apiGet(`/admin/users/${userId}/accounts`);
        tbody.innerHTML = "";

        accounts.forEach(acc => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${acc.number}</td>
                <td>${acc.type}</td>
                <td>$${acc.balance.toFixed(2)}</td>
                <td>${acc.status}</td>
                <td>
                    ${renderButtons(acc)}
                </td>
            `;

            tbody.appendChild(row);

            // Add expandable transactions row
            const txRow = document.createElement("tr");
            txRow.className = "tx-row hidden";

            txRow.innerHTML = `
                <td colspan="5">
                    <div class="tx-container">
                        <h3>Last 5 Transactions</h3>
                        ${renderTransactions(acc.transactions)}
                    </div>
                </td>
            `;

            tbody.appendChild(txRow);

            // Expand on click
            row.addEventListener("click", () => {
                txRow.classList.toggle("hidden");
            });
        });

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5">Error loading accounts</td></tr>`;
    }
}

function renderButtons(acc) {
    return `
        <button class="secondary-btn" onclick="freeze(${acc.id}); event.stopPropagation();">Freeze</button>
        <button class="secondary-btn" onclick="unfreeze(${acc.id}); event.stopPropagation();">Unfreeze</button>
        <button class="danger-btn" onclick="closeAcc(${acc.id}); event.stopPropagation();">Close</button>
    `;
}

function renderTransactions(list) {
    if (!list.length) return `<p>No transactions.</p>`;
    return `
        <table class="inner-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                ${list.map(t => `
                    <tr>
                        <td>${new Date(t.timestamp).toLocaleString()}</td>
                        <td>${t.type}</td>
                        <td>$${t.amount.toFixed(2)}</td>
                        <td>${t.sender}</td>
                        <td>${t.receiver}</td>
                        <td>${t.description}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

async function freeze(id) {
    await apiPatch(`/accounts/${id}/freeze`);
    location.reload();
}

async function unfreeze(id) {
    await apiPatch(`/accounts/${id}/unfreeze`);
    location.reload();
}

async function closeAcc(id) {
    await apiPatch(`/accounts/${id}/close`);
    location.reload();
}
