document.addEventListener("DOMContentLoaded", async () => {
  const btn = document.getElementById("btnSwitch");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    try {
      // Példa: szerver endpoint, ami visszaadja a testusers.json tartalmát
      const res = await fetch("/api/users");
      const users = await res.json();

      const overlay = document.createElement("div");
      overlay.className = "switch-overlay";
      overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;z-index:10000;";

      overlay.innerHTML = `
        <div style="background:#111;padding:20px;border-radius:10px;width:400px;color:#fff;position:relative;">
          <button id="closeSwitch" style="position:absolute;top:10px;right:10px;background:none;border:none;color:#fff;font-size:22px;cursor:pointer;">✖</button>
          <h3>🔄 Switch Profile</h3>
          <div id="profileList" style="margin-top:15px;">
            ${users.map(u => `<button class="profile-btn" style="display:block;width:100%;margin:5px 0;padding:10px;background:#333;color:#fff;border:none;border-radius:6px;cursor:pointer;">${u.username}</button>`).join("")}
          </div>
          <button id="addProfile" style="margin-top:15px;background:#1b1ed8;color:#fff;padding:10px 20px;border:none;border-radius:6px;cursor:pointer;">➕ Add Profile</button>
        </div>
      `;
      document.body.appendChild(overlay);

      // Bezárás
      overlay.querySelector("#closeSwitch").addEventListener("click", () => overlay.remove());

      // Profilváltás
      overlay.querySelectorAll(".profile-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          localStorage.setItem("loggedInUser", btn.textContent);
          alert(`✅ Switched to ${btn.textContent}`);
          overlay.remove();
          window.location.reload();
        });
      });

      // Új profil hozzáadása
      overlay.querySelector("#addProfile").addEventListener("click", () => {
        const newUser = prompt("Adj meg egy új felhasználónevet:");
        if (newUser) {
          localStorage.setItem("loggedInUser", newUser);
          alert(`➕ Új profil hozzáadva: ${newUser}`);
          overlay.remove();
          window.location.reload();
        }
      });
    } catch (err) {
      console.error("Switch hiba:", err);
    }
  });
});
