import type { Config } from 'tailwindcss';

export default {
    content: ['./src/**/*.{vue,ts,tsx,js,jsx}'],
    // 组件库不启用 preflight，避免影响使用方的全局样式
    corePlugins: {
        preflight: false,
    },
} satisfies Config;
