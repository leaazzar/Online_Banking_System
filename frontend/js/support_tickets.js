let activeTicketId = null;

// Load tickets on page load
document.addEventListener("DOMContentLoaded", loadTickets);

async function loadTickets() {
    const tickets = await apiGet("/support/tickets"); // your backend route
    
    const tbody = document.getElementById("tickets-table");
    tbody.innerHTML = "";

    tickets.forEach(t => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${t.id}</td>
            <td>${t.customer_name}</td>
            <td>${t.subject}</td>
            <td><span class="badge-${t.status}">${formatStatus(t.status)}</span></td>
            <td>${new Date(t.created_at).toLocaleString()}</td>
            <td>
                <button class="btn-small" onclick="openTicket(${t.id})">View</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function formatStatus(status) {
    if (status === "open") return "Open";
    if (status === "in_progress") return "In Progress";
    if (status === "resolved") return "Resolved";
    return status;
}

// -------------------------------------------------
// OPEN MODAL
// -------------------------------------------------
async function openTicket(id) {
    activeTicketId = id;

    const data = await apiGet(`/support/tickets/${id}`);

    document.getElementById("modal-subject").innerText = data.subject;
    document.getElementById("modal-description").innerText = data.description;

    document.getElementById("ticket-status").value = data.status;

    const notesBox = document.getElementById("notes-list");
    notesBox.innerHTML = "";

    data.notes.forEach(n => {
        const div = document.createElement("div");
        div.className = "note-item";
        div.innerHTML = `
            <strong>${n.user_name}</strong> <em>${new Date(n.created_at).toLocaleString()}</em>
            <p>${n.note}</p>
        `;
        notesBox.appendChild(div);
    });

    document.getElementById("ticket-modal").classList.remove("hidden");
}

function closeTicketModal() {
    document.getElementById("ticket-modal").classList.add("hidden");
}

// -------------------------------------------------
// ADD NOTE
// -------------------------------------------------
async function addNote() {
    const noteText = document.getElementById("new-note").value.trim();
    if (!noteText) return alert("Enter a note.");

    await apiPost(`/support/tickets/${activeTicketId}/notes`, { note: noteText });

    document.getElementById("new-note").value = "";
    openTicket(activeTicketId); // reload
}

// -------------------------------------------------
// CHANGE STATUS
// -------------------------------------------------
async function changeStatus() {
    const status = document.getElementById("ticket-status").value;
    await apiPatch(`/support/tickets/${activeTicketId}/status`, { status });
    openTicket(activeTicketId);
}
