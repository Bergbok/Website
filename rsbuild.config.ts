import baseConfig from './src/lib/noclip/rsbuild.config.ts';
import { mergeRsbuildConfig } from '@rsbuild/core';

export default mergeRsbuildConfig(baseConfig, {
	output: { assetPrefix: '/noclip/' }
});
