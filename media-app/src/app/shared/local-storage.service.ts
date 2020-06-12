import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }
  tokenName = '--token-ASM-PROD';
  postThemeName = '--post-theme-PROD';

  set(key, value) {
    if ( localStorage) {
      localStorage.setItem(key, value);
    } else {
      alert('Browser does not support the localStorage API');
    }
  }

  get(key) {
    if (localStorage) {
      if (key in localStorage) {
        return localStorage.getItem(key);
      }
    } else {
      alert('Browser does not support the localStorage API');
    }
  }

  setToken(token) {
    this.set(this.tokenName, token);
  }

  getToken() {
    return this.get(this.tokenName);
  }

  removeToken() {
    localStorage.removeItem(this.tokenName);
  }

  getParsedToken() {
    const token = this.getToken();

    return JSON.parse(atob(token.split('.')[1]));
  }

  setPostTheme(theme) {
    this.set(this.postThemeName, theme);
  }

  getPostTheme() {
    return this.get(this.postThemeName);
  }

}
