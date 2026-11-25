import { mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config.ts';

export default mergeConfig(baseConfig, {
  test: {
    include: ['test/**/*.e2e-spec.ts'],
    fileParallelism: false,
  },
});
