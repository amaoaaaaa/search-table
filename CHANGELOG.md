# 更新日志

本文件记录 `@amaoaaaaa/search-table` 的所有重要变更。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [0.6.1] - 2026-11-11

### 修复

- 修复点击“清空勾选”时连同禁用勾选一起清除的问题。现在仅清空未禁用选择，并保留当前页及跨页的禁用勾选。

### 变更

- `refresh` 刷新成功后自动清除所有页面的未禁用勾选并保留禁用勾选；请求失败、取消或加载中不会清空已有勾选。
- 刷新恢复当前页选择时同步更新已选行的最新数据与可勾选状态。

## [0.6.0] - 2026-11-03

### 新增

- `ProTableAction` 新增 `collapsed` 配置，可将不常用操作按钮自动收纳到“更多操作”下拉菜单中。
- 搜索区的“新增”按钮支持通过实例属性 `addButtonText` 或全局 `searchProps.addButtonText` 自定义文本。
- `SearchTable` 新增 `fetch-success` 事件，请求成功后以 `{ params, data }` 对象向页面透传最终请求参数和列表数据。

### 变更

- `SearchTableSearchProps.buttonText` 更名为 `searchButtonText`，与实例属性命名保持一致；旧字段暂时保留为废弃兼容项，新字段优先，使用旧字段时会在控制台输出迁移警告。

### 修复

- 修复展开按钮与收纳按钮混用时操作列渲染不一致的问题，收纳按钮始终显示在操作列最后。

## [0.5.1] - 2026-10-21

### 修复

- 修复 `SearchTable` 未将默认排序和排序变化传递给 `el-table` 的问题，默认排序列现在会显示排序箭头，点击列头也会正常触发后端请求。

### 变更

- `defaultSort` 改为使用 `SortState<T>`，`sort` 会根据行数据类型推导实际字段名，并仅允许字符串字段。
- 对外导出 `SortState` 类型，调用方可显式标注以获取排序字段自动补全。
- 补充默认排序与后端排序的配合说明。

## [0.5.0] - 2026-10-13

### 新增

- 表格区支持 `#table` 插槽：可用自定义组件（如卡片列表）替换内置 `ProTable` 的渲染，插槽提供 `data`、`loading`、`columns`、`indexOffset`、`defaultSort`、`applyFilter`、`selectionChange`、`cellEdit`、`sortChange` 等 props。

### 变更

- `SearchTable` 改为泛型组件：行数据类型 `T` 由 `columns`、`fetchFn` 推断，并传递到插槽 props、事件参数与实例类型上。
- `SearchTableInstance` 由 `InstanceType<typeof SearchTable>` 改为显式声明的泛型接口 `SearchTableInstance<T>`（`InstanceType` 对泛型组件不生效）；需要组件实例的完整类型时改用 `useTemplateRef('searchTableRef')`。

### 注意

- 使用 `#table` 插槽时不再按容器高度自动计算每页条数：未显式传入 `pageSize` 时使用默认值 `10`，并在控制台提示。
- 表格区的布局类（`search-table__body flex-1 overflow-hidden`）需由使用方自行维护。

## [0.4.0] - 2026-09-30

### 新增

- `SearchTableConfigProvider` 新增 `paginationProps`，可全局配置分页组件的视觉（`size`、`background`、`pagerCount`、`layout`、`prevText` 等）。
- `SearchTableConfigProvider` 新增 `searchProps`，当前支持 `buttonText` 全局配置搜索按钮文字。

### 变更

- `SearchTable` 的 `elPaginationProps` 类型放宽为 `SearchTablePaginationProps`，与全局 `paginationProps` 支持完全相同的字段。
- 搜索区配置改为由 `searchProps` 对象承载，实例级用 `searchButtonText` 覆盖；后续新增搜索区配置直接往对象里加字段。
- 配置优先级：`elPaginationProps`（实例级）> `paginationProps`（全局）> 默认配置；`searchButtonText`（实例级）> `searchProps.buttonText`（全局）> 默认值。

## [0.3.0] - 2026-09-28

### 新增

- 新增全局配置组件 `SearchTableConfigProvider`，可覆盖表格行高 `rowHeight` 与表头高度 `headerHeight`，修正业务自定义表格样式后每页条数计算错误的问题。
- 导出 `SearchTableConfigProvider` 组件与 `SearchTableConfigProviderProps` 类型。

## [0.2.3] - 2026-09-28

### 新增

- 各区域按 BEM 规范补充可外部覆盖的类名（`search-table__toolbar`、`search-table__search-input`、`search-table__search-button`、`search-table__actions`、`search-table__footer`、`search-table__pagination` 等），可通过 `:deep()` 定制样式。

## [0.2.2] - 2026-09-28

### 优化

- `PageResp` 的 `success`、`code`、`offset`、`limit`、`totalCount`、`currPageIndex`、`pageCount` 改为可选，兼容分页接口只返回其中部分字段的情况。

## [0.2.1] - 2026-08-10

### 其它

- `package.json` 补充 `homepage`、`repository`、`bugs`、`keywords` 等仓库信息。

## [0.2.0] - 2026-08-10

### 新增

- 新增 `searchField` prop，可自定义搜索框绑定到查询参数的字段名（默认 `search`），适配后端搜索参数名不一致的场景。

## [0.1.3] - 2026-06-29

### 重构

- 新增 `SearchTableInstance` 类型导出。
- 新增 `SearchTableColumn`、`SearchTableAction` 类型别名，作为 `ProTableColumn`、`ProTableAction` 的语义化命名。
- 收敛工具导出：`SelectionStore`、`useTableSort`、`useDelayedRef`、`parseErrorReason` 不再对外暴露。

## [0.1.2] - 2026-06-26

### 修复

- 修复 `SearchTable`、`ProTable` 内部模板 ref 重名导致的 Vue 控制台警告（`Set operation on key "value" failed: target is readonly`）。

## [0.1.1] - 2026-06-25

### 修复

- 修复打包未排除外部依赖的问题：`vue`、`element-plus`、`axios`、`lodash-es`、`@amaoaaaaa/v-text-ellipsis` 等不再被打入产物。
- 修复 `RenderFormatterResult` 组件使用 `v-html` 产生的警告。

### 构建

- 新增 `build:analyze` 脚本，接入 `rollup-plugin-visualizer` 输出打包体积分析报告（`stats.html`）。

## [0.1.0-beta.1] - 2026-06-17

### 新增

- 首个版本：从完整项目中抽离 `SearchTable`、`ProTable` 组件及配套工具（`SelectionStore`、`useTableSort`、`useDelayedRef`、`parseErrorReason`）。
- 支持搜索、分页（按容器高度自动计算每页条数）、列排序、列筛选（单选 / 多选 / 时间范围）、跨页勾选、单元格内联编辑。

### 变更

- 移除自动导入机制，组件与函数改为显式导入。
- `element-plus` peer 依赖升级到 `^2.14.2`，`TableRow` 等类型对齐 element-plus 的类型定义。

[0.5.0]: https://github.com/amaoaaaaa/search-table/compare/537f3a9...92abeaa
[0.4.0]: https://github.com/amaoaaaaa/search-table/compare/fc99483...537f3a9
[0.3.0]: https://github.com/amaoaaaaa/search-table/compare/5d11cd0...fc99483
[0.2.3]: https://github.com/amaoaaaaa/search-table/compare/850550f...5d11cd0
[0.2.2]: https://github.com/amaoaaaaa/search-table/compare/ee2d0e7...850550f
[0.2.1]: https://github.com/amaoaaaaa/search-table/compare/70af915...ee2d0e7
[0.2.0]: https://github.com/amaoaaaaa/search-table/compare/9ac5fe0...70af915
[0.1.3]: https://github.com/amaoaaaaa/search-table/compare/30633b8...9ac5fe0
[0.1.2]: https://github.com/amaoaaaaa/search-table/compare/c989b33...30633b8
[0.1.1]: https://github.com/amaoaaaaa/search-table/compare/e544019...c989b33
[0.1.0-beta.1]: https://github.com/amaoaaaaa/search-table/compare/be176ab...e544019
