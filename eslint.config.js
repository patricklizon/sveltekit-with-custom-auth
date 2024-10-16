import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import drizzle from 'eslint-plugin-drizzle';
import importPlugin from 'eslint-plugin-import';

const typescriptConfig = {
	rules: {
		'@typescript-eslint/consistent-type-definitions': 'off',
		'@typescript-eslint/prefer-ts-expect-error': 'warn',
		'@typescript-eslint/unified-signatures': 'warn',
		'@typescript-eslint/no-dynamic-delete': 'warn',
		'@typescript-eslint/naming-convention': [
			'error',
			{
				selector: 'variable',
				types: ['boolean'],
				format: ['PascalCase'],
				prefix: ['is', 'should', 'has', 'can', 'did', 'will']
			}
		],
		'no-implied-eval': 'off',
		'@typescript-eslint/no-implied-eval': ['error'],
		'no-unused-expressions': 'off',
		'@typescript-eslint/no-unused-expressions': ['error'],
		'no-useless-constructor': 'off',
		'@typescript-eslint/no-useless-constructor': ['error'],
		'no-invalid-this': 'off',
		'@typescript-eslint/no-invalid-this': ['error'],
		'no-shadow': 'off',
		'@typescript-eslint/no-shadow': ['error'],
		'no-return-await': 'off',
		'@typescript-eslint/return-await': 'error',
		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': [
			'error',
			{
				args: 'all',
				argsIgnorePattern: '^_',
				caughtErrors: 'all',
				caughtErrorsIgnorePattern: '^_',
				destructuredArrayIgnorePattern: '^_',
				varsIgnorePattern: '^_',
				ignoreRestSiblings: true
			}
		],
		'@typescript-eslint/no-namespace': [
			'error',
			{
				allowDeclarations: true,
				allowDefinitionFiles: true
			}
		],
		'@typescript-eslint/restrict-template-expressions': [
			'error',
			{
				allowNumber: true,
				allowBoolean: true
			}
		],
		'@typescript-eslint/array-type': 'error',
		'@typescript-eslint/class-literal-property-style': 'error',
		'dot-notation': 'off',
		'@typescript-eslint/dot-notation': 'error',
		'@typescript-eslint/no-base-to-string': 'error',
		'@typescript-eslint/no-extraneous-class': 'error',
		'@typescript-eslint/no-invalid-void-type': 'error',
		'@typescript-eslint/no-meaningless-void-operator': 'error',
		'@typescript-eslint/no-unnecessary-type-assertion': 'error',
		'@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
		'@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
		'@typescript-eslint/no-unnecessary-type-arguments': 'error',
		'@typescript-eslint/non-nullable-type-assertion-style': 'error',
		'@typescript-eslint/prefer-for-of': 'error',
		'@typescript-eslint/prefer-function-type': 'error',
		'@typescript-eslint/prefer-includes': 'error',
		'@typescript-eslint/prefer-nullish-coalescing': 'error',
		'@typescript-eslint/prefer-optional-chain': 'error',
		'@typescript-eslint/prefer-reduce-type-parameter': 'error',
		'@typescript-eslint/prefer-return-this-type': 'error',
		'@typescript-eslint/prefer-string-starts-ends-with': 'error',
		'@typescript-eslint/no-floating-promises': 'error',
		'@typescript-eslint/switch-exhaustiveness-check': [
			'error',
			{ allowDefaultCaseForExhaustiveSwitch: false }
		],
		'@typescript-eslint/no-unnecessary-condition': 'error',
		'@typescript-eslint/no-non-null-assertion': 'error',
		'@typescript-eslint/consistent-type-assertions': [
			'error',
			{
				assertionStyle: 'as',
				objectLiteralTypeAssertions: 'never'
			}
		],
		'@typescript-eslint/explicit-function-return-type': [
			'error',
			{
				allowExpressions: true,
				allowTypedFunctionExpressions: true,
				allowHigherOrderFunctions: true,
				allowConciseArrowFunctionExpressionsStartingWithVoid: true
			}
		],
		'object-shorthand': 'error'
	}
};

const drizzleConfig = {
	plugins: {
		drizzle
	},
	rules: {
		...drizzle.configs.recommended.rules,
		'drizzle/enforce-delete-with-where': ['error', { drizzleObjectName: 'db' }]
	}
};

const drizzleConfigOverride = {
	// override for tests
	plugins: {
		drizzle
	},
	files: ['**/*.spec.*'],
	rules: {
		...drizzle.configs.recommended.rules,
		'drizzle/enforce-delete-with-where': 'off'
	}
};

const importRulesConfig = {
	plugins: {
		import: importPlugin
	},
	rules: {
		...importPlugin.configs.rules,
		'import/no-unresolved': 'off', // check done by typescript
		'import/order': [
			'warn',
			{
				'newlines-between': 'always',
				alphabetize: { order: 'asc', caseInsensitive: true }
			}
		],
		'import/no-default-export': 'warn'
	}
};

export default ts.config(
	js.configs.recommended,
	...ts.configs.strict,
	...ts.configs.stylistic,
	importRulesConfig,
	typescriptConfig,
	...svelte.configs['flat/recommended'],
	prettierConfig,
	...svelte.configs['flat/prettier'],
	drizzleConfig,
	drizzleConfigOverride,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				allowDefaultProject: ['*.js', 'svelte.config.js', 'eslint.config.js', 'drizzle.config.ts'],
				defaultProject: './tsconfig.json',
				tsconfigRootDir: import.meta.dirname
			},
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser,
				extraFileExtensions: ['.svelte']
			}
		}
	},
	{
		ignores: ['build/', '.svelte-kit/', 'dist/', 'data/']
	}
);
