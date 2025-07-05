/**
 * Configures Passport.js with Google OAuth 2.0 strategy
 * Used to authenticate Admin users via Google login
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import Admin from '../models/Admin.js';

// Configure Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID, // Google OAuth Client ID
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Google OAuth Secret
      callbackURL: process.env.GOOGLE_CALLBACK_URL, // Redirect URI after Google login
    },
    /**
     * Callback when Google returns user info
     * @param {string} accessToken
     * @param {string} refreshToken
     * @param {Object} profile - Google profile object
     * @param {Function} done - Callback to proceed in auth flow
     */
    async (accessToken, refreshToken, profile, done) => {
      try {
        let admin = await Admin.findOne({ googleId: profile.id });
        if (!admin) {
          admin = await Admin.create({
            googleId: profile.id,
            email: profile.emails?.[0]?.value || null,
          });
        }
        return done(null, admin);
      } catch (err) {
        return done(err);
      }
    }
  )
);

/**
 * Serialize user instance to session
 * @param {Object} user - Mongoose admin document
 * @param {Function} done
 */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

/**
 * Deserialize user by ID from session
 * @param {string} id - MongoDB ObjectId
 * @param {Function} done
 */
passport.deserializeUser(async (id, done) => {
  try {
    const admin = await Admin.findById(id);
    done(null, admin);
  } catch (err) {
    done(err);
  }
});

export default passport;
