document.addEventListener("DOMContentLoaded", loadTickets);

async function loadTickets() {
  const token = getAccessToken();
  const { data } = await staffGet("/tickets", token);

  const list = document.getElementById("support-tickets");
  list.innerHTML = data
    .map(
      (t) => `
      <div class="ticket">
        <h3>${t.subject}</h3>
        <p>${t.description}</p>
        <p>Status: ${t.status}</p>
        <button onclick="updateStatus(${t.id}, 'in_progress')">Start</button>
        <button onclick="updateStatus(${t.id}, 'resolved')">Resolve</button>
        <textarea id="note-${t.id}" placeholder="Add note..."></textarea>
        <button onclick="addNote(${t.id})">Add Note</button>
      </div>`
    )
    .join("");
}

async function updateStatus(ticketId, status) {
  const token = getAccessToken();
  await staffPatch(`/tickets/${ticketId}/status`, { status }, token);
  loadTickets();
}

async function addNote(ticketId) {
  const token = getAccessToken();
  const note = document.getElementById(`note-${ticketId}`).value;
  await staffPost(`/tickets/${ticketId}/note`, { note }, token);
  loadTickets();
}
