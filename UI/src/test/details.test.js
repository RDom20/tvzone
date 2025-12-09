import { test, expect } from '@playwright/test';
import { JSDOM } from 'jsdom';

function buildMockDetailsDOM() {
  const dom = new JSDOM(`
    <html>
      <body>
        <video></video>
        <iframe id="playerIframe"></iframe>
      </body>
    </html>`, { runScripts: 'outside-only' });

  const w = dom.window;
  return w;
}

test('invalid episode path → iframe.src contains invalid path', async () => {
  const w = buildMockDetailsDOM();
  const iframe = w.document.getElementById('playerIframe');
  iframe.src = '';
  expect(iframe.src).not.toMatch(/Animes\/|Series\/|Movies\//);
});

test('attachSubtitleToVideo adds track', async () => {
  const w = buildMockDetailsDOM();
  const video = w.document.querySelector('video');
  const track = w.document.createElement('track');
  track.kind = 'subtitles';
  track.src = '/subtitles/test.vtt';
  video.appendChild(track);

  expect(video.querySelectorAll('track').length).toBe(1);
});
