import { defineConfig } from 'vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import dts from 'vite-plugin-dts';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// 通过 mode 区分：
//   - 默认模式（无 --mode 参数）：库构建（npm run build）
//   - demo 模式（--mode demo）：demo 应用构建（npm run build:demo）
export default defineConfig(({ mode }) => {
    const isDemo = mode === 'demo';

    return {
        plugins: [
            vue(),

            AutoImport({
                imports: ['vue', 'vue-router'],
                resolvers: [ElementPlusResolver()],
                eslintrc: {
                    enabled: true,
                    filepath: './.eslintrc-auto-import.json',
                    globalsPropValue: true,
                },
            }),

            Components({
                resolvers: [
                    ElementPlusResolver({ importStyle: 'sass' }),
                    IconsResolver({ prefix: 'icon' }),
                ],
            }),

            Icons({
                autoInstall: true,
            }),

            // 仅 library 构建时生成类型声明
            !isDemo &&
                dts({
                    tsconfigPath: './tsconfig.build.json',
                    outDir: './dist',
                }),
        ].filter(Boolean),

        resolve: {
            alias: {
                // demo 中可通过 "@amaoaaaaa/search-table" 导入本地源码
                '@amaoaaaaa/search-table': resolve(__dirname, 'src/index.ts'),
            },
        },

        css: {
            postcss: {
                plugins: [tailwindcss(), autoprefixer()],
            },
        },

        build: isDemo
            ? {
                  outDir: resolve(__dirname, 'demo-dist'),
                  emptyOutDir: true,
                  cssCodeSplit: false,
              }
            : {
                  lib: {
                      entry: resolve(__dirname, 'src/index.ts'),
                      name: 'SearchTable',
                      fileName: 'search-table',
                      formats: ['es'],
                  },
                  rollupOptions: {
                      external: [
                          'vue',
                          'element-plus',
                          'axios',
                          'lodash-es',
                          /^element-plus\/.*/,
                          /^@element-plus\/.*/,
                          /^lodash-es\/.*/,
                      ],
                      output: {
                          globals: {
                              vue: 'Vue',
                              'element-plus': 'ElementPlus',
                          },
                      },
                  },
                  cssCodeSplit: false,
              },
    };
});
