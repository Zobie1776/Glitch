import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import config from './default.js';
import User from '../server/src/models/User.js';

export function configurePassport() {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  if (config.oauth.google.clientID) {
    passport.use(new GoogleStrategy({
      clientID: config.oauth.google.clientID,
      clientSecret: config.oauth.google.clientSecret,
      callbackURL: '/api/auth/google/callback'
    }, async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await User.findOrCreateOAuthUser('google', profile);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }));
  }

  if (config.oauth.facebook.clientID) {
    passport.use(new FacebookStrategy({
      clientID: config.oauth.facebook.clientID,
      clientSecret: config.oauth.facebook.clientSecret,
      callbackURL: '/api/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'emails']
    }, async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await User.findOrCreateOAuthUser('facebook', profile);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }));
  }
}
