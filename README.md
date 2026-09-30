# @amaoaaaaa/search-table

基于 [Element Plus](https://element-plus.org/) 的搜索表格 Vue 3 组件，提供开箱即用的分页、排序、筛选、跨页勾选等功能。

## 特性

- 🔍 内置搜索框 + 搜索参数管理
- 📄 自动分页 + 动态计算每页行数
- ↕️ 列排序支持
- 🎯 列筛选支持（单选 / 多选 / 时间范围）
- ☑️ 跨页勾选（手动管理 selection state）
- ✏️ 单元格内联编辑
- 🎨 内置 ProTable 组件，可独立使用
- 📦 图标构建时内联 SVG，零网络请求，离线可用

## 安装

```bash
npm install @amaoaaaaa/search-table
```

### Peer Dependencies

你需要确保项目中已安装以下依赖：

```bash
npm install vue element-plus axios lodash-es
# tailwindcss 可选（用于样式类）
```

## 使用

### 1. 全局注册图标类型声明（可选）

在 `env.d.ts` 或 `shims-icons.d.ts` 中添加：

```ts
/// <reference types="unplugin-icons/types/vue" />
```

> 注意：消费者项目无需安装 `unplugin-icons`，此声明仅用于 IDE 类型提示。图标 SVG 已在构建时内联到组件中。

### 2. 使用 SearchTable

```vue
<template>
    <SearchTable
        ref="searchTableRef"
        :columns="columns"
        :fetch-fn="fetchData"
        show-add-button
        show-batch-delete-button
        @add="handleAdd"
        @batch-delete="handleBatchDelete"
    />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { SearchTable } from '@amaoaaaaa/search-table';
import type { SearchTableProps, PageParams, PageResp } from '@amaoaaaaa/search-table';

const searchTableRef = ref();

const columns = [
    { label: '姓名', prop: 'name' },
    { label: '年龄', prop: 'age', sortable: true },
    { label: '操作', actions: [{ text: '编辑', handler: (row) => console.log(row) }] },
];

async function fetchData(params?: PageParams): Promise<PageResp<any>> {
    const res = await fetch('/api/list', { method: 'POST', body: JSON.stringify(params) });
    return res.json();
}

function handleAdd() {
    console.log('新增');
}

function handleBatchDelete(rows: any[]) {
    console.log('批量删除', rows);
}
</script>
```

### 3. 使用 ProTable（独立使用）

```vue
<template>
    <ProTable :data="tableData" :columns="columns" />
</template>

<script setup lang="ts">
import { ProTable } from '@amaoaaaaa/search-table';

const tableData = [{ id: 1, name: '张三' }];

const columns = [{ label: '姓名', prop: 'name' }];
</script>
```

## API

### SearchTable Props

| 属性                     | 类型                                 | 默认值             | 说明                           |
| ------------------------ | ------------------------------------ | ------------------ | ------------------------------ |
| `columns`                | `ProTableColumn[]`                   | -                  | 表格列配置                     |
| `fetchFn`                | `SearchTableFetchFn`                 | **必填**           | 数据请求函数                   |
| `showSearch`             | `boolean`                            | `true`             | 是否显示搜索区域               |
| `searchInputPlaceholder` | `string`                             | `"输入搜索关键词"` | 搜索框占位文本                 |
| `searchButtonText`       | `string`                             | `"搜索"`           | 搜索按钮文字（优先于全局配置） |
| `searchField`            | `string`                             | `"search"`         | 搜索框绑定到查询参数的字段名   |
| `showAddButton`          | `boolean`                            | `false`            | 是否显示新增按钮               |
| `showBatchDeleteButton`  | `boolean`                            | `false`            | 是否显示批量删除按钮           |
| `pageSize`               | `number`                             | 自动计算           | 每页条数                       |
| `elPaginationProps`      | `SearchTablePaginationProps`         | -                  | 分页组件视觉配置（见下方说明） |
| `defaultSort`            | `SortState`                          | -                  | 默认排序                       |
| `selectable`             | `boolean \| (row, index) => boolean` | -                  | 是否可勾选                     |
| `searchParamsHandler`    | `(params) => params`                 | -                  | 搜索参数处理函数               |

### SearchTable Events

| 事件名         | 参数              | 说明             |
| -------------- | ----------------- | ---------------- |
| `add`          | -                 | 点击新增按钮     |
| `batch-delete` | `rows: any[]`     | 点击批量删除按钮 |
| `cell-edit`    | `CellEditPayload` | 单元格编辑完成   |

### SearchTable Expose

| 方法/属性          | 类型                         | 说明           |
| ------------------ | ---------------------------- | -------------- |
| `refresh`          | `() => Promise<void>`        | 刷新当前页     |
| `selectedRows`     | `Ref<TableRow[]>`            | 已勾选的行     |
| `getSelectionRows` | `() => TableRow[]`           | 获取已勾选的行 |
| `selectRows`       | `(rows: TableRow[]) => void` | 勾选指定行     |

### SearchTable 样式定制

组件内部按 BEM 规范预留了类名，块名为 `search-table`，可在外层通过 `:deep()` 覆盖样式：

```vue
<template>
    <SearchTable class="my-search-table" :columns="columns" :fetch-fn="fetchData" />
</template>

<style scoped>
.my-search-table :deep(.search-table__search-button) {
    border-radius: 9999px;
}
</style>
```

| 类名                                   | 说明                                       |
| -------------------------------------- | ------------------------------------------ |
| `search-table`                         | 根容器                                     |
| `search-table__toolbar`                | 顶部区域（搜索区 + 操作区）                |
| `search-table__search`                 | 左侧搜索组（搜索框 + 搜索表单 + 搜索按钮） |
| `search-table__search-input`           | 搜索输入框                                 |
| `search-table__search-button`          | 搜索按钮                                   |
| `search-table__actions`                | 右侧操作按钮组（新增 / 批量删除 / 插槽）   |
| `search-table__add-button`             | 新增按钮                                   |
| `search-table__batch-delete-button`    | 批量删除按钮                               |
| `search-table__body`                   | 表格区域（ProTable 根节点）                |
| `search-table__footer`                 | 底部分页区域                               |
| `search-table__selection`              | 已选条数提示区域                           |
| `search-table__clear-selection-button` | 清空勾选按钮                               |
| `search-table__pagination`             | 分页组件                                   |
| `search-table__footer-spacer`          | 分页区域右侧占位（用于保持分页居中）       |

### SearchTableConfigProvider 全局配置

组件默认按 element-plus 表格的默认尺寸（表头 40px、每行 40px）计算每页条数。
如果业务中修改了表格样式，可用 `SearchTableConfigProvider` 统一覆盖，避免分页行数计算错误。
也可以在全局统一定制分页组件的视觉配置。该组件只提供配置、不渲染额外 DOM，用法类似 `ElConfigProvider`：

```vue
<template>
    <SearchTableConfigProvider
        row-height="48"
        header-height="56px"
        :pagination-props="{ layout: 'total, prev, pager, next, jumper', pagerCount: 7 }"
        :search-props="{ buttonText: '查询' }"
    >
        <SearchTable :columns="columns" :fetch-fn="fetchData" />
    </SearchTableConfigProvider>
</template>

<script setup lang="ts">
import { SearchTable, SearchTableConfigProvider } from '@amaoaaaaa/search-table';
</script>
```

| 属性              | 类型                         | 默认值                                                                    | 说明                             |
| ----------------- | ---------------------------- | ------------------------------------------------------------------------- | -------------------------------- |
| `rowHeight`       | `number \| string`           | `40`                                                                      | 表格行高（px），用于计算每页条数 |
| `headerHeight`    | `number \| string`           | `40`                                                                      | 表头高度（px），用于计算每页条数 |
| `paginationProps` | `SearchTablePaginationProps` | `{ background: true, layout: 'total, sizes, prev, pager, next, jumper' }` | 分页组件视觉配置                 |
| `searchProps`     | `SearchTableSearchProps`     | `{ buttonText: '搜索' }`                                                  | 搜索区域配置                     |

取值规则：

- 支持数字或字符串，字符串只提取前导数字并忽略单位：`48`、`'48'`、`'48px'`、`' 48.5px '` 均可用，`'3rem'` 会被当成 `3`（不做单位换算）。
- 解析结果四舍五入为整数：`'48.5px'` 为 `49`，`'48.4'` 为 `48`。
- 无法解析或非正数（如 `'abc'`、`''`、`0`、`Infinity`）会回退默认值 `40`。
- `layout` 与 element-plus 分页组件一致，可按需增减 `total`、`sizes`、`jumper` 等；传空字符串会回退默认布局。
- 分页配置的优先级：`elPaginationProps`（实例级）> `paginationProps`（全局）> 默认配置；值为 `undefined` 的字段不会覆盖低优先级的值。
- 搜索区域的配置统一放在 `searchProps` 对象里，当前支持 `buttonText`（搜索按钮文字），后续新增配置直接往对象里加字段即可；优先级：`searchButtonText`（实例级）> `searchProps.buttonText`（全局）> 默认值。
- 只影响未显式传入 `pageSize` 的实例；配置在实例挂载时读取一次，运行中修改 props 不会让已挂载实例重新计算。

`SearchTablePaginationProps` 是从 element-plus `PaginationProps` 中 Pick 出来的子集，保证与 `el-pagination` 类型一致，支持以下字段：

| 字段          | 说明                                  |
| ------------- | ------------------------------------- |
| `size`        | 分页组件尺寸                          |
| `background`  | 是否为分页按钮添加背景色，默认 `true` |
| `pagerCount`  | 页码按钮数量                          |
| `layout`      | 组件布局，各元素用逗号分隔            |
| `popperClass` | 每页条数下拉框的类名                  |
| `popperStyle` | 每页条数下拉框的行内样式              |
| `prevText`    | 替代上一页图标显示的文本              |
| `prevIcon`    | 上一页图标                            |
| `nextText`    | 替代下一页图标显示的文本              |
| `nextIcon`    | 下一页图标                            |

`SearchTable` 的 `elPaginationProps` 与全局的 `paginationProps` 支持完全相同的字段，例如：

```vue
<SearchTable
    :columns="columns"
    :fetch-fn="fetchData"
    :el-pagination-props="{ background: false, pagerCount: 5, prevText: '上一页' }"
/>
```

`SearchTableSearchProps` 目前支持以下字段，后续新增搜索区配置会继续往这个对象里加：

| 字段         | 说明                                                          |
| ------------ | ------------------------------------------------------------- |
| `buttonText` | 搜索按钮文字，默认 `搜索`；实例级可用 `searchButtonText` 覆盖 |

## 导出清单

**组件：** `SearchTable`, `SearchTableConfigProvider`, `ProTable`

**类型：** `SearchTableProps`, `SearchTablePaginationProps`, `SearchTableSearchProps`, `SearchTableFetchFn`, `PageParams`, `PageResp`, `SearchTableConfigProviderProps`, `ProTableProps`, `ProTableColumn`, `ProTableAction`, `TableRow`, `ApplyFilterPayload`, `CellEditPayload`, `SortState`, `ProTableInstance`

**工具：** `SelectionStore`, `useTableSort`, `useDelayedRef`, `parseErrorReason`

## License

MIT
