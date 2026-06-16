import { isCancel } from 'axios';
import { isString, keys } from 'lodash-es';

/**
 * 解析错误原因，返回更具可读性的提示
 * @param error 错误对象
 */
export function parseErrorReason(error: any): string {
    // 0. 直接传入错误信息
    if (isString(error)) {
        if (error.includes('database') || error.includes('java.sql.')) {
            return '接口异常';
        }

        return error;
    }

    // 1. 判断是否为手动取消
    if (isCancel(error)) return '请求已取消';

    // 2. 网络/连接相关错误 (通常是 axios 包装的错误)
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return '请求超时，请稍后重试';
    }

    if (!window.navigator.onLine || error.message === 'Network Error') {
        return '网络连接断开，请检查网络设置';
    }

    // 3. HTTP 状态码处理 (Response 存在时)
    if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        // 优先返回后端给出的业务错误信息
        if (data && data.message) return data.message;

        switch (status) {
            case 400:
                return '请求参数错误 (400)';
            case 401:
                return '登录已过期，请重新登录 (401)';
            case 403:
                return '拒绝访问，权限不足 (403)';
            case 404:
                return '资源未找到 (404)';
            case 500:
                return '服务器内部错误 (500)';
            case 502:
                return '网关错误 (502)';
            case 503:
                return '服务不可用 (503)';
            default:
                return `网络异常 (${status})`;
        }
    }

    // 4. 代码逻辑错误 (如数据解析失败、变量未定义)
    if (error instanceof SyntaxError) return '数据解析异常';
    if (error instanceof TypeError) return '程序运行异常';

    // 5. 表单验证失败
    if (error instanceof Object && error[keys(error)?.[0]]?.[0]?.message) {
        return error[keys(error)?.[0]]?.[0]?.message;
    }

    // 6. 兜底处理
    return error.message || '未知错误';
}
