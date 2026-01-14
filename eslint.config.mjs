import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    {
        languageOptions: { ecmaVersion: 'latest' },
        rules: {
            'dot-location': ['error', 'property'],
            'handle-callback-err': 'off',
            'keyword-spacing': 'error',
            'max-nested-callbacks': ['error', { max: 4 }],
            'max-statements-per-line': ['error', { max: 2 }],
            'no-console': 'off',
            'no-empty-function': 'error',
            'no-floating-decimal': 'error',
            'no-lonely-if': 'error',
            'no-multi-spaces': 'error',
            'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1, maxBOF: 0 }],
            'no-shadow': ['error', { allow: ['err', 'resolve', 'reject'] }],
            'no-trailing-spaces': ['error'],
            'no-var': 'error',
            'no-undef': 'off',
            'object-curly-spacing': ['error', 'always'],
            'prefer-const': 'error',
            semi: ['error', 'always'],
            yoda: 'error',
        },
        ignores: [
            'node_modules/**',
            'dist/**',
        ],
    }
);
