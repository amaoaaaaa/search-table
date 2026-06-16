import { ref, watch, type Ref, isRef, toRef } from 'vue';

/**
 * 创建一个带延迟的布尔 Ref。
 *
 * 当 source 为 true 时，延迟指定时间后才同步为 true；
 * 当 source 为 false 时，立即同步为 false。
 *
 * @param source 源 Ref<boolean>
 * @param delay 延迟时间（毫秒），默认 300ms
 * @returns 延迟后的 Ref<boolean>
 *
 * @example
 * const loading = ref(false);
 * const delayedLoading = useDelayedRef(loading, 500);
 *
 * loading.value = true;  // 500ms 后 delayedLoading.value 才变为 true
 * loading.value = false; // 立即变为 false
 */
export function useDelayedRef(source: Ref<boolean>, delay?: number): Ref<boolean>;

/**
 * 创建一个带延迟的布尔 Ref（对象属性版本）。
 *
 * 当指定对象属性为 true 时，延迟指定时间后才同步为 true；
 * 当为 false 时，立即同步为 false。
 *
 * @typeParam T 源对象类型
 * @typeParam K 属性键（必须是 boolean 类型属性）
 *
 * @param source 源对象
 * @param property 需要监听的属性名
 * @param delay 延迟时间（毫秒），默认 300ms
 * @returns 延迟后的 Ref<boolean>
 *
 * @example
 * const state = reactive({ loading: false });
 * const delayedLoading = useDelayedRef(state, 'loading', 500);
 *
 * state.loading = true;  // 500ms 后 delayedLoading.value 才变为 true
 * state.loading = false; // 立即变为 false
 */
export function useDelayedRef<T extends object, K extends keyof T>(
    source: T,
    property: K,
    delay?: number,
): Ref<boolean>;

// 函数实现
export function useDelayedRef(
    source: any,
    propertyOrDelay?: any,
    maybeDelay?: number,
): Ref<boolean> {
    let sourceRef: Ref<boolean>;
    let delay: number;

    // 参数归一化
    if (isRef(source)) {
        sourceRef = source as Ref<boolean>;
        delay = propertyOrDelay ?? 300;
    } else {
        sourceRef = toRef(source, propertyOrDelay);
        delay = maybeDelay ?? 300;
    }

    // 最后返回的引用
    const target = ref<boolean>(sourceRef.value);

    // 延迟控制
    let timer: ReturnType<typeof setTimeout> | null = null;
    const clearTimer = () => {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
    };

    // 监听源数据
    watch(
        sourceRef,
        (value) => {
            if (value) {
                clearTimer();

                // true 延迟生效
                timer = setTimeout(() => {
                    target.value = true;
                }, delay);
            } else {
                clearTimer();

                // false 立即生效
                target.value = false;
            }
        },
        { immediate: false },
    );

    return target;
}
