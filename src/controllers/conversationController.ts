import { Request, Response, NextFunction } from 'express';
import Conversation from '../models/conversationModel';
import catchAsync from '../utils/catchAsync';
import ErrorHandler from '../utils/appError';
// import APIFeatures from '../utils/apiFeatures'

export const createConversation = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { senderId, receiverId } = req.body;
    let user = req.user._id.toString();

    const existingConversation = await Conversation.findOne({
      $and: [{ members: user }, { members: req.body.receiverId }],
    });

    if (existingConversation) {
      return next(new ErrorHandler(400, 'conversation already exist'));
    }

    const data = new Conversation({
      members: [user, req.body.receiverId],
    });

    await data.save();
    res.status(200).json({
      status: 'Successful',
      message: 'Chat was created',
      data,
    });
  },
);

export const getConversation = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let user = req.user._id.toString();
    const data = await Conversation.find({ members: { $in: [req.params.id] } })
      .sort({
        createdAt: -1,
      })
      .populate('members', 'firstName lastName -_id');
    if (req.params.id !== user) {
      return next(new ErrorHandler(401, 'You are not logged in!'));
    }
    // else if(!data){
    //   return next(new ErrorHandler(401, 'You have no previous chat!'));
    // }

    res.status(200).json({
      status: 'Successful',
      message: 'Users conversations',
      data,
    });
  },
);

export const getUsersConversation = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await Conversation.find({
      members: { $all: [req.params.firstUserId, req.params.secondUserId] },
    }).populate('members', 'firstName lastName -_id');
    if (!data) {
      return next(new ErrorHandler(401, 'You have no chat records. Start by typing hello!'));
    }
    res.status(200).json({
      status: 'Successful',
      message: 'Users conversation',
      data,
    });
  },
);
