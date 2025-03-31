import React, { useState, useEffect } from 'react';
import './App.css';
import Timer from './components/Timer';
import TimerSettings from './components/TimerSettings';

// 自定义Hook: 处理本地存储
const useLocalStorage = (key, initialValue) => {
    // 获取初始值
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // 设置值到本地存储
    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    };

    return [storedValue, setValue];
};

// 调试Electron环境
const debugElectron = () => {
    // 首先检查Electron API是否存在
    if (typeof window === 'undefined' || !window.electronAPI) {
        console.log('Web环境运行，Electron API不可用');
        return {
            isElectron: false,
            error: 'Web环境运行，Electron API不可用'
        };
    }

    try {
        // 获取Electron调试信息
        const debugInfo = {
            isElectron: window.electronAPI.isElectron,
            versions: window.electronAPI.debug?.getVersion?.() || '无法获取版本信息',
            pathTest: window.electronAPI.debug?.testPathModule?.() || '无法测试path模块'
        };

        console.log('Electron调试信息:', debugInfo);
        return debugInfo;
    } catch (error) {
        console.error('Electron调试错误:', error);
        return {
            isElectron: false,
            error: error.message
        };
    }
};

function App() {
    // 使用自定义本地存储Hook保存设置
    const [pomodoroTime, setPomodoroTime] = useLocalStorage('pomodoroTime', 25);
    const [shortBreakTime, setShortBreakTime] = useLocalStorage('shortBreakTime', 5);
    const [longBreakTime, setLongBreakTime] = useLocalStorage('longBreakTime', 15);
    const [longBreakInterval, setLongBreakInterval] = useLocalStorage('longBreakInterval', 4);
    const [autoStartBreaks, setAutoStartBreaks] = useLocalStorage('autoStartBreaks', true);
    const [autoStartPomodoros, setAutoStartPomodoros] = useLocalStorage('autoStartPomodoros', true);
    const [alarmVolume, setAlarmVolume] = useLocalStorage('alarmVolume', 70);
    const [tickingVolume, setTickingVolume] = useLocalStorage('tickingVolume', 20);
    const [tickingInterval, setTickingInterval] = useLocalStorage('tickingInterval', 1000);

    // 设置模态框状态
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Electron调试状态
    const [electronDebugInfo, setElectronDebugInfo] = useState(null);
    const [showDebug, setShowDebug] = useState(false);

    // 更新标题
    useEffect(() => {
        document.title = '番茄工作法';
    }, []);

    // 初始化时检查Electron环境
    useEffect(() => {
        console.log('检查环境...');
        try {
            if (typeof window !== 'undefined' && window.electronAPI) {
                console.log('Electron环境已检测到');
                setElectronDebugInfo(debugElectron());
            } else {
                console.log('Web环境运行');
                setElectronDebugInfo({
                    isElectron: false,
                    info: 'Web环境，Electron功能不可用'
                });
            }
        } catch (error) {
            console.error('环境检测错误:', error);
        }
    }, []);

    // 检查Electron API是否可用
    const isElectron = () => {
        return typeof window !== 'undefined' &&
            window.electronAPI &&
            window.electronAPI.isElectron;
    };

    // 处理计时完成事件
    const handleTimerComplete = (event) => {
        // 检查是否是设置更改事件
        if (event && typeof event === 'object' && event.type === 'settingsChange') {
            // 处理设置更改
            if ('tickingVolume' in event) {
                setTickingVolume(event.tickingVolume);
                console.log('更新滴答声音量:', event.tickingVolume);
            }
            if ('alarmVolume' in event) {
                setAlarmVolume(event.alarmVolume);
                console.log('更新闹钟声音量:', event.alarmVolume);
            }
            return;
        }

        // 以下是原来的计时完成处理逻辑
        const mode = event; // 之前的参数是模式字符串

        // 尝试显示系统通知
        if (isElectron()) {
            try {
                window.electronAPI.sendNotification({
                    title: mode === 'pomodoro' ? '番茄时间结束！' : '休息时间结束！',
                    body: mode === 'pomodoro' ? '是时候休息一下了。' : '回到工作状态吧！'
                }).catch(err => {
                    console.error('通知发送失败:', err);
                    fallbackNotification(mode);
                });
            } catch (error) {
                console.error('Electron通知错误:', error);
                fallbackNotification(mode);
            }
        } else {
            fallbackNotification(mode);
        }
    };

    // 回退通知方法 - 用于Electron不可用时
    const fallbackNotification = (mode) => {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(
                    mode === 'pomodoro' ? '番茄时间结束！' : '休息时间结束！',
                    {
                        body: mode === 'pomodoro' ? '是时候休息一下了。' : '回到工作状态吧！',
                        icon: '/tomato.png'
                    }
                );
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        fallbackNotification(mode);
                    } else {
                        // 如果通知权限被拒绝，则使用标题闪烁来提示
                        flashTitle(mode === 'pomodoro' ? '番茄时间结束！' : '休息时间结束！', 5);
                    }
                });
            } else {
                // 通知权限被拒绝，使用标题闪烁
                flashTitle(mode === 'pomodoro' ? '番茄时间结束！' : '休息时间结束！', 5);
            }
        } else {
            // 浏览器不支持通知，使用标题闪烁
            flashTitle(mode === 'pomodoro' ? '番茄时间结束！' : '休息时间结束！', 5);
        }
    };

    // 设置标题闪烁效果
    const flashTitle = (message, times) => {
        let count = 0;
        const originalTitle = document.title;
        const interval = setInterval(() => {
            document.title = document.title === originalTitle ? message : originalTitle;
            count++;
            if (count >= times * 2) {
                clearInterval(interval);
                document.title = originalTitle;
            }
        }, 500);
    };

    // 打开设置
    const openSettings = () => {
        setIsSettingsOpen(true);
    };

    // 关闭设置
    const closeSettings = () => {
        setIsSettingsOpen(false);
    };

    // 处理设置更改
    const handleSettingsChange = (newSettings) => {
        setPomodoroTime(newSettings.pomodoroTime);
        setShortBreakTime(newSettings.shortBreakTime);
        setLongBreakTime(newSettings.longBreakTime);
        setLongBreakInterval(newSettings.longBreakInterval);
        setAutoStartBreaks(newSettings.autoStartBreaks);
        setAutoStartPomodoros(newSettings.autoStartPomodoros);
        setAlarmVolume(newSettings.alarmVolume);
        setTickingVolume(newSettings.tickingVolume);
        setTickingInterval(newSettings.tickingInterval);
    };

    // 最小化到托盘
    const minimizeToTray = () => {
        if (isElectron()) {
            try {
                window.electronAPI.minimizeToTray()
                    .catch(err => {
                        console.error('最小化到托盘失败:', err);
                        alert('无法最小化到托盘');
                    });
            } catch (error) {
                console.error('最小化到托盘错误:', error);
                alert('最小化到托盘功能不可用');
            }
        } else {
            console.log('Web环境不支持最小化到托盘功能');
            // 在Web环境中提供反馈
            alert('最小化到托盘功能仅在桌面应用中可用');
        }
    };

    // 重新检查Electron环境
    const recheckElectron = () => {
        setElectronDebugInfo(debugElectron());
    };

    // 请求通知权限
    useEffect(() => {
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }, []);

    // 处理键盘事件
    useEffect(() => {
        const handleKeyDown = (e) => {
            // 按下 S 键打开设置
            if (e.key === 's' && !isSettingsOpen) {
                openSettings();
            }
            // 按下 ESC 键关闭设置
            if (e.key === 'Escape' && isSettingsOpen) {
                closeSettings();
            }
            // 按下 D 键显示/隐藏调试信息
            if (e.key === 'd' && e.ctrlKey && e.shiftKey) {
                setShowDebug(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isSettingsOpen]);

    return (
        <div className="min-h-screen flex flex-col">
            <header className="py-4 px-6 bg-white shadow-sm dark:bg-gray-800">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-tomato">番茄工作法</h1>
                    <div className="flex space-x-2">
                        {/* 只在Electron环境中显示最小化按钮 */}
                        {isElectron() && (
                            <button
                                onClick={minimizeToTray}
                                className="button button-secondary"
                                aria-label="最小化到托盘"
                                tabIndex={0}
                            >
                                最小化
                            </button>
                        )}
                        <button
                            onClick={openSettings}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    openSettings();
                                }
                            }}
                            className="button button-secondary"
                            aria-label="打开设置"
                            aria-haspopup="dialog"
                            tabIndex={0}
                        >
                            设置
                        </button>
                        {/* 只在开发环境显示调试按钮 */}
                        {import.meta.env.DEV && (
                            <button
                                onClick={() => setShowDebug(prev => !prev)}
                                className="button button-secondary opacity-50 hover:opacity-100"
                                aria-label="显示调试信息"
                                title="显示环境调试信息"
                            >
                                {showDebug ? '隐藏调试' : '调试'}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center">
                {showDebug && (
                    <div className="w-full max-w-2xl mb-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-auto">
                        <div className="flex justify-between mb-2">
                            <h2 className="text-lg font-bold">环境调试信息</h2>
                            <button
                                onClick={recheckElectron}
                                className="text-sm py-1 px-2 bg-blue-500 text-white rounded"
                            >
                                重新检查
                            </button>
                        </div>
                        <div className="text-sm font-mono">
                            <p>运行环境: {electronDebugInfo?.isElectron ? 'Electron桌面应用' : 'Web浏览器'}</p>
                            {electronDebugInfo?.error && (
                                <p className="text-red-500">错误: {electronDebugInfo.error}</p>
                            )}
                            {electronDebugInfo?.info && (
                                <p className="text-blue-500">{electronDebugInfo.info}</p>
                            )}
                            {electronDebugInfo?.isElectron && electronDebugInfo?.versions && (
                                <div className="mt-2">
                                    <p>版本信息:</p>
                                    <pre className="bg-gray-200 dark:bg-gray-800 p-2 rounded text-xs overflow-auto">
                                        {JSON.stringify(electronDebugInfo.versions, null, 2)}
                                    </pre>
                                </div>
                            )}
                            {electronDebugInfo?.isElectron && electronDebugInfo?.pathTest && (
                                <div className="mt-2">
                                    <p>Path模块测试:</p>
                                    <pre className="bg-gray-200 dark:bg-gray-800 p-2 rounded text-xs overflow-auto">
                                        {JSON.stringify(electronDebugInfo.pathTest, null, 2)}
                                    </pre>
                                </div>
                            )}
                            <div className="mt-2">
                                <p>浏览器信息:</p>
                                <pre className="bg-gray-200 dark:bg-gray-800 p-2 rounded text-xs overflow-auto">
                                    {`User Agent: ${navigator.userAgent}`}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}

                <Timer
                    pomodoroTime={pomodoroTime}
                    shortBreakTime={shortBreakTime}
                    longBreakTime={longBreakTime}
                    longBreakInterval={longBreakInterval}
                    autoStartBreaks={autoStartBreaks}
                    autoStartPomodoros={autoStartPomodoros}
                    alarmVolume={alarmVolume}
                    tickingVolume={tickingVolume}
                    tickingInterval={tickingInterval}
                    onTimerComplete={handleTimerComplete}
                />
            </main>

            {isSettingsOpen && (
                <TimerSettings
                    pomodoroTime={pomodoroTime}
                    shortBreakTime={shortBreakTime}
                    longBreakTime={longBreakTime}
                    longBreakInterval={longBreakInterval}
                    autoStartBreaks={autoStartBreaks}
                    autoStartPomodoros={autoStartPomodoros}
                    alarmVolume={alarmVolume}
                    tickingVolume={tickingVolume}
                    tickingInterval={tickingInterval}
                    onClose={closeSettings}
                    onSave={handleSettingsChange}
                />
            )}

            <footer className="py-4 text-center text-gray-500 text-sm dark:text-gray-400">
                <p>开源的番茄工作法应用 &copy; {new Date().getFullYear()}</p>
            </footer>
        </div>
    );
}

export default App;