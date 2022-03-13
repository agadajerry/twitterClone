import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import globalErrorHandler from './controllers/errorController';
import session from 'express-session';
import passport from 'passport';
import { googleStrategy, facebookStrategy } from './middleware/passport';
import indexRouter from './routes/index';
import followRoutes from './routes/followRoute';
import likeCommentBook from './routes/likeCommentBookmark';
import tweetRoute from './routes/tweetingRouting';
import { connectDB, connectTestDB } from './database/mem';
import usersRouter from './routes/users';
import viewtweetRoute from './routes/viewTweetRoute';
import resetRouter from './routes/resetPassword';
import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import latest from './routes/latest';
import media from './routes/media';
import trendingRoutes from './routes/trendingRoute';
import conversationRouter from './routes/conversation';
import messageRouter from './routes/message';
import searchRouter from './routes/search';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();
const app = express();
app.use(cors());
googleStrategy(passport);
facebookStrategy(passport);
app.use(
  session({
    secret: process.env.SECRET_SESSION as string,
    resave: true,
    saveUninitialized: true,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3001',
  },
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// connect db
if (process.env.NODE_ENV === 'test') {
  connectTestDB();
} else {
  connectDB();
}

console.log({ nodeEnv: process.env.NODE_ENV });

app.use('/', indexRouter);
app.use('/api/follow', followRoutes);
app.use('/tweeting', tweetRoute);
app.use('/users', usersRouter);

app.use('/profile', profileRouter);

app.use('/api/viewtweet', viewtweetRoute);
app.use('/tweet', likeCommentBook);
app.use('/latest', latest);
app.use('/media', media);

app.use('/api/v1/reset', resetRouter);
app.use('/auth', authRouter);

app.use('/api/trends', trendingRoutes);

app.use('/conversation', conversationRouter);
app.use('/message', messageRouter);
app.use('/api/v1/search', searchRouter);

app.all('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Can not find ${req.originalUrl} endpoint on this server`,
  });
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

app.set('views', path.join(`${__dirname}/../`, 'views'));
app.set('view engine', 'ejs');

app.use(globalErrorHandler);

export default { app, httpServer, io };
