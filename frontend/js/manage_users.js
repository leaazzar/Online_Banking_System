let editingUserId = null;

document.addEventListener("DOMContentLoaded", loadUsers);

async function loadUsers() {
    const res = await staffApiGet("/admin/users", getAccessToken());
    const users = res.data;

    const tbody = document.getElementById("users-body");
    tbody.innerHTML = "";

    users.forEach(u => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${u.full_name}</td>
            <td>${u.email}</td>
            <td>${u.phone}</td>
            <td><span class="role-pill role-${u.role}">${u.role}</span></td>
            <td>
                <button class="btn edit" onclick="openEditModal(${u.id}, '${u.full_name}', '${u.email}', '${u.phone}')">Edit</button>
                <button class="btn danger" onclick="deleteUser(${u.id})">Delete</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}


// ------------------- CREATE USER -------------------
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
        role: document.getElementById("create-role").value
    };

    await staffApiPost("/admin/users/create-staff", body);

    // RESET FIELDS
    document.getElementById("create-name").value = "";
    document.getElementById("create-email").value = "";
    document.getElementById("create-phone").value = "";
    document.getElementById("create-password").value = "";
    document.getElementById("create-role").value = "support";

    closeCreateModal();
    loadUsers();
}


// ------------------- EDIT USER -------------------
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
    await staffApiPatch(`/admin/users/${editingUserId}`, {
        full_name: document.getElementById("edit-name").value,
        email: document.getElementById("edit-email").value,
        phone: document.getElementById("edit-phone").value
    }, getAccessToken());

    closeEditModal();
    loadUsers();
}

// ------------------- DELETE USER -------------------
async function deleteUser(id) {
    if (!confirm("Are you sure you want to delete this staff member?")) return;

    await staffApiDelete(`/admin/users/${id}`, getAccessToken());
    loadUsers();
}
