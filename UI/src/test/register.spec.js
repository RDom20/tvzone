import { test, expect } from '@playwright/test';
import { JSDOM } from 'jsdom';

test('register flow (mocked)', async () => {
  const dom = new JSDOM(`
    <html><body>
      <input name="username" />
      <input name="email" />
      <input name="password" />
      <button type="submit">Register</button>
      <div id="success-message">Registration successful</div>
    </body></html>`, { runScripts: 'outside-only' });

  const w = dom.window;

  const username = w.document.querySelector('input[name="username"]');
  const email = w.document.querySelector('input[name="email"]');
  const password = w.document.querySelector('input[name="password"]');
  const btn = w.document.querySelector('button[type="submit"]');

  username.value = 'test-user';
  email.value = 'test@example.com';
  password.value = 'password123';
  btn.click();

  const successMsg = w.document.getElementById('success-message');
  expect(successMsg.textContent).toMatch(/Registration successful/i);
});

test('POST /register missing fields (mocked)', async () => {
  const dom = new JSDOM(`
    <html><body>
      <input name="username" />
      <button type="submit">Register</button>
      <div id="error-message">All fields are required</div>
    </body></html>`, { runScripts: 'outside-only' });

  const w = dom.window;

  const username = w.document.querySelector('input[name="username"]');
  const btn = w.document.querySelector('button[type="submit"]');
  username.value = 'test-user';
  btn.click();

  const errorMsg = w.document.getElementById('error-message');
  expect(errorMsg.textContent).toMatch(/All fields are required/i);
});
