module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2020,
  },
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "quotes": ["error", "double"],
    "indent": "off",
    "max-len": "off",
    "prefer-const": "off",
    "object-curly-spacing": "off",
    "brace-style": "off",
    "require-jsdoc": "off",
    "no-throw-literal": "off",
    "no-undef": "off",
    "arrow-parens": "off",
  },
};
