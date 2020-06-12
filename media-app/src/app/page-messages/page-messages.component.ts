import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiService } from '../shared/api.service';
import { UserDataService } from '../shared/user-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-page-messages',
  templateUrl: './page-messages.component.html',
  styleUrls: ['./page-messages.component.css']
})
export class PageMessagesComponent implements OnInit, OnDestroy {
  messages = [];
  usersProfileImage = 'default-avatar';
  userName = '';
  userId = '';
  private userSub: Subscription;
  constructor(private title: Title,
              private apiService: ApiService,
              private userDataService: UserDataService) { }

  activeMessages = {
    fromId: '',
    fromName: '',
    fromProfilePicture: '',
    messagesGroup: []

  };

  newMessage = '';
  ngOnInit(): void {
    this.title.setTitle('Messages');
    this.apiService.resetMessageNotifications();

    if (history.state.data && history.state.data.msgId) {
      this.activeMessages.fromId = history.state.data.msgId;
    }

    this.userDataService.getUserData.subscribe(user => {
      if (!user.messages.length) {return; }
      this.activeMessages.fromId = this.activeMessages.fromId || user.messages[0].form_id;
      this.messages = user.messages.reverse();
      this.userName = user.name;
      this.userId = user._id;
      this.usersProfileImage = user.profile_image;
      this.setActiveMessage(this.activeMessages.fromId);
    });
  }

  setActiveMessage(id) {
    for (const message of this.messages) {
      if (message.form_id === id) {
        this.activeMessages.fromId = message.form_id;
        this.activeMessages.fromName = message.messengerName;
        this.activeMessages.fromProfilePicture = message.messengerProfileImage;

        const groups = (this.activeMessages.messagesGroup = []);

        for (const content of message.content) {
          const me = (content.messenger === this.userId);

          if (groups.length) {
            const lastMessagerId = groups[groups.length - 1].id;

            if (content.messenger === lastMessagerId) {
              groups[groups.length - 1].messages.push(content.message);
              continue;
            }
          }

          const group = {
            image: me ? this.usersProfileImage : message.messengerProfileImage,
            name: me ? 'Me' : message.messengerName,
            id: content.messenger,
            messages: [content.message],
            isMe: me
          };

          groups.push(group);
        }
      }
    }
  }

  sendMessage() {
    if (!this.newMessage) {return; }

    const obj = {
      content: this.newMessage,
      id: this.activeMessages.fromId
    };



    this.apiService.sendMessage(obj, false).then((val: any) => {
      if (val.statusCode === 201) {
        const groups = this.activeMessages.messagesGroup;
        if (groups[groups.length - 1].isMe) {
          groups[groups.length - 1].messages.push(this.newMessage);
        } else {
          const newGroup = {
            image: this.usersProfileImage,
            name: this.userName,
            id: this.userId,
            messages: [this.newMessage],
            isMe: true
          };

          groups.push(newGroup);
        }

        for (const message of this.messages) {
          if (message.form_id === this.activeMessages.fromId) {
            const content = {
              message: this.newMessage,
              messenger: this.userId
            };
          }
        }
        this.newMessage = '';

      }

    });
  }

  deleteMessage(msgId) {

    const deleteOptions = {
      method: 'POST',
      location: `users/delete-message/${msgId}`
    };

    this.apiService.makeRequest(deleteOptions).then((val) => {
      if (val.statusCode === 201) {
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < this.messages.length; i++) {
          if (this.messages[i]._id === msgId) {
            this.messages.splice(i, 1);
            if (!this.messages.length) {return; }
            this.setActiveMessage(this.messages[0].form_id);
            break;
          }
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
