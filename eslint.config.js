import pluginVue from 'eslint-plugin-vue';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import eslintJs from '@eslint/js';
import globals from 'globals';
import vueParser from 'vue-eslint-parser';

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const autoImportGlobals = require('./.eslintrc-auto-import.json').globals;

export default [
    // ============ 全局忽略文件 ============
    {
        ignores: [
            'node_modules',
            'dist',
            'demo-dist',
            '.history',
            'components.d.ts',
            'auto-imports.d.ts',
        ],
    },

    // ============ ESLint 推荐规则（适用于所有 JS/TS 文件） ============
    eslintJs.configs.recommended,

    // ============ Vue 3 推荐规则（适用于 .vue 文件） ============
    ...pluginVue.configs['flat/recommended'],

    // ============ TypeScript 推荐规则（适用于 .ts 文件） ============
    ...tsPlugin.configs['flat/recommended'],

    // ============ 通用规则覆盖 ============
    {
        rules: {
            // 禁止使用 var
            'no-var': 'error',

            // 禁止包含 debugger
            'no-debugger': 'error',

            // 意外的恒定条件，例如：while (true) {...}
            'no-constant-condition': 'warn',

            // 禁止提交包含 DEBUG 的注释
            'no-warning-comments': ['error', { terms: ['DEBUG'], location: 'start' }],
        },
    },

    // ============ TypeScript + Vue 文件特定规则覆盖 ============
    {
        files: ['**/*.ts', '**/*.vue'],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                ecmaVersion: 'latest',
                parser: tsParser,
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
                warnOnUnsupportedTypeScriptVersion: false,
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,
                NodeJS: 'readonly',
            },
        },
        rules: {
            // 未定义的变量提示报错
            'no-undef': 'error',

            // 关闭 Prettier 格式检查（交给 Prettier 自身处理）
            'prettier/prettier': 'off',

            // 允许定义但未使用的变量
            '@typescript-eslint/no-unused-vars': 'off',

            // 允许使用 any 类型
            '@typescript-eslint/no-explicit-any': 'off',

            // 允许单单词组件名
            'vue/multi-word-component-names': 'off',

            // 'v-html' 可能导致 XSS 攻击，发出警告
            'vue/no-v-html': 'warn',

            // 允许类似：this.timer && clearTimeout(this.timer) 的表达式
            '@typescript-eslint/no-unused-expressions': 'off',

            // 允许空对象类型
            '@typescript-eslint/no-empty-object-type': 'off',

            // 强制枚举命名为 PascalCase
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'enum',
                    format: ['PascalCase'],
                },
                {
                    selector: 'enumMember',
                    format: ['PascalCase'],
                },
            ],

            // ban-ts-comment 从 error 降为 warn
            '@typescript-eslint/ban-ts-comment': [
                'warn',
                {
                    'ts-nocheck': 'allow-with-description',
                    minimumDescriptionLength: 3,
                },
            ],

            // 在代码中使用 require() 导入模块时发出警告
            '@typescript-eslint/no-require-imports': 'warn',
        },
    },

    // ============ Auto-import 全局变量 ============
    {
        files: ['**/*.ts', '**/*.vue'],
        languageOptions: {
            globals: autoImportGlobals,
        },
    },

    // ============ Prettier（需放在最后以覆盖其他格式化规则） ============
    eslintConfigPrettier,
];
