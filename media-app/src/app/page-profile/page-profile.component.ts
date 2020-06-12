import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { ApiService } from '../shared/api.service';
import { UserDataService } from '../shared/user-data.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlertsService } from '../shared/alerts.service';

@Component({
  selector: 'app-page-profile',
  templateUrl: './page-profile.component.html',
  styleUrls: ['./page-profile.component.css']
})
export class PageProfileComponent implements OnInit, OnDestroy {
  randomFriends = '';
  totalFriends = 0;
  posts: object[] = [];
  userName: string;
  userEmail: string;
  profilePicture = 'default-avatar';
  showPosts = 6;
  haveSentFriendRequest = false;
  haveReceivedFriendRequest = false;
  canAddUser = false;
  canSendMessage = false;
  usersId = '';

  isBestie  = false;
  isEnemy = false;
  maxAmountOfBesties = false;

  private besties = [];
  private enemies = [];


  private userSub: Subscription;

  constructor(private title: Title,
              @Inject(DOCUMENT) private document: Document,
              private apiService: ApiService,
              private userDataService: UserDataService,
              private route: ActivatedRoute,
              private alertService: AlertsService) { }

  ngOnInit(): void {
    this.title.setTitle('Profile');
    this.document.getElementById('sidebarToggleTop').classList.add('d-none');

    this.userSub = this.userDataService.getUserData.subscribe((user) => {
      this.besties = user.besties;
      this.enemies = user.enemies;

      this.route.params.subscribe((params) => {
        this.showPosts = 6;
        this.isBestie = user.besties.some(v => v._id === params.userid);
        this.isEnemy = user.enemies.some(v => v._id === params.userid);

        this.maxAmountOfBesties = user.besties.length >= 2;
        if (user._id === params.userid) {
          this.getUserDetails(user);
          this.resetBoolean();
        } else {
          this.canSendMessage = true;
          const requestOptions = {
            location: `users/get-user-data/${params.userid}`,
            method: 'GET'
          };

          this.apiService.makeRequest(requestOptions).then((value) => {
            if (value.statusCode === 200) {
              this.canAddUser = user.friends.includes(value.user._id) ? false : true;
              this.haveReceivedFriendRequest = user.friend_requests.includes(value.user._id) ? true : false;
              this.haveSentFriendRequest = value.user.friend_requests.includes(user._id) ? true : false;

              if (this.canAddUser) {
                this.showPosts = 0;
              }
              this.getUserDetails(value.user);

            }
          });
        }
      });
});

  }

  getUserDetails(user) {
    this.profilePicture = user.profile_image;
    this.userName = user.name;
    this.userEmail = user.email;
    this.randomFriends = user.random_friends;
    this.posts = user.posts;
    this.totalFriends = user.friends.length;
    this.usersId = user._id;
  }

  showMorePosts() {
    this.showPosts += 6;
  }

  backtoTop() {
    this.document.body.scrollTop = this.document.documentElement.scrollTop = 0;
  }

  acceptFriendRequest() {
    this.apiService.resolveFriendRequest('accept', this.usersId).then((val) => {
      this.haveReceivedFriendRequest = false;
      this.canAddUser = false;
      this.canSendMessage = true;
      this.totalFriends++;
      this.showPosts = 6;
    });

  }

  declineFriendRequest() {
    this.apiService.resolveFriendRequest('decline', this.usersId).then((val) => {
      this.haveReceivedFriendRequest = false;
    });
  }

  makeFriendRequest() {
    this.apiService.makeFriendRequest(this.usersId).then((val) => {
      this.haveSentFriendRequest = true;
      this.canAddUser = false;
    });
  }

  private resetBoolean() {
    this.canAddUser = false;
    this.canSendMessage = false;
    this.haveReceivedFriendRequest = false;
    this.haveSentFriendRequest = false;
    this.isBestie = false;
    this.isEnemy = false;
    this.maxAmountOfBesties = false;
  }

  updateSendMessage(id, name) {
    this.alertService.sendMessageDetailsEvent.emit({id, name});
  }

  toggleRequest(toggle) {

    function toggleValue(array) {
      for (let i = 0; i < array.length; i++) {
        if (array[i]._id === this.usersId) {
          return array.splice(i, 1);
        }
      }
      array.push({ _id: this.usersId});
    }
    const toggleRequest = {
      location: `users/bestie-enemy-toggle/${this.usersId}?toggle=${toggle}`,
      method: 'POST'
    };

    this.apiService.makeRequest(toggleRequest).then((val) => {
      if (val.statusCode === 201) {
        if (toggle === 'besties') {
        toggleValue.call(this, this.besties);

        this.maxAmountOfBesties = this.besties.length >= 2;
        this.isBestie = !this.isBestie;

        } else {
          toggleValue.call(this, this.enemies);
          this.isEnemy = !this.isEnemy;
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }
}
