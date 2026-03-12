/** @type {import('eslint').Linter.Config[]} */
export const nestjsConfig = [
  {
    files: ['**/*.ts'],
    rules: {
      'no-useless-constructor': 'off',
      '@typescript-eslint/no-useless-constructor': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
];
