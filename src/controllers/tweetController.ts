import express, { Request, Response, NextFunction } from 'express';
import CreateTweetCln from '../models/tweetModel';
import CreateRetTweet from '../models/retweetModel';
import { tweetValidate } from '../utils/tweet_utils/tweetingValidation';
import cloudinaryImage from '../utils/tweet_utils/cloudinaryImageStorage';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync';
import ErrorHandler from '../utils/appError';
import Responses from '../utils/response';

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

  if(req.file == undefined){

    let createTweet = new CreateTweetCln({
      userId: req.user._id,
      messageBody,
      tweetImage: "cloudImage.secure_url",
      whoCanReply,
      cloudinary_id: "cloudImage.public_id"
    }); 

    if (createTweet) {
      await createTweet.save();
  
      responseStatus.setSuccess(201, 'Tweet saved successfully...', createTweet);
  
      return responseStatus.send(res)
  
    } else {
      return res.status(404).json({ msg: 'Error  occur for file uploading' });
    }
  }else{

    let cloudImage = await cloudinaryImage.uploader.upload(req.file.path);
    let createTweet = new CreateTweetCln({
      userId: req.user._id,
      messageBody,
      tweetImage: cloudImage.secure_url,
      whoCanReply,
      cloudinary_id: cloudImage.public_id
    }); 

    if (createTweet) {
      await createTweet.save();
  
      responseStatus.setSuccess(201, 'Tweet saved successfully...', createTweet);
  
      return responseStatus.send(res)
  
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
    return res.status(404).json({msg:"Invalid tweet id"})
  }
  const createReTweet = new CreateRetTweet({
    tweetId: req.params.id,
    reTweeterId: req.user._id,
  });

  if (createReTweet) {
    await createReTweet.save();

    responseStatus.setSuccess(201,"You just retweeted...", createReTweet)
    return responseStatus.send(res);
  }else{
    responseStatus.setSuccess(404,"Retweet not made", createReTweet)
    return responseStatus.send(res);
  }
});

/****************************************************************************
 *                 
 *                     Show All user reTweet                                 *                  
 *                                                                           *
 *                                                                           *
/*****************************************************************************/

export const allUserRetweet = catchAsync(async (req: Request, res: Response) => {
  //get id of reweet and search the message body in tweet colltn using populate function
  const userReTweet = await CreateRetTweet.find({ reTweeterId: req.user._id }).populate('tweetId');

  if (userReTweet) {

    responseStatus.setSuccess(200, 'Retweet created', userNewTweet);
    return responseStatus.send(res)
  }
});
/****************************************************************************
 *                 
 *                     Show All user Tweet                                 *                  
 *                                                                           *
 *                                                                           *
/*****************************************************************************/

export const allUserTweet = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  //All user tweet
  CreateTweetCln.find({ userId: req.user._id }, (err: any, allTweets: any) => {
    if (err) return next(new ErrorHandler(404, 'Error Occured in tweet fetching...'));

    if (allTweets == null) {
      return next(new ErrorHandler(404, 'Error Occured in tweet fetching...'));
    } else {
       responseStatus.setSuccess(200, "All user tweet", allTweets);
       return responseStatus.send(res)
    }
  });
});

/****************************************************************************
 *                 
 *                    User Can delete his tweet                              *                  
 *                                                                           *
 *                                                                           *
/*****************************************************************************/

export const deleteTweet = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const tweetId = req.params.id;

  CreateTweetCln.findById(tweetId, async (err: any, user: any) => {
    if (err) {
      return next(new ErrorHandler(404, 'Error occured in finding a particular tweet'));
    } else {
      //delete image from cloudinary according to post id

      if (!user) return next(new ErrorHandler(404, 'The document you want is not found...'));
      await cloudinaryImage.uploader.destroy(user.cloudinary_id);

      //delete user tweet
      await user.remove();

      // delete also the retweet which a user has deleted from retweet collection

      let deletedTweet = await CreateRetTweet.deleteMany({ tweetId: tweetId });

      if (deletedTweet) {
        responseStatus.setSuccess(200, "This tweet was removed", deletedTweet)
        return responseStatus.send(res);
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
    await CreateRetTweet.deleteOne({ tweetId: req.params.id }, (err: any, content: any) => {
      if (err) return next(new ErrorHandler(404, err.message));

      if (content){

         responseStatus.setSuccess(200, 'Reweet is been undo successfully...', content);
        return responseStatus.send(res)
      } 
    });
  },
);

/****************************************************************************
 *                 
 *                   Get All tweet and retweet of other user you visit 
 *                    their page                                              *                  
 /*****************************************************************************/

export const getAllUserTweetNRetweet = catchAsync(async (req: Request, res: Response) => {
  //get other user retweet and and combine it with his tweet

  const otherUserId = req.params.id;

  const otherUserReTweetDetail = await CreateRetTweet.find({ reTweeterId: otherUserId }).populate(
    'tweetId',
  );

  const allOtherUserTweet = await CreateTweetCln.find({ userId: otherUserId });

  const allOtherUserChat = [
    { otherUserRetweet: otherUserReTweetDetail },
    { OtherUserTweet: allOtherUserTweet },
  ];

   responseStatus.setSuccess(200, 'getAllUserTweetNRetweet', allOtherUserChat);

   return responseStatus.send(res);
});
