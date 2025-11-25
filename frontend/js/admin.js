// Frontend/js/admin.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("role-form");
  if (!form) return;

  form.addEventListener("submit", handleRoleChange);
});

async function handleRoleChange(event) {
  event.preventDefault();

  const userId = document.getElementById("role-user-id").value;
  const newRole = document.getElementById("role-select").value;

  const errorEl = document.getElementById("role-error");
  const successEl = document.getElementById("role-success");

  errorEl.textContent = "";
  successEl.textContent = "";

  const token = getAccessToken();
  const currentUser = getCurrentUser();

  if (!token || !currentUser || currentUser.role !== "admin") {
    errorEl.textContent = "You must be logged in as admin.";
    return;
  }

  const { status, data } = await apiPatch(`/users/${userId}/role`, { role: newRole }, token);

  if (status === 200) {
    successEl.textContent = `User ${data.user_id} is now ${data.role}`;
  } else {
    errorEl.textContent = data.error || "Failed to update role.";
  }
}

