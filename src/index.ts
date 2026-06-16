// Tailwind CSS（打包时生成组件库使用的工具类）
import './tailwind.css';

// 组件
export { default as SearchTable } from './SearchTable/index.vue';
export { default as ProTable } from './ProTable/index.vue';

// 组件实例类型
export type { ProTableInstance } from './ProTable';

// SearchTable 类型
export type {
    SearchTableProps,
    SearchTableFetchFn,
    PageParams,
    PageResp,
} from './SearchTable/types';

// ProTable 类型
export type {
    ProTableProps,
    ProTableColumn,
    ProTableAction,
    TableRow,
    ElTableColumnProps,
    FilterOption,
    FilterType,
    ActionButtonVisibility,
    ApplyFilterPayload,
    CellEditPayload,
} from './ProTable/types';

// 工具
export { SelectionStore } from './SearchTable/SelectionStore';
export { useTableSort } from './SearchTable/useTableSort';
export type { SortState, UseTableSortOption } from './SearchTable/useTableSort';
export { useDelayedRef } from './hooks/useDelayedRef';
export { parseErrorReason } from './utils/parseErrorReason';
