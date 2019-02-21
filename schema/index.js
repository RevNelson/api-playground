import { config } from "dotenv";
import merge from "lodash.merge";
import { ApolloServer } from "apollo-server-express";
import { Prisma, extractFragmentReplacements } from "prisma-binding";
import { GraphQLScalarType } from "graphql";
import { isISO8601 } from "validator";

import { userTypes, userResolvers } from "./user";

config();

const { PRISMA_PORT, PRISMA_MANAGEMENT_API_SECRET } = process.env;

const parseISO8601 = value => {
  if (isISO8601(value)) {
    return value;
  }
  throw new Error("DateTime cannot represent an invalid ISO-8601 Date string");
};

const serializeISO8601 = value => {
  if (isISO8601(value)) {
    return value;
  }
  throw new Error("DateTime cannot represent an invalid ISO-8601 Date string");
};

const parseLiteralISO8601 = ast => {
  if (isISO8601(ast.value)) {
    return ast.value;
  }
  throw new Error("DateTime cannot represent an invalid ISO-8601 Date string");
};

const Query = `
  scalar DateTime

  type MyType {
    created: DateTime
  }

  type Query {
    _empty: String
  }
  type Mutation {
    _empty: String
  }
`;

const genericResolvers = {
  DateTime: new GraphQLScalarType({
    name: "DateTime",
    description: "An ISO-8601 encoded UTC date string.",
    serialize: serializeISO8601,
    parseValue: parseISO8601,
    parseLiteral: parseLiteralISO8601
  })
};

const typeDefs = [Query, userTypes];

const resolvers = merge(userResolvers, genericResolvers);

const fragmentReplacements = extractFragmentReplacements(resolvers);

const prisma = new Prisma({
  typeDefs: "prisma/generated/prisma.graphql",
  endpoint: `http://localhost:${PRISMA_PORT}`,
  secret: PRISMA_MANAGEMENT_API_SECRET,
  fragmentReplacements
});

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req, res }) => {
    req.user && console.log("CTX User: ", req.user);
    req.userId && console.log("CTX UserID: ", req.userId);
    return { prisma, ...req, userId: req.userId && req.userId, res };
  },
  fragmentReplacements,
  playground: {
    endpoint: `/graphql`,
    settings: {
      "request.credentials": "include",
      "editor.theme": "dark"
    }
  },
  formatError: error => {
    console.log("Error: ", error);
    return error;
  },
  formatResponse: response => {
    console.log("Response: ", response);
    return response;
  }
});
// Exports
export default apolloServer;
