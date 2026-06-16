import type { PageParams, PageResp } from '@amaoaaaaa/search-table';
import { filter, isUndefined, merge, omitBy } from 'lodash-es';

export interface User {
    id: string;
    name: string;
    age: number;
    gender: 'male' | 'female';
    email: string;
    department: string;
    role: string;
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
}

const departments = ['技术部', '市场部', '销售部', '财务部', '人事部', '运营部', '产品部'];
const roles = ['普通员工', '组长', '经理', '总监', '副总裁', 'CTO'];
const firstNames = [
    '张',
    '李',
    '王',
    '赵',
    '刘',
    '陈',
    '杨',
    '黄',
    '周',
    '吴',
    '徐',
    '孙',
    '马',
    '朱',
    '胡',
    '郭',
    '何',
    '高',
    '林',
    '罗',
];
const lastNames = [
    '伟',
    '芳',
    '娜',
    '秀英',
    '敏',
    '静',
    '丽',
    '强',
    '磊',
    '军',
    '洋',
    '勇',
    '艳',
    '杰',
    '娟',
    '涛',
    '明',
    '超',
    '秀兰',
    '霞',
];

function generateMockUsers(count: number): User[] {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const day = Math.floor(Math.random() * 28) + 1;
        const month = Math.floor(Math.random() * 12) + 1;
        const year = 2020 + Math.floor(Math.random() * 5);

        users.push({
            id: `user_${String(i + 1).padStart(4, '0')}`,
            name: firstName + lastName,
            age: Math.floor(Math.random() * 35) + 22,
            gender: Math.random() > 0.5 ? 'male' : 'female',
            email: `user${i + 1}@example.com`,
            department: departments[Math.floor(Math.random() * departments.length)],
            role: roles[Math.floor(Math.random() * roles.length)],
            status: Math.random() > 0.2 ? 'active' : 'inactive',
            createdAt: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 09:00:00`,
            updatedAt: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 18:00:00`,
        });
    }
    return users;
}

const allUsers = generateMockUsers(386);

/**
 * 模拟异步分页请求
 */
export function mockFetchUsers(
    params?: PageParams,
    options?: { signal?: AbortSignal },
): Promise<PageResp<User>> {
    return new Promise((resolve, reject) => {
        const timeout = Math.random() * 300 + 100;

        const timer = setTimeout(() => {
            if (options?.signal?.aborted) {
                // reject(new DOMException('Aborted', 'AbortError'));
                // return;
            }

            const {
                limit = 20,
                offset = 0,
                search = '',
                sort,
                order,
                ...conditions
            } = params ?? {};
            const predicate = omitBy(conditions, isUndefined);

            // 搜索过滤
            let filtered = filter([...allUsers], predicate) as User[];
            if (search) {
                const keyword = search.toLowerCase();
                filtered = filtered.filter(
                    (user) =>
                        user.name.includes(keyword) ||
                        user.email.includes(keyword) ||
                        user.department.includes(keyword),
                );
            }

            // 排序
            if (sort && order) {
                filtered.sort((a, b) => {
                    const aVal = String((a as any)[sort] ?? '');
                    const bVal = String((b as any)[sort] ?? '');
                    const compare = aVal.localeCompare(bVal, 'zh-CN');
                    return order === 'asc' ? compare : -compare;
                });
            }

            const totalCount = filtered.length;
            const data = filtered.slice(offset, offset + limit);

            resolve({
                success: true,
                code: 0,
                data,
                totalCount,
                offset: offset ?? 0,
                limit: limit ?? 20,
                currPageIndex: (offset ?? 0) / (limit ?? 20) + 1,
                pageCount: Math.ceil(totalCount / (limit ?? 20)),
            });
        }, timeout);

        // if (options?.signal) {
        //     options.signal.addEventListener('abort', () => {
        //         clearTimeout(timer);
        //         reject(new DOMException('Aborted', 'AbortError'));
        //     });
        // }
    });
}
