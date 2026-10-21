import { cloneDeep, isEqual } from 'lodash-es';
import { reactive } from 'vue';

export interface SortState<T extends Record<string, any> = Record<string, any>> {
    /**
     * 排序方式
     */
    order: 'asc' | 'desc';
    /**
     * 排序字段
     */
    sort: Extract<keyof T, string>;
}

export interface UseTableSortOption<T extends Record<string, any> = Record<string, any>> {
    defaultSort?: SortState<T>;
    fetchFn: () => void;
    onReset?: () => void;
}

/**
 * 组件内部的排序状态
 *
 * @description
 * 未配置默认排序时，`sort` 和 `order` 需要允许空值；
 * 用户配置的 `defaultSort` 仍通过 `SortState<T>` 约束为实际行字段。
 */
interface InternalSortState {
    order: 'asc' | 'desc' | '';
    sort: string;
}

export function useTableSort<T extends Record<string, any> = Record<string, any>>({
    defaultSort,
    fetchFn,
    onReset,
}: UseTableSortOption<T>) {
    const DEFAULT_SORT: InternalSortState = defaultSort
        ? cloneDeep(defaultSort)
        : {
              order: '',
              sort: '',
          };

    const sortState = reactive<InternalSortState>(cloneDeep(DEFAULT_SORT));
    let beforeSortState = cloneDeep(sortState);

    function onSortChange({
        prop,
        order,
    }: {
        prop: string;
        order: 'ascending' | 'descending' | null;
    }) {
        if (!order) {
            sortState.sort = DEFAULT_SORT.sort;
            sortState.order = DEFAULT_SORT.order;

            // 处理后的排序跟之前是一样的
            if (isEqual(sortState, beforeSortState)) {
                // 给他倒过来再请求
                sortState.order = sortState.order === 'asc' ? 'desc' : 'asc';
            }

            onReset ? onReset() : fetchFn();
        } else {
            sortState.sort = prop || '';
            sortState.order = order === 'ascending' ? 'asc' : 'desc';

            fetchFn();
        }

        beforeSortState = cloneDeep(sortState);
    }

    return {
        sortState,
        onSortChange,
    };
}
