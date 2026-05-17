import baseConfig from '@bergbok/prettier-config';
import { defineConfig } from 'oxfmt';
import type { OxfmtConfig } from 'oxfmt';

baseConfig.overrides![0]!.files = ['*.yml'];

// https://oxc.rs/docs/guide/usage/formatter/config-file-reference.html
export default defineConfig({
	...(baseConfig as OxfmtConfig),
	bracketSameLine: true,
	ignorePatterns: ['/src/lib/*/', '/src/types/cowsay.d.ts'],
	jsdoc: {
		bracketSpacing: false,
		capitalizeDescriptions: false,
		commentLineStrategy: 'keep',
		lineWrappingStyle: 'balance'
	},
	jsxSingleQuote: true,
	printWidth: 120,
	quoteProps: 'consistent',
	sortPackageJson: {
		sortScripts: true
	}
});
