import { defineConfig } from 'vite';
import { resolve } from 'path';
import { exec } from 'child_process';
import vue from '@vitejs/plugin-vue';
import Icons from 'unplugin-icons/vite';
import dts from 'vite-plugin-dts';
import { visualizer } from 'rollup-plugin-visualizer';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// 通过 mode 区分：
//   - 默认模式（无 --mode 参数）：库构建（npm run build）
//   - demo 模式（--mode demo）：demo 应用构建（npm run build:demo）
//   - analyze 模式（--mode analyze）：库构建 + 打包分析（npm run build:analyze）
export default defineConfig(({ mode }) => {
    const isDemo = mode === 'demo';
    const isAnalyze = mode === 'analyze';

    return {
        plugins: [
            vue(),

            Icons({
                autoInstall: true,
            }),

            // 仅 library 构建时生成类型声明
            !isDemo &&
                dts({
                    tsconfigPath: './tsconfig.build.json',
                    outDir: './dist',
                }),

            // 打包大小分析（--mode analyze）
            isAnalyze &&
                visualizer({
                    filename: 'stats.html',
                    open: false,
                    gzipSize: true,
                    brotliSize: true,
                }),

            // analyze 模式下构建完成后自动打开分析报告
            isAnalyze && {
                name: 'open-analyze-report',
                closeBundle() {
                    const reportPath = resolve(__dirname, 'stats.html');
                    exec(`start "" "${reportPath}"`);
                },
            },
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
                          '@amaoaaaaa/v-text-ellipsis',
                          /node_modules/,
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
