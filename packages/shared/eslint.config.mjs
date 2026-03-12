import { baseConfig } from '@eventtrust/config/eslint/base';
import { libraryConfig } from '@eventtrust/config/eslint/library';

/** @type {import('eslint').Linter.Config[]} */
export default [...baseConfig, ...libraryConfig];
