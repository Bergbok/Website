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
		'**/*.js',
		'**/*.jsx',
		'**/*.mjs',
		'**/compiler_depend.ts',
		'/public/',
		'/src/lib/*/',
		'/src/types/cowsay.d.ts'
	],
	options: {
		maxWarnings: 42,
		typeAware: true
	},
	overrides: [
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
		},
		{
			files: ['src/assets/games/plants-vs-zombies/bridge.ts'],
			rules: {
				'eslint/no-await-in-loop': 'off',
				'eslint/no-empty-function': 'off',
				'eslint/no-underscore-dangle': 'off',
				'promise/prefer-await-to-callbacks': 'off',
				'unicorn/consistent-function-scoping': 'off',
				'unicorn/prefer-add-event-listener': 'off'
			}
		},
		{
			files: ['src/assets/games/spacecadetpinball/bridge.ts', 'src/types/plants-vs-zombies.d.ts'],
			rules: {
				'typescript/no-explicit-any': 'off'
			}
		},
		{
			files: ['src/components/computer/apps/EightyEightThirtyOne.vue'],
			rules: {
				'eslint/no-use-before-define': ['warn', { functions: false }]
			}
		},
		{
			files: [
				'src/components/computer/gpuio/*.vue',
				'src/components/computer/apps/GpuIO.vue',
				'src/components/computer/GpuWindow.vue'
			],
			rules: {
				'eslint/complexity': 'off',
				'eslint/no-bitwise': 'off',
				'eslint/no-use-before-define': ['warn', { functions: false }]
			}
		},
		{
			files: ['src/components/computer/apps/Hydra.vue'],
			rules: {
				'eslint/no-alert': 'off',
				'eslint/no-await-in-loop': 'off',
				'eslint/no-new-func': 'off'
			}
		},
		{
			files: ['src/components/computer/apps/Namegen.vue'],
			rules: {
				'promise/avoid-new': 'off'
			}
		},
		{
			files: ['src/components/computer/apps/PlantsVsZombies.vue'],
			rules: {
				'eslint/no-alert': 'off'
			}
		},
		{
			files: ['src/components/computer/apps/index.ts'],
			rules: {
				'eslint/no-use-before-define': 'off',
				'import/no-namespace': 'off',
				'unicorn/no-await-expression-member': 'off'
			}
		},
		{
			files: ['src/composables/useLinux.ts'],
			rules: {
				'unicorn/require-post-message-target-origin': 'off'
			}
		},
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
			files: ['src/scripts/patchSubmodules.ts'],
			rules: {
				'eslint/no-useless-escape': 'off'
			}
		},
		{
			files: ['src/components/computer/os-gui/Window.vue', 'src/server/worker.ts', 'vite.config.ts'],
			rules: {
				'eslint/complexity': 'off'
			}
		},
		{
			files: ['src/server/diablo.ts', 'src/server/hydra.ts', 'src/server/tally.ts'],
			rules: {
				'eslint/class-methods-use-this': 'off'
			}
		},
		{
			files: ['src/store/webamp.ts'],
			rules: {
				'eslint/no-empty-function': 'off',
				'unicorn/no-await-expression-member': 'off'
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
		'eslint/no-undefined': 'off',
		'eslint/no-underscore-dangle': ['warn', { allow: ['__TURNSTILE_SITEKEY__', '_memory'] }],
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
		'unicorn/number-literal-case': 'off',
		'unicorn/prefer-global-this': 'off',
		'unicorn/prefer-node-protocol': 'off',
		'vue/max-props': 'off'
	}
});
