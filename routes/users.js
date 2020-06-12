var express = require('express');
var router = express.Router();
const authMiddleware = require('../mvc/middleware/auth-check');



const userController = require('../mvc/controllers/user');
const fakeuserController = require('../mvc/controllers/fakeUsers');


// Routes to get all users
router.get('/', userController.getUsers);

//Loggin in and Registration
router.post('/register', userController.register);
router.post('/login', userController.login);


// Get Routes
router.get('/generate-feed', authMiddleware.authorize,userController.generateFeed);
router.get('/search-results', authMiddleware.authorize, userController.searchResults);
router.get('/get-user-data/:userId', authMiddleware.authorize, userController.getUserData);

//Routes Handling Friend Requests
router.post('/send-friend-request/:from/:to', authMiddleware.authorize, userController.sendFriendRequest);
router.get('/get-friend-request', authMiddleware.authorize, userController.getFriendrequest);
router.post('/resolve-friend-request/:from/:to', userController.resolveFriendRequest);


// Route Handling Post Requests
router.post('/create-post', authMiddleware.authorize, userController.createPost);
router.post('/like-unlike/:ownerid/:postid', authMiddleware.authorize, userController.likeUnlike);
router.post('/post-comment/:ownerid/:postid', authMiddleware.authorize, userController.postCommentOnPost);


//Routes Handling Messages
router.post('/send-message/:to', authMiddleware.authorize, userController.sendMessage);
router.post('/reset-message-notifications', authMiddleware.authorize, userController.resetMessageNotifications);
router.post('/delete-message/:messageid', authMiddleware.authorize, userController.deleteMessage);
router.post('/reset-alert-notifications', authMiddleware.authorize, userController.resetAlertNotifications);

//Miscelaneous Routes
router.post('/bestie-enemy-toggle/:userid', authMiddleware.authorize, userController.bestieEnemyToggle);


// Development and Testing Routes
router.post('/create-fake-users', fakeuserController.createFakeUsers);
router.delete('/delete-all', userController.deleteAll);



module.exports = router;