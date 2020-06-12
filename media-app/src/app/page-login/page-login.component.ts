import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { LocalStorageService } from '../shared/local-storage.service';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-page-login',
  templateUrl: './page-login.component.html',
  styleUrls: ['./page-login.component.css']
})
export class PageLoginComponent implements OnInit {
  formError = '';
  loginForm;

credentials = {
    email: '',
    password: ''
  };
  constructor(
    private apiService: ApiService,
    private storage: LocalStorageService,
    private router: Router,
    private title: Title) {}

  ngOnInit() {
    this.title.setTitle('Login');
  }

  formSubmit() {
    this.formError = '';
    if (!this.credentials.email || !this.credentials.password) {
      return this.formError = 'All fields are required';
    }
    this.login();
  }

  private login() {
    const requestOptions = {
      method: 'POST',
      location: 'users/login',
      body: this.credentials
    };
    this.apiService.makeRequest(requestOptions).then(user => {
      if (user.token) {
        console.log(user.token);
        this.storage.setToken(user.token);
        this.router.navigate(['/']);
        return;
      }
      if (user.message) {
        this.formError = user.message;
      }
    });
  }

}
