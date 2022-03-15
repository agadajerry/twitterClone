import express, { NextFunction, Request, Response } from 'express';
import passport from 'passport';
const router = express.Router();

// @desc    Auth with Google
// @route   GET /auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/',
    successRedirect: `${process.env.BACKEND_URL}/auth/login/success`,
  }),
);

router.get('/login/success', (req, res) => {
  console.log(req.session.passport.user, 'Pasport');

  const user = JSON.stringify(req.session.passport.user);

  res.redirect(`${process.env.FRONTEND_URL}/social/${req.session.passport.user.token}`);
});

// @desc    Auth with Facebook
// @route   GET /auth/facebook
router.get('/facebook', passport.authenticate('facebook', { scope: 'email' }));

// @desc    Facebook auth callback
// @route   GET /auth/facebook/callback
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', {
    successRedirect: '/dashboard',
    failureRedirect: '/',
  }),
);

// @desc    Logout user
// @route   /auth/logout
router.get('/logout', function (req: any, res) {
  res.clearCookie('refreshtoken');
  res.clearCookie('accessToken');
  req.logOut(); // <-- not req.logout();
  console.log('logout initiated successfully');
  res.render('home');
});

export default router;
