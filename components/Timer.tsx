import React, { useState, useEffect, useRef } from 'react';

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

interface TimerProps {
    initialPomodoro: number;
    initialShortBreak: number;
    initialLongBreak: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    longBreakInterval: number;
    onComplete: (mode: TimerMode) => void;
}

const Timer: React.FC<TimerProps> = ({
    initialPomodoro = 25 * 60,
    initialShortBreak = 5 * 60,
    initialLongBreak = 15 * 60,
    autoStartBreaks = true,
    autoStartPomodoros = true,
    longBreakInterval = 4,
    onComplete
}) => {
    const [mode, setMode] = useState<TimerMode>('pomodoro');
    const [timeLeft, setTimeLeft] = useState(initialPomodoro);
    const [isActive, setIsActive] = useState(false);
    const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
    const [isReset, setIsReset] = useState(true);

    // 音效引用
    const alarmSoundRef = useRef<HTMLAudioElement | null>(null);
    const tickingSoundRef = useRef<HTMLAudioElement | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [tickingEnabled, setTickingEnabled] = useState(false);

    // 初始化音效
    useEffect(() => {
        if (typeof window === 'undefined') return;

        alarmSoundRef.current = new Audio('/alarm.mp3');
        tickingSoundRef.current = new Audio('/ticking.mp3');

        if (tickingSoundRef.current) {
            tickingSoundRef.current.loop = true;
        }

        return () => {
            if (tickingSoundRef.current) {
                tickingSoundRef.current.pause();
            }
        };
    }, []);

    // 切换模式时重置计时器
    useEffect(() => {
        switch (mode) {
            case 'pomodoro':
                setTimeLeft(initialPomodoro);
                break;
            case 'shortBreak':
                setTimeLeft(initialShortBreak);
                break;
            case 'longBreak':
                setTimeLeft(initialLongBreak);
                break;
        }
        setIsReset(true);
        setIsActive(false);
    }, [mode, initialPomodoro, initialShortBreak, initialLongBreak]);

    // 计时器核心逻辑
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        // Early return if not active or time is up
        if (!isActive) {
            if (tickingSoundRef.current) {
                tickingSoundRef.current.pause();
                if (tickingSoundRef.current.currentTime) {
                    tickingSoundRef.current.currentTime = 0;
                }
            }
            return;
        }

        if (timeLeft > 0) {
            // 播放滴答声
            if (tickingEnabled && tickingSoundRef.current && soundEnabled) {
                tickingSoundRef.current.play().catch(error => {
                    console.error("Failed to play ticking sound:", error);
                    // 音频播放失败的回退处理
                    setTickingEnabled(false);
                });
            }

            interval = setInterval(() => {
                setTimeLeft(prevTime => prevTime - 1);
            }, 1000);
        } else {
            // 计时完成
            if (soundEnabled && alarmSoundRef.current) {
                alarmSoundRef.current.play().catch(error => {
                    console.error("Failed to play alarm sound:", error);
                    // 显示视觉提示作为回退
                    document.title = "⏰ 时间到！";
                    setTimeout(() => {
                        document.title = "番茄工作法";
                    }, 3000);
                });
            }

            // 停止滴答声
            if (tickingSoundRef.current) {
                tickingSoundRef.current.pause();
                if (tickingSoundRef.current.currentTime) {
                    tickingSoundRef.current.currentTime = 0;
                }
            }

            setIsActive(false);

            // 通知完成并处理自动切换
            onComplete(mode);

            if (mode === 'pomodoro') {
                const newPomodorosCompleted = pomodorosCompleted + 1;
                setPomodorosCompleted(newPomodorosCompleted);

                // 根据番茄钟完成数决定休息类型
                if (newPomodorosCompleted % longBreakInterval === 0) {
                    setMode('longBreak');
                    if (autoStartBreaks) {
                        setTimeout(() => {
                            setIsActive(true);
                            setIsReset(false);
                        }, 500);
                    }
                } else {
                    setMode('shortBreak');
                    if (autoStartBreaks) {
                        setTimeout(() => {
                            setIsActive(true);
                            setIsReset(false);
                        }, 500);
                    }
                }
            } else {
                // 从休息模式回到番茄工作模式
                setMode('pomodoro');
                if (autoStartPomodoros) {
                    setTimeout(() => {
                        setIsActive(true);
                        setIsReset(false);
                    }, 500);
                }
            }
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [
        isActive,
        timeLeft,
        mode,
        pomodorosCompleted,
        longBreakInterval,
        autoStartBreaks,
        autoStartPomodoros,
        onComplete,
        tickingEnabled,
        soundEnabled
    ]);

    // 格式化时间显示
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // 切换计时器状态
    const handleToggleTimer = () => {
        if (timeLeft === 0) {
            // 如果计时结束，重置并开始
            switch (mode) {
                case 'pomodoro':
                    setTimeLeft(initialPomodoro);
                    break;
                case 'shortBreak':
                    setTimeLeft(initialShortBreak);
                    break;
                case 'longBreak':
                    setTimeLeft(initialLongBreak);
                    break;
            }
            setIsActive(true);
            setIsReset(false);
            return;
        }

        // 否则，切换暂停/继续
        setIsActive(!isActive);
        setIsReset(false);
    };

    // 重置计时器
    const handleResetTimer = () => {
        // 停止滴答声
        if (tickingSoundRef.current) {
            tickingSoundRef.current.pause();
            if (tickingSoundRef.current.currentTime) {
                tickingSoundRef.current.currentTime = 0;
            }
        }

        switch (mode) {
            case 'pomodoro':
                setTimeLeft(initialPomodoro);
                break;
            case 'shortBreak':
                setTimeLeft(initialShortBreak);
                break;
            case 'longBreak':
                setTimeLeft(initialLongBreak);
                break;
        }
        setIsActive(false);
        setIsReset(true);
    };

    // 手动切换模式
    const handleModeChange = (newMode: TimerMode) => {
        if (mode === newMode) return;

        // 停止滴答声
        if (tickingSoundRef.current) {
            tickingSoundRef.current.pause();
            if (tickingSoundRef.current.currentTime) {
                tickingSoundRef.current.currentTime = 0;
            }
        }

        setMode(newMode);
    };

    // 计算进度条百分比
    const calculateProgress = (): number => {
        let totalTime;
        switch (mode) {
            case 'pomodoro':
                totalTime = initialPomodoro;
                break;
            case 'shortBreak':
                totalTime = initialShortBreak;
                break;
            case 'longBreak':
                totalTime = initialLongBreak;
                break;
            default:
                totalTime = initialPomodoro;
        }

        return (1 - timeLeft / totalTime) * 100;
    };

    // 获取当前模式的颜色
    const getModeColor = (): string => {
        switch (mode) {
            case 'pomodoro':
                return 'bg-tomato';
            case 'shortBreak':
                return 'bg-rest';
            case 'longBreak':
                return 'bg-long-rest';
            default:
                return 'bg-tomato';
        }
    };

    // 获取按钮文本
    const getButtonText = (): string => {
        if (isReset) return '开始';
        return isActive ? '暂停' : '继续';
    };

    // 处理键盘事件
    const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            action();
        }
    };

    // 切换声音
    const handleToggleSound = () => {
        setSoundEnabled(!soundEnabled);
        if (!soundEnabled && tickingEnabled && isActive) {
            // 重新启用声音并正在计时，开始播放滴答声
            if (tickingSoundRef.current) {
                tickingSoundRef.current.play().catch(console.error);
            }
        } else if (soundEnabled && tickingEnabled && isActive) {
            // 禁用声音但正在播放滴答声，暂停它
            if (tickingSoundRef.current) {
                tickingSoundRef.current.pause();
            }
        }
    };

    // 切换滴答声
    const handleToggleTicking = () => {
        setTickingEnabled(!tickingEnabled);
        if (soundEnabled && !tickingEnabled && isActive) {
            // 启用滴答声并且正在计时，开始播放
            if (tickingSoundRef.current) {
                tickingSoundRef.current.play().catch(console.error);
            }
        } else if (soundEnabled && tickingEnabled && isActive) {
            // 禁用滴答声并且正在播放，暂停它
            if (tickingSoundRef.current) {
                tickingSoundRef.current.pause();
            }
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-4">
            {/* 模式选择按钮 */}
            <div className="flex justify-center space-x-2 mb-6">
                <button
                    className={`button ${mode === 'pomodoro' ? 'button-primary' : 'button-secondary'}`}
                    onClick={() => handleModeChange('pomodoro')}
                    onKeyDown={(e) => handleKeyDown(e, () => handleModeChange('pomodoro'))}
                    aria-label="番茄工作模式"
                    aria-pressed={mode === 'pomodoro'}
                    tabIndex={0}
                >
                    专注
                </button>
                <button
                    className={`button ${mode === 'shortBreak' ? 'button-success' : 'button-secondary'}`}
                    onClick={() => handleModeChange('shortBreak')}
                    onKeyDown={(e) => handleKeyDown(e, () => handleModeChange('shortBreak'))}
                    aria-label="短休息模式"
                    aria-pressed={mode === 'shortBreak'}
                    tabIndex={0}
                >
                    短休息
                </button>
                <button
                    className={`button ${mode === 'longBreak' ? 'button-info' : 'button-secondary'}`}
                    onClick={() => handleModeChange('longBreak')}
                    onKeyDown={(e) => handleKeyDown(e, () => handleModeChange('longBreak'))}
                    aria-label="长休息模式"
                    aria-pressed={mode === 'longBreak'}
                    tabIndex={0}
                >
                    长休息
                </button>
            </div>

            {/* 计时器显示 */}
            <div className="relative mb-8">
                <div className="timer-display text-center mb-2" aria-live="polite" aria-atomic="true">
                    {formatTime(timeLeft)}
                </div>

                {/* 进度条 */}
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={calculateProgress()}>
                    <div
                        className={`h-full ${getModeColor()} transition-all duration-1000 ease-linear`}
                        style={{ width: `${calculateProgress()}%` }}
                    ></div>
                </div>
            </div>

            {/* 控制按钮 */}
            <div className="flex justify-center space-x-4 mb-6">
                <button
                    className={`button ${isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'button-primary'}`}
                    onClick={handleToggleTimer}
                    onKeyDown={(e) => handleKeyDown(e, handleToggleTimer)}
                    aria-label={isActive ? '暂停' : '开始'}
                    tabIndex={0}
                >
                    {getButtonText()}
                </button>
                <button
                    className="button button-secondary"
                    onClick={handleResetTimer}
                    onKeyDown={(e) => handleKeyDown(e, handleResetTimer)}
                    disabled={isReset}
                    aria-label="重置"
                    aria-disabled={isReset}
                    tabIndex={isReset ? -1 : 0}
                >
                    重置
                </button>
            </div>

            {/* 声音控制 */}
            <div className="flex justify-center space-x-4 mb-4">
                <button
                    className={`button ${soundEnabled ? 'button-primary' : 'button-secondary'}`}
                    onClick={handleToggleSound}
                    onKeyDown={(e) => handleKeyDown(e, handleToggleSound)}
                    aria-label={soundEnabled ? '关闭声音' : '打开声音'}
                    aria-pressed={soundEnabled}
                    tabIndex={0}
                >
                    {soundEnabled ? '🔊' : '🔇'}
                </button>
                <button
                    className={`button ${tickingEnabled ? 'button-primary' : 'button-secondary'}`}
                    onClick={handleToggleTicking}
                    onKeyDown={(e) => handleKeyDown(e, handleToggleTicking)}
                    aria-label={tickingEnabled ? '关闭滴答声' : '打开滴答声'}
                    aria-pressed={tickingEnabled}
                    aria-disabled={!soundEnabled}
                    tabIndex={soundEnabled ? 0 : -1}
                    disabled={!soundEnabled}
                >
                    ⏱️
                </button>
            </div>

            {/* 番茄钟计数 */}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
                已完成 <span className="font-bold">{pomodorosCompleted}</span> 个番茄钟
            </div>
        </div>
    );
};

export default Timer; 