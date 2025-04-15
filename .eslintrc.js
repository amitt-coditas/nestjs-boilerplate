module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'import', 'prettier'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/', 'node_modules/'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unsafe-enum-comparison': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',

    'import/order': [
      'error',
      {
        groups: [
          'builtin', // Built-in Node.js modules
          'internal', // Internal modules
          'external', // External modules (npm packages)
          'sibling', // Same directory imports (./)
          'parent', // Parent directory imports (../)
          'index', // Index file of the current directory
          'object', // Object imports
          'type', // Type imports
        ],
        'newlines-between': 'always',
        pathGroups: [
          {
            pattern: '@nestjs/**',
            group: 'external',
            position: 'before',
          },
        ],
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-duplicates': 'error',
    'import/no-unresolved': 'error',

    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-var': 'error',
    'no-multiple-empty-lines': ['error', { max: 1 }],
    'no-duplicate-imports': 'error',
    'no-trailing-spaces': 'error',
    eqeqeq: ['error', 'always'],
    'no-throw-literal': 'error',
    'prettier/prettier': 'error',
  },
};
