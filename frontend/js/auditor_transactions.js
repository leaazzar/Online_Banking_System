const user = getCurrentUser();
if (!user || (user.role !== "auditor")) {
  alert("Unauthorized access.");
  window.location.href = "login.html";
}
document.addEventListener("DOMContentLoaded", loadTx);

async function loadTx() {
    try {
        const data = await staffApiGet("/auditor/transactions");
        const tbody = document.getElementById("tx-body");

        tbody.innerHTML = "";

        data.forEach(t => {
            tbody.innerHTML += `
                <tr>
                    <td>${t.id}</td>
                    <td>${t.amount}</td>
                    <td>${t.type}</td>
                    <td>${t.sender}</td>
                    <td>${t.receiver}</td>
                    <td>${t.timestamp}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Failed to load transactions", err);
    }
}
