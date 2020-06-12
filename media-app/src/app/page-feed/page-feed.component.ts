import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { Title } from '@angular/platform-browser';
import { LocalStorageService } from '../shared/local-storage.service';
import { AlertsService } from '../shared/alerts.service';

@Component({
  selector: 'app-page-feed',
  templateUrl: './page-feed.component.html',
  styleUrls: ['./page-feed.component.css']
})
export class PageFeedComponent implements OnInit {
  newPostContent = '';
  newPostTheme = this.storage.getPostTheme() || 'primary';
  posts = {
    col1: [],
    col2: [],
    col3: [],
    col4: []
  };

  bestiePosts = [];

  constructor(
    private apiService: ApiService,
    private title: Title,
    private storage: LocalStorageService,
    private alertService: AlertsService
  ) { }

  ngOnInit(): void {
    this.title.setTitle('Feed');
    const requestOptions = {
      method: 'GET',
      location: 'users/generate-feed'
    };

    this.apiService.makeRequest(requestOptions).then(value => {
      if (value.statusCode === 200) {
        this.bestiePosts = value.bestiePosts;
        const fullCol1 = value.posts.filter((val, i) => i % 4 === 0);
        const fullCol2 = value.posts.filter((val, i) => i % 4 === 1);
        const fullCol3 = value.posts.filter((val, i) => i % 4 === 2);
        const fullCol4 = value.posts.filter((val, i) => i % 4 === 3);

        const cols = [fullCol1, fullCol2, fullCol3, fullCol4];

        this.addPostToFeed(cols, 0, 0);
      }
    });
  }

  changeTheme(color: string) {
    this.newPostTheme = color;
    this.storage.setPostTheme(color);
  }

  createPost() {
    if (this.newPostContent.length === 0) {
      this.alertService.onAlertEvent.emit('No content post provided');
    }

    const requestOptions = {
      location: 'users/create-post',
      method: 'POST',
      body: {
        content: this.newPostContent,
        theme: this.newPostTheme
      }
    };

    this.apiService.makeRequest(requestOptions).then((val) => {
      if (val.statusCode === 201) {
        val.newPost.ago = 'Now';
        this.posts.col1.unshift(val.newPost);
      } else {
        this.alertService.onAlertEvent.emit('Something went wrong, your post could not be created');
      }
      this.newPostContent = '';
    });
  }

  private addPostToFeed(array, colNumber, delay) {
    setTimeout(() => {
      if (array[colNumber].length) {
        // tslint:disable-next-line: no-unused-expression
        this.posts['col' + (colNumber + 1)].push(array[colNumber].splice(0, 1)[0]);
        colNumber = ++colNumber % 4;
        this.addPostToFeed(array, colNumber, 100);
      }
    }, delay);
  }


}
