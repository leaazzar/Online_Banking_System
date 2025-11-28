// js/support.js

let selectedTicketId = null;
let ticketsCache = [];

// -------------------------
// PAGE INIT
// -------------------------
document.addEventListener("DOMContentLoaded", () => {
  const user = getCurrentUser();
  console.log("Support dashboard - current user:", user);

  // Only support/admin should access this page
  if (!user || (user.role !== "support" && user.role !== "admin")) {
    window.location.href = "login.html";
    return;
  }

  // Optional: show name if header has this span
  const nameSpan = document.getElementById("support-user-name");
  if (nameSpan) {
    nameSpan.textContent = user.full_name || "Support Agent";
  }

  loadTickets();

  // If there is a note form that uses submit event
  const addNoteForm = document.getElementById("add-note-form");
  if (addNoteForm) {
    addNoteForm.addEventListener("submit", handleAddNote);
  }
});

// -------------------------
// LOAD & RENDER TICKETS
// -------------------------
async function loadTickets() {
  const errorEl = document.getElementById("tickets-error");
  const tbody =
    document.querySelector("#tickets-table tbody") ||
    document.getElementById("tickets-table");

  if (!tbody) {
    console.error("support.js: #tickets-table not found.");
    return;
  }

  // temporary loading row
  tbody.innerHTML = `
    <tr><td colspan="6" class="empty-msg">Loading tickets...</td></tr>
  `;
  if (errorEl) errorEl.textContent = "";

  const { status, data } = await staffGet("/tickets");
  console.log("GET /tickets =>", status, data);

  tbody.innerHTML = "";

  if (status !== 200) {
    if (errorEl) {
      errorEl.textContent = data?.error || "Failed to load tickets.";
    } else {
      alert(data?.error || "Failed to load tickets.");
    }
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
    const created = new Date(t.created_at).toLocaleString();

    tr.innerHTML = `
      <td>${t.id}</td>
      <td>${t.customer_id ?? "-"}</td>
      <td>${escapeHtml(t.subject)}</td>
      <td>${statusBadge(t.status)}</td>
      <td>${created}</td>
      <td>
        <button class="secondary-btn" onclick="showTicketDetails(${t.id})">
          Details
        </button>
        ${renderStatusButton(t)}
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// nice colored status badge if you have .badge-open etc.
function statusBadge(status) {
  const label = formatStatus(status);
  return `<span class="badge-${status}">${label}</span>`;
}

function formatStatus(status) {
  if (status === "open") return "Open";
  if (status === "in_progress") return "In Progress";
  if (status === "resolved") return "Resolved";
  return status;
}

// Decide which status button to show depending on current status
function renderStatusButton(ticket) {
  if (ticket.status === "open") {
    return `<button class="primary-btn" onclick="updateTicketStatus(${ticket.id}, 'in_progress')">
              Mark In Progress
            </button>`;
  }
  if (ticket.status === "in_progress") {
    return `<button class="primary-btn" onclick="updateTicketStatus(${ticket.id}, 'resolved')">
              Mark Resolved
            </button>`;
  }
  // resolved → no further transitions
  return `<button class="secondary-btn" disabled>Resolved</button>`;
}

// -------------------------
// STATUS UPDATE
// -------------------------
async function updateTicketStatus(ticketId, nextStatus) {
  const { status, data } = await staffPatch(`/tickets/${ticketId}/status`, {
    status: nextStatus,
  });
  console.log("PATCH /tickets/" + ticketId + "/status =>", status, data);

  if (status !== 200) {
    alert(data?.error || "Failed to update status.");
    return;
  }

  await loadTickets();
  if (selectedTicketId === ticketId) {
    await showTicketDetails(ticketId);
  }
}

// -------------------------
// TICKET DETAILS + NOTES
// -------------------------
async function showTicketDetails(ticketId) {
  selectedTicketId = ticketId;

  // Use cached tickets first
  let ticket = ticketsCache.find((t) => t.id === ticketId);

  // Fallback: refetch if not in cache (should rarely happen)
  if (!ticket) {
    const { status, data } = await staffGet("/tickets");
    if (status !== 200) {
      alert("Failed to reload ticket details.");
      return;
    }
    ticketsCache = Array.isArray(data) ? data : [];
    ticket = ticketsCache.find((t) => t.id === ticketId);
  }

  if (!ticket) {
    alert("Ticket not found.");
    return;
  }

  const card = document.getElementById("ticket-details-card");
  const detailsDiv = document.getElementById("ticket-details");
  const notesList = document.getElementById("ticket-notes-list");

  if (!card || !detailsDiv || !notesList) {
    console.warn("support.js: details card elements missing.");
    return;
  }

  card.style.display = "block";

  detailsDiv.innerHTML = `
    <p><strong>ID:</strong> ${ticket.id}</p>
    <p><strong>Customer ID:</strong> ${ticket.customer_id ?? "-"}</p>
    <p><strong>Subject:</strong> ${escapeHtml(ticket.subject)}</p>
    <p><strong>Description:</strong> ${escapeHtml(ticket.description)}</p>
    <p><strong>Status:</strong> ${formatStatus(ticket.status)}</p>
    <p><strong>Created:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
  `;

  notesList.innerHTML = "";
  (ticket.notes || []).forEach((n) => {
    const li = document.createElement("li");
    li.textContent = `[${new Date(n.created_at).toLocaleString()}] User ${
      n.user_id
    }: ${n.note}`;
    notesList.appendChild(li);
  });

  const noteError = document.getElementById("note-error");
  const noteSuccess = document.getElementById("note-success");
  const noteInput = document.getElementById("note-text");

  if (noteError) noteError.textContent = "";
  if (noteSuccess) noteSuccess.textContent = "";
  if (noteInput) noteInput.value = "";
}

// -------------------------
// ADD NOTE
// -------------------------
async function handleAddNote(event) {
  event.preventDefault();
  if (!selectedTicketId) return;

  const noteInput = document.getElementById("note-text");
  const errorEl = document.getElementById("note-error");
  const successEl = document.getElementById("note-success");

  const noteText = (noteInput?.value || "").trim();

  if (errorEl) errorEl.textContent = "";
  if (successEl) successEl.textContent = "";

  if (!noteText) {
    if (errorEl) errorEl.textContent = "Note text is required.";
    else alert("Note text is required.");
    return;
  }

  const { status, data } = await staffPost(`/tickets/${selectedTicketId}/note`, {
    note: noteText,
  });
  console.log("POST /tickets/" + selectedTicketId + "/note =>", status, data);

  if (status !== 201) {
    if (errorEl) errorEl.textContent = data?.error || "Failed to add note.";
    else alert(data?.error || "Failed to add note.");
    return;
  }

  if (noteInput) noteInput.value = "";
  if (successEl) successEl.textContent = "Note added.";

  await showTicketDetails(selectedTicketId);
}

// -------------------------
// HELPERS
// -------------------------
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
