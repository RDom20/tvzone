document.addEventListener("DOMContentLoaded", () => {
    // === STÍLUS (A beágyazott kód felülíró stílusai) ===
    const style = document.createElement("style");
    style.innerHTML = `
        .profile-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: transparent;
          border: 2px solid #007bff;
          color: #fff;
          padding: 6px 12px;
          border-radius: 30px;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }

        .profile-btn:hover {
          background: #007bff;
          transform: scale(1.05);
        }

        .profile-btn img {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #007bff;
          background: transparent !important;
          box-shadow: none !important;
        }

        .profile-btn span {
          font-weight: bold;
          font-size: 20px;
          color: white;
        }

        .auth-modal {
          position: fixed !important;
          inset: 0 !important;
          background: rgba(0,0,0,0.7) !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          z-index: 9999 !important;
        }

        .auth-box {
          width: 500px !important;
          height: 340px !important;
          padding: 0 !important;
          background: #111 !important;
          border-radius: 10px !important;
          color: #fff !important;
          text-align: center !important;
          box-shadow: 0 0 30px rgba(0,0,0,0.5) !important;
          transition: all 0.3s ease-in-out !important;
        }

        .auth-box input {
          width: 80% !important;
          padding: 10px !important;
          margin: 8px 0 !important;
          border: none !important;
          border-radius: 5px !important;
          background: #222 !important;
          color: #fff !important;
          font-family: Arial, sans-serif !important;
          font-weight: bold !important;
          font-size: 20px !important;
        }

        .auth-box button {
          background: #007bff !important;
          color: white !important;
          border: none !important;
          padding: 10px 20px !important;
          border-radius: 5px !important;
          cursor: pointer !important;
          margin-top: 8px !important;
          font-family: Arial, sans-serif !important;
          font-weight: bold !important;
          font-size: 20px !important;
          color: #d8d8e0 !important;
        }

        .auth-box button:hover { background: #0056b3 !important; }

        #authTitle {
          font-family: Arial, sans-serif !important;
          font-weight: bold !important;
          color: #b8b8b8 !important;
          margin-bottom: 15px !important;
          font-size: 30px !important;
        }

        .auth-box .switch {
          font-family: Arial, sans-serif !important;
          font-weight: bold !important;
          color: #b8b8b8 !important;
          font-size: 26px !important;
          text-align: center !important;
          position: relative !important;
          top: -5px !important;
          margin-top: 20px !important;
          display: block !important;
        }

        .auth-box .switch a {
          font-family: Arial, sans-serif !important;
          font-weight: bold !important;
          color: #2523a7 !important;
          margin-left: 8px !important;
          font-size: 25px !important;
          text-decoration: none !important;
          display: inline-block !important;
          transition: transform 0.2s ease-in-out, color 0.2s ease-in-out !important;
        }

        .auth-box .switch a:hover {
          transform: scale(1.25) !important;
          color: #4a47ff !important;
        }

        .hidden { display: none !important; }
    `;
    document.head.appendChild(style);

    const loginBtn = document.querySelector(".login-btn");
    const loggedUser = localStorage.getItem("loggedInUser");
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");

    // --- Watchlist gombok kezelése (hozzáadás a listához) ---
    const reactionButtons = document.querySelectorAll(".reaction-btn");

    reactionButtons.forEach(btn => {
        btn.addEventListener("click", async () => {
            let title, img, link;
            const item = btn.closest(".carousel-item");
            if (item) {
                title = item.querySelector("h3")?.textContent || "Unknown Title"; 
                img = item.querySelector("img")?.src || ""; 
                link = item.querySelector("a")?.href || ""; 
            } else { // Ha details oldalon vagy
                title = document.getElementById("infoTitle")?.textContent || "Unknown Title"; 
                img = document.querySelector(".player-wrapper img")?.src || "default-thumbnail.png"; 
                link = window.location.href;  // jelenlegi oldal
            }

            const data = { title, img, link };

            try {
                const res = await fetch("/api/watchlist", {
                    method: "POST", 
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });
                const result = await res.json(); 
                if (result.success) {
                    alert(`✅ "${title}" hozzáadva a Watchlisthez!`); 
                } else {
                    alert("⚠️ Már hozzá van adva a listádhoz!");
                }
            } catch (err) {
                console.error("Watchlist hiba:", err);
                alert("❌ Hiba történt a mentés közben!");
            }
        });
    });

    // --- Watchlist megnyitása (főoldali gomb) ---
    const watchlistBtn = document.getElementById("btnWatchList");
    if (watchlistBtn) { 
        watchlistBtn.addEventListener("click", async () => {
            try {
                const res = await fetch("/api/watchlist");
                const data = await res.json();

                const overlay = document.createElement("div");
                overlay.className = "watchlist-overlay";
                overlay.innerHTML = `
                    <div class="watchlist-box">
                        <h2>📺 My Watchlist</h2>
                        <button id="closeWatchlist">✖</button>
                        <div class="watchlist-grid">
                            ${data.length > 0 ? data.map(item => `
                                <div class="watchlist-item">
                                    <img src="${item.img}" alt="">
                                    <h3>${item.title}</h3>
                                    <button class="play-btn" data-link="${item.link}">▶ Play</button>
                                </div>
                            `).join("") : "<p>❌ A listád üres</p>"}
                        </div>
                    </div>
                `;
                document.body.appendChild(overlay);

                overlay.querySelector("#closeWatchlist").addEventListener("click", () => overlay.remove());

                overlay.querySelectorAll(".play-btn").forEach(btn => {
                    btn.addEventListener("click", () => {
                        window.location.href = btn.dataset.link;
                    });
                });
            } catch (err) {
                console.error("Watchlist betöltési hiba:", err);
            }
        });
    }

    // --- 1️⃣ BEJELENTKEZETT FELHASZNÁLÓ ---
    if (loggedUser && loginBtn) {
        // Profil gomb megjelenítése
        const avatar = document.createElement("img");
        avatar.id = "avatar";
        avatar.src = userData.image || "default-avatar.png";

        const nameSpan = document.createElement("span");
        nameSpan.textContent = loggedUser;

        loginBtn.innerHTML = "";
        loginBtn.appendChild(avatar);
        loginBtn.appendChild(nameSpan);
        loginBtn.classList.remove("login-btn");
        loginBtn.classList.add("profile-btn");

        // 🔥 régi click eventek törlése, új gomb készítése a profillogika hozzáadásához
        const newProfileBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newProfileBtn, loginBtn);

        // --- Profil overlay megnyitása ---
        newProfileBtn.addEventListener("click", async () => {
            if (document.getElementById("profileOverlay")) return;

            try {
                const res = await fetch(`profile.html?nocache=${Date.now()}`);
                const html = await res.text();

                const overlay = document.createElement("div");
                overlay.id = "profileOverlay";
                overlay.innerHTML = html;

                Object.assign(overlay.style, { // Stílusok a profil overlay-hez
                    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                    background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center",
                    alignItems: "center", zIndex: "9999",
                });

                document.body.appendChild(overlay);

                // --- Bezárás overlay kattintással ---
                overlay.addEventListener("click", (e) => {
                    if (e.target === overlay) overlay.remove();
                });

                // --- Inicializáljuk a menüt ---
                initProfileMenu(overlay);
            } catch (err) {
                console.error("Profil overlay betöltési hiba:", err);
            }
        });

        return; // Nincs szükség az auth-modal logikára bejelentkezett állapotban
    }

    // --- 2️⃣ NINCS BEJELENTKEZVE (AUTH MODAL) ---
    if (!loginBtn) return; // Ha nincs loginBtn, ne fusson tovább

    const modal = document.createElement("div");
    modal.className = "auth-modal hidden";
    modal.innerHTML = `
        <div class="auth-box">
            <h2 id="authTitle">Login</h2>
            <div id="loginForm">
                <input type="text" id="loginUsername" placeholder="Username or Email"><br>
                <input type="password" id="loginPassword" placeholder="Password"><br>
                <button id="loginSubmit">Login</button>
                <p class="switch">Don’t have an account? <a href="#" id="showRegister">Register</a></p>
            </div>
            <div id="registerForm" class="hidden">
                <input type="text" id="regUsername" placeholder="Username"><br>
                <input type="email" id="regEmail" placeholder="Email"><br>
                <input type="password" id="regPassword" placeholder="Password"><br>
                <button id="registerSubmit">Register</button>
                <p class="switch">Already have an account? <a href="#" id="showLogin">Login</a></p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // --- Modal megnyitása / zárása ---
    loginBtn.addEventListener("click", () => modal.classList.remove("hidden"));
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.add("hidden");
    });

    const loginForm = modal.querySelector("#loginForm");
    const registerForm = modal.querySelector("#registerForm");
    const authTitle = modal.querySelector("#authTitle");

    // --- LOGIN → REGISTER (és átméretezés) ---
    modal.querySelector("#showRegister").addEventListener("click", (e) => {
        e.preventDefault();
        loginForm.classList.add("hidden");
        registerForm.classList.remove("hidden");
        authTitle.textContent = "Register";
        modal.querySelector(".auth-box").style.height = "400px"; // Külön kód, a beágyazott kódból
    });

    // --- REGISTER → LOGIN (és átméretezés) ---
    modal.querySelector("#showLogin").addEventListener("click", (e) => {
        e.preventDefault();
        registerForm.classList.add("hidden");
        loginForm.classList.remove("hidden");
        authTitle.textContent = "Login";
        modal.querySelector(".auth-box").style.height = "340px"; // Külön kód, a beágyazott kódból
    });

    // --- LOGIN ---
    modal.querySelector("#loginSubmit").onclick = async () => {
        const username = modal.querySelector("#loginUsername").value.trim();
        const password = modal.querySelector("#loginPassword").value.trim();
        if (!username || !password) return alert("Please fill in all fields.");
        try {
            const res = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem("loggedInUser", username);
                // Megjegyzés: A userData-t a szervernek is vissza kellene adnia
                alert(`✅ Welcome, ${username}!`);
                modal.remove();
                location.reload(); 
            } else {
                alert(data.error || "Login failed.");
            }
        } catch (err) {
            console.error("Login error:", err);
            alert("Server error.");
        }
    };

    // --- REGISTER ---
    modal.querySelector("#registerSubmit").onclick = async () => {
        const username = modal.querySelector("#regUsername").value.trim();
        const email = modal.querySelector("#regEmail").value.trim();
        const password = modal.querySelector("#regPassword").value.trim();
        if (!username || !email || !password) return alert("Please fill in all fields.");
        try {
            const res = await fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await res.json();
            if (data.success) {
                alert("✅ Registration successful! Please log in.");
                registerForm.classList.add("hidden");
                loginForm.classList.remove("hidden");
                authTitle.textContent = "Login";
            } else {
                alert(data.error || "Registration failed.");
            }
        } catch (err) {
            console.error("Register error:", err);
            alert("Server error.");
        }
    };
});

// === Profil overlay gombok (külön függvényként) ===
function initProfileMenu(overlay) {
    // Keressük a profil menüt az overlay-ben
    const profileMenu = overlay.querySelector('.profile-menu') || overlay;
    const logoutBtn = overlay.querySelector('#logoutBtn');

    // --- WATCHLIST gomb létrehozása, ha nincs ---
    let playlistBtn = overlay.querySelector('#btnWatchList');
    if (!playlistBtn) {
        playlistBtn = document.createElement('button');
        playlistBtn.id = 'btnWatchList';
        playlistBtn.textContent = '📺 Watchlist';
        playlistBtn.className = 'profile-item';
        profileMenu.appendChild(playlistBtn);
    }

    // --- WATCHLIST overlay megnyitása ---
    playlistBtn.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/watchlist');
            if (!res.ok) throw new Error('Network error');
            const data = await res.json();

            const wlOverlay = document.createElement('div');
            wlOverlay.className = 'watchlist-overlay';
            wlOverlay.innerHTML = `
                <div class="watchlist-box">
                    <h2>📺 My Watchlist</h2>
                    <button id="closeWatchlist">✖</button>
                    <div class="watchlist-grid">
                        ${
                            data.length
                                ? data.map((item) => `
                                    <div class="watchlist-item">
                                        <img src="${item.img || ''}" alt="">
                                        <h3>${item.title}</h3>
                                        <button onclick="window.location='${item.link}'">▶ Play</button>
                                    </div>`
                                ).join('')
                                : '<p>Nincs semmi a Watchlistben.</p>'
                        }
                    </div>
                </div>
            `;
            document.body.appendChild(wlOverlay); 
            document.getElementById('closeWatchlist').addEventListener('click', () => wlOverlay.remove());
        } catch (err) {
            console.error('❌ Watchlist betöltési hiba:', err); 
            alert('Nem sikerült betölteni a Watchlistet!');
        }
    });

    // --- SETTINGS bezárás kezelése ---
    const closeBtn = overlay.querySelector('#closeSettings');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => { 
            overlay.remove();
        });
    }

    // --- LOGOUT ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => { 
            localStorage.removeItem('loggedInUser');
            alert('👋 Logged out!'); 
            location.reload(); 
        });
    }
}