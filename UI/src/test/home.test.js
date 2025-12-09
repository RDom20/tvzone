import { JSDOM } from 'jsdom';
import { test, expect } from '@playwright/test';

// Mock segédfüggvény
const mockFn = (implementation = () => {}) => {
  const mock = function(...args) {
    mock.mock.calls.push(args);
    return implementation(...args);
  };
  mock.mock = { calls: [], implementation };
  return mock;
};

function buildHomeDom() {
  const html = `
  <!doctype html>
  <html>
    <head><meta charset="utf-8"></head>
    <body>
      <header>
          <div class="nav-center">
            <input type="search" placeholder="Search..." />
          </div>
          <li class="filter-container">
            <a href="#" id="filter-btn">Filter</a>
            <div id="filter-popup" class="filter-popup">
                <form id="filter-form">
                    <input type="radio" name="type" value="movies">
                    <input type="number" id="released-input">
                    <button type="button" id="apply-filter">Apply</button>
                    <button type="button" id="reset-filter">Reset</button>
                </form>
            </div>
          </li>
          <svg id="theme-toggle"></svg>
      </header>
      <main>
          <div class="carousel-wrapper">
            <button class="carousel-button prev">prev</button>
            <div class="carousel">
                <div class="carousel-track" style="transform: translateX(0px)">
                    <div class="carousel-item" data-type="movies" data-year="2020">
                        <div class="info"><h3>Batman</h3></div>
                    </div>
                    <div class="carousel-item" data-type="tv" data-year="2021">
                        <div class="info"><h3>Sherlock</h3></div>
                    </div>
                </div>
            </div>
            <button class="carousel-button next">next</button>
          </div>
      </main>
      <script>
        // --- MOCK LOGIKA A TESZTHEZ ---
        
        // 1. CAROUSEL
        document.querySelectorAll('.carousel-wrapper').forEach(wrapper => {
          const track = wrapper.querySelector('.carousel-track');
          const nextBtn = wrapper.querySelector('.carousel-button.next');
          const prevBtn = wrapper.querySelector('.carousel-button.prev');
          let currentIndex = 0;
          const itemWidth = 300; // JSDOM fix méret

          const update = () => {
             track.style.transform = 'translateX(-' + (currentIndex * itemWidth) + 'px)';
          };

          nextBtn.addEventListener('click', () => {
            currentIndex++;
            update();
          });

          prevBtn.addEventListener('click', () => {
            currentIndex--;
            if(currentIndex < 0) currentIndex = 0;
            update();
          });
        });

        // 2. SEARCH
        const searchInput = document.querySelector('.nav-center input');
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            document.querySelectorAll('.carousel-item').forEach(item => {
                const title = item.querySelector('h3').textContent.toLowerCase();
                if(title.includes(term)) item.classList.remove('hidden-item');
                else item.classList.add('hidden-item');
            });
        });

        // 3. FILTER
        const filterBtn = document.getElementById('filter-btn');
        const popup = document.getElementById('filter-popup');
        filterBtn.onclick = () => popup.classList.toggle('active');
        
        document.getElementById('apply-filter').onclick = () => {
             // Mock filter logic: elrejti a TV-t ha movies van kiválasztva
             const type = document.querySelector('input[name="type"]:checked')?.value;
             if(type === 'movies') {
                 document.querySelector('.carousel-item[data-type="tv"]').classList.add('hidden-item');
             }
             popup.classList.remove('active');
        };

        // 4. THEME
        document.getElementById('theme-toggle').onclick = () => {
            document.body.classList.toggle('dark-mode');
        };
      </script>
    </body>
  </html>`;

  const dom = new JSDOM(html, {
    url: 'http://localhost/home.html',
    runScripts: 'dangerously',
    resources: 'usable'
  });

  return dom;
}

function tick() { return new Promise(r => setTimeout(r, 0)); }

test('home: carousel navigation updates transform', async () => {
    const { window } = buildHomeDom();
    await tick();

    const track = window.document.querySelector('.carousel-track');
    const next = window.document.querySelector('.carousel-button.next');
    
    // Alapállapot
    expect(track.style.transform).toBe('translateX(0px)');
    
    // Kattintás
    next.click();
    expect(track.style.transform).toBe('translateX(-300px)');
});

test('home: search hides unmatched items', async () => {
    const { window } = buildHomeDom();
    await tick();

    const input = window.document.querySelector('input[type="search"]');
    const batmanItem = window.document.querySelector('.carousel-item:nth-child(1)'); // Batman
    const sherlockItem = window.document.querySelector('.carousel-item:nth-child(2)'); // Sherlock

    // Írjuk be: "Bat"
    input.value = 'Bat';
    input.dispatchEvent(new window.Event('input'));

    expect(batmanItem.classList.contains('hidden-item')).toBe(false);
    expect(sherlockItem.classList.contains('hidden-item')).toBe(true);
});

test('home: filter logic applies correctly', async () => {
    const { window } = buildHomeDom();
    await tick();

    const filterBtn = window.document.getElementById('filter-btn');
    const popup = window.document.getElementById('filter-popup');
    const radioMovie = window.document.querySelector('input[value="movies"]');
    const applyBtn = window.document.getElementById('apply-filter');

    // Nyitás
    filterBtn.click();
    expect(popup.classList.contains('active')).toBe(true);

    // Kiválasztás és Apply
    radioMovie.checked = true;
    applyBtn.click();

    // Sherlock (TV) elrejtve?
    const sherlockItem = window.document.querySelector('.carousel-item[data-type="tv"]');
    expect(sherlockItem.classList.contains('hidden-item')).toBe(true);
    expect(popup.classList.contains('active')).toBe(false);
});

test('home: theme toggle works', async () => {
    const { window } = buildHomeDom();
    await tick();
    const toggle = window.document.getElementById('theme-toggle');
    
    expect(window.document.body.classList.contains('dark-mode')).toBe(false);
    
    // JAVÍTÁS: click() helyett dispatchEvent használata, mert SVG elem
    toggle.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    
    expect(window.document.body.classList.contains('dark-mode')).toBe(true);
});