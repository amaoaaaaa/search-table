<template>
    <div class="search-table flex h-full flex-col">
        <!-- 搜索区 -->
        <section
            v-if="showSearch"
            class="search-table__toolbar mb-6 flex flex-shrink-0 items-center justify-between"
        >
            <div class="search-table__search flex items-center gap-x-3">
                <el-input
                    v-model.trim="searchQuery"
                    class="search-table__search-input !w-[260px] flex-shrink-0"
                    :placeholder="searchInputPlaceholder"
                    clearable
                    @keyup.enter="resetToFirstPage"
                    @clear="resetToFirstPage"
                ></el-input>

                <!-- 更多搜索条件 -->
                <slot name="search-form" :query="query" :search="resetToFirstPage"></slot>

                <el-button
                    class="search-table__search-button"
                    type="primary"
                    @click="resetToFirstPage"
                >
                    <icon-ri-search-line />
                    {{ realSearchButtonText }}
                </el-button>
            </div>

            <!-- 头部中间内容插槽 -->
            <slot name="top-center"></slot>

            <div class="search-table__actions">
                <el-button
                    v-if="showAddButton"
                    class="search-table__add-button"
                    type="primary"
                    @click="emit('add')"
                >
                    <icon-ri-add-line />{{ realAddButtonText }}
                </el-button>

                <el-button
                    v-if="showBatchDeleteButton"
                    class="search-table__batch-delete-button"
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

        <!-- 表格区：默认渲染 ProTable，可通过 #table 插槽替换为自定义表格 -->
        <slot
            name="table"
            :data="tableData"
            :loading="delayedLoading"
            :columns="props.columns"
            :index-offset="realOffset"
            :default-sort="tableDefaultSort"
            :apply-filter="handleApplyFilter"
            :selection-change="handleSelectionChange"
            :cell-edit="handleCellEdit"
            :sort-change="onSortChange"
        >
            <ProTable
                ref="proTableRef"
                v-bind="props"
                class="search-table__body flex-1 overflow-hidden"
                :index-offset="realOffset"
                :data="tableData"
                :loading="delayedLoading"
                :default-sort="tableDefaultSort"
                @apply-filter="handleApplyFilter"
                @selection-change="handleSelectionChange"
                @cell-edit="handleCellEdit"
                @sort-change="onSortChange"
            />
        </slot>

        <!-- 分页区 -->
        <!-- FIX 分页点击下一页，UI变了，如果请求失败会导致 UI 和实际显示数据不一致 -->
        <section class="search-table__footer mt-5 flex flex-shrink-0 items-center justify-between">
            <div class="search-table__selection flex w-[164px] items-center">
                <template v-if="selectable">
                    <el-text type="info">已选 {{ selectionRows.length }} 条</el-text>

                    <el-tooltip
                        v-if="selectionRows.length"
                        content="清空勾选"
                        placement="top"
                        effect="dark"
                        :hide-after="0"
                    >
                        <el-button
                            type="danger"
                            text
                            class="search-table__clear-selection-button ml-1 !px-2"
                            @click="clearSelectableSelection"
                        >
                            <icon-ri-delete-back-2-line />
                        </el-button>
                    </el-tooltip>
                </template>
            </div>

            <el-pagination
                v-bind="paginationProps"
                v-model:page-size="pagination.pageSize"
                v-model:current-page="pagination.currPage"
                :total="pagination.total"
                :page-sizes="pageSizes"
                class="search-table__pagination flex-shrink-0"
                @size-change="fetchList"
                @current-change="fetchList"
            ></el-pagination>

            <div class="search-table__footer-spacer w-[164px]"></div>
        </section>
    </div>
</template>

<script lang="ts" setup generic="T extends TableRow = any">
import { ElMessage } from 'element-plus';
import { ElButton, ElInput, ElPagination, ElText, ElTooltip } from 'element-plus';
import { SearchTableFetchSuccessPayload, SearchTableProps } from './types';
import ProTable from '../ProTable/index.vue';
import { ApplyFilterPayload, CellEditPayload, ProTableColumn, TableRow } from '../ProTable/types';
import { isCancel } from 'axios';
import { cloneDeep, countBy, keys, map, pickBy, sortBy, uniq } from 'lodash-es';
import { parseErrorReason } from '../utils/parseErrorReason';
import { SelectionStore } from './SelectionStore';
import { useDelayedRef } from '../hooks/useDelayedRef';
import { useTableSort } from './useTableSort';
import { DEFAULT_SEARCH_TABLE_CONFIG, mergePaginationProps, searchTableConfigKey } from './config';
import {
    computed,
    ref,
    reactive,
    nextTick,
    watch,
    onMounted,
    onUnmounted,
    inject,
    useTemplateRef,
    type Ref,
} from 'vue';
import IconRiSearchLine from '~icons/ri/search-line';
import IconRiAddLine from '~icons/ri/add-line';
import IconRiDeleteBinLine from '~icons/ri/delete-bin-line';
import IconRiDeleteBack2Line from '~icons/ri/delete-back2-line';

const props = withDefaults(defineProps<SearchTableProps<T>>(), {
    showSearch: true,
    searchInputPlaceholder: '输入搜索关键词',
    searchField: 'search',

    // ProTable 的默认值
    showIndex: true,
    indexWidth: 70,
    rowKey: 'id',
});

const emit = defineEmits<{
    add: [];
    'batch-delete': [rows: T[]];
    'cell-edit': [payload: CellEditPayload<T>];
    'fetch-success': [payload: SearchTableFetchSuccessPayload<T>];
}>();

/**
 * 插槽类型声明
 *
 * @description
 * `table` 插槽用于替换默认的 ProTable 渲染，这里把渲染表格所需的
 * 数据与交互回调一并声明出来，使用方在模板中可以直接获得类型提示；
 * 同时通过 `slots.table` 判断使用方是否接管了表格渲染。
 */
const slots = defineSlots<{
    /** 搜索框右侧的更多搜索条件 */
    'search-form'?: (props: { query: Record<string, any>; search: () => void }) => any;
    /** 顶部区域中间内容 */
    'top-center'?: () => any;
    /** 操作区追加按钮 */
    btns?: () => any;
    /** 替换默认表格 */
    table?: (props: {
        /** 当前页数据 */
        data: T[];
        /** 表格加载状态（带延迟，避免闪烁） */
        loading: boolean;
        /** 表格列配置 */
        columns: ProTableColumn<T>[];
        /** 序号列的起始偏移量 */
        indexOffset: number;
        /** 默认排序（element-plus 的排序顺序） */
        defaultSort: { prop: string | number | symbol; order: 'ascending' | 'descending' };
        /** 应用列筛选条件 */
        applyFilter: (payload: ApplyFilterPayload) => void;
        /** 勾选变化 */
        selectionChange: (rows: T[]) => void;
        /** 单元格编辑完成 */
        cellEdit: (payload: CellEditPayload<T>) => void;
        /** 排序变化 */
        sortChange: (payload: { prop: string; order: 'ascending' | 'descending' | null }) => void;
    }) => any;
}>();

const tableRef = useTemplateRef('proTableRef');

/** 全局配置（行高、表头高度、分页配置），由 SearchTableConfigProvider 提供 */
const globalConfig = inject(searchTableConfigKey, DEFAULT_SEARCH_TABLE_CONFIG);

/**
 * 分页组件的视觉配置
 *
 * 优先取 `elPaginationProps`（实例级），其次取全局配置，最后取默认配置
 */
const paginationProps = computed(() =>
    mergePaginationProps(globalConfig.paginationProps, props.elPaginationProps),
);

/**
 * 搜索按钮文字
 *
 * 优先取实例的 `searchButtonText`，其次取全局配置的 `searchProps.searchButtonText`
 */
const realSearchButtonText = computed(
    () => props.searchButtonText ?? globalConfig.searchProps.searchButtonText,
);

/**
 * 新增按钮文字
 *
 * 优先取实例的 `addButtonText`，其次取全局配置的 `searchProps.addButtonText`
 */
const realAddButtonText = computed(
    () => props.addButtonText ?? globalConfig.searchProps.addButtonText,
);

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

/**
 * 传给表格的默认排序
 *
 * @description
 * 把组件内部的排序状态映射为 element-plus 的排序顺序；
 * 通过 `table` 插槽替换表格时，使用方也可以直接复用这个值
 */
const tableDefaultSort = computed(() => {
    const order: 'ascending' | 'descending' =
        sortState.order === 'asc' ? 'ascending' : 'descending';

    return {
        prop: sortState.sort,
        order,
    };
});

/** 无法根据容器高度计算每页条数时的兜底值（如通过 `table` 插槽替换表格） */
const DEFAULT_PAGE_SIZE = 10;

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

/** 搜索框绑定的字段名 */
const searchField = computed(() => props.searchField ?? 'search');

const query = ref<Record<string, any>>({
    [searchField.value]: '',
});

/** 搜索框 v-model，动态绑定 searchField 指定的字段 */
const searchQuery = computed<string>({
    get: () => query.value[searchField.value] ?? '',
    set: (val) => {
        query.value[searchField.value] = val;
    },
});
const filterParams = reactive<Record<string, any>>({});

const tableData: Ref<T[]> = ref([]);
const loading = ref(false);
const delayedLoading = useDelayedRef(loading, 100);

let abortController: AbortController | null = null;

async function fetchList(): Promise<boolean> {
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
        const { data = [], totalCount = 0 } = await props.fetchFn(paramsRes, {
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

        emit('fetch-success', { params: paramsRes, data });
        loading.value = false;
        return true;
    } catch (error) {
        // 用户取消，则直接结束，不需要报错
        // 也不能关 loading，否则会导致下一次请求没有 loading
        if (isCancel(error)) return false;

        console.error('[SearchTable] 获取数据失败', error);
        ElMessage.error('表格数据加载失败：' + parseErrorReason(error));
        loading.value = false;
        return false;
    }
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

/**
 * 单元格编辑完成，透传给使用方
 *
 * @param payload 单元格编辑信息
 */
function handleCellEdit(payload: CellEditPayload<T>) {
    emit('cell-edit', payload);
}

const refresh = async () => {
    if (loading.value) return;

    const success = await fetchList();
    if (!success) return;

    // 等待新数据完成渲染后再同步当前页的可勾选状态
    await nextTick();
    clearSelectableSelection();
};

/**
 * 计算表格中可显示的最大行数
 *
 * @description
 * 该函数通过获取表格容器的高度，减去表头高度后，
 * 根据每行的高度计算出表格主体区域最多可以显示多少行数据。
 * 表头高度与行高默认取 element-plus 表格的默认样式尺寸，
 * 业务修改了表格样式时可通过 SearchTableConfigProvider 统一覆盖。
 *
 * @returns 返回表格中可显示的最大行数
 */
function calcMaxRow() {
    const { rowHeight, headerHeight } = globalConfig;

    // 获取表格容器元素并计算表格主体区域的最大高度
    // 用 `table` 插槽替换表格时没有 ProTable 实例，无法测量高度
    const tableWrap = tableRef.value?.$el as HTMLElement | undefined;
    if (!tableWrap) return 0;

    const tableBodyMaxHeight = tableWrap.offsetHeight - headerHeight;

    // 根据表格主体区域最大高度和每行高度计算最大行数
    const maxRow = Math.floor(tableBodyMaxHeight / rowHeight);

    return maxRow;
}

// --------- 勾选功能 ---------

/** 已勾选的行，用于双向绑定 */
const selectionRows: Ref<T[]> = ref([]);
const _selectionRows = computed(() => selectionRows.value);

/** 跨页勾选存储 */
const selectionStore = new SelectionStore<T>(props.rowKey);
/** 标识是否正在恢复跨页勾选，用于阻止一些逻辑执行 */
let isRestoring = false;

/** 获取行的可勾选状态，跨页程序化选择传入 -1 */
const isRowSelectable = (row: T, index: number) => {
    const selectable = props.selectable;
    return typeof selectable === 'function' ? selectable(row, index) : selectable === true;
};

/**
 * 表格勾选回调事件处理
 * @param rows 当前页勾选行
 */
const handleSelectionChange = (rows: T[]) => {
    // 恢复跨页勾选时候不执行
    if (isRestoring) return;

    // 同步到跨页勾选存储
    selectionStore.syncPage(tableData.value, rows, isRowSelectable);

    // 更新双向绑定
    selectionRows.value = selectionStore.values;

    // console.log(`已选 ${selectionStore.values.length} 条`);
    // console.log(selectionStore.ids);
};

const getSelectionRows = () => selectionRows.value;

const selectRows = (rows: T[]) => {
    handleSelectionChange(rows);
};

/**
 * 清空未禁用的勾选，保留禁用选择
 *
 * @description 禁用行没有可替换的新数据时仍会保留最近一次的可勾选状态。
 */
const clearSelectableSelection = () => {
    // 清空前重新计算当前页状态，处理行状态发生变化的情况
    selectionStore.syncSelectable(tableData.value, isRowSelectable);

    const table = tableRef.value?.tableInstance;
    const rowsToDeselect = (table?.getSelectionRows() ?? []).filter((row) =>
        selectionStore.isSelectable(row[props.rowKey]),
    );

    selectionStore.clearSelectable();
    rowsToDeselect.forEach((row) => table?.toggleRowSelection(row, false));
    selectionRows.value = selectionStore.values;
};

if (props.selectable) {
    // 监听数据变化
    watch(tableData, async () => {
        // 防止触发 handleSelectionChange
        isRestoring = true;

        await nextTick();

        // 恢复已勾选的行
        selectionStore.restorePageSelection(
            tableData.value,
            (row, selected) => {
                tableRef.value?.tableInstance?.toggleRowSelection(row, selected);
            },
            isRowSelectable,
        );

        await nextTick();

        // 恢复后同步最新行数据
        selectionRows.value = selectionStore.values;

        // 允许触发 handleSelectionChange
        isRestoring = false;
    });
}

// --------- xxx ---------

/**
 * 监测重复的 rowKey
 * @param data
 */
function checkDuplicateRowKey(data: T[]) {
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
        // 用 `table` 插槽替换表格时表格高度由使用方决定，不再自动计算每页条数
        if (slots.table) {
            console.warn(
                `[SearchTable] 使用 table 插槽替换表格时无法自动计算每页条数，将使用默认值 ${DEFAULT_PAGE_SIZE}，可通过 pageSize 指定`,
            );

            defaultPageSize.value = DEFAULT_PAGE_SIZE;
        } else {
            // 计算表格中可显示的最大行数
            defaultPageSize.value = calcMaxRow();
        }

        pagination.value.pageSize = defaultPageSize.value;
    }

    fetchList();
});

onUnmounted(() => {
    // 销毁时取消上一次请求
    abortController?.abort();
});

defineExpose({
    /**
     * 刷新当前页；成功后清除未禁用勾选，保留禁用勾选
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
