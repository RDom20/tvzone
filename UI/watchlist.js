document.addEventListener("DOMContentLoaded", () => {
  // ---------------------------------------------------------
  // Watchlist interakció gombok kiválasztása
  //   → minden .reaction-btn olyan gomb, ami hozzáadhat a listához
  // ---------------------------------------------------------
  const buttons = document.querySelectorAll(".reaction-btn");

  // ---------------------------------------------------------
  // HOZZÁADÁS A WATCHLISTHEZ
  //   - film/sorozat címe + képe + linkje kinyerése
  //   - elküldés a szervernek (POST /api/watchlist)
  //   - szerver visszajelzés kezelése
  // ---------------------------------------------------------
  buttons.forEach(btn => {
    btn.addEventListener("click", async () => {
      let title, img, link;
      // Ha carousel-ből van kattintva → ott keresi az adatokat
      const item = btn.closest(".carousel-item");
      if (item) {
        title = item.querySelector("h3")?.textContent || "Unknown Title";
        img = item.querySelector("img")?.src || "";
        link = item.querySelector("a")?.href || "";
      } 
      // Ha részletes nézetből van kattintva → details oldalról szedi
      else {
        title = document.getElementById("infoTitle")?.textContent || "Unknown Title";
        img = document.querySelector(".player-wrapper img")?.src || "default-thumbnail.png";
        link = window.location.href;
      }

      // Létrehozza a szervernek küldendő adatcsomagot
      const data = { title, img, link };

      try {
        // Küldi a szervernek a watchlist POST hívást
        const res = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
          alert(`✅ "${title}" hozzáadva a Watchlisthez!`);
        }
        // Ha már benne van
        else {
          alert("⚠️ Már hozzá van adva a listádhoz!");
        }
      } catch (err) {
        console.error("Watchlist hiba:", err);
        alert("❌ Hiba történt a mentés közben!");
      }
    });
  });

  // ---------------------------------------------------------
  // WATCHLIST MEGNYITÁSA
  //   - GET /api/watchlist segítségével lekéri a mentett elemeket
  //   - felugró overlay-ben megjeleníti a listát
  //   - Play gomb → átirányítás a film/sorozat oldalára
  // ---------------------------------------------------------
  const watchlistBtn = document.getElementById("btnWatchList");
  if (watchlistBtn) {
    watchlistBtn.addEventListener("click", async () => {
      try {

        // Lekéri a watchlist jelenlegi tartalmát
        const res = await fetch("/api/watchlist");
        const data = await res.json();

        // Overlay létrehozása (felugró ablak)
        const overlay = document.createElement("div");
        overlay.className = "watchlist-overlay";

        let contentHTML = "";

        // Ha vannak mentett elemek → kirendereli őket
        if (data.length > 0) {
          contentHTML = data.map(item => {
            // Helyi szerveres borítókép elérési út
            const localImg = `http://localhost:3000/covers/${encodeURIComponent(item.title)}.jpg`;

            const genre = item.genre ? item.genre : "";
            const year = item.year ? `• ${item.year}` : "";
            return `
              <div class="watchlist-item">
                <img src="${localImg}" alt="${item.title}" onerror="this.src='default-thumbnail.png'">
                onerror="this.src='default-thumbnail.png'" 
             width="200" height="300">
                <div class="info">
                  <h3>${item.title}</h3>
                  <p>${genre} ${year}</p>
                  <button class="play-btn" data-link="${item.link}">▶ Play</button>
                </div>
              </div>
            `;
          }).join("");
        }

        // Ha üres a watchlist
        else {
          contentHTML = "<p>❌ A listád üres</p>";
        }

        // Felugró ablak HTML felépítése
        overlay.innerHTML = `
          <div class="watchlist-box">
            <h2>📺 My Watchlist</h2>
            <button id="closeWatchlist">✖</button>
            <div class="watchlist-grid">
              ${contentHTML}
            </div>
          </div>
        `;

        document.body.appendChild(overlay);

        // Bezárás gomb
        const closeBtn = overlay.querySelector("#closeWatchlist");
        if (closeBtn) closeBtn.addEventListener("click", () => overlay.remove());

        // Lejátszás gomb
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
});
