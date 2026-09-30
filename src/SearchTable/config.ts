import type { InjectionKey } from 'vue';
import { pickBy } from 'lodash-es';
import type { SearchTablePaginationProps, SearchTableSearchProps } from './types';

/**
 * SearchTableConfigProvider 的配置项
 */
export interface SearchTableConfigProviderProps {
    /**
     * 表格行高，用于计算每页条数
     *
     * 支持数字或字符串（如 `48`、`'48px'`），单位会被忽略
     *
     * @default 40
     */
    rowHeight?: number | string;

    /**
     * 表头高度，用于计算每页条数
     *
     * 支持数字或字符串（如 `48`、`'48px'`），单位会被忽略
     *
     * @default 40
     */
    headerHeight?: number | string;

    /**
     * 分页组件的视觉配置
     *
     * 从 element-plus 分页组件的 props 中 Pick 而来，会与 SearchTable 的
     * `elPaginationProps` 合并，后者优先级更高
     *
     * @default { background: true, layout: 'total, sizes, prev, pager, next, jumper' }
     */
    paginationProps?: SearchTablePaginationProps;

    /**
     * 搜索区域的配置
     *
     * 会被 SearchTable 上同名的实例配置覆盖
     *
     * @default { buttonText: '搜索' }
     */
    searchProps?: SearchTableSearchProps;
}

/**
 * 解析后的组件配置
 */
export interface SearchTableConfig {
    /** 表格行高，正整数 */
    rowHeight: number;

    /** 表头高度，正整数 */
    headerHeight: number;

    /** 分页组件的视觉配置 */
    paginationProps: SearchTablePaginationProps;

    /** 解析后的搜索区域配置 */
    searchProps: Required<SearchTableSearchProps>;
}

/**
 * 分页的默认视觉配置
 *
 * @description
 * `background` 保持组件原有外观；`layout` 为空会让分页整块空白，
 * 因此这里给出确定的默认值，类型上用 `Required` 收窄避免再做空值断言。
 */
const DEFAULT_PAGINATION_PROPS: Required<
    Pick<SearchTablePaginationProps, 'background' | 'layout'>
> = {
    background: true,
    layout: 'total, sizes, prev, pager, next, jumper',
};

/**
 * 搜索区域的默认配置
 */
const DEFAULT_SEARCH_PROPS: Required<SearchTableSearchProps> = {
    buttonText: '搜索',
};

/**
 * 默认配置，高度与 element-plus 表格默认样式保持一致
 */
export const DEFAULT_SEARCH_TABLE_CONFIG: SearchTableConfig = {
    rowHeight: 40,
    headerHeight: 40,
    paginationProps: DEFAULT_PAGINATION_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
};

/**
 * 将高度配置解析为正整数
 *
 * @description
 * 业务中通常直接写 CSS 尺寸（如 `48px`），这里只提取前导数字并忽略单位，
 * 避免使用方为了配置而额外处理单位；解析失败或非正数时回退默认值，
 * 防止出现 `pageSize` 为 `Infinity` / 负数导致请求参数异常。
 *
 * @param value 原始高度值
 * @param fallback 解析失败时的回退值
 * @returns 正整数高度
 */
function resolveHeight(value: number | string | null | undefined, fallback: number): number {
    if (value === undefined || value === null) return fallback;

    const num = typeof value === 'number' ? value : Number.parseFloat(value);
    if (!Number.isFinite(num)) return fallback;

    const rounded = Math.round(num);

    return rounded > 0 ? rounded : fallback;
}

/**
 * 解析分页布局
 *
 * @description
 * 空字符串会让 element-plus 分页组件渲染不出任何内容，
 * 因此这里统一回退默认布局，避免使用方传入空值时页面白掉。
 *
 * @param value 原始布局
 * @param fallback 解析失败时的回退值
 * @returns 合法的布局字符串
 */
function resolvePaginationLayout(value: string | undefined, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value : fallback;
}

/**
 * 合并分页配置
 *
 * @description
 * 越靠后的配置优先级越高；值为 `undefined` 的键视为未传入，
 * 避免某个来源只声明了部分配置时把已有值覆盖掉。
 *
 * @param sources 按优先级从低到高排列的分页配置
 * @returns 合并后的分页配置
 */
export function mergePaginationProps(
    ...sources: Array<SearchTablePaginationProps | undefined>
): SearchTablePaginationProps {
    return pickBy(Object.assign({}, ...sources), (value) => value !== undefined);
}

/**
 * 解析搜索区域配置
 *
 * @param config 原始配置
 * @returns 解析后的搜索区域配置
 */
function resolveSearchProps(config?: SearchTableSearchProps): Required<SearchTableSearchProps> {
    return {
        buttonText: config?.buttonText ?? DEFAULT_SEARCH_PROPS.buttonText,
    };
}

/**
 * 解析组件配置
 *
 * @param config 原始配置
 * @returns 解析后的配置
 */
export function resolveSearchTableConfig(
    config?: SearchTableConfigProviderProps,
): SearchTableConfig {
    const paginationProps = mergePaginationProps(
        DEFAULT_SEARCH_TABLE_CONFIG.paginationProps,
        config?.paginationProps,
    );

    return {
        rowHeight: resolveHeight(config?.rowHeight, DEFAULT_SEARCH_TABLE_CONFIG.rowHeight),
        headerHeight: resolveHeight(config?.headerHeight, DEFAULT_SEARCH_TABLE_CONFIG.headerHeight),
        paginationProps: {
            ...paginationProps,
            layout: resolvePaginationLayout(
                paginationProps.layout,
                DEFAULT_PAGINATION_PROPS.layout,
            ),
        },
        searchProps: resolveSearchProps(config?.searchProps),
    };
}

/**
 * 组件配置的注入 key，由 SearchTableConfigProvider 提供、SearchTable 读取
 */
export const searchTableConfigKey: InjectionKey<SearchTableConfig> = Symbol('searchTableConfig');
