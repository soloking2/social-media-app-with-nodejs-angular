import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { AlertsService } from '../shared/alerts.service';

@Component({
  selector: 'app-result-request',
  templateUrl: './result-request.component.html',
  styleUrls: ['./result-request.component.css']
})
export class ResultRComponent implements OnInit {
  constructor(private apiService: ApiService,
              private alertService: AlertsService) { }

  @Output() resultChanged = new EventEmitter<any>();
  @Input() searchResult;
  @Input() switchUse;
  haveSentFriendRequest = false;
  haveReceivedFriendRequest = false;
  isFriend = false;

  ngOnInit(): void {
    if (this.searchResult.isFriend) {
      this.isFriend = true;
    }
    if (this.searchResult.haveReceivedFriendRequest) {
      this.haveReceivedFriendRequest = true;
    }
    if (this.searchResult.haveSentFriendRequest) {
      this.haveSentFriendRequest = true;
    }
  }

  sendFriendRequest(id: string) {
    this.apiService.makeFriendRequest(id);
  }

  acceptFriendRequest() {
    this.resultChanger();
    this.apiService.resolveFriendRequest('accept', this.searchResult._id).then((val) => {
    });
  }

  declineFriendRequest() {
    this.resultChanger();
    this.apiService.resolveFriendRequest('decline', this.searchResult._id);
  }

  updateSendMessage(id, name) {
    this.alertService.sendMessageDetailsEvent.emit({id, name});
  }

  private resultChanger() {
    this.resultChanged.emit(this.searchResult._id);
  }

}
