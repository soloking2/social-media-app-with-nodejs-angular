import { Component, OnInit, Input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiService } from '../shared/api.service';
import { LocalStorageService } from '../shared/local-storage.service';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css']
})
export class PostComponent implements OnInit {

  @Input() post;
  fakeId;
  fontSize = 18;
  alignContent = 'left';
  liked = false;
  userId = '';
  comment = '';
  constructor(private apiService: ApiService,
              private storage: LocalStorageService) { }

  ngOnInit(): void {
    function removeLeadingNumber(character) {
      function isNumber(n) {
        n = Number(n);
        if (!isNaN(n)) {
          return true;
        }
      }

      if (character && isNumber(character[0])) {
        character = removeLeadingNumber(character.substr(1));
      }
      return character;
    }

    this.fakeId = removeLeadingNumber(this.post._id);

    if (this.post.content.length < 40) { this.fontSize = 22; }
    if (this.post.content.length < 20) { this.fontSize = 28; this.alignContent = 'center'; }
    if (this.post.content.length < 14) { this.fontSize = 32; }
    if (this.post.content.length < 8) { this.fontSize = 44; }
    if (this.post.content.length < 5) { this.fontSize = 62; }

    this.userId = this.storage.getParsedToken()._id;
    if (this.post.likes.includes(this.userId)) {
      this.liked = true;
    }
  }

  likeButtonClicked(postId) {
    const requestOptions = {
      location: `users/like-unlike/${this.post.ownerid}/${this.post._id}`,
      method: 'POST'
    };

    this.apiService.makeRequest(requestOptions).then(val => {
      if (this.post.likes.includes(this.userId)) {
        this.post.likes.splice(this.post.likes.indexOf(this.userId), 1);
        this.liked = false;
      } else {
        this.post.likes.push(this.userId);
        this.liked = true;
      }
    });
  }

  postComment() {
    if (this.comment.length === 0) {return; }
    const requestObject = {
      location: `users/post-comment/${this.post.ownerid}/${this.post._id}`,
      method: 'POST',
      body: {
        content: this.comment}
    };
    this.apiService.makeRequest(requestObject).then(val => {
      if (val.statusCode === 201) {
        const newComment = {
          ...val.comment,
          commenter_name: val.commenter.name,
          comment_profile_image: val.commenter.profile_image
        };
        this.post.comments.push(newComment);
        this.comment = '';
      }
    });
  }

}
