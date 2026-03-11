import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

interface EnvConfig {
  app: string;
  required: string[];
  optional: string[];
}

const configs: EnvConfig[] = [
  {
    app: 'apps/api',
    required: [
      'DATABASE_URL',
      'DIRECT_DATABASE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'FRONTEND_URL',
    ],
    optional: [
      'TERMII_API_KEY',
      'TERMII_SENDER_ID',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
      'RESEND_API_KEY',
      'SENTRY_DSN',
      'NODE_ENV',
      'PORT',
    ],
  },
  {
    app: 'apps/web',
    required: ['NEXT_PUBLIC_API_URL'],
    optional: [
      'NEXT_PUBLIC_SENTRY_DSN',
      'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
      'SENTRY_AUTH_TOKEN',
    ],
  },
];

let hasErrors = false;

for (const config of configs) {
  const envPath = resolve(process.cwd(), config.app, '.env');
  console.log(`\nChecking ${config.app}...`);

  if (!existsSync(envPath)) {
    console.log(`  ⚠ No .env file found at ${envPath}`);
    console.log(`  → Copy .env.example to .env and fill in values`);
    hasErrors = true;
    continue;
  }

  const envContent = readFileSync(envPath, 'utf-8');
  const envVars = new Map<string, string>();

  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    envVars.set(trimmed.slice(0, eqIndex), trimmed.slice(eqIndex + 1));
  }

  for (const key of config.required) {
    const value = envVars.get(key);
    if (!value || value === '') {
      console.log(`  ✗ Missing required: ${key}`);
      hasErrors = true;
    } else {
      console.log(`  ✓ ${key}`);
    }
  }

  for (const key of config.optional) {
    const value = envVars.get(key);
    if (!value || value === '') {
      console.log(`  - Optional missing: ${key}`);
    } else {
      console.log(`  ✓ ${key}`);
    }
  }
}

if (hasErrors) {
  console.log('\n✗ Environment check failed. Fix the issues above.');
  process.exit(1);
} else {
  console.log('\n✓ All required environment variables are set.');
}
