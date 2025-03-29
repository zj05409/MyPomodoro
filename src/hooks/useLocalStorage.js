import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
    // 状态初始化函数
    const initialize = () => {
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            // localStorage不可用的回退处理
            if (item === null) {
                return initialValue;
            }

            return JSON.parse(item);
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    };

    // 状态
    const [storedValue, setStoredValue] = useState(initialize);

    // 返回包装版本的 useState 的 setter 函数，将新值保存到 localStorage
    const setValue = (value) => {
        try {
            // 允许值是一个函数，这样可以有和 useState 一样的 API
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            // 保存状态
            setStoredValue(valueToStore);

            // 保存到 localStorage
            if (typeof window === 'undefined') return;

            try {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            } catch (storageError) {
                console.error(`Error setting localStorage key "${key}":`, storageError);
                // 尝试使用sessionStorage作为回退
                try {
                    window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
                } catch (sessionError) {
                    console.error(`SessionStorage also failed for key "${key}":`, sessionError);
                }
            }
        } catch (error) {
            console.error(`Error processing value for "${key}":`, error);
        }
    };

    // 检测localStorage可用性，并设置监听器
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 检查localStorage可用性
        try {
            const testKey = `${key}_test`;
            window.localStorage.setItem(testKey, '1');
            window.localStorage.removeItem(testKey);
        } catch (error) {
            console.warn('localStorage is not available, using in-memory storage only');
            return; // 不设置监听器，因为localStorage不可用
        }

        // 监听其他标签页的 storage 事件，保持数据同步
        const handleStorageChange = (event) => {
            if (event.key !== key) return;
            if (!event.newValue) return;

            try {
                const newValue = JSON.parse(event.newValue);
                setStoredValue(newValue);
            } catch (parseError) {
                console.error(`Error parsing storage event value for "${key}":`, parseError);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [key]);

    return [storedValue, setValue];
} 