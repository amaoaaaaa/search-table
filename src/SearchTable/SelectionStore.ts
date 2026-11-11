type RowKey = string;

/**
 * 已选行及其最近一次可勾选状态
 *
 * @description
 * 跨页选择无法在行未加载时重新执行 `selectable`，因此需要保留最近一次结果。
 * `selectable` 为 `false` 的行视为禁用选择，在选择性清空时保留。
 */
type SelectionEntry<T> = {
    row: T;
    selectable: boolean;
};

/**
 * 表格跨页选择状态管理器
 */
export class SelectionStore<T extends Record<string, any>> {
    /** 存储选中的行及其可勾选状态 */
    private map = new Map<RowKey, SelectionEntry<T>>();

    /** 行数据的 Key */
    private rowKey: string;

    /**
     * 实例化 SelectionStore
     *
     * @param rowKey 作为 id 的字段名，默认为 `'id'`
     */
    constructor(rowKey = 'id') {
        this.rowKey = rowKey;
    }

    /** 获取所有选中行 */
    get values(): T[] {
        return [...this.map.values()].map(({ row }) => row);
    }

    /** 获取选中 id */
    get ids(): RowKey[] {
        return [...this.map.keys()];
    }

    /** 是否选中 */
    has(id: RowKey) {
        return this.map.has(id);
    }

    /** 选中一行 */
    select(row: T, selectable = true) {
        this.map.set(row[this.rowKey], { row, selectable });
    }

    /** 取消选中 */
    unselect(id: RowKey) {
        this.map.delete(id);
    }

    /** 批量选中 */
    selectMany(rows: T[], selectable = true) {
        rows.forEach((row) => this.select(row, selectable));
    }

    /** 批量取消 */
    unselectMany(ids: RowKey[]) {
        ids.forEach((id) => this.unselect(id));
    }

    /** 清空 */
    clear() {
        this.map.clear();
    }

    /** 判断已选行是否仍可勾选 */
    isSelectable(id: RowKey) {
        return this.map.get(id)?.selectable ?? true;
    }

    /** 仅清空未禁用的选择，保留禁用行 */
    clearSelectable() {
        this.map.forEach((entry, id) => {
            if (entry.selectable) {
                this.map.delete(id);
            }
        });
    }

    /**
     * 重新计算当前页已选行的可勾选状态
     * @param pageRows 当前页数据
     * @param getSelectable 获取行的可勾选状态
     */
    syncSelectable(pageRows: T[], getSelectable: (row: T, index: number) => boolean) {
        pageRows.forEach((row, index) => {
            const id = row[this.rowKey];
            if (!this.map.has(id)) return;

            this.map.set(id, { row, selectable: getSelectable(row, index) });
        });
    }

    /**
     * 同步当前页 selection-change
     * @param pageRows 当前页数据
     * @param selected 当前页勾选行
     * @param getSelectable 获取行的可勾选状态
     */
    syncPage(pageRows: T[], selected: T[], getSelectable: (row: T, index: number) => boolean) {
        const selectedSet = new Set(selected.map((r) => r[this.rowKey]));

        // 同步当前页勾选状态和最新行数据
        pageRows.forEach((row, index) => {
            if (!selectedSet.has(row[this.rowKey])) {
                this.map.delete(row[this.rowKey]);
                return;
            }

            this.map.set(row[this.rowKey], { row, selectable: getSelectable(row, index) });
        });

        // 同步程序化选择的其他页行，无法取得当前页索引时传 -1
        selected.forEach((row) => {
            const id = row[this.rowKey];
            if (this.map.has(id)) return;

            const index = pageRows.findIndex((pageRow) => pageRow[this.rowKey] === id);
            this.map.set(id, { row, selectable: getSelectable(row, index) });
        });
    }

    /**
     * 同步表格 UI 勾选状态
     * @param pageRows 当前页数据
     * @param toggleFn el-table toggleRowSelection
     * @param getSelectable 获取行的可勾选状态
     */
    restorePageSelection(
        pageRows: T[],
        toggleFn: (row: T, selected: boolean) => void,
        getSelectable: (row: T, index: number) => boolean,
    ) {
        pageRows.forEach((row, index) => {
            if (!Object.hasOwn(row, this.rowKey)) {
                console.error(
                    '[SelectionStore]',
                    `表格数据缺少配置的 rowKey 属性：'${this.rowKey}'`,
                );
            }

            if (this.map.has(row[this.rowKey])) {
                this.map.set(row[this.rowKey], { row, selectable: getSelectable(row, index) });
                toggleFn(row, true);
            }
        });
    }
}
