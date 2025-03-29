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

    // 设置模态框状态
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // 更新标题
    useEffect(() => {
        document.title = '番茄工作法';
    }, []);

    // 检查Electron API是否可用
    const isElectron = () => {
        return window?.electronAPI?.isElectron || false;
    };

    // 处理计时完成事件
    const handleTimerComplete = (mode) => {
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
    };

    // 最小化到托盘
    const minimizeToTray = () => {
        if (isElectron()) {
            try {
                window.electronAPI.minimizeToTray()
                    .catch(err => console.error('最小化到托盘失败:', err));
            } catch (error) {
                console.error('最小化到托盘错误:', error);
            }
        }
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
                    </div>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center">
                <Timer
                    pomodoroTime={pomodoroTime}
                    shortBreakTime={shortBreakTime}
                    longBreakTime={longBreakTime}
                    longBreakInterval={longBreakInterval}
                    autoStartBreaks={autoStartBreaks}
                    autoStartPomodoros={autoStartPomodoros}
                    alarmVolume={alarmVolume}
                    tickingVolume={tickingVolume}
                    onTimerComplete={handleTimerComplete}
                />
            </main>

            <footer className="py-4 px-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>© {new Date().getFullYear()} 番茄工作法 - 提高效率的最佳伙伴</p>
            </footer>

            {isSettingsOpen && (
                <TimerSettings
                    isOpen={isSettingsOpen}
                    onClose={closeSettings}
                    pomodoroTime={pomodoroTime}
                    shortBreakTime={shortBreakTime}
                    longBreakTime={longBreakTime}
                    longBreakInterval={longBreakInterval}
                    autoStartBreaks={autoStartBreaks}
                    autoStartPomodoros={autoStartPomodoros}
                    alarmVolume={alarmVolume}
                    tickingVolume={tickingVolume}
                    onSettingsChange={handleSettingsChange}
                />
            )}
        </div>
    );
}

export default App; 