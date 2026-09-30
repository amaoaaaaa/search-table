<template>
    <slot />
</template>

<script lang="ts" setup>
import { provide } from 'vue';
import {
    DEFAULT_SEARCH_TABLE_CONFIG,
    resolveSearchTableConfig,
    searchTableConfigKey,
    type SearchTableConfigProviderProps,
} from './config';

defineOptions({ name: 'SearchTableConfigProvider' });

const props = withDefaults(defineProps<SearchTableConfigProviderProps>(), {
    rowHeight: DEFAULT_SEARCH_TABLE_CONFIG.rowHeight,
    headerHeight: DEFAULT_SEARCH_TABLE_CONFIG.headerHeight,
    // 对象类型的 props 需要用工厂函数返回，避免多个实例共享同一个默认对象
    paginationProps: () => DEFAULT_SEARCH_TABLE_CONFIG.paginationProps,
    searchProps: () => DEFAULT_SEARCH_TABLE_CONFIG.searchProps,
});

// 注入一次性快照：配置只在子实例挂载时读取，运行时不响应 props 变化
provide(searchTableConfigKey, resolveSearchTableConfig(props));
</script>
