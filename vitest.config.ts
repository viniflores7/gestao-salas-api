import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { defineConfig } from 'vitest/config';

const env = existsSync('.env') ? parseEnv(readFileSync('.env', 'utf8')) : {};

export default defineConfig({
  test: {
    globals: true,
    root: './',
    env,
    include: ['test/**/*.spec.ts'],
    passWithNoTests: true,
  },
});
