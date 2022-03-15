import { Request, Response, NextFunction, response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/userModels';
import { ISign } from '../utils/interfaces/userInterface';
import catchAsync from '../utils/catchAsync';
import ErrorHandler from '../utils/appError';
import sendEmail from '../utils/email';

export const generateToken = (email: string) => {
  const token = jwt.sign({ email }, process.env.JWT_SECRET_KEY as string, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  return token;
};

const generateEmailToken = (email: string) => {
  const emailToken = jwt.sign({ email }, process.env.JWT_EMAIL_KEY as string, {
    expiresIn: process.env.JWT_EMAIL_EXPIRES_IN,
  });
  return emailToken;
};

export const signup = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const newUser = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password
  });
  // console.log(newUser, newUser.email, '***')

  const emailToken = generateEmailToken(newUser.email);
  if (process.env.NODE_ENV === 'test') {
    return res.status(200).json({
      status: 'success',
      newUser,
      emailToken,
    });
  } else {
    sendEmail(
      newUser.email,
      'Email Verification',
      `<p>Hello ${newUser.firstName},</p><p>Thank you for signing up for a Twitter account.
       In order to access your Twitter account,</p>
       Click
       <button><a href= http://localhost:3000/users/verify/${emailToken}>here</a></button>
       to verify your email. Thanks`,
    )
      .then(() => {
        console.log('email sent');
      })
      .catch((err) => {
        console.log(err);
      });
    console.log(emailToken);
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  }
});

export const confirmEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const emailToken: any = jwt.verify(
    req.params.token as string,
    process.env.JWT_EMAIL_KEY as string,
  );
  if (!emailToken) {
    return next(new ErrorHandler(401, 'Invalid Token. Please SignUp!'));
  }
  //console.log(decodedToken)
  const data = await User.findOne({ email: emailToken.email });
  if (!data) {
    return next(
      new ErrorHandler(401, 'We were unable to find a user for this verification. Please SignUp!'),
    );
  } else {
    data.isActive = true;
    await data.save();
  }

  if (process.env.NODE_ENV === 'test') {
    return res.status(201).json({
      message: 'success',
      emailToken,
      data,
    });
  } else {
    return res.redirect('back');
  }
});

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  //check if user submitted email and password
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler(401, 'Please provide email and password'));
  }

  //check if user with the email exists
  const user: ISign | null = await User.findOne({ email: req.body.email }).select('+password');
  if (!user) {
    return next(new ErrorHandler(401, 'invalid login credentials'));
  }

  // const emailToken = generateEmailToken(user.email);
  // if (!user.isActive) {
  //   await sendEmail(
  //     user.email,
  //     'Email Verification',
  //     `<p>Thank you for signing up for a Twitter account</p>
  //   <p>In order to access your Twitter account</p>
  //   Click
  //   <button><a href= http://localhost:3000/users/verify/${emailToken}>here</a></button>
  //   to verify your email. Thanks`,
  //   );
  //   return next(
  //     new ErrorHandler(401, 'A mail has been sent to you. Please confirm email to login'),
  //   );
  // }

  //Check if password is correct
  const match = await bcrypt.compare(req.body.password, user.password);
  if (!match) {
    return next(new ErrorHandler(401, 'invalid login credentials'));
  }

  //Generate token for user
  const token = generateToken(user.email);

  // (const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET_KEY, {
  //   expiresIn: process.env.JWT_EXPIRES_IN,
  // });

  // res.cookie'jwt_token', token, { httpOnly: true });

  res.status(201).json({
    status: 'Login successful!',
    user,
    token,
  });
});

export const protectRoute = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorHandler(401, 'You are not authorized! 🚨'));
  }

  const decodedToken: any = jwt.verify(token as string, process.env.JWT_SECRET_KEY as string);
  const user = await User.findOne({ email: decodedToken.email });
  req.user = user;

  next();
});
