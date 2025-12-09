document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnSettings");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const overlay = document.createElement("div");
    overlay.className = "settings-overlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;z-index:10000;";

    overlay.innerHTML = `
      <div style="background:#111;padding:30px;border-radius:15px;width:400px;color:#fff;position:relative;">
        <button id="closeSettings" style="position:absolute;top:10px;right:10px;background:none;border:none;color:#fff;font-size:22px;cursor:pointer;">✖</button>
        <h3>⚙️ Edit Profile</h3>
        <input type="text" id="newUsername" placeholder="New Username" style="width:90%;margin:6px 0;padding:10px;">
        <input type="email" id="newEmail" placeholder="New Email" style="width:90%;margin:6px 0;padding:10px;">
        <input type="password" id="newPassword" placeholder="New Password" style="width:90%;margin:6px 0;padding:10px;">
        <input type="file" id="newProfilePic" accept="image/*" style="margin:6px 0;">
        <button id="saveSettings" style="background:#1b1ed8;color:#fff;padding:10px 20px;border:none;border-radius:6px;cursor:pointer;">💾 Save Changes</button>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector("#closeSettings").addEventListener("click", () => overlay.remove());
    overlay.querySelector("#saveSettings").addEventListener("click", async () => {
      const newUser = {
        username: document.getElementById("newUsername").value,
        email: document.getElementById("newEmail").value,
        password: document.getElementById("newPassword").value,
      };
      // Példa: szerverre küldés
      try {
        const res = await fetch("/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newUser)
        });
        const result = await res.json();
        if (result.success) {
          alert("✅ Profile updated!");
        } else {
          alert("❌ Hiba: " + (result.error || "Ismeretlen"));
        }
      } catch (err) {
        console.error("Settings hiba:", err);
      }
      overlay.remove();
    });
  });
});
