module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
    sourceType: 'module',
    extraFileExtensions: ['.json'],
  },
  ignorePatterns: [
    '.eslintrc.js',
    'gulpfile.js',
    'dist/**',
    'node_modules/**',
  ],
  plugins: ['n8n-nodes-base'],
  extends: ['plugin:n8n-nodes-base/community'],
  rules: {},
};
