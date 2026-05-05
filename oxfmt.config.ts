import { defineConfig } from 'oxfmt';
import type { OxfmtConfig } from 'oxfmt';
import baseConfig from '@bergbok/prettier-config';

baseConfig.overrides![0].files = ['*.yml'];

export default defineConfig({
	...(baseConfig as OxfmtConfig),
	bracketSameLine: true,
	jsdoc: {
		bracketSpacing: false,
		capitalizeDescriptions: false,
		commentLineStrategy: 'keep',
		lineWrappingStyle: 'balance'
	},
	jsxSingleQuote: true,
	ignorePatterns: ['*.wasm', '*.webm', '/artifacts/', '/src/lib/*/', '/src/types/cowsay.d.ts'],
	printWidth: 120,
	quoteProps: 'consistent',
	sortPackageJson: {
		sortScripts: true
	}
});
