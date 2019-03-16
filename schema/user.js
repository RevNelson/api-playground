import { gql } from "apollo-server-express";
import { checkPass, hashPass, loginSuccess, clearCookie } from "../lib";

const userTypes = gql`
  type User {
    id: ID!
    username: String!
    name: Name
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Name {
    en: String
    zh: String
    it: String
    fr: String
    es: String
    de: String
    ru: String
    ua: String
  }

  extend type Query {
    users(query: String): [User!]!
    checkAuth: User
    getUser: User
  }

  extend type Mutation {
    registerUser(user: UserInput!): User!
    loginUser(username: String!, password: String!): LoginUserResponse!
    logoutUser: String
  }

  type LoginUserResponse {
    token: String
    user: User
  }

  input UserInput {
    username: String!
    password: String!
    name: NameInput
  }

  input NameInput {
    en: String
    zh: String
    it: String
    fr: String
    es: String
    de: String
    ru: String
    ua: String
  }
`;

const userPrismaReturn =
  "{ id username createdAt updatedAt password name { en zh de es fr it ru ua } }";

const userResolvers = {
  Query: {
    users: async (_, { query }, { prisma }, info) => {
      const opArgs = {
        where: {}
      };

      if (query) {
        opArgs.where.OR = [
          {
            id_contains: query
          },
          {
            email_contains: query
          }
        ];
      }

      return prisma.query.users(opArgs, info);
    },
    checkAuth: async (_, { data }, { prisma, res, user }, info) => {
      console.log("Get User ID: ", user);
      if (user) {
        return await prisma.query.user(
          { where: { id: user.id } },
          userPrismaReturn
        );
      }
    },
    getUser: async (_, { data }, { prisma, user }, info) => {
      console.log("Get User ID: ", user);
      if (user) {
        return prisma.query.user({ where: { id: user.id } });
      }
    }
  },

  Mutation: {
    registerUser: async (_, { user }, { prisma }, info) => {
      const { username, password, name } = user;
      const hashedPassword = await hashPass(password);
      const newUser = await prisma.mutation.createUser({
        data: {
          username,
          password: hashedPassword,
          name: { create: { ...name } }
        }
      });
      return newUser;
    },
    loginUser: async (_, { username, password }, { prisma, res }, info) => {
      const user = await prisma.query.user(
        {
          where: { username }
        },
        userPrismaReturn
      );

      if (!user) {
        throw new Error("Invalid Login");
      }

      const passwordMatch = await checkPass(password, user.password);

      if (!passwordMatch) {
        throw new Error("Invalid Login");
      }

      return loginSuccess(res, user);
    },
    logoutUser: async (_, none, { res, user }, info) => {
      clearCookie(res);
      return (user && user.username) || "";
    }
  }
};

module.exports = { userTypes, userResolvers };
