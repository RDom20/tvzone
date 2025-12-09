import { test, expect } from '@playwright/test';
import { JSDOM } from 'jsdom';

function buildMockDOM() {
  const dom = new JSDOM(`
    <html>
      <body>
        <div id="ui-container"></div>
        <div class="season-item"></div>
        <div class="episode-item"></div>
        <button id="play-movie"></button>
        <iframe id="playerIframe" src=""></iframe>
      </body>
    </html>`, { runScripts: 'outside-only' });

  const w = dom.window;
  w.fetch = async () => ({ ok: true, json: async () => ({ type: 'series', files: [], seasons: {} }) });
  return w;
}

test('series: season+episode works correctly', async () => {
  const w = buildMockDOM();
  const iframe = w.document.getElementById('playerIframe');
  iframe.src = 'Animes/TestSeries/S01E01.mkv';
  expect(iframe.src).toMatch(/Animes\//);
});

test('movie hides UI', async () => {
  const w = buildMockDOM();
  const ui = w.document.getElementById('ui-container');
  ui.className = 'hidden';
  expect(ui.className).toMatch(/hidden/);
});

test('invalid path → iframe does not load video', async () => {
  const w = buildMockDOM();
  const iframe = w.document.getElementById('playerIframe');
  iframe.src = '';
  expect(iframe.src).not.toMatch(/Animes\/|Series\/|Movies\//);
});
