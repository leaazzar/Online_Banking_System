document.addEventListener("DOMContentLoaded", loadTickets);

async function loadTickets() {
  const container = document.getElementById("tickets-container");
  container.innerHTML = "<p>Loading tickets...</p>";

  try {
    const tickets = await apiGet("/tickets");
    renderTickets(tickets);
  } catch (err) {
    container.innerHTML = "<p class='error-msg'>Failed to load tickets.</p>";
  }
}

function renderTickets(list) {
  const container = document.getElementById("tickets-container");
  container.innerHTML = "";

  if (!list.length) {
    container.innerHTML = `<p class="no-results">No tickets yet. Create one above.</p>`;
    return;
  }

  list.forEach(t => {
    const card = document.createElement("div");
    card.className = "ticket-card";

    const statusClass = `status-${t.status}`;

    card.innerHTML = `
      <h3>${t.subject}</h3>

      <p>${t.description}</p>

      <p style="margin-top: 10px;">
        <span class="ticket-status ${statusClass}">
          ${t.status.replace("_", " ").toUpperCase()}
        </span>
      </p>

      <p class="txn-date">Created: ${new Date(t.created_at).toLocaleString()}</p>
      ${t.updated_at ? `<p class="txn-date">Updated: ${new Date(t.updated_at).toLocaleString()}</p>` : ""}
    `;

    container.appendChild(card);
  });
}

/* MODAL HANDLING */
function openTicketForm() {
  document.getElementById("ticket-modal").classList.remove("hidden");
}

function closeTicketForm() {
  document.getElementById("ticket-modal").classList.add("hidden");
  document.getElementById("ticket-subject").value = "";
  document.getElementById("ticket-description").value = "";
}

/* SUBMIT TICKET */
async function submitTicket() {
  const subject = document.getElementById("ticket-subject").value.trim();
  const description = document.getElementById("ticket-description").value.trim();

  if (!subject || !description) {
    alert("Both subject and description are required.");
    return;
  }

  try {
    await apiPost("/tickets", { subject, description });
    closeTicketForm();
    loadTickets(); // refresh list
  } catch (err) {
    alert("Failed to submit ticket.");
  }
}
