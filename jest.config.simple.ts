import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testMatch: ["**/__tests__/**/*.test.ts?(x)"],
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
  // Skip global setup/teardown that requires Docker
  // globalSetup: "<rootDir>/__tests__/setup/globalSetup.ts",
  // globalTeardown: "<rootDir>/__tests__/setup/globalTeardown.ts",
};
export default config;
