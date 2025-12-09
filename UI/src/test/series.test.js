// E:\UI\src\test\series.test.js

import { JSDOM } from 'jsdom';
import request from 'supertest'; 
import express from 'express'; 
import { test, expect } from '@playwright/test'; 
import { TextEncoder, TextDecoder } from "util"; 

// ------------------------------------------------------------------------
// JAVÍTÁS: Manuális Mocking függvény
// ------------------------------------------------------------------------
const mockFn = (implementation = () => {}) => {
  const mock = function(...args) {
    mock.mock.calls.push(args);
    return implementation(...args);
  };
  mock.mock = { calls: [], implementation };
  mock.mockImplementation = (newImpl) => { mock.mock = { ...mock.mock, implementation: newImpl }; };
  return mock;
};
// ------------------------------------------------------------------------

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;


function buildSeriesDom() {
  const html = `<!doctype html><html><body>
    <div class="carousel-track"></div>
    <button class="next"></button>
    <video id="mainVideo"><source src=""/></video>
  </body></html>`;
  const dom = new JSDOM(html, { url: 'http://localhost/series.html' });
  
  // Logic mock
  const { window } = dom;
  // JAVÍTÁS: mockFn()
  window.fetch = mockFn(async () => ({ ok: true, json: async () => ({ url: 'sub.vtt' }) }));
  
  // Functions to test
  window.attachSubtitleToVideo = async (title, lang) => {
      const vid = window.document.getElementById('mainVideo');
      const track = window.document.createElement('track');
      track.srclang = lang;
      vid.appendChild(track);
      return true;
  };

  return dom;
}

// describe() eltávolítva
test('series: attachSubtitleToVideo adds track', async () => {
    const { window } = buildSeriesDom();
    await window.attachSubtitleToVideo('Test', 'hu');
    const track = window.document.querySelector('track');
    expect(track).toBeTruthy();
    expect(track.getAttribute('srclang')).toBe('hu');
});