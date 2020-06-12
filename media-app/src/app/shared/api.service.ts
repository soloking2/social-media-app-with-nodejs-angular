import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LocalStorageService } from './local-storage.service';
import { AlertsService } from './alerts.service';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ApiService {
// private sub = new Subject<string>();
// alertChange = this.sub.asObservable();
private baseUrl = environment.baseUrl;
  constructor(private http: HttpClient,
              private storage: LocalStorageService,
              private alertService: AlertsService) { }

  private successHandler(value) {
    return value;
  }

  private errorHandler(error) {
    return error;
  }

  public makeRequest(requestObject): any {
    const method = requestObject.method.toLowerCase();
    if (!method) {
      return console.log('No type specified in the request object');
    }


    const body = requestObject.body || {};
    const location = requestObject.location;
    if (!location) {
      return console.log('No location specified in the request object');
    }

    const url = `${this.baseUrl}/${location}`;

    let httpOptions = {};

    if (this.storage.getParsedToken) {
      httpOptions = {
        headers: new HttpHeaders({
          Authorization: `Bearer ${this.storage.getToken()}`
        })
      };
    }

    if (method === 'get') {
      return this.http.get(url, httpOptions).toPromise()
      .then(this.successHandler)
      .catch(this.errorHandler);
    }

    if (method === 'post') {
      return this.http.post(url, body, httpOptions).toPromise()
      .then(this.successHandler)
      .catch(this.errorHandler);
    }

    console.log('Could not make the request. Make sure a type of GET or POST is supplied.');
  }

  makeFriendRequest(to: string) {
    const from = this.storage.getParsedToken()._id;

    const requestOptions = {
      location: `users/send-friend-request/${from}/${to}`,
      method: 'POST'
    };

    return new Promise((resolve, reject) => {
      this.makeRequest(requestOptions).then(val => {
       if (val.statusCode === 201) {
         this.alertService.onAlertEvent.emit('Friend request sent successfully');

       } else {
        this.alertService.onAlertEvent.emit('Something went wrong. Perhaps you have sent a friend request already');
       }
       resolve(val);
      });

    });
  }

  resolveFriendRequest(resolution, id) {
    const to = this.storage.getParsedToken()._id;

    return new Promise((resolve, reject) => {
      const requestOptions = {
        location: `users/resolve-friend-request/${id}/${to}?resolution=${resolution}`,
        method: 'POST'
      };

      this.makeRequest(requestOptions).then(val => {
        if (val.statusCode === 201) {
          this.alertService.updateFriendRequestsEvent.emit();
          const resolved = (resolution === 'accept') ? 'accepted' : 'declined';
          this.alertService.onAlertEvent.emit(`Successfully ${resolved} the friend request`);
        }
        resolve(val);
      });

    });
  }

  sendMessage(sendMessageObject, showAlerts = true) {
    if (!sendMessageObject.content && showAlerts) {
      this.alertService.onAlertEvent.emit('Message not sent. You must provide some content for your message');
      return;
    }
    const options = {
      method: 'POST',
      location: `users/send-message/${sendMessageObject.id}`,
      body: {
        content: sendMessageObject.content
      }
    };
    return new Promise((resolve, reject) => {
      this.makeRequest(options).then((val) => {
        if (val.statusCode === 201 && showAlerts) {
          this.alertService.onAlertEvent.emit('Successfully sent a message');
        }
        resolve(val);
      });
    });
  }

  resetMessageNotifications() {
    const requestObject = {
      location: 'users/reset-message-notifications',
      method: 'POST'
    };

    return new Promise((resolve, reject) => {
      this.makeRequest(requestObject).then((val) => {
        if (val.statusCode === 201) {
          this.alertService.resetMessageNotifications.emit();
        }
        resolve();
      });
    });
  }

  resetAlertnotifications() {
    const requestObject = {
      location: 'users/reset-alert-notifications',
      method: 'POST'
    };

    return new Promise((resolve, reject) => {
      this.makeRequest(requestObject).then((val) => {
        if (val.statusCode === 201) {
          this.alertService.resetMessageNotifications.emit();

        }
        resolve();
      });
    });
  }
}
