<template>
    <slot />
</template>

<script lang="ts" setup>
import { provide } from 'vue';
import {
    DEFAULT_SEARCH_TABLE_HEIGHT_CONFIG,
    resolveHeightConfig,
    searchTableConfigKey,
    type SearchTableConfigProviderProps,
} from './config';

defineOptions({ name: 'SearchTableConfigProvider' });

const props = withDefaults(defineProps<SearchTableConfigProviderProps>(), {
    rowHeight: DEFAULT_SEARCH_TABLE_HEIGHT_CONFIG.rowHeight,
    headerHeight: DEFAULT_SEARCH_TABLE_HEIGHT_CONFIG.headerHeight,
});

// 注入一次性快照：高度只在子实例挂载时读取，运行时不响应 props 变化
provide(searchTableConfigKey, resolveHeightConfig(props));
</script>
