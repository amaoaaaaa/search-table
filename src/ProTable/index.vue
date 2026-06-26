<template>
    <section v-loading="loading" element-loading-text="加载中...">
        <el-table
            ref="elTableRef"
            :data="data"
            border
            class="pro-table"
            height="100%"
            :row-key="rowKey"
            @selection-change="(rows) => emit('selectionChange', rows)"
        >
            <!-- 选择列 -->
            <el-table-column
                v-if="selectable"
                type="selection"
                width="55"
                :selectable="isFunction(selectable) ? selectable : undefined"
            />

            <!-- 序号列 -->
            <el-table-column
                v-if="showIndex"
                class="index-cell"
                align="center"
                :width="indexWidth"
                label="序号"
            >
                <template #default="{ $index }">
                    {{ $index + 1 + (indexOffset || 0) }}
                </template>
            </el-table-column>

            <!--动态列  -->
            <el-table-column
                v-for="(col, colIndex) in columns"
                :key="colIndex"
                v-bind="col"
                :align="col.align ?? 'center'"
                :fixed="col.label === '操作' ? 'right' : false"
            >
                <!-- 启用筛选功能 -->
                <template
                    v-if="
                        col.filterable ??
                        (col.filterType || col.filterOptions || isRef(col.filterOptions))
                    "
                    #header="{ column }"
                >
                    <span
                        class="inline-flex items-center"
                        :class="{
                            'text-[--el-color-primary]':
                                getFilterFieldName(col) &&
                                filterData[getFilterFieldName(col)!] !== undefined,
                        }"
                    >
                        <!-- 筛选弹窗 -->
                        <el-popover
                            v-if="getFilterFieldName(col)"
                            v-model:visible="filterPopoverVisibleMap[getFilterFieldName(col)!]"
                            placement="bottom"
                            trigger="click"
                            :hide-after="0"
                            :show-after="0"
                            :width="
                                col.filterPopoverWidth ??
                                (col.filterType === 'datetimerange' ? 424 : undefined)
                            "
                            popper-class="reset"
                            @show="onFilterPopoverShow(getFilterFieldName(col)!)"
                            @hide="onFilterPopoverHide(getFilterFieldName(col)!)"
                        >
                            <template #reference>
                                <div
                                    class="inline-flex cursor-pointer items-center gap-x-0.5 duration-100 hover:text-[--el-color-primary]"
                                    @click.stop
                                >
                                    <!-- 列名 -->
                                    {{ column.label }}

                                    <icon-tabler-filter-check
                                        v-if="filterData[getFilterFieldName(col)!] !== undefined"
                                    />
                                    <icon-tabler-filter v-else />
                                </div>
                            </template>

                            <!-- 单选 -->
                            <template v-if="!col.filterType || col.filterType === 'radio'">
                                <el-scrollbar always max-height="34vh">
                                    <el-radio-group
                                        v-model="tempFilterData[getFilterFieldName(col)!]"
                                    >
                                        <el-radio
                                            v-for="item in toValue(col.filterOptions)"
                                            :key="item.value.toString()"
                                            :value="item.value"
                                            :label="item.label"
                                            class="!m-0 w-full"
                                        >
                                        </el-radio>
                                    </el-radio-group>
                                </el-scrollbar>
                            </template>
                            <!-- 多选 -->
                            <template v-else-if="col.filterType === 'checkbox'">
                                <el-scrollbar always max-height="34vh">
                                    <el-checkbox-group
                                        v-model="tempFilterData[getFilterFieldName(col)!]"
                                    >
                                        <el-checkbox
                                            v-for="item in toValue(col.filterOptions)"
                                            :key="item.value.toString()"
                                            :value="item.value"
                                            :label="item.label"
                                            class="!m-0 w-full"
                                        >
                                        </el-checkbox>
                                    </el-checkbox-group>
                                </el-scrollbar>
                            </template>
                            <!-- 时间选择 -->
                            <template v-else-if="col.filterType === 'datetimerange'">
                                <el-date-picker
                                    v-model="tempFilterData[getFilterFieldName(col)!]"
                                    type="datetimerange"
                                    start-placeholder="开始时间"
                                    end-placeholder="结束时间"
                                    range-separator="至"
                                    value-format="YYYY-MM-DD HH:mm:ss"
                                    :teleported="false"
                                >
                                </el-date-picker>
                            </template>

                            <!-- 重置/确认按钮 -->
                            <div class="-mx-3 my-3 border-t"></div>
                            <div class="flex justify-center">
                                <div class="-mx-3 flex w-[150px] items-center justify-evenly">
                                    <el-button
                                        type="primary"
                                        plain
                                        size="small"
                                        @click="
                                            resetFilter(
                                                getFilterFieldName(col)!,
                                                col.filterType || 'radio',
                                                col,
                                            )
                                        "
                                        >重置</el-button
                                    >
                                    <el-button
                                        type="primary"
                                        size="small"
                                        class="!m-0"
                                        @click="
                                            applyFilter(
                                                getFilterFieldName(col)!,
                                                col.filterType || 'radio',
                                                col,
                                            )
                                        "
                                        >确定</el-button
                                    >
                                </div>
                            </div>
                        </el-popover>
                    </span>
                </template>

                <!-- 使用格式化函数 -->
                <template v-if="col.formatter" #default="{ row, column, $index }">
                    <div v-text-ellipsis="col.truncate ?? true">
                        <render-formatter-result
                            :col="col"
                            :row="row"
                            :column="column"
                            :index="$index"
                        />
                    </div>
                </template>
                <!-- 回显单元格内容 -->
                <template
                    v-else
                    #default="{ row, $index: rowIndex }: { row: TableRow; $index: number }"
                >
                    <!-- 默认显示的单元格内容 -->
                    <div v-if="col.prop" class="h-[23px]">
                        <!-- 可编辑时显示 -->
                        <template v-if="isEditable(col, row)">
                            <!-- 输入框 -->
                            <el-input
                                v-if="cells[rowIndex]?.[colIndex]?.editing"
                                :ref="
                                    (i) => (cells[rowIndex][colIndex].inputRef = i as InputInstance)
                                "
                                v-model="cells[rowIndex][colIndex].value"
                                style="
                                    /* stylelint-disable custom-property-empty-line-before */
                                    --el-input-height: 23px;
                                "
                                clearable
                                size="small"
                                input-style="--el-input-inner-height: 20px"
                                @blur="
                                    handleCellExitEditing({
                                        rowIndex,
                                        colIndex,
                                        row,
                                        prop: col.prop,
                                        oldValue: row[col.prop],
                                        newValue: cells[rowIndex][colIndex].value,
                                    })
                                "
                                @keydown.enter.stop.prevent="
                                    handleCellExitEditing({
                                        rowIndex,
                                        colIndex,
                                        row,
                                        prop: col.prop,
                                        oldValue: row[col.prop],
                                        newValue: cells[rowIndex][colIndex].value,
                                    })
                                "
                                @keydown.esc.stop.prevent="
                                    handleCellCancelEditing(rowIndex, colIndex)
                                "
                            ></el-input>

                            <!-- 可触发编辑的元素 -->
                            <div
                                v-else
                                v-text-ellipsis="col.truncate ?? true"
                                class="h-[23px] cursor-pointer"
                                @dblclick="
                                    handleCellEnterEditing(rowIndex, colIndex, row[col.prop])
                                "
                            >
                                {{ row[col.prop] }}
                            </div>
                        </template>

                        <!-- 默认不做任何处理的内容 -->
                        <template v-else>
                            <div v-text-ellipsis="col.truncate ?? true">
                                {{ row[col.prop] }}
                            </div>
                        </template>
                    </div>

                    <!-- 遍历筛选后需要显示的按钮 -->
                    <template v-for="action of filteredActions(col, row)" :key="action.text">
                        <!-- 需要二次确认 -->
                        <el-popconfirm
                            v-if="action.text === '删除' || action.confirmText"
                            placement="top"
                            :hide-after="0"
                            popper-style="width: unset; min-width: 150px;"
                            :title="
                                isBoolean(action.confirmText)
                                    ? `是否确认${action.text}？`
                                    : isFunction(action.confirmText)
                                      ? action.confirmText(row)
                                      : (action.confirmText ?? `是否确认${action.text}？`)
                            "
                            @confirm="
                                action.visibility === 'hidden' ? undefined : action.handler(row)
                            "
                        >
                            <template #reference>
                                <el-button
                                    link
                                    :type="action.type ?? 'primary'"
                                    :style="getActionButtonStyle(action, action.visibility)"
                                    :disabled="
                                        isFunction(action.disabled)
                                            ? action.disabled(row)
                                            : action.disabled
                                    "
                                >
                                    {{ action.text }}
                                </el-button>
                            </template>
                        </el-popconfirm>

                        <!-- 不需要确认 -->
                        <el-button
                            v-else
                            link
                            :type="action.type ?? 'primary'"
                            :style="getActionButtonStyle(action, action.visibility)"
                            :disabled="
                                isFunction(action.disabled) ? action.disabled(row) : action.disabled
                            "
                            @click="
                                action.visibility === 'hidden' ? undefined : action.handler(row)
                            "
                        >
                            {{ action.text }}
                        </el-button>
                    </template>
                </template>
            </el-table-column>
        </el-table>
    </section>
</template>

<script lang="ts" setup>
import { cloneDeep, isBoolean, isFunction, toString } from 'lodash-es';
import {
    ActionButtonVisibility,
    ApplyFilterPayload,
    CellEditPayload,
    FilterType,
    ProTableAction,
    ProTableColumn,
    ProTableProps,
    TableRow,
} from './types';
import { toValue, isRef, StyleValue, reactive, useTemplateRef, ref, nextTick } from 'vue';
import RenderFormatterResult from './components/RenderFormatterResult.vue';
import { InputInstance, ElLoading } from 'element-plus';
import {
    ElButton,
    ElCheckbox,
    ElCheckboxGroup,
    ElDatePicker,
    ElInput,
    ElPopconfirm,
    ElPopover,
    ElRadio,
    ElRadioGroup,
    ElScrollbar,
    ElTable,
    ElTableColumn,
} from 'element-plus';
import IconTablerFilter from '~icons/tabler/filter';
import IconTablerFilterCheck from '~icons/tabler/filter-check';
import { vTextEllipsis } from '@amaoaaaaa/v-text-ellipsis';

const vLoading = ElLoading.directive;

const props = withDefaults(defineProps<ProTableProps>(), {
    showIndex: true,
    indexWidth: 70,
    loading: false,
    rowKey: 'id',
});

const filterData = defineModel<Record<string, any>>('filterData', {
    default: () => reactive({}),
});

const emit = defineEmits<{
    applyFilter: [ApplyFilterPayload];
    selectionChange: [newSelection: TableRow[]];
    'cell-edit': [payload: CellEditPayload];
}>();

const tableRef = useTemplateRef('elTableRef');

/**
 * 弹窗内的临时筛选数据，只在点击"确定"时才提交到 filterData
 * 避免用户勾选未提交时污染实际状态
 */
const tempFilterData = ref<Record<string, any>>({});

const filterPopoverVisibleMap = ref<Record<string, boolean>>({});

/**
 * 筛选弹窗打开时，从已提交的 filterData 初始化临时数据
 */
function onFilterPopoverShow(prop: string) {
    tempFilterData.value[prop] = cloneDeep(filterData.value[prop]);
}

/**
 * 弹窗关闭时，将临时数据回滚到已提交的 filterData
 * 防止下次打开时看到残留的未提交选项闪烁取消
 */
function onFilterPopoverHide(prop: string) {
    tempFilterData.value[prop] = cloneDeep(filterData.value[prop]);
}

function resetFilter(prop: string, type: FilterType, col: ProTableColumn) {
    // 重置临时数据和已提交数据
    tempFilterData.value[prop] = undefined;
    filterData.value[prop] = undefined;

    applyFilter(prop, type, col);
}

function applyFilter(prop: string, type: FilterType, col: ProTableColumn) {
    // 将临时数据提交到 filterData
    filterData.value[prop] = tempFilterData.value[prop];
    filterPopoverVisibleMap.value[prop] = false;

    emit('applyFilter', {
        col,
        prop,
        type,
        value: filterData.value[prop],
        filterData: filterData.value,
    });
}

function filteredActions(col: ProTableColumn, row: any) {
    const actions = isFunction(col.actions) ? col.actions(row) : col.actions;

    return (
        actions
            ?.map((action) => {
                // 计算 visibility 结果
                const visibilityRes = isFunction(action.visibility)
                    ? action.visibility(row)
                    : (action.visibility ?? true);

                return { ...action, visibility: visibilityRes };
            })
            // 过滤显示的按钮
            .filter((action) => action.visibility !== false)
    );
}

/**
 * 获取过滤字段名
 * @param col 列配置
 */
function getFilterFieldName(col: ProTableColumn) {
    return col.filterFieldName ?? col.prop;
}

function getActionButtonStyle(
    action: ProTableAction,
    visibility: ActionButtonVisibility,
): StyleValue {
    return {
        color: action.text.includes('删除') ? 'var(--el-color-danger)' : '',
        visibility: isBoolean(visibility) ? undefined : visibility,
    };
}

interface CellState {
    editing: boolean;
    inputRef?: InputInstance;
    value?: any;
}
const cells = ref<CellState[][]>([]);

// const createMatrix = <T = any,>(rows: number, cols: number, value: T) =>
//     Array.from({ length: rows }, () => Array.from({ length: cols }, () => value));

function resetCells() {
    cells.value = Array.from({ length: props.data.length }, () =>
        Array.from({ length: props.columns.length }, () => ({
            editing: false,
            inputRef: undefined,
            value: undefined,
        })),
    );
}

function isEditable(col: ProTableColumn, row: TableRow) {
    return isFunction(col.editable) ? col.editable(row) : (col.editable ?? false);
}

function handleCellEnterEditing(rowIndex: number, colIndex: number, currValue: any) {
    const cell = cells.value[rowIndex][colIndex];
    if (!cell) return;

    cell.value = currValue;
    cell.editing = true;

    nextTick(() => {
        cell.inputRef?.focus();
    });
}

function handleCellExitEditing(payload: CellEditPayload) {
    const cell = cells.value[payload.rowIndex][payload.colIndex];
    if (!cell) return;

    cell.editing = false;

    const newValue = payload.newValue;
    const oldValue = payload.row[payload.prop];

    // 值未改变
    if (newValue === oldValue) return;

    // 先更新 UI（乐观更新）
    payload.row[payload.prop] = newValue;

    emit('cell-edit', payload);
}

function handleCellCancelEditing(rowIndex: number, colIndex: number) {
    const cell = cells.value[rowIndex][colIndex];
    if (!cell) return;

    cell.editing = false;
}

defineExpose({
    tableInstance: tableRef,
    resetCells,
});
</script>

<style lang="scss" scoped>
::v-deep(.pro-table) {
    // 表头背景颜色
    --el-table-header-bg-color: #f7f8fa;

    // 表头文字颜色
    --el-table-header-text-color: var(--el-text-color-regular);

    // 表格文字颜色
    --el-table-text-color: var(--el-text-color-primary);
    thead th {
        font-weight: normal;
    }
}
</style>
