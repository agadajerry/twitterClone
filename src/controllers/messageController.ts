import { Request, Response, NextFunction } from 'express';
import Message from '../models/messageModel';

import catchAsync from '../utils/catchAsync';
import ErrorHandler from '../utils/appError';

export const createMessage = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const data = await Message.create(req.body);
  if (data === null) {
    return next(new ErrorHandler(401, 'invalid login credentials'));
  }
  const savedData = await data.save();
  res.status(200).json({
    status: 'Successful',
    message: 'message was created',
    savedData,
  });
});

export const getMessages = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const data = await Message.find({ conversationId: req.params.conversationId })
    .sort({
      createdAt: 1,
    })
    .populate('senderId');
  if (!data) {
    return next(new ErrorHandler(401, 'You have no chat records. Start by typing hello!'));
  }
  res.status(200).json({
    status: 'Successful',
    message: 'message was created',
    data,
  });
});
