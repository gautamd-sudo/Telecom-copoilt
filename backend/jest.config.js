const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.ts"],
  transform: {
    ...tsJestTransformCfg,
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(uuid|pino|pino-http|prom-client)/)"
  ],
  moduleNameMapper: {
    "^uuid$": "<rootDir>/node_modules/uuid/dist/index.js"
  }
};