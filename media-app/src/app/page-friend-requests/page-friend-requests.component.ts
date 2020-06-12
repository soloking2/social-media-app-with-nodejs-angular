import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UserDataService } from '../shared/user-data.service';
import { ApiService } from '../shared/api.service';
import { Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-page-friend-requests',
  templateUrl: './page-friend-requests.component.html',
  styleUrls: ['./page-friend-requests.component.css']
})
export class PageFriendRequestsComponent implements OnInit, OnDestroy {

  userData: object = {};
  friendRequests = [];
  private userSub: Subscription;

  constructor(private userDataService: UserDataService,
              private apiService: ApiService,
              private title: Title,
              @Inject(DOCUMENT) private document: Document) { }

  ngOnInit(): void {
    this.document.getElementById('sidebarToggleTop').classList.add('d-none');
    this.title.setTitle('Friend Requests');
    this.userSub = this.userDataService.getUserData.subscribe(data => {
      this.userData = data;
      this.requestOptions(data);

    });

  }

  private requestOptions(data) {
    const friends = JSON.stringify(data.friend_requests);
    const request = {
      location: `users/get-friend-request?friend_requests=${friends}`,
      method: 'GET'
    };

    this.apiService.makeRequest(request).then(val => {
      if (val.statusCode === 200) {
        this.friendRequests = val.users;
      }
    });
  }

  updateFriendRequest(id) {
    const arr = this.friendRequests;

    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < arr.length; i++) {
      if (arr[i]._id === id) {
        arr.splice(i, 1);
        break;
      }
    }
  }

  ngOnDestroy() {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

}
