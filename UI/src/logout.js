document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnLogout");
  if (!btn) return;

  btn.addEventListener("click", () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userData");
    alert("🚪 Logged out successfully!");
    window.location.href = "index.html"; // vissza a login oldalra
  });
});
