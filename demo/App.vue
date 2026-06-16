<template>
    <el-config-provider :locale="zh">
        <div class="demo-container">
            <header class="demo-header">
                <h1>@amaoaaaaa/search-table Demo</h1>
                <p class="text-sm text-gray-500">基于 Element Plus 的搜索表格组件</p>
            </header>

            <main class="demo-main">
                <SearchTable
                    ref="searchTableRef"
                    :columns="columns"
                    :fetch-fn="fetchFn"
                    :default-sort="defaultSort"
                    selectable
                    show-add-button
                    show-batch-delete-button
                    @add="handleAdd"
                    @batch-delete="handleBatchDelete"
                    @cell-edit="handleCellEdit"
                >
                    <!-- 自定义搜索表单 -->
                    <template #search-form="{ search }">
                        <el-select
                            v-model="deptFilter"
                            placeholder="选择部门"
                            clearable
                            class="w-32"
                            @change="search"
                        >
                            <el-option
                                v-for="dept in departments"
                                :key="dept"
                                :label="dept"
                                :value="dept"
                            />
                        </el-select>
                        <el-select
                            v-model="statusFilter"
                            placeholder="选择状态"
                            clearable
                            class="w-32"
                            @change="search"
                        >
                            <el-option label="启用" value="active" />
                            <el-option label="停用" value="inactive" />
                        </el-select>
                    </template>

                    <!-- 自定义操作按钮 -->
                    <template #btns>
                        <el-button type="warning" @click="handleExport">
                            <icon-ri-download-line />导出
                        </el-button>
                    </template>
                </SearchTable>
            </main>
        </div>
    </el-config-provider>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage, ElMessageBox, ElConfigProvider } from 'element-plus';
import zh from 'element-plus/es/locale/lang/zh-cn';
import {
    SearchTable,
    type SearchTableFetchFn,
    type ProTableColumn,
    type CellEditPayload,
} from '@amaoaaaaa/search-table';
import { mockFetchUsers, type User } from './mock-data';

const searchTableRef = ref<InstanceType<typeof SearchTable>>();

// 部门列表（用于搜索表单）
const departments = ['技术部', '市场部', '销售部', '财务部', '人事部', '运营部', '产品部'];
const deptFilter = ref('');
const statusFilter = ref('');

/**
 * 包装 fetch 函数，支持自定义搜索条件的参数合并
 */
const fetchFn: SearchTableFetchFn<User> = (params, options) => {
    const mergedParams = {
        ...params,
        department: deptFilter.value || undefined,
        status: statusFilter.value || undefined,
    };
    return mockFetchUsers(mergedParams, options);
};

const defaultSort = { sort: 'id', order: 'asc' as const };

// 过滤选项
const statusFilterOptions = [
    { label: '启用', value: 'active' },
    { label: '停用', value: 'inactive' },
];

const genderFilterOptions = [
    { label: '男', value: 'male' },
    { label: '女', value: 'female' },
];

const columns: ProTableColumn<User>[] = [
    { prop: 'id', label: 'ID', width: 100, sortable: true, truncate: false },
    { prop: 'name', label: '姓名', width: 100, sortable: true },
    {
        prop: 'age',
        label: '年龄',
        width: 80,
        sortable: true,
        align: 'center',
        editable: true,
        truncate: false,
    },
    {
        prop: 'gender',
        label: '性别',
        width: 100,
        align: 'center',
        filterable: true,
        filterOptions: genderFilterOptions,
        truncate: false,
    },
    { prop: 'email', label: '邮箱', minWidth: 200 },
    {
        prop: 'department',
        label: '部门',
        width: 110,
        sortable: true,
        filterable: true,
        filterType: 'checkbox',
        filterOptions: departments.map((d) => ({ label: d, value: d })),
    },
    { prop: 'role', label: '职位', width: 100 },
    {
        prop: 'status',
        label: '状态',
        width: 90,
        align: 'center',
        filterable: true,
        filterOptions: statusFilterOptions,
        formatter: (row: User) => {
            return row.status === 'active'
                ? h('el-tag', { type: 'success', size: 'small' }, '启用')
                : h('el-tag', { type: 'danger', size: 'small' }, '停用');
        },
        truncate: false,
    },
    { prop: 'createdAt', label: '创建时间', width: 175, sortable: true },
    {
        prop: 'updatedAt',
        label: '更新时间',
        width: 175,
        sortable: true,
        formatter: (row: User) => row.updatedAt?.split(' ')[0] ?? '-',
    },
    {
        label: '操作',
        width: 160,
        fixed: 'right',
        actions: [
            {
                text: '编辑',
                type: 'primary',
                handler: (row: User) => {
                    ElMessage.success(`编辑用户：${row.name}`);
                },
            },
            {
                text: '删除',
                type: 'danger',
                confirmText: true,
                handler: (row: User) => {
                    ElMessage.success(`已删除用户：${row.name}`);
                },
            },
        ],
    },
];

function handleAdd() {
    ElMessage.info('点击了新增按钮');
}

function handleBatchDelete(rows: User[]) {
    ElMessageBox.confirm(`确定要批量删除 ${rows.length} 条数据吗？`, '提示', {
        type: 'warning',
    }).then(() => {
        ElMessage.success(`已批量删除 ${rows.length} 条数据`);
    });
}

function handleCellEdit(payload: CellEditPayload<User>) {
    console.log('单元格编辑', payload);
    ElMessage.success(`已将 ${payload.row.name} 的 ${payload.prop} 修改为：${payload.newValue}`);
}

function handleExport() {
    ElMessage.info('点击了导出按钮（演示功能）');
}
</script>

<style>
/* 全局样式 */
html,
body,
#app {
    margin: 0;
    padding: 0;
    height: 100%;
    font-family:
        -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.demo-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #f5f7fa;
}

.demo-header {
    flex-shrink: 0;
    padding: 20px 24px 0;
}

.demo-header h1 {
    margin: 0 0 4px;
    font-size: 22px;
    font-weight: 600;
    color: #303133;
}

.demo-main {
    flex: 1;
    margin: 16px 24px 24px;
    padding: 20px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    overflow: hidden;
}

/* Tailwind 工具类（demo 需要时使用） */
.text-gray-500 {
    color: #909399;
}
.text-sm {
    font-size: 14px;
}
.w-32 {
    width: 8rem /* 128px */;
}
</style>
