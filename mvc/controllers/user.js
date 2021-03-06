const mongoose = require('mongoose');
const passport = require('passport');
const User = require('../models/user');
const Post = mongoose.model('Post');
const Comment = mongoose.model('Comment');
const Message = mongoose.model('Message');
const timeAgo = require('time-ago');


const containsDuplicate = (array) => {
  array.sort();
  for(let i=0; i < array.length; i++) {
    if(array[i] === array[i + 1]) {
      return true;
    }
  }
}

const addCommentDetails = (posts) => {
  return new Promise((resolve, reject) => {
    let promises = [];

    for(let post of posts) {
      for(let comment of post.comments) {
        let promise = new Promise((resolve, reject) => {
          User.findById(comment.commenter_id, "name profile_image", (err, user) => {
            comment.comment_name = user.name;
            comment.comment_profile_image = user.profile_image;
            resolve(comment);
          });
        });

        promises.push(promise);
      }
    }

    Promise.all(promises).then((val) => {
      resolve(posts);
    })
  });
}

const generateRandom = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
}

const addToPosts = (array, user) => {
  for(item of array) {
    item.name = user.name;
    item.ago = timeAgo.ago(item.date);
    item.ownerProfileImage = user.profile_image;
    item.ownerid = user._id;
    
  }
}

const alertUser = (fromUser, toId, type, postContent) => {
  return new Promise((resolve, reject) => {
    let alert = {
      alert_type: type,
      from_id: fromUser._id,
      from_name: fromUser.name
    };

    if(postContent && postContent.length > 28) {
      postContent = postContent.substring(0, 28) + '...';
    }
    switch(type) {
      case 'new_friend':
        alert.alert_text = `${alert.from_name} has accepted your friend request`;
        break;
      case 'liked_post':
        alert.alert_text = `${alert.from_name} has liked your post: '${postContent}'`;
        break;
      case 'commented_post':
        alert.alert_text = `${alert.from_name} has commented on your post: '${postContent}'`;
        break;
      default:
        return reject('No return alert type');
    }

    User.findById(toId, (err, user) => {
      if(err) {return res.json({err: err})}

      user.new_notifications++;
      user.notifications.splice(18);
      user.notifications.unshift(JSON.stringify(alert));

      user.save((err) => {
        if(err) {return res.json({err: err})}

        resolve();
      })
    })
  })
}




exports.getUsers = (req, res, next) => {
  User.find().then(users =>{
    res.status(200).json({
      message: 'All users',
      users: users
    })
  })
};

exports.register = ({body}, res) => {
  if(
    !body.first_name ||
    !body.last_name ||
    !body.email ||
    !body.password ||
    !body.password_confirm 
    ) {
      return res.json({"message": "All fields are required"})
    }
  if(body.password !== body.password_confirm) {
    return res.send({message: 'Passwords does not match'});
  }
  
  const user = new User();
  user.name = body.first_name.trim() + " " + body.last_name.trim();
  user.email = body.email;
  user.setPassword(body.password);
  user.save((err, newUser) => {
    if(err) {
      if(err.errmsg && err.errmsg.includes("duplicate key error")) {
        return res.json({
          message: "the provided email is already registered"
        });
      } else {
        res.json({message: 'Something went wrong'})
      }
    } else {
      const token = newUser.getJwt();
      return res.status(201).json({
        token
      });
    }
  });
};

exports.login = (req, res, next) => {
  if(!req.body.email || !req.body.password) {
    return res.status(400).json({
      message: 'All fields are required' 
    });
  }
  passport.authenticate("local", (err, user, info) => {
    if(err) {
      return res.status(404).json(err);
     }
     console.log('checking');
   if(user) {
    const token = user.getJwt();
     res.status(201).json({token});
   } else {
     res.json(info); 
   }
  })(req, res, next);
};

exports.generateFeed = ({payload}, res, next) => {

  let posts = [];
  let bestiePosts = [];


   let newPost = new Promise((resolve, reject) => {
     User.findById(payload._id, "", {lean: true}, (err, user) => {
      if(err) {return res.statusJson(400, {err: err})};
      if(!user) {return res.statusJson(404, {message: 'User not found'})};
      
       addToPosts(user.posts, user);
       posts.push(...user.posts);

       user.friends = user.friends.filter(val => {
         return !user.besties.includes(val); 
        });
       resolve(user);
     });

   });

   function getPostsFrom(arrayOfUsers, maxAmountofPosts, postArray) {
     return new Promise((resolve, reject) => {
       User.find({'_id': {$in: arrayOfUsers}}, 'name posts profile_image', {lean: true}, (err, users) => {
        if(err) {return res.json({err: err})}

        for(user of users) {
          addToPosts(user.posts, user);
          postArray.push(...user.posts);
        }

        postArray.sort((a, b) => (a.date > b.date) ? -1 : 1);
        postArray.splice(maxAmountofPosts);

        addCommentDetails(postArray).then(() => {
          resolve();
   
        })
       })
     })

   }

   let myBestiePosts = newPost.then(({besties}) => {
    return getPostsFrom(besties, 4, bestiePosts)
  })

   let myFriendsPost = newPost.then(({friends}) => {
     return getPostsFrom(friends, 48, posts)
   })

   Promise.all([myBestiePosts, myFriendsPost]).then(() => {
    res.statusJson(200, {posts, bestiePosts});
   })
}

exports.searchResults = (req, res, next) => {
  if(!req.query.query) {return res.json({err: 'Missing a query'});}
  User.find({name: {$regex: req.query.query, $options: 'i'}}, "name friends email profile_image friend_requests", (err, results) => {
    if(err) { return res.json({err: err})}
    results = results.slice(0, 20);

    for(let i = 0; i < results.length; i++) {
      if(results[i]._id == req.payload._id) {
        results.splice(i, 1);
        break;
      }
    }
  
    return res.status(200).json({message: 'Getting search results', results: results});
  });

};

exports.sendFriendRequest = ({params}, res, next) => {
  User.findById(params.to, (err, friend) => {
    if(err) { return res.json({err: err})}

    if(containsDuplicate([params.from, ...friend.friend_requests])) {
      return res.json({ message: 'Friend request is sent already'})
    }
    friend.friend_requests.push(params.from);
    friend.save((err, friend) => {
      if(err) { return res.json({err: err});};
      res.statusJson(201, {
        message: 'Successfully sent a friend request'});

    })

  })
}

exports.getFriendrequest = ({query}, res, next) => {

  let friends = JSON.parse(query.friend_requests);
  User.find({'_id': {$in: friends}}, "name profile_image", (err, users) => {
    if(err) { return res.json({err: err})}
    return res.statusJson(200, {
      message: 'Getting friend requests',
      users: users
    });
  })
}

exports.getUserData = ({params}, res, next) => {
  User.findById(params.userId, "-salt -password", {lean: true}, (err, user) => {
    if(err) {return res.statusJson(400, {err: err})};
    if(!user) {return res.statusJson(404, {message: 'User not found'})};

    function getRandomFriends(friendList) {
      let copyOfFriendList = Array.from(friendList);
      let randomIds = [];

      for(let i=0; i < 6; i++) {
        if(friendList.length <= 6) {
          randomIds = copyOfFriendList;
          break;
        }
        let randomId = generateRandom(0, copyOfFriendList.length);
        randomIds.push(copyOfFriendList[randomId]);
        copyOfFriendList.splice(randomId, 1);
      }

      return new Promise((resolve, reject) => {
        User.find({'_id': {$in: randomIds}}, "name profile_image", (err, friends) =>{
          if(err) {return res.json({err: err})}
          resolve(friends)
        })
      })
    }

    function addMessengerDetails(messages) {
      return new Promise((resolve, reject) => {
        if(!messages.length) {resolve(messages)}
        
        let usersArray = [];

        for(let message of messages) {
          usersArray.push(message.form_id);
        }

        User.find({'_id': {$in: usersArray}}, 'name profile_image', (err, users) => {
          if(err) {return res.json({err: err})}

          for(message of messages) {
            for(let i=0; i < users.length; i++) {
              if(message.form_id == users[i]._id) {
                message.messengerName = users[i].name;
                message.messengerProfileImage = users[i].profile_image;
                users.splice(i, 1);
                break;
              }
            }
          }

          resolve(messages);
        })
      })
    }

    user.posts.sort((a, b) => (a.date > b.date) ? -1 : 1);

    addToPosts(user.posts, user);

    let randomFriends = getRandomFriends(user.friends);
    let commentDetails = addCommentDetails(user.posts);
    let messageDetails = addMessengerDetails(user.messages);

    let besties = new Promise((resolve, reject) => {
      User.find({'_id': {$in: user.besties}}, "name profile_image", (err, users) => {
        user.besties = users;
        resolve();
      });
    });
    let enemies = new Promise((resolve, reject) => {
      User.find({'_id': {$in: user.enemies}}, "name profile_image", (err, users) => {
        user.enemies = users;
        resolve();
      });
    });

    let waitFor = [randomFriends, commentDetails, messageDetails, besties, enemies];

    Promise.all(waitFor).then((val) => {
      user.random_friends = val[0];
      user.messages = val[2];
      res.statusJson(200, {user: user})
    })

  })
}

exports.resolveFriendRequest = ({query, params}, res, next) => {
  User.findById(params.to, (err, user) => {
    if(err) { return res.json({err: err})}

    for(let i=0; i < user.friend_requests.length; i++ ) {
      if (user.friend_requests[i] === params.from) {
        user.friend_requests.splice(i, 1);
        break;
      }
    }

    let promise = new Promise((resolve, reject) => {
      if(query.resolution === 'accept') {
        if(containsDuplicate([params.from, ...user.friends])) {
         return res.json({message: 'Duplicate error'});
        }

        user.friends.push(params.from);

        User.findById(params.from, (err, user) => {
          if(err) { return res.json({err: err})};

          if(containsDuplicate([params.to, ...user.friends])) {
            return res.json({message: 'Duplicate error'});
          }

          user.friends.push(params.to);

          user.save((err, user) => {
            if(err) { return res.json({err: err})};
            resolve();
          })
        })
      } else {
        resolve();
      }
    });

    promise.then(() => {
      user.save((err, user) => {
        if(err) { return res.json({err: err})};
        alertUser(user, params.from, "new_friend").then(() => {
          res.statusJson(201, { message: 'Resolving friend request', ...query, ...params});

        })
      })
    });

  });
}

exports.createPost = ({body, payload}, res, next) => {
  if(!body.content || !body.theme) {
    return res.statusJson(400, {message: 'Insufficient data sent with the request'});
  }

  let userId = payload._id;

  const post = new Post();
  post.content = body.content;
  post.theme = body.theme;

  User.findById(userId, (err, user) => {
    if(err) {return res.json({err: err})}

    let newPost = post.toObject();
    newPost.name = payload.name;
    newPost.ownerid = payload._id;
    newPost.ownerProfileImage = user.profile_image;
    user.posts.push(post);
    user.save((err) => {
      if(err) {return res.json({err: err})}
      return res.statusJson(201, {message: 'Created posts', newPost: newPost});

    })
  })
  
}

exports.likeUnlike = ({payload, params}, res, next) => {
  User.findById(params.ownerid, (err, user) => {
    if(err) {return res.json({err: err})}

    const post = user.posts.id(params.postid);

    let promise = new Promise((resolve, reject) => {
      if(post.likes.includes(payload._id)) {
        post.likes.splice(post.likes.indexOf(payload._id), 1);
        resolve();
      } else {
        post.likes.push(payload._id);
  
        if(params.ownerid !== payload._id) {
          User.findById(payload._id, (err, user) => {
            if(err) {return res.json({err: err})}

            alertUser(user, params.ownerid, 'liked_post', post.content).then(() => {
              resolve();
            })
          })
        } else {
          resolve();
        }
      }

    })


    promise.then(() => {
      user.save((err, user) => {
        if(err) {return res.json({err: err})}
        res.statusJson(201, {message: 'Liking / unlike posts'});
      });

    });
  });
}

exports.postCommentOnPost = ({payload, body, params}, res, next) => {
  User.findById(params.ownerid, (err, user) => {
    if(err) { return res.json({err: err})}

    const post = user.posts.id(params.postid);

    let comment = new Comment();
    comment.commenter_id = payload._id;
    comment.comment_content = body.content;
    post.comments.push(comment);

    user.save((err, user) => {
      if(err) { return res.json({err: err})}

      User.findById(payload._id, "name profile_image", (err, user) => {
        if(err) { return res.json({err: err})}

        let promise = new  Promise((resolve, reject) => {

          if (payload._id !== params.ownerid) {
            alertUser(user, params.ownerid, 'commented_post', post.content).then(() => {
              resolve();
            });
          } else {
            resolve();
          }
        });

        promise.then(() => {
          res.statusJson(201, {
            message: 'Posted comments',
          comment: comment,
          commenter: user
        });

        });
      })

    })
  })
}

exports.sendMessage = ({body, payload, params}, res, next) => {
  let from = payload._id;
  let to = params.to;

  let fromPromise = new Promise((resolve, reject) => {
    User.findById(from, "messages", (err, user) => {
      if(err) { reject(err)}

      from = user;
      resolve(user);
    })
  });

  let toPromise = new Promise((resolve, reject) => {
    User.findById(to, "messages new_message_notifications", (err, user) => {
      if(err) { reject(err)}

      to = user;
      resolve(user);
    })
  });

  let sendMessagePromise = Promise.all([fromPromise, toPromise]).then(() => {

    function hasMessageFrom(messages, id){
      for(let message of messages) {
        if(message.form_id == id) {
          return message;
        }
      }
    }


    function sendMessageTo (to, from, notify = false) {
      return new Promise((resolve, reject) => {
        if(notify && !to.new_message_notifications.includes(from._id)) {
          to.new_message_notifications.push(from._id);
        }
        if(foundMessage = hasMessageFrom(to.messages, from._id)) {
          foundMessage.content.push(message);
          to.save((err, user) => {
            if(err) {reject(err)}
            resolve(user)
          });
        } else {
          let newMessage = new Message();
          newMessage.form_id = from._id;
          newMessage.content = [
            message
          ];

          to.messages.push(newMessage);
          to.save((err, user) => {
            if(err) {reject(err)}
            resolve(user);
          });
        }
      });
    }

    let message = {
      messenger: from._id,
      message: body.content
    }
    
   
    let sendMessageToRecipient = sendMessageTo(to, from, true);
    let sendMessageToAuthor = sendMessageTo(from, to);

    return new Promise((resolve, reject) => {
      Promise.all([sendMessageToRecipient, sendMessageToAuthor]).then(() => {
        resolve()
      }).catch(err => err)
    });
  });


  sendMessagePromise.then(() => {
    return res.statusJson(201, {
      message: 'Sending message'
    });
  });

}

exports.resetMessageNotifications = ({payload}, res, next) => {
  User.findById(payload._id, (err, user) => {
    if(err) { return res.json({err: err})}

    user.new_message_notifications = [];
    user.save(err => {
      if(err) { return res.json({err: err})}
      return res.statusJson(201, {message: 'Reset message notifications'});
    })
  })
}

exports.resetAlertNotifications = ({payload}, res, next) => {
  User.findById(payload._id, (err, user) => {
    if(err) {return res.json({err: err})};

    user.new_notifications = 0;
    user.save((err) => {
      if(err) {return res.json({err: err})};
      return res.statusJson(201, {message: 'Reset alert'})
    });
  });
}

exports.deleteMessage = ({payload, params}, res, next) => {
  User.findById(payload._id, (err, user) => {
    if(err) return res.json({err: err})

    const message = user.messages.id(params.messageid).remove();
    user.save((err) => {
      if(err) return res.json({err: err})
      return res.statusJson(201, {
        message: 'Deleted message'
      });
    });
  });
}

exports.bestieEnemyToggle = ({payload, params, query}, res, next) => {

  let toggle = query.toggle;

  let myId = payload._id;
  let friendId = params.userid;

  User.findById(myId, (err, user) => {
    if(err) {return res.json({err: err})}

    if(!user.friends.includes(friendId)) {
      return res.json({message: 'You are not friends with this user'});
    }

    if(toggle === 'besties' && user.besties.length >= 2) {
      return res.json({message: 'You have the max amount of besties'});
    }
    let arr = user[toggle];

    if(arr.includes(friendId)) {
      arr.splice(arr.indexOf(friendId), 1);
    } else {
      if(toggle !== 'besties' && toggle !== 'enemies') {
        return res.json({message: 'Incorrect query supplied'});
      }
      arr.push(friendId);
    }

    user.save((err) => {
      if(err) {return res.json({err: err})}
      return res.statusJson(201, {message: 'Besties or enemy toggle'})
    })
  })
}

exports.deleteAll = (req, res, next) => {
  User.deleteMany({}, (err, user) => {
    if(err) {
      return res.send({error: err})
    }
    res.json({message: 'Deleted successfully', user: user});
  })
}