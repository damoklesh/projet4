module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react-hooks/recommended', 'prettier'],
  env: {
    browser: true,
    es2022: true,
    jest: true,
    node: true
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    'apps/api/storage/uploads/',
    'apps/api/storage/tmp/',
    'apps/web/dist/'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off'
  }
};
