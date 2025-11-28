// ============================
// ROLE PROTECTION (runs immediately)
// ============================
const user = getCurrentUser();
if (!user || (user.role !== "admin")) {
  alert("Unauthorized access.");
  window.location.href = "login.html";
}


let editingUserId = null;

// Load users when page is ready
document.addEventListener("DOMContentLoaded", () => {
  loadUsers().catch((err) => {
    console.error("Error loading users on DOMContentLoaded:", err);
  });
});

async function loadUsers() {
  try {
    // staffApiGet returns the parsed JSON (array), not { status, data }
    const users = await staffApiGet("/admin/users", getAccessToken());
    console.log("Users loaded:", users);

    const tbody = document.getElementById("users-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!Array.isArray(users) || users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">No users found.</td>
        </tr>
      `;
      return;
    }

    users.forEach((u) => {
      const row = document.createElement("tr");

      const safePhone = u.phone ?? "";
      const safeName = (u.full_name || "").replace(/'/g, "\\'");
      const safeEmail = (u.email || "").replace(/'/g, "\\'");
      const safePhoneAttr = safePhone.replace(/'/g, "\\'");

      row.innerHTML = `
        <td>${u.full_name}</td>
        <td>${u.email}</td>
        <td>${safePhone}</td>
        <td><span class="role-pill role-${u.role}">${u.role}</span></td>
        <td>
          <button class="btn edit"
            onclick="openEditModal(${u.id}, '${safeName}', '${safeEmail}', '${safePhoneAttr}')">
            Edit
          </button>
          <button class="btn danger" onclick="deleteUser(${u.id})">
            Delete
          </button>
        </td>
      `;

      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Failed to load users:", err);
    const tbody = document.getElementById("users-body");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">Failed to load users.</td>
        </tr>
      `;
    }
  }
}

/* ------------------- CREATE USER ------------------- */

function openCreateModal() {
  document.getElementById("create-modal").classList.remove("hidden");
}

function closeCreateModal() {
  document.getElementById("create-modal").classList.add("hidden");
}

async function createStaff() {
  const body = {
    full_name: document.getElementById("create-name").value,
    email: document.getElementById("create-email").value,
    phone: document.getElementById("create-phone").value,
    password: document.getElementById("create-password").value,
    role: document.getElementById("create-role").value,
  };

  try {
    await staffApiPost("/admin/users/create-staff", body, getAccessToken());
    // Reset fields
    document.getElementById("create-name").value = "";
    document.getElementById("create-email").value = "";
    document.getElementById("create-phone").value = "";
    document.getElementById("create-password").value = "";
    document.getElementById("create-role").value = "support";

    closeCreateModal();
    await loadUsers();
  } catch (err) {
    console.error("Failed to create staff:", err);
    // here you could show an error message in the modal if you want
  }
}

/* ------------------- EDIT USER ------------------- */

function openEditModal(id, name, email, phone) {
  editingUserId = id;
  document.getElementById("edit-name").value = name;
  document.getElementById("edit-email").value = email;
  document.getElementById("edit-phone").value = phone;
  document.getElementById("edit-modal").classList.remove("hidden");
}

function closeEditModal() {
  editingUserId = null;
  document.getElementById("edit-modal").classList.add("hidden");
}

async function saveUserEdit() {
  const body = {
    full_name: document.getElementById("edit-name").value,
    email: document.getElementById("edit-email").value,
    phone: document.getElementById("edit-phone").value,
  };

  try {
    await staffApiPatch(`/admin/users/${editingUserId}`, body, getAccessToken());
    closeEditModal();
    await loadUsers();
  } catch (err) {
    console.error("Failed to update user:", err);
  }
}

/* ------------------- DELETE USER ------------------- */

async function deleteUser(id) {
  if (!confirm("Are you sure you want to delete this staff member?")) return;

  try {
    await staffApiDelete(`/admin/users/${id}`, getAccessToken());
    await loadUsers();
  } catch (err) {
    console.error("Failed to delete user:", err);
  }
}
