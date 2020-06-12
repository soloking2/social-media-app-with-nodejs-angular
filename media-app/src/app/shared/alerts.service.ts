import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AlertsService {
onAlertEvent: EventEmitter<string> = new EventEmitter();
updateFriendRequestsEvent: EventEmitter<string> = new EventEmitter();
sendMessageDetailsEvent: EventEmitter<object> = new EventEmitter();

resetMessageNotifications: EventEmitter<string> = new EventEmitter();

  constructor() { }
}
