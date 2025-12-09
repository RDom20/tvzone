// jest.config.js
module.exports = {
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/setupTests.js"],
  testMatch: [
    "**/test/**/*.test.js",
    "**/?(*.)+(spec|test).js"
  ],
  testPathIgnorePatterns: ["/node_modules/"]
};
