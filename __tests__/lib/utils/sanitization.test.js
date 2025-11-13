/**
 * Tests for sanitization utilities
 */

import {
  sanitizeInput,
  sanitizeTextArea,
  escapeHtml,
  sanitizeUuid,
  sanitizeEmail
} from '../../../lib/utils/sanitization';

describe('sanitizeInput', () => {
  test('trims whitespace', () => {
    expect(sanitizeInput('  hello  ', 100)).toBe('hello');
  });

  test('removes null bytes', () => {
    expect(sanitizeInput('hello\x00world', 100)).toBe('helloworld');
  });

  test('removes control characters', () => {
    expect(sanitizeInput('hello\x01world', 100)).toBe('helloworld');
  });

  test('enforces max length', () => {
    const longString = 'a'.repeat(200);
    expect(sanitizeInput(longString, 100)).toHaveLength(100);
  });

  test('handles empty string', () => {
    expect(sanitizeInput('', 100)).toBe('');
  });

  test('handles null input', () => {
    expect(sanitizeInput(null, 100)).toBe('');
  });

  test('handles undefined input', () => {
    expect(sanitizeInput(undefined, 100)).toBe('');
  });

  test('handles non-string input', () => {
    expect(sanitizeInput(123, 100)).toBe('');
    expect(sanitizeInput({}, 100)).toBe('');
    expect(sanitizeInput([], 100)).toBe('');
  });

  test('preserves valid characters', () => {
    const valid = 'Hello World 123!';
    expect(sanitizeInput(valid, 100)).toBe(valid);
  });
});

describe('sanitizeTextArea', () => {
  test('trims whitespace', () => {
    expect(sanitizeTextArea('  hello\nworld  ', 100)).toBe('hello\nworld');
  });

  test('preserves newlines', () => {
    const text = 'line1\nline2\nline3';
    expect(sanitizeTextArea(text, 100)).toBe(text);
  });

  test('normalizes line endings', () => {
    expect(sanitizeTextArea('line1\r\nline2\rline3', 100)).toBe('line1\nline2\nline3');
  });

  test('enforces max length', () => {
    const longString = 'a'.repeat(1000);
    expect(sanitizeTextArea(longString, 500)).toHaveLength(500);
  });

  test('handles empty string', () => {
    expect(sanitizeTextArea('', 100)).toBe('');
  });

  test('handles null input', () => {
    expect(sanitizeTextArea(null, 100)).toBe('');
  });
});

describe('escapeHtml', () => {
  test('escapes ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  test('escapes less than', () => {
    expect(escapeHtml('5 < 10')).toBe('5 &lt; 10');
  });

  test('escapes greater than', () => {
    expect(escapeHtml('10 > 5')).toBe('10 &gt; 5');
  });

  test('escapes quotes', () => {
    expect(escapeHtml('Say "hello"')).toBe('Say &quot;hello&quot;');
  });

  test('escapes apostrophes', () => {
    expect(escapeHtml("It's mine")).toBe('It&#x27;s mine');
  });

  test('escapes forward slashes', () => {
    expect(escapeHtml('a/b/c')).toBe('a&#x2F;b&#x2F;c');
  });

  test('escapes all special characters', () => {
    expect(escapeHtml('<script>"test"</script>')).toBe('&lt;script&gt;&quot;test&quot;&lt;&#x2F;script&gt;');
  });

  test('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  test('handles null input', () => {
    expect(escapeHtml(null)).toBe('');
  });
});

describe('sanitizeUuid', () => {
  test('validates valid UUID', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    expect(sanitizeUuid(uuid)).toBe(uuid);
  });

  test('converts to lowercase', () => {
    const uuid = '123E4567-E89B-12D3-A456-426614174000';
    expect(sanitizeUuid(uuid)).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  test('trims whitespace', () => {
    const uuid = '  123e4567-e89b-12d3-a456-426614174000  ';
    expect(sanitizeUuid(uuid)).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  test('rejects invalid UUID format', () => {
    expect(sanitizeUuid('invalid-uuid')).toBeNull();
    expect(sanitizeUuid('123e4567')).toBeNull();
    expect(sanitizeUuid('not-a-uuid-at-all')).toBeNull();
  });

  test('handles null input', () => {
    expect(sanitizeUuid(null)).toBeNull();
  });

  test('handles undefined input', () => {
    expect(sanitizeUuid(undefined)).toBeNull();
  });

  test('handles non-string input', () => {
    expect(sanitizeUuid(123)).toBeNull();
    expect(sanitizeUuid({})).toBeNull();
  });
});

describe('sanitizeEmail', () => {
  test('validates valid email', () => {
    expect(sanitizeEmail('test@example.com')).toBe('test@example.com');
  });

  test('converts to lowercase', () => {
    expect(sanitizeEmail('Test@EXAMPLE.COM')).toBe('test@example.com');
  });

  test('trims whitespace', () => {
    expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
  });

  test('rejects invalid email format', () => {
    expect(sanitizeEmail('invalid-email')).toBeNull();
    expect(sanitizeEmail('missing-at-sign.com')).toBeNull();
    expect(sanitizeEmail('@no-local-part.com')).toBeNull();
    expect(sanitizeEmail('no-domain@')).toBeNull();
  });

  test('enforces max length', () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    expect(sanitizeEmail(longEmail)).toBeNull();
  });

  test('handles null input', () => {
    expect(sanitizeEmail(null)).toBeNull();
  });

  test('handles undefined input', () => {
    expect(sanitizeEmail(undefined)).toBeNull();
  });
});

