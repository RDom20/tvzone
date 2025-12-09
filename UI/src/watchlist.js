document.addEventListener("DOMContentLoaded", () => {
  const watchlistBtn = document.getElementById("btnWatchList");
  if (!watchlistBtn) return;

  watchlistBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/watchlist");
      const data = await res.json();

      const overlay = document.createElement("div");
      overlay.className = "watchlist-overlay";
      overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;justify-content:center;align-items:center;z-index:10000;";

      let contentHTML = "";
      if (data.length > 0) {
        contentHTML = data.map(item => `
          <div class="watchlist-item" style="margin:10px;text-align:center;">
            <img src="/covers/${encodeURIComponent(item.title)}.jpg" alt="${item.title}" style="width:180px;height:260px;border-radius:10px;" onerror="this.src='default-thumbnail.png'">
            <h3>${item.title}</h3>
            <button class="play-btn" data-link="${item.link}">▶ Play</button>
          </div>
        `).join("");
      } else {
        contentHTML = "<p>❌ A listád üres</p>";
      }

      overlay.innerHTML = `
        <div class="watchlist-box" style="background:#111;padding:20px;border-radius:10px;width:80%;max-width:1000px;color:#fff;position:relative;">
          <button id="closeWatchlist" style="position:absolute;top:10px;right:10px;font-size:22px;background:none;border:none;color:#fff;cursor:pointer;">✖</button>
          <h2>📺 My Watchlist</h2>
          <div class="watchlist-grid" style="display:flex;flex-wrap:wrap;justify-content:center;">${contentHTML}</div>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.querySelector("#closeWatchlist").addEventListener("click", () => overlay.remove());
      overlay.querySelectorAll(".play-btn").forEach(btn => {
        btn.addEventListener("click", () => window.location.href = btn.dataset.link);
      });
    } catch (err) {
      console.error("Watchlist betöltési hiba:", err);
    }
  });
});
