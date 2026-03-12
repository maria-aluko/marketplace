import { baseConfig } from '@eventtrust/config/eslint/base';
import { nextConfig } from '@eventtrust/config/eslint/next';

/** @type {import('eslint').Linter.Config[]} */
export default [...baseConfig, ...nextConfig];
