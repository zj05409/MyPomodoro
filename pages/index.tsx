import { useState, useEffect } from 'react';
import Head from 'next/head';
import Timer from '../components/Timer';
import TimerSettings from '../components/TimerSettings';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function Home() {
    // 使用 localStorage 存储设置
    const [pomodoroTime, setPomodoroTime] = useLocalStorage('pomodoroTime', 25 * 60);
    const [shortBreakTime, setShortBreakTime] = useLocalStorage('shortBreakTime', 5 * 60);
    const [longBreakTime, setLongBreakTime] = useLocalStorage('longBreakTime', 15 * 60);
    const [longBreakInterval, setLongBreakInterval] = useLocalStorage('longBreakInterval', 4);
    const [autoStartBreaks, setAutoStartBreaks] = useLocalStorage('autoStartBreaks', true);
    const [autoStartPomodoros, setAutoStartPomodoros] = useLocalStorage('autoStartPomodoros', true);

    // 设置模态框状态
    const [showSettings, setShowSettings] = useState(false);

    // 更新标题
    useEffect(() => {
        document.title = '番茄工作法';
    }, []);

    // 处理计时完成事件
    const handleTimerComplete = (mode: 'pomodoro' | 'shortBreak' | 'longBreak') => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;

        if (Notification.permission !== 'granted') {
            // 如果没有通知权限，尝试请求
            Notification.requestPermission();
            // 同时通过标题闪烁来提示
            const originalTitle = document.title;
            document.title = mode === 'pomodoro' ? '🍅 休息时间！' : '🔔 工作时间！';
            setTimeout(() => { document.title = originalTitle; }, 3000);
            return;
        }

        try {
            if (mode === 'pomodoro') {
                new Notification('番茄时间结束', {
                    body: '休息一下吧！',
                    icon: '/tomato.png',
                });
            } else {
                new Notification('休息结束', {
                    body: '回到工作状态！',
                    icon: '/tomato.png',
                });
            }
        } catch (error) {
            console.error('通知创建失败:', error);
            // 通知失败时使用标题闪烁提示
            const originalTitle = document.title;
            document.title = mode === 'pomodoro' ? '🍅 休息时间！' : '🔔 工作时间！';
            setTimeout(() => { document.title = originalTitle; }, 3000);
        }
    };

    // 处理设置更改
    const handleSettingsChange = (settings: {
        pomodoroTime: number;
        shortBreakTime: number;
        longBreakTime: number;
        longBreakInterval: number;
        autoStartBreaks: boolean;
        autoStartPomodoros: boolean;
    }) => {
        setPomodoroTime(settings.pomodoroTime);
        setShortBreakTime(settings.shortBreakTime);
        setLongBreakTime(settings.longBreakTime);
        setLongBreakInterval(settings.longBreakInterval);
        setAutoStartBreaks(settings.autoStartBreaks);
        setAutoStartPomodoros(settings.autoStartPomodoros);
    };

    // 打开设置面板
    const handleOpenSettings = () => {
        setShowSettings(true);
    };

    // 关闭设置面板
    const handleCloseSettings = () => {
        setShowSettings(false);
    };

    // 请求通知权限
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
    }, []);

    // 处理键盘事件
    const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            action();
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Head>
                <title>番茄工作法</title>
                <meta name="description" content="一个专注于提高工作效率的番茄工作法计时应用" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <header className="py-4 px-6 bg-white shadow-sm dark:bg-gray-800">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-tomato">番茄工作法</h1>
                    <button
                        onClick={handleOpenSettings}
                        onKeyDown={(e) => handleKeyDown(e, handleOpenSettings)}
                        className="button button-secondary"
                        aria-label="打开设置"
                        aria-haspopup="dialog"
                        tabIndex={0}
                    >
                        设置
                    </button>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center">
                <Timer
                    initialPomodoro={pomodoroTime}
                    initialShortBreak={shortBreakTime}
                    initialLongBreak={longBreakTime}
                    autoStartBreaks={autoStartBreaks}
                    autoStartPomodoros={autoStartPomodoros}
                    longBreakInterval={longBreakInterval}
                    onComplete={handleTimerComplete}
                />
            </main>

            <footer className="py-4 px-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>© {new Date().getFullYear()} 番茄工作法 - 提高效率的最佳伙伴</p>
            </footer>

            {showSettings && (
                <TimerSettings
                    pomodoroTime={pomodoroTime}
                    shortBreakTime={shortBreakTime}
                    longBreakTime={longBreakTime}
                    longBreakInterval={longBreakInterval}
                    autoStartBreaks={autoStartBreaks}
                    autoStartPomodoros={autoStartPomodoros}
                    onSettingsChange={handleSettingsChange}
                    onClose={handleCloseSettings}
                />
            )}
        </div>
    );
} 