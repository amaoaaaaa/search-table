import type { TableRow } from '../ProTable/types';

/**
 * SearchTable 暴露出来的实例 API
 *
 * @description
 * 行数据类型 `T` 由 `fetchFn` / `columns` 自动推断，也可以在声明 ref 时手动指定
 * （如 `ref<SearchTableInstance<User>>()`）。
 *
 * 注意：`SearchTable` 是泛型组件，`InstanceType<typeof SearchTable>` 对泛型组件
 * 不生效，因此这里显式声明 `defineExpose` 暴露出来的成员；需要组件实例的完整类型
 * （`$el`、`$props` 等）时，推荐用 `useTemplateRef('searchTableRef')`。
 */
export interface SearchTableInstance<T extends TableRow = any> {
    /**
     * 刷新当前页
     */
    refresh: () => Promise<void>;

    /**
     * 已勾选的行
     *
     * @description `defineExpose` 暴露的 ref 会被自动解包，因此这里是数组本身
     */
    selectedRows: T[];

    /**
     * 获取已勾选的行
     */
    getSelectionRows: () => T[];

    /**
     * 勾选指定行
     */
    selectRows: (rows: T[]) => void;
}
