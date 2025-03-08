const encode_regex = /[\+=\/]/g;
const decode_regex = /[\._\-]/g;

export function base64_encode(text: string) {
  return btoa(text).replace(encode_regex, encodeChar);
}

export function base64_decode(text: string) {
  return atob(text.replace(decode_regex, decodeChar));
}

function encodeChar(c: string) {
  switch (c) {
    case '+': return '.';
    case '=': return '-';
    case '/': return '_';
  }
  return c;
}

function decodeChar(c: string) {
  switch (c) {
    case '.': return '+';
    case '-': return '=';
    case '_': return '/';
  }
  return c;
}
