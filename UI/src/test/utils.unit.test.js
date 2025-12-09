// E:\UI\src\test\utils.unit.test.js

import { test, expect } from '@playwright/test';
import { formatTime, safeParseJson } from '../lib/utils.js'; 

// describe() eltávolítva
test('utils: formatTime formats seconds correctly', () => {
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(3661)).toBe('61:01');
});

test('utils: safeParseJson returns fallback on invalid json', () => {
    expect(safeParseJson('{"a":1}')).toEqual({ a: 1 });
    expect(safeParseJson('not json', { ok: true })).toEqual({ ok: true });
    expect(safeParseJson(null, 'x')).toBe('x');
});