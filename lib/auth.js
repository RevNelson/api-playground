import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "dotenv";

config();

const { API_NAME, JWT_SECRET, NODE_ENV } = process.env;

const SALT = 10;

export const hashPass = async password => await bcrypt.hash(password, SALT);

export const checkPass = async (sentPass, storedPass) =>
  await bcrypt.compare(sentPass, storedPass);

export const checkJWT = token =>
  jwt.verify(token, JWT_SECRET, function(err, decoded) {
    if (err) return "JWT_ERROR";
    return decoded;
  });

const signJWT = (data, expiresIn = "7d") =>
  jwt.sign(data, JWT_SECRET, {
    expiresIn: expiresIn
  });

const setCookie = (token, res) => {
  res.cookie(API_NAME, token, {
    httpOnly: true,
    secure: NODE_ENV === "production"
  });
};

export const loginSuccess = (res, user) => {
  // Remove password from returned user
  const { password, ...userWithoutPass } = user;
  const token = signJWT(userWithoutPass);
  setCookie(token, res);
  return { token, user: userWithoutPass };
};

export const clearCookie = res => res.clearCookie(API_NAME, { path: "/" });
