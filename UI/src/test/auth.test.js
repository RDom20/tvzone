import { test, expect } from '@playwright/test';
import request from 'supertest'; 
import express from 'express'; 

const app = express();
app.use(express.json());

app.post("/register", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }
  return res.json({ success: true });
});

test("auth: POST /register happy path", async () => {
  const res = await request(app).post("/register").send({
    username: "domi",
    email: "domi@example.com",
    password: "1234"
  });
  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
});

test("auth: POST /register missing fields", async () => {
  const res = await request(app).post("/register").send({
    username: "domi"
  });
  expect(res.statusCode).toBe(400);
});