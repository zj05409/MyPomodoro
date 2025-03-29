import React, { useState, useEffect, useRef } from 'react';
import './Timer.css';

const Timer = ({
    pomodoroTime,
    shortBreakTime,
    longBreakTime,
    longBreakInterval,
    autoStartBreaks,
    autoStartPomodoros,
    alarmVolume,
    tickingVolume,
    onTimerComplete
}) => {
    // 计时器状态
    const [mode, setMode] = useState('pomodoro');
    const [timeLeft, setTimeLeft] = useState(pomodoroTime * 60);
    const [isActive, setIsActive] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [pomodoroCount, setPomodoroCount] = useState(0);

    // 音频引用
    const alarmSound = useRef(null);
    const tickingSound = useRef(null);

    // 倒计时计时器
    const timer = useRef(null);
    const startTime = useRef(null);
    const remainingTime = useRef(0);

    // 初始化音频
    useEffect(() => {
        alarmSound.current = new Audio('/alarm.mp3');
        tickingSound.current = new Audio('/ticking.mp3');
        tickingSound.current.loop = true;

        // 设置音量
        alarmSound.current.volume = alarmVolume / 100;
        tickingSound.current.volume = tickingVolume / 100;

        return () => {
            if (tickingSound.current) {
                tickingSound.current.pause();
            }
            if (alarmSound.current) {
                alarmSound.current.pause();
            }
            clearInterval(timer.current);
        };
    }, []);

    // 当音量设置改变时更新音量
    useEffect(() => {
        if (alarmSound.current) {
            alarmSound.current.volume = alarmVolume / 100;
        }
        if (tickingSound.current) {
            tickingSound.current.volume = tickingVolume / 100;
        }
    }, [alarmVolume, tickingVolume]);

    // 根据模式设置时间
    useEffect(() => {
        let time;
        switch (mode) {
            case 'pomodoro':
                time = pomodoroTime * 60;
                break;
            case 'shortBreak':
                time = shortBreakTime * 60;
                break;
            case 'longBreak':
                time = longBreakTime * 60;
                break;
            default:
                time = pomodoroTime * 60;
        }
        setTimeLeft(time);
        remainingTime.current = time;
        document.title = formatTime(time) + ' - 番茄工作法';
        setIsBreak(mode !== 'pomodoro');
    }, [mode, pomodoroTime, shortBreakTime, longBreakTime]);

    // 使用前一个值的引用
    const usePrevious = (value) => {
        const ref = useRef();
        useEffect(() => {
            ref.current = value;
        });
        return ref.current;
    };

    const prevIsActive = usePrevious(isActive);

    // 处理计时器模式切换的效果
    useEffect(() => {
        if (!prevIsActive && isActive) {
            // 开始计时
            startTicking();
        } else if (prevIsActive && !isActive) {
            // 停止计时
            stopTicking();
        }
    }, [isActive]);

    // 开始计时的更精确方法
    const startTicking = () => {
        startTime.current = Date.now();
        clearInterval(timer.current);

        if (tickingSound.current && tickingVolume > 0) {
            tickingSound.current.play().catch(err => console.error('播放滴答声失败:', err));
        }

        timer.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
            const newRemainingTime = Math.max(0, remainingTime.current - elapsed);

            setTimeLeft(newRemainingTime);
            document.title = formatTime(newRemainingTime) + ' - 番茄工作法';

            if (newRemainingTime === 0) {
                handleComplete();
            }
        }, 200); // 更频繁地更新以保持精确性
    };

    // 停止计时
    const stopTicking = () => {
        remainingTime.current = timeLeft;
        clearInterval(timer.current);

        if (tickingSound.current) {
            tickingSound.current.pause();
        }
    };

    // 处理计时器完成
    const handleComplete = () => {
        clearInterval(timer.current);
        setIsActive(false);

        if (tickingSound.current) {
            tickingSound.current.pause();
        }

        if (alarmSound.current && alarmVolume > 0) {
            alarmSound.current.play().catch(err => console.error('播放闹钟声失败:', err));
        }

        // 更新番茄计数和自动切换到下一个模式
        if (mode === 'pomodoro') {
            const newCount = pomodoroCount + 1;
            setPomodoroCount(newCount);

            if (newCount % longBreakInterval === 0) {
                setTimeout(() => {
                    changeMode('longBreak');
                    if (autoStartBreaks) setIsActive(true);
                }, 500);
            } else {
                setTimeout(() => {
                    changeMode('shortBreak');
                    if (autoStartBreaks) setIsActive(true);
                }, 500);
            }
        } else {
            // 从休息状态切换回番茄
            setTimeout(() => {
                changeMode('pomodoro');
                if (autoStartPomodoros) setIsActive(true);
            }, 500);
        }

        // 通知父组件计时器完成
        onTimerComplete && onTimerComplete(mode);
    };

    // 切换计时器模式
    const changeMode = (newMode) => {
        setMode(newMode);
        setIsActive(false);
    };

    // 格式化时间显示
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // 切换计时器状态
    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    // 重置计时器
    const resetTimer = () => {
        setIsActive(false);
        let time;
        switch (mode) {
            case 'pomodoro':
                time = pomodoroTime * 60;
                break;
            case 'shortBreak':
                time = shortBreakTime * 60;
                break;
            case 'longBreak':
                time = longBreakTime * 60;
                break;
            default:
                time = pomodoroTime * 60;
        }
        setTimeLeft(time);
        remainingTime.current = time;
        document.title = formatTime(time) + ' - 番茄工作法';
    };

    return (
        <div className="timer">
            <div className="timer-modes">
                <button
                    className={`mode-button ${mode === 'pomodoro' ? 'active' : ''}`}
                    onClick={() => changeMode('pomodoro')}
                >
                    番茄
                </button>
                <button
                    className={`mode-button ${mode === 'shortBreak' ? 'active' : ''}`}
                    onClick={() => changeMode('shortBreak')}
                >
                    短休息
                </button>
                <button
                    className={`mode-button ${mode === 'longBreak' ? 'active' : ''}`}
                    onClick={() => changeMode('longBreak')}
                >
                    长休息
                </button>
            </div>

            <div className="time-display">
                {formatTime(timeLeft)}
            </div>

            <div className="timer-controls">
                <button
                    className={`control-button ${isActive ? 'pause' : 'start'}`}
                    onClick={toggleTimer}
                >
                    {isActive ? '暂停' : '开始'}
                </button>
                <button
                    className="control-button reset"
                    onClick={resetTimer}
                >
                    重置
                </button>
            </div>

            <div className="timer-info">
                <span className={`status ${isBreak ? 'break' : 'focus'}`}>
                    {isBreak ? '休息中...' : '专注中...'}
                </span>
                <span className="counter">
                    完成: {pomodoroCount}
                </span>
            </div>
        </div>
    );
};

export default Timer; 