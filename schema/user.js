const { gql } = require("apollo-server-express");

const userTypes = gql`
  type User {
    id: ID!
    email: String!
    password: String!
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
  }

  extend type Query {
    users(query: String): [User!]!
    getUser: User!
  }

  extend type Mutation {
    _empty_: String
  }

  input NameInput {
    en: String
    zh: String
    it: String
    fr: String
    es: String
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

  Mutation: {}
};

module.exports = { userTypes, userResolvers };
