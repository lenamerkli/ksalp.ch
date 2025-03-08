import {base64_decode, base64_encode} from "../utils/base64";

const decoder = new TextDecoder('utf-8');

export class AuthToken {
  url: string;
  secret: string;
  redirect: string;

  constructor(public token: string) {
    const tokenParts = token.split('.');
    this.url = base64_decode(tokenParts[0]);
    this.secret = tokenParts[1];
    this.redirect = base64_decode(tokenParts[2]);
  }

  getUrl(): string {
    return this.url;
  }

  getSecret(): string {
    return this.secret;
  }

  getRedirect(): string {
    return this.redirect;
  }

  getPreviewUrl(): string {
    const url = new URL(this.url);
    return url.hostname;
  }
}
