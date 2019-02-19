import { config } from "dotenv";
import express from "express";
import passport from "passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";

config();

import apolloServer from "./schema";

const { HOST, PORT, ORIGIN_URL, JWT_SECRET } = process.env;

const start = async () => {
  try {
    const app = express();

    app.use(morgan("dev"));

    const corsMiddleware = {
      origin: ORIGIN_URL,
      credentials: true,
      preflightContinue: false
    };

    app.use(cors(corsMiddleware));

    app.options(cors(corsMiddleware));

    app.use(cookieParser());

    app.use(passport.initialize());

    app.use(passport.session());

    passport.serializeUser((userId, done) => {
      done(null, userId);
    });

    passport.deserializeUser((userId, done) => {
      done(null, userId);
    });

    passport.use(
      "jwt",
      new Strategy(
        {
          secretOrKey: JWT_SECRET, // this should either be the sharedKey or the publicKey you used in the ooth config
          jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("jwt")
        },
        (payload, next) => {
          if (!payload._id || typeof payload._id !== "string") {
            return next("Malformed token payload.", false);
          }
          return next(null, payload._id);
        }
      )
    );

    apolloServer.applyMiddleware({
      app,
      path: "/",
      cors: corsMiddleware
    });

    app.listen(PORT, () => {
      console.info(`API online at ${HOST}:${PORT}`);
    });
  } catch (e) {
    console.error(e);
  }
};

start();
