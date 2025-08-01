import passport from "passport";
import User from "../models/User.js";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { configDotenv } from "dotenv";
configDotenv();
let opt = {};
opt.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opt.secretOrKey = process.env.SECRET_KEY;

passport.use(
  new JwtStrategy(opt, async (jwt_payload, done) => {
    try {
      const user = await User.findById(jwt_payload.id);
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  })
);

const isauthentificate = passport.authenticate("jwt", { session: false });
export default isauthentificate;
