import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { LocalStorageService } from '../shared/local-storage.service';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-page-register',
  templateUrl: './page-register.component.html',
  styleUrls: ['./page-register.component.css']
})
export class PageRegisterComponent implements OnInit {
  formError = '';
  credentials = {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: ''
  };

  constructor(
    private apiService: ApiService,
    private storage: LocalStorageService,
    private router: Router,
    private title: Title) { }

  ngOnInit(): void {
    this.title.setTitle('Register');
  }

  formSubmit() {
    this.formError = '';
    if (
      !this.credentials.first_name ||
      !this.credentials.last_name ||
      !this.credentials.email ||
      !this.credentials.password ||
      !this.credentials.password_confirm
      ) {
        return this.formError = 'All fields are needed';
      }

    const re =
      // tslint:disable-next-line: max-line-length
      new RegExp(/^[a-z0-9!#$%&'&+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9]*[a-z0-9])?/);

    if (!re.test(this.credentials.email)) {
        return this.formError = 'Please enter a valid email address';
      }

    if (this.credentials.password !== this.credentials.password_confirm) {
      return this.formError = 'Password does not match';
    }
    this.register();
  }

  private register() {
    const requestOption = {
      method: 'POST',
      location: 'users/register',
      body: this.credentials
    };

    this.apiService.makeRequest(requestOption).then(result => {
      if (result.token) {
        this.storage.setToken(result.token);
        this.router.navigate(['/']);
        return;
      }
      if (result.message) {
        this.formError = result.message;
      }
    });
  }

}
