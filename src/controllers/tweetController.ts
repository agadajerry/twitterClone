import express, { Request, Response, NextFunction } from 'express';
import CreateTweetCln from '../models/tweetModel';
import CreateRetTweet from '../models/retweetModel';
import { tweetValidate } from '../utils/tweet_utils/tweetingValidation';
import cloudinaryImage from '../utils/tweet_utils/cloudinaryImageStorage';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync';
import ErrorHandler from '../utils/appError';
import Responses from '../utils/response';
import User from '../models/userModels';
import { createHashtag, extractHashtag } from '../models/trendingModel';
import Bookmark from '../models/bookmarkModel';
import Like from '../models/likeModel';
import Comment from '../models/commentModel';
import { getFollowersModel, getFollowingModel } from '../models/followModel';

const responseStatus = new Responses();
/****************************************************************************
 *                                                                           *
 *               Creation of new Tweet by the user                           *
 *                                                                           *
/*****************************************************************************/

export const userNewTweet = catchAsync(async (req: any, res: Response, next: NextFunction) => {
  //check error for incoming request

  const { error } = tweetValidate(req.body);

  if (error) return next(new ErrorHandler(404, error.message));

  const { messageBody, whoCanReply } = req.body;

  let hashtags = await createHashtag(messageBody);

  if (req.file == undefined) {
    let createTweet = new CreateTweetCln({
      userId: req.user._id,
      messageBody,
      tweetImage: null,
      whoCanReply: whoCanReply == 'Everyone' ? whoCanReply : 'People you follow',
      cloudinary_id: null,
      hashtag: hashtags,
    });

    if (createTweet) {
      await createTweet.save();

      responseStatus.setSuccess(201, 'Tweet saved successfully...', { createTweet, hashtags });

      return responseStatus.send(res);
    } else {
      return res.status(404).json({ msg: 'Error  occur for file uploading' });
    }
  } else {
    let cloudImage = await cloudinaryImage.uploader.upload(req.file.path);
    let createTweet = new CreateTweetCln({
      userId: req.user._id,
      messageBody,
      tweetImage: cloudImage.secure_url,
      whoCanReply: whoCanReply == 'Everyone' ? whoCanReply : 'People you follow',
      cloudinary_id: cloudImage.public_id,
      hashtag: hashtags,
    });

    if (createTweet) {
      await createTweet.save();

      responseStatus.setSuccess(201, 'Tweet saved successfully...', createTweet);

      return responseStatus.send(res);
    } else {
      return res.status(404).json({ msg: 'Error  occur for file uploading' });
    }
  }
});

/****************************************************************************
 *                 
 *              Retweeting function                                          *
 *               An authorised user can reweet another person's tweet   
 *                                                                           *
 *                                                                           *
/*****************************************************************************/

export const reTweeting = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  //check if objectId is valid or not

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ msg: 'Invalid tweet Id ' });
  }

  //check if you have already retweeted this tweet
  const checkIfRetweeted = await CreateRetTweet.findOne({ tweetId: req.params.id }).where({
    reTweeterId: req.user._id,
  });
  if (checkIfRetweeted) {
    return undoUserReweet(req, res, next);
  }

  const createReTweet = new CreateRetTweet({
    tweetId: req.params.id,
    reTweeterId: req.user._id,
  });

  if (createReTweet) {
    await createReTweet.save();

    responseStatus.setSuccess(201, 'You just retweeted...', createReTweet);
    return responseStatus.send(res);
  } else {
    responseStatus.setSuccess(404, 'Retweet not made', createReTweet);
    return responseStatus.send(res);
  }
});

/****************************************************************************
 *                 
 *                     Show All your reTweet                                 *                  
 *                                                                           *
 *                                                                           *
/*****************************************************************************/

export const allUserRetweet = catchAsync(async (req: Request, res: Response) => {
  // get id of reweet and search the message body in tweet colltn using populate function

  const userReTweet = await CreateRetTweet.find({ reTweeterId: req.user._id }).populate(
    'noOfLikes commentCount tweetId retweeter_name',
  );
  // console.log(userReTweet)

  if (userReTweet) {
    const tweetsPromises = userReTweet.map(async (item: any) => {
      let isLiked = await Like.findOne({ userId: req.user._id, tweetId: item._id });
      let isBookmarked = await Bookmark.findOne({ userId: req.user._id, tweetId: item._id });
      let isRetweeted = await CreateRetTweet.findOne({
        reTweeterId: req.user._id,
        tweetId: item._id,
      });
      isLiked = isLiked ? true : false;
      isBookmarked = isBookmarked ? true : false;
      isRetweeted = isRetweeted ? true : false;

      return { tweet: item, isLiked, isBookmarked, isRetweeted };
    });

    const reTweet = await Promise.all(tweetsPromises);
    responseStatus.setSuccess(200, 'All your Retweet', reTweet);
    return responseStatus.send(res);
  }
});

// get single retweet by the user
/****************************************************************************
 *                 
 *                     Show All user Tweet                                 *                  
 *                                                                           *
 *                                                                           *
/*****************************************************************************/

export const allUserTweet = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  //All user tweet

  let allTweets = await CreateTweetCln.find({ userId: req.user._id }).populate(
    'noOfLikes commentCount allComment createdBy',
  );

  if (allTweets == null) {
    return next(new ErrorHandler(404, 'Error Occured in tweet fetching...'));
  } else {
    const tweetsPromises = allTweets.map(async (item: any) => {
      let isLiked = await Like.findOne({ userId: req.user._id, tweetId: item._id });
      let isBookmarked = await Bookmark.findOne({ userId: req.user._id, tweetId: item._id });
      let isRetweeted = await CreateRetTweet.findOne({
        reTweeterId: req.user._id,
        tweetId: item._id,
      });
      isLiked = isLiked ? true : false;
      isBookmarked = isBookmarked ? true : false;
      isRetweeted = isRetweeted ? true : false;

      return { item, isLiked, isBookmarked, isRetweeted };
    });

    const tweets = await Promise.all(tweetsPromises);

    console.log(tweets);
    responseStatus.setSuccess(200, 'All your  tweet and comments', tweets);
    return responseStatus.send(res);
  }
});

/****************************************************************************
 *                 
 *                    User Can delete his tweet                              *                  
 *                                                                           *
 *                                                                           *
/*****************************************************************************/

export const deleteTweet = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const tweetId = req.params.id;

  // if(req.user._id) return res.json

  CreateTweetCln.findById(tweetId, async (err: any, tweet: any) => {
    if (err) {
      return next(new ErrorHandler(404, 'Error occured in finding a particular tweet'));
    } else {
      //delete image from cloudinary according to post id

      if (!tweet.userId.equals(req.user._id)) {
        return res.json({ warning: "You cannot delete another person's tweet" });
      }

      try {
        if (!tweet) return next(new ErrorHandler(404, 'The document you want is not found...'));
        if (tweet.cloudinary_id) await cloudinaryImage.uploader.destroy(tweet.cloudinary_id);

        //delete user tweet
        await tweet.remove();

        // delete also the retweet which a user has deleted from retweet collection

        let deletedTweet = await CreateRetTweet.deleteMany({ tweetId: tweetId });
        await Bookmark.deleteMany({ tweetId });
        await Like.deleteMany({ tweetId });
        await Comment.deleteMany({ tweetId });

        if (deletedTweet) {
          responseStatus.setSuccess(200, 'This tweet was removed', deletedTweet);
          return responseStatus.send(res);
        }
      } catch (error: any) {
        next(new ErrorHandler(500, error.message));
      }
    }
  });
});

/****************************************************************************
 *                 
 *                   Undo a particular tweet you reweeted.                            *                  
 /*****************************************************************************/

export const undoUserReweet = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const tweetToDelete = await CreateRetTweet.deleteOne({ tweetId: req.params.id }).where({
      reTweeterId: req.user._id,
    });

    if (!tweetToDelete) {
      return next(new ErrorHandler(404, 'Error occurred in finding retweet to undo..'));
    } else {
      responseStatus.setSuccess(200, 'Reweet is been undo successfully...', {
        deleteRetweetId: req.params.id,
      });
      return responseStatus.send(res);
    }
  },
);

/****************************************************************************
 *                 
 *                   Get All tweet and retweet of other user you visit 
 *                    their page/profile                                      *                  
 /*****************************************************************************/

export const getAllUserTweetNRetweet = catchAsync(async (req: Request, res: Response) => {
  //get other user retweet and and combine it with his tweet

  const otherUserId = req.params.id;

  const otherUserReTweetDetail = await CreateRetTweet.find({ reTweeterId: otherUserId }).populate(
    'tweetId retweeter_name noOfLikes commentCount userId',
  );

  const reTweetsPromises = otherUserReTweetDetail.map(async (item: any) => {
    let isLiked = await Like.findOne({ userId: req.user._id, tweetId: item._id });
    let isBookmarked = await Bookmark.findOne({ userId: req.user._id, tweetId: item._id });
    let isRetweeted = await CreateRetTweet.findOne({
      reTweeterId: req.user._id,
      tweetId: item._id,
    });
    isLiked = isLiked ? true : false;
    isBookmarked = isBookmarked ? true : false;
    isRetweeted = isRetweeted ? true : false;

    return { ...item._doc, isLiked, isBookmarked, isRetweeted };
  });

  const reTweets = await Promise.all(reTweetsPromises);

  const allOtherUserTweet = await CreateTweetCln.find({ userId: otherUserId }).populate(
    'noOfLikes commentCount userId',
  );

  const tweetsPromises = allOtherUserTweet.map(async (item: any) => {
    let isLiked = await Like.findOne({ userId: req.user._id, tweetId: item._id });
    let isBookmarked = await Bookmark.findOne({ userId: req.user._id, tweetId: item._id });
    let isRetweeted = await CreateRetTweet.findOne({
      reTweeterId: req.user._id,
      tweetId: item._id,
    });
    isLiked = isLiked ? true : false;
    isBookmarked = isBookmarked ? true : false;
    isRetweeted = isRetweeted ? true : false;

    return { ...item._doc, isLiked, isBookmarked, isRetweeted };
  });

  const tweets = await Promise.all(tweetsPromises);

  const allOtherUserChat = [{ otherUserRetweet: reTweets }, { OtherUserTweet: tweets }];

  responseStatus.setSuccess(200, 'getAllUserTweetNRetweet', allOtherUserChat);

  return responseStatus.send(res);
});

export const getUserTweetByTime = catchAsync(async (req: Request, res: Response) => {
  const { pageNo, pageSize, createdAt } = req.query as any;
  const page = +pageNo || 1;
  const size = +pageSize || 5;
  const otherUserTweet = await CreateTweetCln.find({
    createdAt: { $gte: new Date(new Date(createdAt).setHours(0, 0, 0)) },
    userId: req.params.userId,
  })
    .populate('userId')
    .skip(page - 1)
    .limit(size);

  const otherUserRetweet = await CreateRetTweet.find({
    createdAt: { $gte: new Date(new Date(createdAt).setHours(0, 0, 0)) },
    reTweeterId: req.params.userId,
  })
    .populate('reTweeterId')
    .skip(page - 1)
    .limit(size);

  const data = {
    tweets: otherUserTweet,
    retweets: otherUserRetweet,
  };

  responseStatus.setSuccess(200, 'Get tweets and retweets by time', data);
  return responseStatus.send(res);
});

export const getPopularTweets = catchAsync(async (req: Request, res: Response) => {
  const likes = await Like.aggregate([
    { $group: { _id: '$tweetId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const comments = await Comment.aggregate([
    { $group: { _id: '$tweetId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const bookmarks = await Bookmark.aggregate([
    { $group: { _id: '$tweetId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const tweets = await CreateTweetCln.find()
    .populate('userId')
    .populate('noOfLikes commentCount bookmarkCount');

  const combinedTweetsAndCounts = tweets.map((tweet) => {
    const tweetLikes = likes.find((like) => tweet._id.equals(like._id)) || { count: 0 };
    const tweetComments = comments.find((comment: any) => tweet._id.equals(comment._id)) || {
      count: 0,
    };
    const tweetBookmarks = bookmarks.find((bookmark) => tweet._id.equals(bookmark._id)) || {
      count: 0,
    };

    return {
      tweet,
      count: tweetLikes.count + tweetComments.count + tweetBookmarks.count,
    };
  });

  const data = combinedTweetsAndCounts.sort((a, b) => b.count - a.count);

  // const tweets = await CreateTweetCln.populate(likes, {path: "tweetId"});

  // const tweets = await CreateTweetCln.find().populate(['Like', 'Comment', 'Bookmark'])

  responseStatus.setSuccess(200, 'Get popular tweets', data);
  return responseStatus.send(res);
});

// Sprint Two \\
/****************************************************************************
 *                 
 *                  Get Single tweet and it comment                           *                  
 /*****************************************************************************/

export const singleTweetAndComment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const tweetId = req.params.id;

    // const {contentLimit, pageNo} =  req.query;

    let numObj = { contentLimit: 5, pageNo: 3 };

    let { contentLimit, pageNo } = numObj;

    console.log(contentLimit, pageNo);

    let singleTweet = await CreateTweetCln.find({ _id: tweetId }).populate([
      {
        path: 'retweetCount commentCount noOfLikes allComment createdBy',
        select: 'content userId tweetId firstName lastName email profilePic bioData',
        model: 'allCreatedTweets',
        options: {
          sort: { createdAt: -1 },
        },

        skip: (Number(pageNo) - 1) * Number(contentLimit),
        limit: Number(contentLimit),
      },
    ]);

    responseStatus.setSuccess(200, 'Single tweet and it comment', singleTweet);

    return responseStatus.send(res);
  },
);

/***********************************************************************
 *
 *
 *
 *  As a login user, you can access other person profile
 * This function handle that
 *
 *************************************************************************/

export const singleUserProfile = catchAsync(async (req: Request, res: Response) => {
  const otherUserId = req.params.id;

  const otherUserDetails = await User.find({ _id: otherUserId }).select({
    firstName: 1,
    lastName: 1,
    email: 1,
    profilePic: 1,
  });

  const followers = await getFollowersModel(otherUserId, 1, 1);

  const following = await getFollowingModel(otherUserId, 1, 1);

  const totalFollowers = {
    totalFollowers: followers.Totalfollowers,
    totalFollowing: following.Totalfollowing,
  };

  const otherUsersProfiles_Details = [totalFollowers, otherUserDetails];

  responseStatus.setSuccess(200, 'Bio data', otherUsersProfiles_Details);

  return responseStatus.send(res);
});

/***********************************************************************
 *
 *
 *
 *  As a login user, i want to get the list of people that are the user of the app
 * This function handle that
 *
 *************************************************************************/

export const listOfAppUser = catchAsync(async (req: Request, res: Response) => {
  const userList = await User.find({}).where({ isActive: true });

  responseStatus.setSuccess(200, 'List Of Users In the App', userList);

  return responseStatus.send(res);
});

/**
 *  .select({ firstName: 1, lastName: 1, profilePic: 1, bioData: 1 })
 * [
      {
        path: 'retweetCount commentCount noOfLikes allComment createdBy',
        select: 'content userId tweetId firstName lastName email profilePic bioData',
        model: 'allCreatedTweets',
        options: {
          sort: { createdAt: -1 },
        },

        skip: (Number(pageNo) - 1) * Number(contentLimit),
        limit: Number(contentLimit),
      },
    ]
 */
