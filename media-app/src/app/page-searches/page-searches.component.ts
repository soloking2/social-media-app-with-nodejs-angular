import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { UserDataService } from '../shared/user-data.service';

@Component({
  selector: 'app-page-searches',
  templateUrl: './page-searches.component.html',
  styleUrls: ['./page-searches.component.css']
})
export class PageSearchesComponent implements OnInit, OnDestroy {

  constructor(private apiService: ApiService,
              private route: ActivatedRoute,
              private title: Title,
              @Inject(DOCUMENT) private document: Document,
              private userDataService: UserDataService) { }

query = this.route.snapshot.params.query;
results = [];
private searchSub: Subscription;
private user;
private userSub: Subscription;

ngOnInit(): void {
  this.document.getElementById('sidebarToggleTop').classList.add('d-none');
  this.title.setTitle('Search Friends');
  this.userSub = this.userDataService.getUserData.subscribe(userData => {
  this.searchSub = this.route.params.subscribe(
    params => {
      this.query = params.query;
      this.user = userData;
      this.searchResults();
        });
    }
    );
}

private searchResults() {
  const requestOptions = {
    method: 'GET',
    location: `users/search-results?query=${this.query}`
    };

  this.apiService.makeRequest(requestOptions).then(val => {
    this.results = val.results;

    for (const result of this.results) {
      if (result.friends.includes(this.user._id)) {
        result.isFriend = true;
      }

      if (result.friend_requests.includes(this.user._id)) {
        result.haveSentFriendRequest = true;
      }

      if (this.user.friend_requests.includes(result._id)) {
        result.haveReceivedFriendRequest = true;
      }
    }
    });
}

ngOnDestroy(): void {
  this.searchSub.unsubscribe();
  if (this.userSub) {
    this.userSub.unsubscribe();
  }
}



}
