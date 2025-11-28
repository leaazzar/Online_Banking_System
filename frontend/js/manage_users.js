let editingUserId = null;

document.addEventListener("DOMContentLoaded", loadUsers);

async function loadUsers() {
    const users = await apiGet("/admin/users");
    const tbody = document.getElementById("users-body");
    tbody.innerHTML = "";

    users.forEach(u => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${u.full_name}</td>
            <td>${u.email}</td>
            <td>${u.phone}</td>
            <td>${u.role}</td>
            <td>
                <button class="action-btn small-btn" onclick="openEditModal(${u.id}, '${u.full_name}', '${u.email}', '${u.phone}')">Edit</button>
                <button class="action-btn small-btn" onclick="changeRole(${u.id})">Role</button>
                <button class="action-btn danger-btn small-btn" onclick="deleteUser(${u.id})">Delete</button>
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

    await apiPost("/admin/users/create-staff", body);
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
    await apiPatch(`/admin/users/${editingUserId}`, {
        full_name: document.getElementById("edit-name").value,
        email: document.getElementById("edit-email").value,
        phone: document.getElementById("edit-phone").value
    });

    closeEditModal();
    loadUsers();
}

// ------------------- CHANGE ROLE -------------------
async function changeRole(id) {
    const newRole = prompt("Enter new role: support / auditor / admin");
    if (!newRole) return;

    await apiPatch(`/admin/users/${id}/role`, { role: newRole });
    loadUsers();
}

// ------------------- DELETE USER -------------------
async function deleteUser(id) {
    if (!confirm("Delete this staff member?")) return;
    await apiDelete(`/admin/users/${id}`);
    loadUsers();
}
