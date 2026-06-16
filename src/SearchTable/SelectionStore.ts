type RowKey = string;

/**
 * 表格跨页选择状态管理器
 */
export class SelectionStore<T extends Record<string, any>> {
    /** 存储选中的行 */
    private map = new Map<RowKey, T>();

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
        return [...this.map.values()];
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
    select(row: T) {
        this.map.set(row[this.rowKey], row);
    }

    /** 取消选中 */
    unselect(id: RowKey) {
        this.map.delete(id);
    }

    /** 批量选中 */
    selectMany(rows: T[]) {
        rows.forEach((r) => this.select(r));
    }

    /** 批量取消 */
    unselectMany(ids: RowKey[]) {
        ids.forEach((id) => this.unselect(id));
    }

    /** 清空 */
    clear() {
        this.map.clear();
    }

    /**
     * 同步当前页 selection-change
     * @param pageRows 当前页数据
     * @param selected 当前页勾选行
     */
    syncPage(pageRows: T[], selected: T[]) {
        const selectedSet = new Set(selected.map((r) => r[this.rowKey]));

        // 当前页取消选中
        pageRows.forEach((row) => {
            if (!selectedSet.has(row[this.rowKey])) {
                this.map.delete(row[this.rowKey]);
            }
        });

        // 当前页新增选中
        selected.forEach((row) => this.map.set(row[this.rowKey], row));
    }

    /**
     * 同步表格 UI 勾选状态
     * @param pageRows 当前页数据
     * @param toggleFn el-table toggleRowSelection
     */
    restorePageSelection(pageRows: T[], toggleFn: (row: T, selected: boolean) => void) {
        pageRows.forEach((row) => {
            if (!Object.hasOwn(row, this.rowKey)) {
                console.error(
                    '[SelectionStore]',
                    `表格数据缺少配置的 rowKey 属性：'${this.rowKey}'`,
                );
            }

            if (this.map.has(row[this.rowKey])) {
                toggleFn(row, true);
            }
        });
    }
}
