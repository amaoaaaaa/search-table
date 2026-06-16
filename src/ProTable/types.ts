import { ExtractPropTypes, MaybeRefOrGetter, VNode } from 'vue';
import tableColumnProps, {
    TableColumnCtx,
} from 'element-plus/es/components/table/src/table-column/defaults';

// 获取 element-plus table-column 组件的属性
export type ElTableColumnProps = ExtractPropTypes<typeof tableColumnProps>;

export type TableRow = Record<string, any>;

export type FilterOption = { label: string; value: string | number | boolean };

/**
 * 操作按钮显示状态
 *
 * - true: 正常显示
 * - false: 不渲染
 * - 'hidden': 不显示但占位
 */
export type ActionButtonVisibility = boolean | 'hidden';

/**
 * 表格操作按钮
 */
export interface ProTableAction<T extends TableRow = TableRow> {
    text: string;

    /**
     * 按钮类型
     *
     * @default 'primary'
     */
    type?: '' | 'primary' | 'danger' | 'text' | 'default' | 'success' | 'warning' | 'info';

    /**
     * 是否显示
     *
     * - true: 正常显示
     * - false: 不渲染
     * - 'hidden': 不显示但占位
     *
     * @default true
     */
    visibility?: ActionButtonVisibility | ((row: T) => ActionButtonVisibility);

    /**
     * 是否禁用
     *
     * @default false
     */
    disabled?: boolean | ((row: T) => boolean);

    handler: (row: T) => void;

    /**
     * 二次确认提示内容
     *
     * @description
     * - 传入 `true` 表示使用默认提示内容：`是否确认${action.text}？`
     * - 传入 `false` 表示不使用二次确认
     * - 传入字符串表示使用自定义提示内容
     * - 函数表示使用自定义提示内容
     */
    confirmText?: boolean | string | ((row: T) => string);
}

export type FilterType = 'radio' | 'checkbox' | 'datetimerange';

/**
 * 表格列配置
 */
export type ProTableColumn<T extends TableRow = TableRow> = Partial<
    Omit<ElTableColumnProps, 'filters' | 'formatter'>
> & {
    prop?: keyof T;

    align?: 'left' | 'center' | 'right';

    /**
     * 是否可编辑
     * @default false
     */
    editable?: boolean | ((row: T) => boolean);

    /**
     * 内容溢出自动截断，鼠标移入显示完整内容
     *
     * @default true
     */
    truncate?: boolean;

    /**
     * 是否可筛选
     *
     * @description 优先级高于 `filterOptions`
     */
    filterable?: boolean;

    /**
     * 数据过滤字段名，默认为当前列 `prop` 属性的值
     */
    filterFieldName?: string;

    /**
     * 时间范围筛选字段名
     */
    datetimerangeFilterFieldNames?: string[];

    /**
     * 数据过滤类型
     * - radio: 单选（默认）
     * - checkbox: 多选
     * - datetimerange: 时间范围选择器
     */
    filterType?: FilterType;

    /**
     * 数据过滤选项
     */
    filterOptions?: MaybeRefOrGetter<FilterOption[] | undefined>;

    /**
     * 筛选弹窗宽度
     */
    filterPopoverWidth?: number;

    /**
     * 操作按钮
     */
    actions?: ProTableAction<T>[] | ((row: T) => ProTableAction<T>[]);

    /**
     * 格式化单元格的函数
     */
    formatter?: (
        row: T,
        column: TableColumnCtx<T>,
        cellValue: any,
        index: number,
    ) => VNode | string;
};

/**
 * 表格配置
 */
export type ProTableProps<T extends TableRow = any> = {
    data: T[];
    columns: ProTableColumn<T>[];

    /**
     * 行数据的 Key，属性值必须唯一
     *
     * @default 'id'
     */
    rowKey?: string;

    /**
     * 是否可选择
     * - 传入 true 表示所有行都可选择
     * - 传入函数表示自定义选择逻辑
     *
     * @default undefined
     */
    selectable?: boolean | ((row: any, index: number) => boolean);

    showIndex?: boolean;
    indexWidth?: ElTableColumnProps['width'];
    indexOffset?: number;

    loading?: boolean;
};

export type ApplyFilterPayload = {
    prop: string;
    type: FilterType;
    value: any;
    filterData: Record<string, any>;
    col: ProTableColumn;
};

/**
 * 单元格退出编辑状态时触发回调的参数
 * @template T 行数据类型
 */
export type CellEditPayload<T = any> = {
    /** 编辑后的值 */
    newValue: any;

    /** 编辑前的值 */
    oldValue: any;

    /** 行索引 */
    rowIndex: number;

    /** 列索引 */
    colIndex: number;

    /** 当前行完整数据 */
    row: T;

    /** 当前列对应的字段名 */
    prop: keyof T;
};
