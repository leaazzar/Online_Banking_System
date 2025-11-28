document.addEventListener("DOMContentLoaded", loadAuditLogs);

async function loadAuditLogs() {
    const table = document.getElementById("logs-table");
    table.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;

    try {
        const logs = await apiGet("/auditor/audit-logs");

        if (!logs.length) {
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
        console.error(err);
        table.innerHTML = `<tr><td colspan="5">Error loading logs.</td></tr>`;
    }
}

function formatDate(str) {
    const d = new Date(str);
    return d.toLocaleString();
}
