// eslint.config.js
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        process: "readonly",
        console: "readonly"
      }
    },
    rules: {
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
    }
  }
];
