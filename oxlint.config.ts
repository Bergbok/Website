import { defineConfig } from 'oxlint';

// https://oxc.rs/docs/guide/usage/linter/config-file-reference.html
export default defineConfig({
	categories: {
		correctness: 'warn',
		perf: 'warn',
		restriction: 'warn',
		style: 'warn',
		suspicious: 'warn'
	},
	env: {
		browser: true,
		vue: true
	},
	ignorePatterns: [
		'/artifacts/',
		'/public/',
		'/src/assets/games/the-powder-toy/powder.js',
		'/src/assets/games/space-cadet-pinball/SpaceCadetPinball.js',
		'/src/lib/*/',
		'/src/types/cowsay.d.ts'
	],
	options: {
		maxWarnings: 42,
		typeAware: true
	},
	overrides: [
		{
			files: ['src/main.ts'],
			rules: {
				'eslint/new-cap': 'off'
			}
		},
		{
			files: ['src/router/router.ts'],
			rules: {
				'typescript/explicit-function-return-type': 'off'
			}
		},
		{
			files: ['src/scripts/buildBassoonTracker.ts'],
			rules: {
				'import/no-relative-parent-imports': 'off'
			}
		},
		{
			files: ['*.config.ts', 'src/scripts/*.ts'],
			rules: {
				'import/no-nodejs-modules': 'off'
			}
		},
		{
			files: ['ox*.config.ts'],
			rules: {
				'eslint/sort-keys': 'warn'
			}
		}
	],
	plugins: ['eslint', 'oxc', 'import', 'jsdoc', 'promise', 'typescript', 'unicorn', 'vue'],
	rules: {
		'eslint/capitalized-comments': 'off',
		'eslint/func-style': 'off',
		'eslint/id-length': 'off',
		'eslint/max-params': 'off',
		'eslint/max-statements': 'off',
		'eslint/no-console': 'off',
		'eslint/no-continue': 'off',
		'eslint/no-duplicate-imports': ['warn', { allowSeparateTypeImports: true }],
		'eslint/no-magic-numbers': 'off',
		'eslint/no-plusplus': 'off',
		'eslint/no-ternary': 'off',
		'eslint/no-void': 'off',
		'eslint/sort-imports': ['warn', { ignoreCase: true, ignoreDeclarationSort: true }],
		'eslint/sort-keys': 'off',
		'import/exports-last': 'off',
		'import/group-exports': 'off',
		'import/no-default-export': 'off',
		'import/no-named-export': 'off',
		'import/no-unassigned-import': 'off',
		'import/prefer-default-export': 'off',
		'import/unambiguous': 'off',
		'oxc/no-async-await': 'off',
		'oxc/no-optional-chaining': 'off',
		'oxc/no-rest-spread-properties': 'off',
		'typescript/no-non-null-assertion': 'off',
		'typescript/no-unsafe-type-assertion': 'off',
		'unicorn/filename-case': 'off',
		'unicorn/no-null': 'off',
		'unicorn/prefer-global-this': 'off',
		'unicorn/prefer-node-protocol': 'off',
		'vue/max-props': 'off'
	}
});
