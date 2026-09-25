import passport from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import * as userRepository from "../repositories/userRepository.js";
import { AppError } from "../shared/errors/appError.js";
import {
  WIDGET_AUDIENCE,
  isTokenBeforeCutoff,
} from "../services/auth/authSessionService.js";

// Bearer authentication.
//
// A disabled account is refused even with an access token still valid: it
// used to keep working for up to two hours after being disabled.
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.SECRET_KEY,
    },
    async (payload, done) => {
      try {
        const user = await userRepository.findSessionUser(payload.id);
        if (!user || user.is_active === false) return done(null, false);
        // Signing out everywhere, changing or resetting the password moves the
        // account's cutoff: tokens issued before it die on their next request
        // instead of living out their 15 minutes in another tab.
        if (isTokenBeforeCutoff(payload, user.sessions_valid_from)) return done(null, false);
        // The payload travels with the account: the caller below needs to know
        // whether this is a widget token, and for which project.
        return done(null, { ...user, tokenPayload: payload });
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// A refusal goes through the error middleware like any other: same envelope,
// same language, still a 401 so the dashboard renews its token.
//
// A widget token only passes on a route that declared `allowWidgetSession`,
// and the project it was issued for is kept on the request for the access
// guards.
const isauthentificate = (req, res, next) =>
  passport.authenticate("jwt", { session: false }, (error, user) => {
    if (error) return next(error);
    if (!user) return next(new AppError("AUTH_REQUIRED"));

    const { tokenPayload, sessions_valid_from: _cutoff, ...account } = user;
    if (tokenPayload?.aud === WIDGET_AUDIENCE) {
      if (!req.allowWidgetSession) return next(new AppError("AUTH_WIDGET_SCOPE"));
      req.widgetSession = { projectId: tokenPayload.project };
    }

    req.user = account;
    return next();
  })(req, res, next);

export default isauthentificate;
