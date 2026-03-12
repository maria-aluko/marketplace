/** @type {import('eslint').Linter.Config[]} */
export const libraryConfig = [
  {
    files: ['**/*.ts'],
    rules: {
      'no-console': 'error',
    },
  },
];
