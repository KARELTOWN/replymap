import jwt from "jsonwebtoken";
import { ExtractJwt } from "passport-jwt";
import User from "../models/User.js";
const UserConnect = (req, res, next) => {
  const jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken(req);
  const token = jwtFromRequest(req);
  if (!token) {
    next();
  } else {
    jwt.verify(token, process.env.SECRET_KEY, async (err, decoded) => {
      if (err) {
        next();
      }
      const user = await User.findById(decoded.id);
      if (user) {
        req.userconnect = user;
      }
      next();
    });
  }
};
export default UserConnect;
