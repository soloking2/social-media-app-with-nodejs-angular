import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../shared/auth.service';
import { Router } from '@angular/router';
import { LocalStorageService } from '../shared/local-storage.service';
import { AlertsService } from '../shared/alerts.service';
import { Subscription } from 'rxjs';
import { ApiService } from '../shared/api.service';
import { UserDataService } from '../shared/user-data.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit, OnDestroy {
  query = '';
  userName;
  showMessage = '';
  userId = this.storage.getParsedToken()._id;

  alerts = [];

  messagePreviews = [];
  notifications = {
    alerts: 0,
    friendRequests: 0,
    messages: 0,
  };

  private alertSub: Subscription;
  private friendRequestsSub: Subscription;
  private userSub: Subscription;
  private updateEventSub: Subscription;
  private resetSub: Subscription;

  profilePicture = 'default-avatar';
  sendMessageObject = {
    id: '',
    name: '',
    content: ''
  };

  constructor(private authService: AuthService,
              private router: Router,
              private storage: LocalStorageService,
              private alertService: AlertsService,
              private apiService: ApiService,
              private userDataService: UserDataService) { }

  ngOnInit(): void {
    this.userName = this.storage.getParsedToken().name;
    this.alertSub = this.alertService.onAlertEvent.subscribe((msg) => {
      this.showMessage = msg;
    });
    this.friendRequestsSub = this.alertService.updateFriendRequestsEvent.subscribe((msg) => {
      this.notifications.friendRequests--;
    });
    this.userSub = this.userDataService.getUserData.subscribe(userData => {
      this.notifications.alerts = userData.new_notifications;
      this.notifications.messages = userData.new_message_notifications.length;
      this.profilePicture = userData.profile_image;
      this.notifications.friendRequests = userData.friend_requests.length;

      this.setMessagePreviews(userData.messages, userData.new_message_notifications);
      this.setAlerts(userData.notifications);
    });

    this.updateEventSub = this.alertService.sendMessageDetailsEvent.subscribe(d => {
      this.sendMessageObject.id = d.id;
      this.sendMessageObject.name = d.name;
    });

    this.resetSub = this.alertService.resetMessageNotifications.subscribe((msg) => {
      this.notifications.messages = 0;
      this.notifications.alerts = 0;
    });

    const requestOption =  {
      location: `users/get-user-data/${this.userId}`,
      method: 'GET'
    };

    this.apiService.makeRequest(requestOption).then(val => {
      if (val.status === 404) {return this.authService.isLogOut(); }

      if (val.statusCode === 200) {
        this.userDataService.getUserData.emit(val.user);

      }
    });
  }

  logout() {
    this.authService.isLogOut();
    this.router.navigate(['/login']);
  }

  searchForFriends() {
    this.router.navigate(['/search-results', {query: this.query}]);
  }

  sendMessage() {
    this.apiService.sendMessage(this.sendMessageObject);
    this.sendMessageObject.content = '';
  }

  resetMessage() {
    if (this.notifications.messages === 0) {return; }
    this.apiService.resetMessageNotifications();
  }

  resetAlert() {
    if (this.notifications.alerts === 0) {return; }
    this.apiService.resetAlertnotifications();
  }

  private setMessagePreviews(messages, messageNotifications) {
    for (let i = messages.length - 1; i >= 0; i--) {
      // tslint:disable-next-line: prefer-const
      let lastMessage = messages[i].content[messages[i].content.length - 1];

      // tslint:disable-next-line: prefer-const
      let preview = {
        messengerName: messages[i].messengerName,
        messageContent: lastMessage.message,
        messengerImage: '',
        messengerId: messages[i].form_id,
        isNew: false
      };

      if (lastMessage.messenger === this.userId) {
        preview.messengerImage = this.profilePicture;
      } else {
        preview.messengerImage = messages[i].messengerProfileImage;

        if (messageNotifications.includes(messages[i].form_id)) {
          preview.isNew = true;
        }
      }

      if (preview.isNew) {
        this.messagePreviews.unshift(preview);
      } else {
        this.messagePreviews.push(preview);
      }
    }
  }

  messageLink(messageId) {
    this.router.navigate(['/messages'], {state: {data: {msgId: messageId}}});
  }

  private setAlerts(notificationData) {
    for (const alert of notificationData) {
      const alertObj = JSON.parse(alert);

      const newAlert = {
        text: alertObj.alert_text,
        icon: '',
        bgColor: '',
        href: ''
      };

      switch (alertObj.alert_type) {
        case 'new_friend':
          newAlert.icon = 'fa-user-check';
          newAlert.bgColor = 'bg-success';
          newAlert.href = `/profile/${alertObj.from_id}`;
          break;
        case 'liked_post':
          newAlert.icon = 'fa-thumbs-up';
          newAlert.bgColor = 'bg-purple';
          newAlert.href = `/profile/${this.userId}`;
          break;
        case 'commented_post':
          newAlert.icon = 'fa-comment';
          newAlert.bgColor = 'bg-primary';
          newAlert.href = `/profile/${this.userId}`;
          break;
      }

      this.alerts.push(newAlert);
    }

  }

  ngOnDestroy() {
    this.alertSub.unsubscribe();
    if (this.friendRequestsSub) {
      this.friendRequestsSub.unsubscribe();
    }

    if (this.userSub) {
      this.userSub.unsubscribe();
    }

    if (this.updateEventSub) {
      this.updateEventSub.unsubscribe();
    }

    if (this.resetSub) {
      this.resetSub.unsubscribe();
    }
  }

}
