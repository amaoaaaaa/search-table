import { ProTableProps, TableRow } from '../ProTable/types';
import { PaginationProps } from 'element-plus';
import { SortState } from './useTableSort';

/**
 * 分页组件的视觉配置
 *
 * @description
 * 直接从 element-plus 的 `PaginationProps` 中 Pick，
 * 保证这里的类型与 `el-pagination` 的 props 始终一致。
 */
export type SearchTablePaginationProps = Partial<
    Pick<
        PaginationProps,
        | 'size'
        | 'background'
        | 'pagerCount'
        | 'layout'
        | 'popperClass'
        | 'popperStyle'
        | 'prevText'
        | 'prevIcon'
        | 'nextText'
        | 'nextIcon'
    >
>;

/**
 * 搜索区域的配置
 *
 * @description
 * 用对象承载搜索区的可配置项，后续新增配置直接往里加字段，
 * 避免在全局配置上不断堆叠扁平的单项属性。
 */
export interface SearchTableSearchProps {
    /**
     * 搜索按钮的文字
     *
     * @default '搜索'
     */
    buttonText?: string;
}

export type SearchTableProps<T extends TableRow = any> = Omit<
    ProTableProps<T>,
    'data' | 'defaultSort'
> & {
    /**
     * 是否显示搜索区域
     * @default true
     */
    showSearch?: boolean;

    /**
     * 搜索输入框的提示语
     *
     * @default '输入搜索关键词'
     */
    searchInputPlaceholder?: string;

    /**
     * 搜索按钮的文字
     *
     * 优先级高于 `SearchTableConfigProvider` 中的 `searchProps.buttonText`
     *
     * @default '搜索'
     */
    searchButtonText?: string;

    /**
     * 搜索框绑定到查询参数的字段名
     *
     * @default 'search'
     */
    searchField?: string;

    /**
     * 是否显示新增按钮
     *
     * @default false
     */
    showAddButton?: boolean;

    /**
     * 是否显示批量删除按钮
     *
     * @default false
     */
    showBatchDeleteButton?: boolean;

    /**
     * 每页条数，不传则自动计算可显示的最大行数
     */
    pageSize?: number;

    /**
     * element-plus 分页组件的视觉配置
     *
     * 优先级高于 `SearchTableConfigProvider` 中的 `paginationProps`
     */
    elPaginationProps?: SearchTablePaginationProps;

    /**
     * 默认排序
     */
    defaultSort?: SortState;

    fetchFn: SearchTableFetchFn<T>;

    /**
     * 搜索参数处理函数
     * @param params 当前参数
     * @returns 返回处理后的参数
     */
    searchParamsHandler?: (params: Record<string, any>) => Record<string, any>;
};

/**
 * 分页请求参数
 */
export interface PageParams {
    /**
     * 每页元素数量
     */
    limit?: number;

    /**
     * 当前页起始索引（第一页为0，第n页为(n-1)*limit）
     */
    offset?: number;

    /**
     * 排序顺序，升序还是降序 `asc` or `desc`
     */
    order?: string;

    /**
     * 查询关键词（需要模糊检索时使用）
     */
    search?: string;

    /**
     * 排序字段
     */
    sort?: string;

    [key: string]: any;
}

export type SearchTableFetchFn<T = any> = (
    params?: PageParams,
    options?: {
        /**
         * 请求中断的信号
         */
        signal?: AbortSignal;
    },
) => Promise<PageResp<T>>;

/**
 * 通用分页响应结构
 */
export interface PageResp<T = any> {
    /**
     * 请求是否成功
     */
    success?: boolean;

    /**
     * 错误代码-0为成功
     */
    code?: number;

    /**
     * 错误信息
     */
    message?: string;

    /**
     * 响应数据
     */
    data?: Array<T>;

    /**
     * 开始索引
     */
    offset?: number;

    /**
     * 每页数量
     */
    limit?: number;

    /**
     * 元素总数
     */
    totalCount?: number;

    /**
     * 当前页数（从1开始）
     */
    currPageIndex?: number;

    /**
     * 总页数
     */
    pageCount?: number;
}
