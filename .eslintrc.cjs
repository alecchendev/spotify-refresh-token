module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    'plugin:react/recommended',
    'airbnb',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'react',
  ],
  rules: {
    'no-console': 0,
    'no-plusplus': 0,
    'new-cap': 0,
    'max-len': 0,
    'react/function-component-definition': 0,
    'prefer-arrow-callback': 2,
    'react/prop-types': 0,
  },
};
