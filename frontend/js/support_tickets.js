// js/support_tickets.js

let activeTicketId = null;
let ticketsCache = [];

// Run on page load
document.addEventListener("DOMContentLoaded", async () => {
  const user = getCurrentUser();
  if (!user || (user.role !== "support" && user.role !== "admin")) {
    // Only support/admin should see this page
    window.location.href = "login.html";
    return;
  }

  await loadTickets();
});

// ----------------------------------------
// LOAD ALL TICKETS (STAFF SERVICE)
// ----------------------------------------
async function loadTickets() {
  const tbody = document.getElementById("tickets-table");
  if (!tbody) return;

  // clear table & show temporary row
  tbody.innerHTML = `
    <tr><td colspan="6" class="empty-msg">Loading tickets...</td></tr>
  `;

  try {
    const { status, data } = await staffGet("/tickets");
    console.log("GET /tickets =>", status, data);

    tbody.innerHTML = "";

    if (status !== 200) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="6" class="error-msg">
        Failed to load tickets: ${data?.error || status}
      </td>`;
      tbody.appendChild(tr);
      return;
    }

    ticketsCache = Array.isArray(data) ? data : [];

    if (!ticketsCache.length) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        `<td colspan="6" class="empty-msg">No tickets found.</td>`;
      tbody.appendChild(tr);
      return;
    }

    ticketsCache.forEach((t) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.id}</td>
        <td>${t.customer_id ?? "-"}</td>
        <td>${escapeHtml(t.subject)}</td>
        <td>${statusBadge(t.status)}</td>
        <td>${new Date(t.created_at).toLocaleString()}</td>
        <td>
          <button class="primary-btn btn-small" onclick="openTicket(${t.id})">
            View
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading tickets:", err);
    tbody.innerHTML = `
      <tr><td colspan="6" class="error-msg">Failed to load tickets (network error).</td></tr>
    `;
  }
}

function statusBadge(status) {
  const label = formatStatus(status);
  // you already have .badge-open / .badge-in_progress / .badge-resolved OR .status-open…
  return `<span class="badge-${status}">${label}</span>`;
}

function formatStatus(status) {
  if (status === "open") return "Open";
  if (status === "in_progress") return "In Progress";
  if (status === "resolved") return "Resolved";
  return status;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ----------------------------------------
// MODAL: VIEW / NOTES / STATUS
// ----------------------------------------
async function openTicket(id) {
  activeTicketId = id;

  const t = ticketsCache.find((ticket) => ticket.id === id);
  if (!t) {
    alert("Ticket not found.");
    return;
  }

  document.getElementById("modal-subject").innerText = t.subject || "(no subject)";
  document.getElementById("modal-description").innerText =
    t.description || "(no description)";
  document.getElementById("ticket-status").value = t.status;

  const notesBox = document.getElementById("notes-list");
  notesBox.innerHTML = "";

  (t.notes || []).forEach((n) => {
    const div = document.createElement("div");
    div.className = "note-item";
    div.innerHTML = `
      <div style="font-size:13px; margin-bottom:4px;">
        <strong>User ${n.user_id}</strong>
        <em style="margin-left:6px;">${new Date(n.created_at).toLocaleString()}</em>
      </div>
      <p>${escapeHtml(n.note)}</p>
    `;
    notesBox.appendChild(div);
  });

  document.getElementById("ticket-modal").classList.remove("hidden");
}

function closeTicketModal() {
  document.getElementById("ticket-modal").classList.add("hidden");
}

// ----------------------------------------
// ADD NOTE  (POST /tickets/<id>/note)
// ----------------------------------------
async function addNote() {
  if (!activeTicketId) return;

  const noteText = document.getElementById("new-note").value.trim();
  if (!noteText) {
    alert("Enter a note.");
    return;
  }

  const { status, data } = await staffPost(
    `/tickets/${activeTicketId}/note`,
    { note: noteText }
  );
  console.log("POST note =>", status, data);

  if (status !== 201) {
    alert(data?.error || "Failed to add note.");
    return;
  }

  document.getElementById("new-note").value = "";
  await loadTickets();
  await openTicket(activeTicketId);
}

// ----------------------------------------
// CHANGE STATUS (PATCH /tickets/<id>/status)
// ----------------------------------------
async function changeStatus() {
  if (!activeTicketId) return;

  const newStatus = document.getElementById("ticket-status").value;

  const { status, data } = await staffPatch(
    `/tickets/${activeTicketId}/status`,
    { status: newStatus }
  );
  console.log("PATCH status =>", status, data);

  if (status !== 200) {
    alert(data?.error || "Failed to change status.");
    return;
  }

  await loadTickets();
  await openTicket(activeTicketId);
}
