import { ProTableProps, TableRow } from '../ProTable/types';
import { PaginationProps } from 'element-plus';
import { SortState } from './useTableSort';

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
     */
    searchInputPlaceholder?: string;

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
     * element-plus 分页组件属性
     */
    elPaginationProps?: Partial<Pick<PaginationProps, 'size' | 'pagerCount'>>;

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
    success: boolean;

    /**
     * 错误代码-0为成功
     */
    code: number;

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
    offset: number;

    /**
     * 每页数量
     */
    limit: number;

    /**
     * 元素总数
     */
    totalCount: number;

    /**
     * 当前页数（从1开始）
     */
    currPageIndex: number;

    /**
     * 总页数
     */
    pageCount: number;
}
