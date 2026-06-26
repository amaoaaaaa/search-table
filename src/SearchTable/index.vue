<template>
    <div class="flex h-full flex-col">
        <!-- 搜索区 -->
        <section v-if="showSearch" class="mb-6 flex flex-shrink-0 items-center justify-between">
            <div class="flex items-center gap-x-3">
                <el-input
                    v-model.trim="query.search"
                    class="!w-[260px] flex-shrink-0"
                    :placeholder="searchInputPlaceholder"
                    clearable
                    @keyup.enter="resetToFirstPage"
                    @clear="resetToFirstPage"
                ></el-input>

                <!-- 更多搜索条件 -->
                <slot name="search-form" :query="query" :search="resetToFirstPage"></slot>

                <el-button type="primary" @click="resetToFirstPage">
                    <icon-ri-search-line />
                    搜索
                </el-button>
            </div>

            <!-- 头部中间内容插槽 -->
            <slot name="top-center"></slot>

            <div>
                <el-button v-if="showAddButton" type="primary" @click="emit('add')">
                    <icon-ri-add-line />新增
                </el-button>

                <el-button
                    v-if="showBatchDeleteButton"
                    :disabled="!selectionRows.length"
                    type="danger"
                    @click="emit('batch-delete', selectionRows)"
                >
                    <icon-ri-delete-bin-line />批量删除
                </el-button>

                <!-- 更多操作按钮 -->
                <slot name="btns"></slot>
            </div>
        </section>

        <!-- 表格区 -->
        <ProTable
            ref="proTableRef"
            v-bind="props"
            class="flex-1 overflow-hidden"
            :index-offset="realOffset"
            :data="tableData"
            :loading="delayedLoading"
            :default-sort="{
                prop: sortState.sort,
                order: sortState.order === 'asc' ? 'ascending' : 'descending',
            }"
            @apply-filter="handleApplyFilter"
            @selection-change="handleSelectionChange"
            @cell-edit="(...p) => emit('cell-edit', ...p)"
            @sort-change="onSortChange"
        />

        <!-- 分页区 -->
        <!-- FIX 分页点击下一页，UI变了，如果请求失败会导致 UI 和实际显示数据不一致 -->
        <section class="mt-5 flex flex-shrink-0 items-center justify-between">
            <div class="flex w-[164px] items-center">
                <template v-if="selectable">
                    <el-text type="info">已选 {{ selectionRows.length }} 条</el-text>

                    <el-tooltip
                        v-if="selectionRows.length"
                        content="清空勾选"
                        placement="top"
                        effect="dark"
                        :hide-after="0"
                    >
                        <el-button type="danger" text class="ml-1 !px-2" @click="clearSelection">
                            <icon-ri-delete-back-2-line />
                        </el-button>
                    </el-tooltip>
                </template>
            </div>

            <el-pagination
                v-bind="elPaginationProps"
                v-model:page-size="pagination.pageSize"
                v-model:current-page="pagination.currPage"
                :total="pagination.total"
                background
                :page-sizes="pageSizes"
                layout="total, sizes, prev, pager, next, jumper"
                class="flex-shrink-0"
                @size-change="fetchList"
                @current-change="fetchList"
            ></el-pagination>

            <div class="w-[164px]"></div>
        </section>
    </div>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import { ElButton, ElInput, ElPagination, ElText, ElTooltip } from 'element-plus';
import { SearchTableProps } from './types';
import ProTable from '../ProTable/index.vue';
import { ApplyFilterPayload, CellEditPayload, TableRow } from '../ProTable/types';
import { isCancel } from 'axios';
import { cloneDeep, countBy, keys, map, pickBy, sortBy, uniq } from 'lodash-es';
import { parseErrorReason } from '../utils/parseErrorReason';
import { SelectionStore } from './SelectionStore';
import { useDelayedRef } from '../hooks/useDelayedRef';
import { useTableSort } from './useTableSort';
import {
    computed,
    ref,
    reactive,
    nextTick,
    watch,
    onMounted,
    onUnmounted,
    useTemplateRef,
} from 'vue';
import IconRiSearchLine from '~icons/ri/search-line';
import IconRiAddLine from '~icons/ri/add-line';
import IconRiDeleteBinLine from '~icons/ri/delete-bin-line';
import IconRiDeleteBack2Line from '~icons/ri/delete-back2-line';

const props = withDefaults(defineProps<SearchTableProps>(), {
    showSearch: true,
    searchInputPlaceholder: '输入搜索关键词',

    // ProTable 的默认值
    showIndex: true,
    indexWidth: 70,
    rowKey: 'id',
});

const emit = defineEmits<{
    add: [];
    'batch-delete': [rows: any[]];
    'cell-edit': [payload: CellEditPayload];
}>();

const tableRef = useTemplateRef('proTableRef');

const { sortState, onSortChange } = useTableSort({
    defaultSort: props.defaultSort,
    fetchFn: fetchList,
    onReset() {
        const prop = sortState.sort;
        const order = sortState.order === 'asc' ? 'ascending' : 'descending';

        // 表格有显示需要排序的这一列时，sort 方法才有效
        if (props.columns.some((column) => column.prop === prop)) {
            tableRef.value?.tableInstance?.sort(prop, order);
        } else {
            fetchList();
        }
    },
});

const defaultPageSize = ref(props.pageSize ?? 0);
const pagination = ref({
    pageSize: defaultPageSize.value,
    currPage: 1,
    total: 0,
});

const pageSizes = computed(() => {
    return sortBy(uniq([defaultPageSize.value, 10, 20, 30, 40, 50, 100]));
});

/** 查询用的 offset */
const offset = computed(() => (pagination.value.currPage - 1) * pagination.value.pageSize);
/** 当前数据的实际 offset */
const realOffset = ref(0);

const query = ref<{ search: string; [key: string]: any }>({
    search: '',
});
const filterParams = reactive<Record<string, any>>({});

const tableData = ref<any[]>([]);
const loading = ref(false);
const delayedLoading = useDelayedRef(loading, 100);

let abortController: AbortController | null = null;

async function fetchList() {
    // 取消上一次请求
    abortController?.abort();
    abortController = new AbortController();

    loading.value = true;

    const currOffset = offset.value;

    try {
        const params = {
            ...query.value,
            ...filterParams,
            ...sortState,
            limit: pagination.value.pageSize,
            offset: currOffset,
        };
        const paramsRes = props.searchParamsHandler ? props.searchParamsHandler(params) : params;

        // 请求数据
        const { data = [], totalCount } = await props.fetchFn(paramsRes, {
            signal: abortController.signal,
        });

        // console.log('请求数据', data);

        // 更新表格
        tableData.value = data;
        realOffset.value = currOffset;
        pagination.value.total = totalCount;
        await nextTick(() => {
            // 表格滚回顶部
            tableRef.value?.tableInstance?.setScrollTop(0);
            // 重置单元格阵列的状态
            tableRef.value?.resetCells();
        });

        if (props.selectable) {
            // 监测重复的 rowKey
            checkDuplicateRowKey(data);
        }
    } catch (error) {
        // 用户取消，则直接结束，不需要报错
        // 也不能关 loading，否则会导致下一次请求没有 loading
        if (isCancel(error)) return;

        console.error('[SearchTable] 获取数据失败', error);
        ElMessage.error('表格数据加载失败：' + parseErrorReason(error));
    }

    loading.value = false;
}

/**
 * 重置到第一页
 */
function resetToFirstPage() {
    pagination.value.currPage = 1;
    fetchList();
}

/**
 * 应用过滤条件
 */
function handleApplyFilter({ type, value, prop, col }: ApplyFilterPayload) {
    // 处理过滤参数
    if (type === 'datetimerange') {
        const [start = `${prop}Start`, end = `${prop}End`] =
            col.datetimerangeFilterFieldNames || [];
        const [startValue, endValue] = value || [];

        filterParams[start] = startValue;
        filterParams[end] = endValue;
    } else {
        filterParams[prop] = value;
    }

    resetToFirstPage();
}

const refresh = async () => {
    if (loading.value) return;
    clearSelection();
    await fetchList();
};

/**
 * 计算表格中可显示的最大行数
 *
 * @description
 * 该函数通过获取表格容器的高度，减去表头高度后，
 * 根据每行的高度计算出表格主体区域最多可以显示多少行数据。
 *
 * @returns 返回表格中可显示的最大行数
 */
function calcMaxRow() {
    // 定义表头高度和每行高度的常量
    const TABLE_HEAD_HEIGHT = 40;
    const ROW_HEIGHT = 40;

    // 获取表格容器元素并计算表格主体区域的最大高度
    const tableWrap = tableRef.value?.$el as HTMLElement;
    const tableBodyMaxHeight = tableWrap.offsetHeight - TABLE_HEAD_HEIGHT;

    // 根据表格主体区域最大高度和每行高度计算最大行数
    const maxRow = Math.floor(tableBodyMaxHeight / ROW_HEIGHT);

    return maxRow;
}

// --------- 勾选功能 ---------

/** 已勾选的行，用于双向绑定 */
const selectionRows = ref<TableRow[]>([]);
const _selectionRows = computed(() => selectionRows.value);

/** 跨页勾选存储 */
const selectionStore = new SelectionStore<TableRow>(props.rowKey);
/** 标识是否正在恢复跨页勾选，用于阻止一些逻辑执行 */
let isRestoring = false;

/**
 * 表格勾选回调事件处理
 * @param rows
 */
const handleSelectionChange = (rows: TableRow[]) => {
    // 恢复跨页勾选时候不执行
    if (isRestoring) return;

    // 同步到跨页勾选存储
    selectionStore.syncPage(tableData.value, rows);

    // 更新双向绑定
    selectionRows.value = selectionStore.values;

    // console.log(`已选 ${selectionStore.values.length} 条`);
    // console.log(selectionStore.ids);
};

const getSelectionRows = () => selectionRows.value;

const selectRows = (rows: TableRow[]) => {
    handleSelectionChange(rows);
};

const clearSelection = () => {
    tableRef.value?.tableInstance?.clearSelection();
    selectionRows.value = [];
    selectionStore.clear();
};

if (props.selectable) {
    // 监听数据变化
    watch(tableData, async () => {
        // 防止触发 handleSelectionChange
        isRestoring = true;

        await nextTick();

        // 恢复已勾选的行
        selectionStore.restorePageSelection(tableData.value, (row, selected) => {
            tableRef.value?.tableInstance?.toggleRowSelection(row, selected);
        });

        await nextTick();

        // 允许触发 handleSelectionChange
        isRestoring = false;
    });
}

// --------- xxx ---------

/**
 * 监测重复的 rowKey
 * @param data
 */
function checkDuplicateRowKey(data: TableRow[]) {
    const rowKeys = data.map((row) => row[props.rowKey]);
    const duplicateRowKeys = keys(pickBy(countBy(rowKeys), (v) => v > 1));

    if (duplicateRowKeys.length) {
        console.error(
            '[SearchTable] 表格数据存在重复的 rowKey，将会导致勾选功能异常！',
            duplicateRowKeys,
        );
    }
}

onMounted(() => {
    // 初始化分页大小
    if (!pagination.value.pageSize) {
        // 计算表格中可显示的最大行数
        const size = calcMaxRow();

        defaultPageSize.value = size;
        pagination.value.pageSize = size;
    }

    fetchList();
});

onUnmounted(() => {
    // 销毁时取消上一次请求
    abortController?.abort();
});

defineExpose({
    /**
     * 刷新当前页
     */
    refresh,

    /**
     * 已勾选的行
     */
    selectedRows: _selectionRows,

    /**
     * 获取已勾选的行
     */
    getSelectionRows,

    /**
     * 勾选指定行
     */
    selectRows,
});
</script>

<style lang="scss" scoped>
::v-deep() {
    .el-table {
        .el-table-column--selection.el-table__cell {
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }

    .el-button > span {
        gap: 0 4px;
    }
}

.el-pagination {
    ::v-deep(.el-pagination__sizes .el-select) {
        width: 110px;
    }
}
</style>
