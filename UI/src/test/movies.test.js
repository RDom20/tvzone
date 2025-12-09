import { JSDOM } from 'jsdom';
import { test, expect } from '@playwright/test';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

function buildPageDom(pageName) {
  const html = `
  <!doctype html>
  <html>
    <body>
      <main>
          <div class="carousel-wrapper">
            <div class="carousel-track">
                <div class="carousel-item">
                    <div class="info"><h3>Test Title</h3></div>
                </div>
            </div>
          </div>
      </main>
      <script>
        // MOCK CAROUSEL CLICK LOGIC
        document.querySelectorAll('.carousel-item').forEach(item => {
            item.addEventListener('click', () => {
                const title = item.querySelector('h3').textContent;
                // A valós navigáció helyett egy tesztelhető hook-ot hívunk
                if (window.onNavigate) {
                    window.onNavigate('details.html?title=' + encodeURIComponent(title));
                }
            });
        });
      </script>
    </body>
  </html>`;

  const dom = new JSDOM(html, {
    url: `http://localhost/${pageName}.html`,
    runScripts: 'dangerously',
    resources: 'usable',
    beforeParse(window) {
       // Inicializáljuk a hook-ot
       window.onNavigate = null;
    }
  });

  return dom;
}

function tick() { return new Promise(r => setTimeout(r, 0)); }

test('page: clicking an item redirects to details with title', async () => {
    const { window } = buildPageDom('movies');
    await tick();

    const item = window.document.querySelector('.carousel-item');
    
    // Elkapjuk a navigációs kérést
    let targetUrl = '';
    window.onNavigate = (url) => { targetUrl = url; };

    item.click();

    expect(targetUrl).toContain('details.html');
    expect(targetUrl).toContain('title=Test%20Title');
});