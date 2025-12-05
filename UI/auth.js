// --- AUTH.JS ---
// Használható bármely HTML-ben: <script src="auth.js"></script>

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.querySelector(".login-btn");
  if (!loginBtn) return;

  const loggedUser = localStorage.getItem("loggedInUser");

  // --- Alap stílus hozzáadása (beleértve a profile-btn-t is) ---
  const style = document.createElement("style");
  style.innerHTML = `
    .profile-btn {
      background: transparent;
      border: 2px solid #007bff;
      color: #007bff;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 24px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
    }

    .profile-btn:hover {
      background: #007bff;
      color: white;
      transform: scale(1.1);
    }

    .auth-modal {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    .auth-box {
      width: 400px;
      height: 300px;
      background: #111;
      border-radius: 10px;
      padding: 20px;
      color: #fff;
      text-align: center;
      box-shadow: 0 0 30px rgba(0,0,0,0.5);
    }

    .auth-box input {
      width: 80%;
      padding: 8px;
      margin: 6px 0;
      border: none;
      border-radius: 5px;
      background: #222;
      color: #fff;
    }

    .auth-box button {
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      margin-top: 8px;
    }

    .auth-box button:hover { background: #0056b3; }
    .hidden { display: none; }
    .switch { font-size: 0.9em; margin-top: 10px; }
  `;
  document.head.appendChild(style);

  // --- Ha be van jelentkezve, átvált profil módba ---
  if (loggedUser) {
    loginBtn.textContent = `👤 ${loggedUser}`;
    loginBtn.classList.remove("login-btn");
    loginBtn.classList.add("profile-btn");

    // Ha rákattint, átirányít a profil oldalra
    loginBtn.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
    return; // itt vége, nem kell login modalt létrehozni
  }

  // === Ha nincs bejelentkezve, akkor login funkció marad ===
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

  // === Modal nyitása / zárása ===
   // --- MODAL NYITÁS/ZÁRÁS ---
  loginBtn.addEventListener("click", () => modal.classList.remove("hidden"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  const loginForm = modal.querySelector("#loginForm");
  const registerForm = modal.querySelector("#registerForm");
  const authTitle = modal.querySelector("#authTitle");

  modal.querySelector("#showRegister").addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    authTitle.textContent = "Register";
  });

  modal.querySelector("#showLogin").addEventListener("click", (e) => {
    e.preventDefault();
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    authTitle.textContent = "Login";
  });

  // --- LOGIN ---
  modal.querySelector("#loginSubmit").addEventListener("click", async () => {
    const username = modal.querySelector("#loginUsername").value.trim();
    const password = modal.querySelector("#loginPassword").value.trim();
    if (!username || !password) return alert("Please fill in all fields.");

    // (Itt most nincs valódi backend, ezért direktben sikeresnek vesszük)
    localStorage.setItem("loggedInUser", username);
    modal.classList.add("hidden");

        // ✅ Gomb frissítése azonnal
         loginBtn.textContent = `👤 Profile`;
    loginBtn.classList.remove("login-btn");
    loginBtn.classList.add("profile-btn");

        // Eltávolítjuk a régi click eseményeket
        const newBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newBtn, loginBtn);

        // Új esemény: profil oldal megnyitása
        newBtn.addEventListener("click", () => {
          window.location.href = "profile.html";
        });

        alert(`✅ Welcome, ${username}!`);
      else {
        alert(data.error || "Login failed.");
      }
    catch (err) {
      console.error("Login error:", err);
      alert("Server error.");
    }
  });

  // === REGISTER ===
  modal.querySelector("#registerSubmit").addEventListener("click", async () => {
    const username = modal.querySelector("#regUsername").value.trim();
    const email = modal.querySelector("#regEmail").value.trim();
    const password = modal.querySelector("#regPassword").value.trim();
    if (!username || !email || !password) return alert("Please fill in all fields.");

    try {
      const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (data.success) {
        alert("Registration successful! Please log in.");
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
  });

  // === Ha már be van jelentkezve, frissítjük a gombot ===
  const againLoggedUser = localStorage.getItem("loggedInUser");
  if (againLoggedUser) {
    loginBtn.textContent = `👤 ${againLoggedUser}`;
  }
});

// === AUTH ELLENŐRZÉS ===
function isLoggedIn() {
  return !!localStorage.getItem("loggedInUser");
}

function requireLogin(actionIfLoggedIn) {
  if (isLoggedIn()) {
    actionIfLoggedIn();
  } else {
    document.querySelector(".login-btn")?.click();
  }
}
