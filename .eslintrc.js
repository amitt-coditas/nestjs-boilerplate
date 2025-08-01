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
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'import', 'prettier'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/', 'node_modules/'],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    // TypeScript Rules
    '@typescript-eslint/no-explicit-any': 'warn', // Warn on 'any' usage, aligning with noImplicitAny
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }], // Ignore unused vars starting with _
    '@typescript-eslint/no-floating-promises': 'error', // Ensure promises are awaited
    '@typescript-eslint/await-thenable': 'error', // Enforce awaiting thenables
    '@typescript-eslint/no-unsafe-enum-comparison': 'off', // Disable unsafe enum comparison checks
    '@typescript-eslint/interface-name-prefix': 'off', // Allow flexible interface naming
    '@typescript-eslint/explicit-function-return-type': 'off', // Don’t require explicit return types
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Don’t require explicit module boundary types

    // Import Rules
    'import/order': [
      'error',
      {
        groups: [
          'builtin', // Node.js built-in modules (e.g., fs, path)
          'external', // npm packages
          'internal', // Aliased imports (e.g., @utils, @app)
          'sibling', // ./ imports
          'parent', // ../ imports
          'index', // index file imports
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
          {
            pattern: '@utils/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@app/**',
            group: 'internal',
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
  overrides: [
    {
      files: ['**/*.controller.ts'],
      rules: {
        '@typescript-eslint/no-floating-promises': 'off', // Allow promises to be returned directly in controllers
        '@typescript-eslint/await-thenable': 'off', // Allow returning promises without await in controllers
        '@typescript-eslint/require-await': 'error', // Prevent async functions that don't use await
        '@typescript-eslint/no-misused-promises': 'off', // Allow promises in non-async functions for controllers
        'no-restricted-syntax': [
          'error',
          {
            selector: 'FunctionDeclaration[async=true]',
            message:
              'Async functions are not allowed in controllers. Return promises directly instead.',
          },
          {
            selector: 'MethodDefinition[value.async=true]',
            message:
              'Async methods are not allowed in controllers. Return promises directly instead.',
          },
        ],
      },
    },
  ],
};
