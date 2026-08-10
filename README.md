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

| 属性                     | 类型                                 | 默认值             | 说明                         |
| ------------------------ | ------------------------------------ | ------------------ | ---------------------------- |
| `columns`                | `ProTableColumn[]`                   | -                  | 表格列配置                   |
| `fetchFn`                | `SearchTableFetchFn`                 | **必填**           | 数据请求函数                 |
| `showSearch`             | `boolean`                            | `true`             | 是否显示搜索区域             |
| `searchInputPlaceholder` | `string`                             | `"输入搜索关键词"` | 搜索框占位文本               |
| `searchField`            | `string`                             | `"search"`         | 搜索框绑定到查询参数的字段名 |
| `showAddButton`          | `boolean`                            | `false`            | 是否显示新增按钮             |
| `showBatchDeleteButton`  | `boolean`                            | `false`            | 是否显示批量删除按钮         |
| `pageSize`               | `number`                             | 自动计算           | 每页条数                     |
| `elPaginationProps`      | `Partial<PaginationProps>`           | -                  | 分页组件属性                 |
| `defaultSort`            | `SortState`                          | -                  | 默认排序                     |
| `selectable`             | `boolean \| (row, index) => boolean` | -                  | 是否可勾选                   |
| `searchParamsHandler`    | `(params) => params`                 | -                  | 搜索参数处理函数             |

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

## 导出清单

**组件：** `SearchTable`, `ProTable`

**类型：** `SearchTableProps`, `SearchTableFetchFn`, `PageParams`, `PageResp`, `ProTableProps`, `ProTableColumn`, `ProTableAction`, `TableRow`, `ApplyFilterPayload`, `CellEditPayload`, `SortState`, `ProTableInstance`

**工具：** `SelectionStore`, `useTableSort`, `useDelayedRef`, `parseErrorReason`

## License

MIT
