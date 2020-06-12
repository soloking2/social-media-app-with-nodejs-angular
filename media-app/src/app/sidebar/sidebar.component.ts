import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../shared/auth.service';
import { Router } from '@angular/router';
import { UserDataService } from '../shared/user-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
userData = {};
userid;
besties = [];
enemies = [];
private userSub: Subscription;
  constructor(private authService: AuthService,
              private router: Router,
              private userDataService: UserDataService) { }

ngOnInit(): void {
  this.userSub = this.userDataService.getUserData.subscribe((data) => {
    this.userData = data;
    this.userid = data._id;
    this.besties = data.besties;
    this.enemies = data.enemies;
  });
}

logout() {
this.authService.isLogOut();
this.router.navigate(['/login']);
}

ngOnDestroy() {
  if (this.userSub) {
    this.userSub.unsubscribe();
  }
}

}
