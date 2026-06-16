<template>
    <component :is="res" v-if="isVNode(res)" />
    <span v-else v-html="res" />
</template>

<script lang="ts" setup>
import { computed, isVNode } from 'vue';
import { ProTableColumn } from '../types';

const props = defineProps<{
    col: ProTableColumn;
    row: any;
    column: any;
    index: number;
}>();

const res = computed(() => {
    const val = props.col['prop'] ? props.row[props.col['prop']] : undefined;

    return props.col.formatter?.(props.row, props.column, val, props.index);
});
</script>

<style lang="scss" scoped></style>
