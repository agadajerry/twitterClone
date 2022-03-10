import { Request, Response, NextFunction, response } from 'express';
import multer from 'multer';
import catchAsync from '../utils/catchAsync';
import ErrorHandler from '../utils/appError';
import imageMulter from '../utils/tweet_utils/multerImageUpload';
import cloudinaryImage from '../utils/tweet_utils/cloudinaryImageStorage';
import User from '../models/userModels';
import { getFollowersModel } from '../models/followModel';
import { getFollowingModel } from '../models/followModel';

const upload = imageMulter.single('profilePicture');

export const uploadProfilePicture = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return next(new ErrorHandler(500, err.message));
      } else if (err) {
        return next(new ErrorHandler(500, err.message));
      }

      const path = req.file?.path;
      try {
        const profile = await User.findOne({ email: req.user.email });
        if (!profile) return next(new ErrorHandler(500, 'Profile does not exist'));
        const file = await cloudinaryImage.uploader.upload(path as string);
        await profile.updateOne({ profilePic: file.url });
        const updateProfile = await User.findOne({ email: req.user.email });
        return res.status(201).json({
          status: 'successful!',
          profile: updateProfile,
        });
      } catch (error: any) {
        next(new ErrorHandler(500, error.message));
      }
    });
  },
);

// export const createProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//   const profile = await User.findOne({ email: req.user.email });
//   if (profile) return next(new ErrorHandler(400, 'User can not create multiple profiles'));
//   const newProfile = await User.create({
//     user: req.user.email,
//     name: req.body.name,
//     bioData: req.body.bioData,
//   });

//   return res.status(201).json({
//     status: 'successful!',
//     data: { newProfile },
//   });
// });

export const updateProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const profile = await User.findOne({ email: req.user.email });
  if (!profile) return next(new ErrorHandler(404, 'profile does not exist'));
  await profile.updateOne({
    firstName: req.body.firstName || profile.firstName,
    lastName: req.body.lastName || profile.lastName,
    bioData: req.body.bioData || profile.bioData,
  });
  const updateProfile = await User.findOne({ email: req.user.email });
  return res.status(201).json({
    status: 'successful!',
    profile: updateProfile,
  });
});

// export const updateProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//   const profile = await User.findOneAndUpdate({ email: req.user.email });
//   res.status(201).json({
//     status: 'successful!',
//     message: 'profile updated',
//     profile,
//   });
// });

export const getProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { page, size } = req.query as any;
  const user = await User.findOne({ email: req.user.email });
  if (!user) return next(new ErrorHandler(404, 'User does not exist'));
  const followers = await getFollowersModel(user._id, +page || 1, +size || 5);
  const following = await getFollowingModel(user._id, +page || 1, +size || 5);

  return res.status(200).json({
    user,
    followers,
    following,
  });
});

export const getUserProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { page, size } = req.query as any;
    const user = await User.findOne({ _id: req.params.userId });
    if (!user) return next(new ErrorHandler(404, 'User does not exist'));
    const followers = await getFollowersModel(user._id, +page || 1, +size || 5);
    const following = await getFollowingModel(user._id, +page || 1, +size || 5);
    return res.status(200).json({
      user,
      followers,
      following,
    });
  },
);
