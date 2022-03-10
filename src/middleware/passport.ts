import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FBStrategy } from 'passport-facebook';
import User from '../models/userModels';
import passport, { PassportStatic, Profile } from 'passport';
import { Request, Response, NextFunction } from 'express';
import { generateToken } from './../controllers/authController';

export const googleStrategy = (passport: PassportStatic) =>
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        callbackURL: '/auth/google/callback',
        passReqToCallback: true,
      },
      async (
        req: Request,
        accessToken: string,
        refreshToken: string,
        params: any,
        profile: any,
        done: (arg0: null, arg1: any) => void,
      ) => {
        accessToken;
        refreshToken;
        // console.log(profile, accessToken, refreshToken);
        const newUser = {
          isActive: true,
          email: profile.emails[0].value,
          firstName: profile.name!.givenName,
          lastName: profile.name!.familyName, // look at the passport user profile to see how names are returned
          profilePic: profile.photos ? profile.photos[0].value : null,
          provider: profile.provider,
        };

        // return done(null, newUser);

        try {
          let user: any = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            const token = generateToken(user.email);
            // console.log(user, token);
            return done(null, { user, token });
          } else {
            user = await User.create(newUser);
            const token = generateToken(user.email);
            // console.log({user, token});
            return done(null, { user, token });
          }
        } catch (err) {
          console.error(err);
        }
      },
    ),
  );

export const facebookStrategy = (passport: PassportStatic) =>
  passport.use(
    new FBStrategy(
      {
        clientID: process.env.CLIENT_ID_FB as string,
        clientSecret: process.env.CLIENT_SECRET_FB as string,
        callbackURL: '/auth/facebook/callback',
        profileFields: ['name', 'picture.type(large)', 'email'],
      }, // facebook will send back the token and profile
      async function (token: string, refreshToken: string, profile: any, done: any) {
        token;
        refreshToken;
        console.log(profile);
        const newUser = {
          isActive: true,
          email: profile.emails[0].value,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          profilePic: profile.photos ? profile.photos[0].value : null,
          provider: profile.provider,
        };
        try {
          let user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            done(null, user);
          } else {
            user = await User.create(newUser);
            done(null, user);
          }
        } catch (err) {
          console.error(err);
        }
      },
    ),
  );

// route middleware to make sure a user is logged in to access protected routes
export function isLoggedIn(req: Request, res: Response, next: NextFunction) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) return next();
  // if they aren't redirect them to the home page
  res.redirect('/');
}

passport.serializeUser((profile, done) => {
  done(null, profile);
});

passport.deserializeUser((profile: typeof User, done) => {
  done(null, profile);
});
