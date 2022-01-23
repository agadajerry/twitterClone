import express, { Request, Response } from 'express';
import imageMulter from '../utils/tweet_utils/multerImageUpload';
import * as tweetControls from '../controllers/tweetController';
import { protectRoute } from '../controllers/authController';

const router = express.Router();

//create tweet

router.post('/', protectRoute, imageMulter.single('tweetImage'), tweetControls.userNewTweet);

//retweeting
router.post('/retweet/:id', protectRoute, tweetControls.reTweeting);

// all user retweet
router.get('/allretweet', protectRoute, tweetControls.allUserRetweet);

//all tweet from a specific user
router.get('/allTweet', protectRoute, tweetControls.allUserTweet);

//delete tweet
router.delete('/deletetweet/:id', protectRoute, tweetControls.deleteTweet);

//undo retweet
router.delete('/undoretweet/:id', protectRoute, tweetControls.undoUserReweet);

//get other user tweet and retweet in th
router.get('/otherusertweet/:id', protectRoute, tweetControls.getAllUserTweetNRetweet);

export default router;
