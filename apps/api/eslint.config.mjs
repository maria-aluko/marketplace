import { baseConfig } from '@eventtrust/config/eslint/base';
import { nestjsConfig } from '@eventtrust/config/eslint/nestjs';

/** @type {import('eslint').Linter.Config[]} */
export default [...baseConfig, ...nestjsConfig];
