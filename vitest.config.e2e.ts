import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config.ts';

export default defineConfig({
  test: {
    ...baseConfig.test,
    include: ['test/**/*.e2e-spec.ts'],
    fileParallelism: false,
  },
});
