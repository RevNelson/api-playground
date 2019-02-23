import { config } from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";

config();

import apolloServer from "./schema";
import { checkJWT } from "./lib";

const { API_NAME, HOST, PORT, ORIGIN_URL } = process.env;

const start = async () => {
  try {
    const app = express();
    app.use(morgan("combined"));

    const corsMiddleware = {
      origin: ORIGIN_URL,
      credentials: true,
      preflightContinue: false
    };

    app.use(cors(corsMiddleware));

    app.options(cors(corsMiddleware));

    app.post("*", function(req, res, next) {
      let user;
      // Check for Cookies
      const token =
        (req.headers.cookie && req.headers.cookie.split("=")[1]) || "";
      token && (user = checkJWT(token));

      // Check for Auth Header
      req.headers.authorization && (user = checkJWT(req.headers.authorization));

      if (user === "JWT_ERROR") {
        res.clearCookie(API_NAME, { path: "/" });
        return next();
      }

      user && (req.user = user);
      !user && (req.user = undefined);
      return next();
    });

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
