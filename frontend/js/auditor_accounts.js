document.addEventListener("DOMContentLoaded", loadAccounts);

async function loadAccounts() {
    try {
        const data = await staffApiGet("/auditor/accounts");
        const tbody = document.getElementById("accounts-body");

        tbody.innerHTML = "";

        data.forEach(acc => {
            tbody.innerHTML += `
                <tr>
                    <td>${acc.id}</td>
                    <td>${acc.number}</td>
                    <td>${acc.balance}</td>
                    <td>${acc.status}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Failed to load accounts", err);
    }
}
