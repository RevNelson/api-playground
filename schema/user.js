import { gql } from "apollo-server-express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    getUser: User!
  }

  extend type Mutation {
    registerUser(username: String!, password: String!): User!
    loginUser(username: String!, password: String!): LoginUserResponse!
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
    async getUser(_, { data }, { prisma, userId }, info) {
      console.log("Get User ID: ", userId);
      if (userId) {
        return prisma.query.user({ where: { id: userId } }, info);
      }
    }
  },

  Mutation: {
    registerUser: async (_, { username, password }, { prisma }, info) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.mutation.createUser({
        data: {
          username,
          password: hashedPassword
        }
      });
      return user;
    },
    loginUser: async (_, { username, password }, { prisma }, info) => {
      const user = await prisma.query.user({
        where: { username }
      });
      console.log(user);

      if (!user) {
        throw new Error("Invalid Login");
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        throw new Error("Invalid Login");
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.email
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "30d"
        }
      );
      return {
        token,
        user
      };
    }
  }
};

module.exports = { userTypes, userResolvers };
