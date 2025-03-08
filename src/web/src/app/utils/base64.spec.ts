import { TestBed } from '@angular/core/testing';

import { base64_encode, base64_decode } from './base64';

describe('Base64', () => {
  it('should convert Unicode string to URL-safe base64', () => {
    const input = 'Hello, world!';
    const expectedOutput = 'SGVsbG8sIHdvcmxkIQ==';
    const result = base64_encode(input);
    expect(result).toBe(expectedOutput);
  });

  it('should convert URL-safe base64 to Unicode string', () => {
    const input = 'SGVsbG8sIHdvcmxkIQ==';
    const expectedOutput = 'Hello, world!';
    const result = base64_decode(input);
    expect(result).toBe(expectedOutput);
  });
});
