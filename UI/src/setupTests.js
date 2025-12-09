// setupTests.js
// Ez fut minden teszt előtt: biztosítja a TextEncoder/TextDecoder globálisokat
const { TextEncoder, TextDecoder } = require("util");

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
