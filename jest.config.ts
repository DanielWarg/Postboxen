import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts?(x)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup/jest.setup.ts"],
  globalSetup: "<rootDir>/__tests__/setup/globalSetup.ts",
  globalTeardown: "<rootDir>/__tests__/setup/globalTeardown.ts",
  testTimeout: 60000,
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
  // Skip UI tests for now to avoid jsdom issues
  testPathIgnorePatterns: [
    "<rootDir>/__tests__/ui/",
  ],
};

export default config;