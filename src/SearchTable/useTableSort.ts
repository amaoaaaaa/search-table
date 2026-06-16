import { cloneDeep, isEqual, merge } from 'lodash-es';
import { reactive } from 'vue';

export interface SortState<T extends Record<string, any> = Record<string, any>> {
    /**
     * 排序方式
     */
    order: 'asc' | 'desc';
    /**
     * 排序字段
     */
    sort: keyof T;
}

export interface UseTableSortOption {
    defaultSort?: SortState;
    fetchFn: () => void;
    onReset?: () => void;
}

export function useTableSort({ defaultSort, fetchFn, onReset }: UseTableSortOption) {
    const DEFAULT_SORT: SortState = merge(
        {
            order: '',
            sort: '',
        },
        defaultSort,
    );

    const sortState = reactive<SortState>(cloneDeep(DEFAULT_SORT));
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
