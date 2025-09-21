import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup/jest.setup.ts"],
  testTimeout: 30000,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      tsconfig: {
        jsx: "react-jsx",
      },
    }],
  },
  // Skip database-dependent tests for now
  testPathIgnorePatterns: [
    "<rootDir>/__tests__/ui/",
    "<rootDir>/__tests__/api/",
    "<rootDir>/__tests__/compliance/",
    "<rootDir>/__tests__/agents/",
  ],
};

export default config;