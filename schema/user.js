import { gql } from "apollo-server-express";
import { checkPass, hashPass, loginSuccess, clearCookie } from "../lib";

const userTypes = gql`
  type User {
    id: ID!
    username: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Name {
    en: String
    zh: String
    it: String
    fr: String
    es: String
  }

  extend type Query {
    users(query: String): [User!]!
    checkAuth: User
    getUser: User
  }

  extend type Mutation {
    registerUser(username: String!, password: String!): User!
    loginUser(username: String!, password: String!): LoginUserResponse!
    logoutUser: String
  }

  type LoginUserResponse {
    token: String
    user: User
  }
`;

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
        return await prisma.query.user({ where: { id: user.id } });
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
    registerUser: async (_, { username, password }, { prisma }, info) => {
      const hashedPassword = await hashPass(password);
      const user = await prisma.mutation.createUser({
        data: {
          username,
          password: hashedPassword
        }
      });
      return user;
    },
    loginUser: async (_, { username, password }, { prisma, res }, info) => {
      const user = await prisma.query.user({
        where: { username }
      });

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
      return user && user.username || "";
    }
  }
};

module.exports = { userTypes, userResolvers };
