import type { InjectionKey } from 'vue';

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
}

/**
 * 解析后的高度配置
 */
export interface SearchTableHeightConfig {
    /** 表格行高，正整数 */
    rowHeight: number;

    /** 表头高度，正整数 */
    headerHeight: number;
}

/**
 * 默认高度配置，与 element-plus 表格默认样式保持一致
 */
export const DEFAULT_SEARCH_TABLE_HEIGHT_CONFIG: SearchTableHeightConfig = {
    rowHeight: 40,
    headerHeight: 40,
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
 * 解析高度配置
 *
 * @param config 原始配置
 * @returns 解析后的正整数高度配置
 */
export function resolveHeightConfig(
    config?: SearchTableConfigProviderProps,
): SearchTableHeightConfig {
    return {
        rowHeight: resolveHeight(config?.rowHeight, DEFAULT_SEARCH_TABLE_HEIGHT_CONFIG.rowHeight),
        headerHeight: resolveHeight(
            config?.headerHeight,
            DEFAULT_SEARCH_TABLE_HEIGHT_CONFIG.headerHeight,
        ),
    };
}

/**
 * 高度配置的注入 key，由 SearchTableConfigProvider 提供、SearchTable 读取
 */
export const searchTableConfigKey: InjectionKey<SearchTableHeightConfig> =
    Symbol('searchTableHeightConfig');
