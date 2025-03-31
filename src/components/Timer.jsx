import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import './Timer.css';

// 使用memo包装组件以减少不必要的重渲染
const Timer = memo(({
    pomodoroTime,
    shortBreakTime,
    longBreakTime,
    longBreakInterval,
    autoStartBreaks,
    autoStartPomodoros,
    alarmVolume,
    tickingVolume,
    tickingInterval = 1000,
    onTimerComplete
}) => {
    // 调试信息 - 仅在开发环境下输出
    const isInitialRender = useRef(true);

    // 仅在组件首次渲染或tickingInterval变化时输出日志
    useEffect(() => {
        if (isInitialRender.current || process.env.NODE_ENV === 'development') {
            console.log('Timer组件渲染，滴答间隔:', tickingInterval);
            isInitialRender.current = false;
        }
    }, [tickingInterval]);

    // 计时器状态
    const [mode, setMode] = useState('pomodoro');
    const [timeLeft, setTimeLeft] = useState(pomodoroTime * 60);
    const [isActive, setIsActive] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [pomodoroCount, setPomodoroCount] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // 音频引用
    const alarmSound = useRef(null);
    const tickingSound = useRef(null);

    // 倒计时计时器
    const timer = useRef(null);
    const startTime = useRef(null);
    const remainingTime = useRef(0);

    // 滴答声计时器
    const tickingTimer = useRef(null);

    // 创建滴答声播放函数 - 移到这里，确保在使用前定义
    const createPlayTickFunction = useCallback(() => {
        return () => {
            if (tickingSound.current) {
                // 暂停并重置当前音频
                tickingSound.current.pause();
                tickingSound.current.currentTime = 0;

                // 播放滴答声
                tickingSound.current.play()
                    .then(() => {
                        console.log('滴答声播放成功');
                    })
                    .catch(err => {
                        console.error('播放滴答声失败:', err);
                        // 尝试在用户交互后播放
                        const playOnInteraction = () => {
                            if (tickingSound.current) {
                                tickingSound.current.play()
                                    .then(() => {
                                        console.log('用户交互后滴答声播放成功');
                                    })
                                    .catch(e => console.error('再次播放失败:', e));
                            }
                        };
                        // 监听一次点击事件
                        document.addEventListener('click', playOnInteraction, { once: true });
                    });
            }
        };
    }, [tickingSound]);

    // 使用前一个值的引用
    const usePrevious = (value) => {
        const ref = useRef();
        useEffect(() => {
            ref.current = value;
        });
        return ref.current;
    };

    const prevIsActive = usePrevious(isActive);
    const prevMode = usePrevious(mode);

    // 格式化时间显示
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // ===== 提前定义关键函数 =====

    // 开始计时的更精确方法（移到前面定义）
    const startTicking = useCallback(() => {
        // 确保先清除所有现有计时器
        if (timer.current) {
            clearInterval(timer.current);
            timer.current = null;
        }
        if (tickingTimer.current) {
            clearInterval(tickingTimer.current);
            tickingTimer.current = null;
        }

        // 确保在开始计时前刷新当前模式的时间设置
        let currentModeTime;

        // 检查是否是从暂停状态恢复，如果是则使用保存的剩余时间
        if (remainingTime.current > 0 && timeLeft > 0) {
            console.log(`从暂停状态恢复，使用保存的剩余时间: ${timeLeft}秒`);
            currentModeTime = timeLeft;
        } else {
            // 否则使用当前模式的时间设置
            switch (mode) {
                case 'pomodoro':
                    currentModeTime = pomodoroTime * 60;
                    break;
                case 'shortBreak':
                    currentModeTime = shortBreakTime * 60;
                    break;
                case 'longBreak':
                    currentModeTime = longBreakTime * 60;
                    break;
                default:
                    currentModeTime = pomodoroTime * 60;
            }
            console.log(`使用模式默认时间: ${currentModeTime}秒`);
        }

        // 强制更新当前剩余时间，确保使用正确的模式时间
        remainingTime.current = currentModeTime;
        setTimeLeft(currentModeTime);
        console.log(`开始模式: ${mode}, 设置时间: ${currentModeTime}秒`);

        const currentTickingInterval = tickingInterval; // 捕获当前的间隔值
        console.log(`开始计时，当前滴答间隔: ${currentTickingInterval}毫秒, 音量: ${tickingVolume}`);

        startTime.current = Date.now();

        // 只有当滴答声音量大于0时才启动滴答声计时器
        if (tickingSound.current && tickingVolume > 0) {
            console.log(`尝试播放滴答声，间隔: ${currentTickingInterval}毫秒`);

            // 创建新的播放函数
            const playTick = createPlayTickFunction();

            // 立即播放一次
            playTick();

            // 设置定时器以指定间隔播放
            tickingTimer.current = setInterval(playTick, currentTickingInterval);
            console.log('滴答声计时器已创建:', !!tickingTimer.current);
        } else {
            console.log('滴答声音量为0或音频未加载，不创建滴答声计时器');
        }

        timer.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
            const newRemainingTime = Math.max(0, remainingTime.current - elapsed);

            setTimeLeft(newRemainingTime);

            if (newRemainingTime === 0) {
                // 这里使用内联函数而不是直接引用handleComplete，避免循环依赖
                if (timer.current) {
                    clearInterval(timer.current);
                    timer.current = null;
                }
                if (tickingTimer.current) {
                    clearInterval(tickingTimer.current);
                    tickingTimer.current = null;
                }
                setIsActive(false);
                setIsPaused(false);
                if (tickingSound.current) {
                    tickingSound.current.pause();
                    tickingSound.current.currentTime = 0;
                }

                // 播放闹钟声
                if (alarmSound.current && alarmVolume > 0) {
                    alarmSound.current.play().catch(err => {
                        console.error('播放闹钟声失败:', err);
                        document.addEventListener('click', () => {
                            alarmSound.current.play().catch(e => console.error('再次播放失败:', e));
                        }, { once: true });
                    });
                }

                // 更新番茄计数和自动切换到下一个模式
                if (mode === 'pomodoro') {
                    const newCount = pomodoroCount + 1;
                    setPomodoroCount(newCount);

                    // 根据番茄钟完成次数决定休息类型
                    setTimeout(() => {
                        if (newCount % longBreakInterval === 0) {
                            // 长休息
                            changeMode('longBreak');
                            if (autoStartBreaks) setIsActive(true);
                        } else {
                            // 短休息
                            changeMode('shortBreak');
                            if (autoStartBreaks) setIsActive(true);
                        }
                    }, 500);
                } else {
                    // 从休息状态切换回番茄
                    setTimeout(() => {
                        changeMode('pomodoro');
                        if (autoStartPomodoros) setIsActive(true);
                    }, 500);
                }

                // 通知父组件计时器完成
                if (onTimerComplete) onTimerComplete(mode);
            }
        }, 200); // 更频繁地更新以保持精确性
        console.log('主计时器已创建:', !!timer.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        mode, timeLeft, pomodoroTime, shortBreakTime, longBreakTime,
        tickingInterval, tickingVolume, createPlayTickFunction,
        alarmVolume, onTimerComplete, pomodoroCount, longBreakInterval,
        autoStartBreaks, autoStartPomodoros
    ]);

    // 停止计时（移到前面定义）
    const stopTicking = useCallback(() => {
        // 保存当前剩余时间，确保不丢失进度
        remainingTime.current = timeLeft;

        // 清除所有计时器并重置引用
        if (timer.current) {
            console.log('清除主计时器');
            clearInterval(timer.current);
            timer.current = null;
        }

        if (tickingTimer.current) {
            console.log('清除滴答声计时器');
            clearInterval(tickingTimer.current);
            tickingTimer.current = null;
        }

        // 停止滴答声
        if (tickingSound.current) {
            tickingSound.current.pause();
            tickingSound.current.currentTime = 0;
        }

        console.log(`暂停计时，保存当前剩余时间: ${timeLeft}秒`);
    }, [timeLeft]);

    // 处理计时器完成
    const handleComplete = useCallback(() => {
        // 清除所有计时器并重置引用
        if (timer.current) {
            clearInterval(timer.current);
            timer.current = null;
        }

        if (tickingTimer.current) {
            clearInterval(tickingTimer.current);
            tickingTimer.current = null;
        }

        setIsActive(false);
        setIsPaused(false); // 清除暂停状态

        if (tickingSound.current) {
            tickingSound.current.pause();
            tickingSound.current.currentTime = 0;
        }

        if (alarmSound.current && alarmVolume > 0) {
            console.log('尝试播放闹钟声');
            alarmSound.current.play()
                .then(() => {
                    console.log('闹钟声播放成功');
                })
                .catch(err => {
                    console.error('播放闹钟声失败:', err);
                    // 再次尝试播放（有时需要用户交互后才能播放音频）
                    const playOnInteraction = () => {
                        alarmSound.current.play()
                            .then(() => {
                                document.removeEventListener('click', playOnInteraction);
                                console.log('用户交互后闹钟声播放成功');
                            })
                            .catch(e => console.error('再次尝试播放闹钟声失败:', e));
                    };
                    document.addEventListener('click', playOnInteraction, { once: true });
                });
        }

        // 更新番茄计数和自动切换到下一个模式
        if (mode === 'pomodoro') {
            const newCount = pomodoroCount + 1;
            setPomodoroCount(newCount);

            if (newCount % longBreakInterval === 0) {
                setTimeout(() => {
                    changeMode('longBreak');
                    if (autoStartBreaks) {
                        // 直接设置状态而不是调用startTicking
                        setIsActive(true);
                    }
                }, 500);
            } else {
                setTimeout(() => {
                    changeMode('shortBreak');
                    if (autoStartBreaks) {
                        // 直接设置状态而不是调用startTicking
                        setIsActive(true);
                    }
                }, 500);
            }
        } else {
            // 从休息状态切换回番茄
            setTimeout(() => {
                changeMode('pomodoro');
                if (autoStartPomodoros) {
                    // 直接设置状态而不是调用startTicking
                    setIsActive(true);
                }
            }, 500);
        }

        // 通知父组件计时器完成
        onTimerComplete && onTimerComplete(mode);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        mode, alarmVolume, pomodoroCount, longBreakInterval,
        autoStartBreaks, autoStartPomodoros, onTimerComplete
    ]);

    // 切换计时器模式
    const changeMode = useCallback((newMode) => {
        // 停止当前计时
        setIsActive(false);
        setIsPaused(false); // 清除暂停状态

        // 清除所有计时器并重置引用
        if (timer.current) {
            clearInterval(timer.current);
            timer.current = null;
        }

        if (tickingTimer.current) {
            clearInterval(tickingTimer.current);
            tickingTimer.current = null;
        }

        // 设置新模式
        setMode(newMode);

        // 根据新模式立即更新时间
        let newTime;
        switch (newMode) {
            case 'pomodoro':
                newTime = pomodoroTime * 60;
                break;
            case 'shortBreak':
                newTime = shortBreakTime * 60;
                break;
            case 'longBreak':
                newTime = longBreakTime * 60;
                break;
            default:
                newTime = pomodoroTime * 60;
        }

        // 立即更新时间状态，而不是等待useEffect
        setTimeLeft(newTime);
        remainingTime.current = newTime;
        setIsBreak(newMode !== 'pomodoro');
        console.log(`切换到模式: ${newMode}, 设置时间: ${newTime}秒`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pomodoroTime, shortBreakTime, longBreakTime]);

    // 监听时间设置变化
    useEffect(() => {
        // 只在以下情况更新时间:
        // 1. 初始渲染时
        // 2. 模式发生变化时(已在changeMode中处理)
        // 3. 时间设置(pomodoroTime等)发生变化时且计时器未启动

        // 避免在某些情况下重置时间的标志
        const isInitialRender = !prevMode; // 初始渲染
        const isModeChange = prevMode && prevMode !== mode; // 模式改变
        const isSettingsChange = !isActive; // 设置改变且计时器未启动
        const isResumeFromPause = prevIsActive === true && isActive === false; // 从暂停恢复

        // 如果是从暂停恢复，不要重置时间
        if (isResumeFromPause) {
            console.log("暂停后恢复，保持当前时间");
            return;
        }

        // 如果计时器正在运行，不要更新时间
        if (isActive) {
            console.log("计时器正在运行，不更新时间设置");
            return;
        }

        // 如果不是初始渲染、模式变化或设置变化，不要重置时间
        if (!isInitialRender && !isModeChange && !isSettingsChange) {
            console.log("无需更新时间设置");
            return;
        }

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

        console.log(`更新时间设置: ${mode} 模式, ${time}秒`);
        setTimeLeft(time);
        remainingTime.current = time;
        document.title = formatTime(time) + ' - 番茄工作法';

    }, [pomodoroTime, shortBreakTime, longBreakTime, mode, isActive, prevIsActive, prevMode]);

    // 监听timeLeft变化更新文档标题，减少在计时器中频繁更新
    useEffect(() => {
        // 更新文档标题
        document.title = formatTime(timeLeft) + ' - 番茄工作法';
    }, [timeLeft]);

    // 处理计时器模式切换的效果
    useEffect(() => {
        // 在组件卸载时清除所有计时器
        return () => {
            if (timer.current) {
                console.log('组件卸载，清除所有计时器');
                clearInterval(timer.current);
                clearInterval(tickingTimer.current);
                timer.current = null;
                tickingTimer.current = null;
            }
        };
    }, []);

    // 监听isActive状态变化
    useEffect(() => {
        if (!prevIsActive && isActive) {
            // 确保在开始计时前已清除所有现有计时器
            if (timer.current) {
                console.log('清除现有计时器...');
                clearInterval(timer.current);
                timer.current = null;
            }
            if (tickingTimer.current) {
                console.log('清除现有滴答声计时器...');
                clearInterval(tickingTimer.current);
                tickingTimer.current = null;
            }

            // 开始计时
            console.log('开始新计时器');
            startTicking();
        } else if (prevIsActive && !isActive) {
            // 停止计时
            console.log('停止计时器');
            stopTicking();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive, prevIsActive]);

    // 当音量设置改变时更新音量
    useEffect(() => {
        if (alarmSound.current) {
            alarmSound.current.volume = alarmVolume / 100;
        }
        if (tickingSound.current) {
            tickingSound.current.volume = tickingVolume / 100;

            // 如果计时器正在运行，且滴答声音量从无声变为有声，需要启动滴答声计时器
            if (isActive && tickingVolume > 0) {
                console.log('音量从无声变为有声，重新配置滴答声计时器');

                // 停止现有的滴答声计时器
                if (tickingTimer.current) {
                    clearInterval(tickingTimer.current);
                    tickingTimer.current = null;
                }

                // 创建新的播放函数
                const playTick = createPlayTickFunction();

                // 立即播放一次
                playTick();

                // 设置新的滴答声计时器
                tickingTimer.current = setInterval(playTick, tickingInterval);
                console.log('重新创建滴答声计时器:', !!tickingTimer.current);
            } else if (isActive && tickingVolume === 0 && tickingTimer.current) {
                // 如果音量设置为0，且计时器正在运行，停止滴答声计时器
                console.log('音量设置为0，停止滴答声计时器');
                clearInterval(tickingTimer.current);
                tickingTimer.current = null;
            }
        }
    }, [alarmVolume, tickingVolume, isActive, tickingInterval, createPlayTickFunction]);

    // 监听tickingInterval变化
    useEffect(() => {
        // 如果正在计时中，需要重新启动计时器以应用新的间隔设置
        if (isActive && tickingTimer.current) {
            const currentTickingInterval = tickingInterval; // 捕获当前的间隔值
            console.log(`滴答声间隔已更新为: ${currentTickingInterval}毫秒`);

            // 停止当前计时器
            clearInterval(tickingTimer.current);

            // 如果音量大于0才启动滴答声
            if (tickingSound.current && tickingVolume > 0) {
                // 创建新的播放函数
                const playTick = createPlayTickFunction();

                // 用新的间隔重新启动计时器
                tickingTimer.current = setInterval(playTick, currentTickingInterval);
            }
        }
    }, [tickingInterval, isActive, tickingVolume, createPlayTickFunction]);  // eslint-disable-line react-hooks/exhaustive-deps

    // 切换计时器状态
    const toggleTimer = () => {
        if (isActive) {
            // 暂停计时器
            console.log('暂停计时器');
            setIsActive(false);
            setIsPaused(true); // 设置为暂停状态
            // stopTicking函数会被useEffect调用
        } else {
            // 恢复或开始计时器
            console.log('开始/恢复计时器，当前剩余时间:', timeLeft);
            setIsActive(true);
            setIsPaused(false); // 清除暂停状态
            // startTicking函数会被useEffect调用
        }
    };

    // 重置计时器
    const resetTimer = () => {
        // 停止计时
        setIsActive(false);
        setIsPaused(false); // 清除暂停状态
        clearInterval(timer.current);
        clearInterval(tickingTimer.current);

        // 重置时间到当前模式的设定时间
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
        console.log(`重置模式: ${mode}, 设置时间: ${time}秒`);

        // 停止所有音频
        if (tickingSound.current) {
            tickingSound.current.pause();
            tickingSound.current.currentTime = 0;
        }
    };

    // 初始化音频
    useEffect(() => {
        // 检查是否在Electron环境中 - 使用更安全的检测方法
        const isElectronEnv = typeof window !== 'undefined' &&
            window.electronAPI &&
            window.electronAPI.isElectron;

        console.log('环境检测:', isElectronEnv ? 'Electron环境' : 'Web环境');

        const loadAudio = async () => {
            try {
                let alarmPath = '/alarm.mp3';
                let tickingPath = '/ticking.mp3';

                // 如果在Electron环境中，尝试使用API获取路径
                if (isElectronEnv && window.electronAPI?.getResourcePath) {
                    try {
                        alarmPath = await window.electronAPI.getResourcePath('alarm.mp3');
                        tickingPath = await window.electronAPI.getResourcePath('ticking.mp3');
                        console.log('从Electron获取音频路径:', { alarmPath, tickingPath });
                    } catch (error) {
                        console.error('无法从Electron获取资源路径:', error);
                    }
                } else {
                    console.log('Web环境使用标准路径');
                }

                // 创建音频元素
                const alarmEl = new Audio(alarmPath);
                const tickingEl = new Audio(tickingPath);

                // 设置音频属性
                alarmEl.preload = 'auto';
                tickingEl.preload = 'auto';

                // 调试信息
                console.log('音频路径:', { alarmPath, tickingPath });

                // 错误处理
                alarmEl.addEventListener('error', (e) => {
                    console.error('闹钟音频加载失败:', e.target.error);

                    // 回退方案: 尝试硬编码路径
                    const fallbackAlarm = new Audio('./public/alarm.mp3');
                    fallbackAlarm.preload = 'auto';
                    fallbackAlarm.addEventListener('canplaythrough', () => {
                        console.log('回退闹钟音频已加载');
                        alarmSound.current = fallbackAlarm;
                    });
                });

                tickingEl.addEventListener('error', (e) => {
                    console.error('滴答声音频加载失败:', e.target.error);

                    // 回退方案: 尝试硬编码路径
                    const fallbackTicking = new Audio('./public/ticking.mp3');
                    fallbackTicking.preload = 'auto';
                    fallbackTicking.addEventListener('canplaythrough', () => {
                        console.log('回退滴答声音频已加载');
                        tickingSound.current = fallbackTicking;
                    });
                });

                // 设置引用
                alarmSound.current = alarmEl;
                tickingSound.current = tickingEl;

                // 设置音量
                alarmSound.current.volume = alarmVolume / 100;
                tickingSound.current.volume = tickingVolume / 100;

                // 尝试预加载
                alarmEl.load();
                tickingEl.load();
            } catch (error) {
                console.error('音频初始化失败:', error);
            }
        };

        loadAudio();

        return () => {
            if (tickingSound.current) {
                tickingSound.current.pause();
            }
            if (alarmSound.current) {
                alarmSound.current.pause();
            }
            clearInterval(timer.current);
            clearInterval(tickingTimer.current);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
                    className={`control-button ${isActive ? 'pause' : (isPaused ? 'resume' : 'start')}`}
                    onClick={toggleTimer}
                >
                    {isActive ? '暂停' : (isPaused ? '继续' : '开始')}
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

                {/* 声音控制 - 集成到同一行 */}
                <div className="sound-controls">
                    <button
                        className={`sound-button ${tickingVolume > 0 ? 'on' : 'off'}`}
                        onClick={() => {
                            if (tickingVolume > 0) {
                                // 存储当前音量以便稍后恢复
                                window.localStorage.setItem('prevTickingVolume', tickingVolume);

                                // 本地立即静音
                                if (tickingSound.current) {
                                    tickingSound.current.volume = 0;
                                }

                                // 停止滴答声计时器
                                if (isActive && tickingTimer.current) {
                                    clearInterval(tickingTimer.current);
                                    tickingTimer.current = null;
                                    console.log('用户关闭滴答声，停止滴答声计时器');
                                }

                                // 触发onSettingsChange事件
                                onTimerComplete && onTimerComplete({
                                    type: 'settingsChange',
                                    tickingVolume: 0
                                });
                            } else {
                                // 恢复音量
                                const prevVolume = parseInt(window.localStorage.getItem('prevTickingVolume') || '20', 10);

                                // 本地立即恢复音量
                                if (tickingSound.current) {
                                    tickingSound.current.volume = prevVolume / 100;
                                }

                                // 如果计时器正在运行，立即启动滴答声
                                if (isActive && !tickingTimer.current) {
                                    const playTick = createPlayTickFunction();
                                    playTick(); // 立即播放一次
                                    tickingTimer.current = setInterval(playTick, tickingInterval);
                                    console.log('用户开启滴答声，启动滴答声计时器');
                                }

                                // 触发onSettingsChange事件
                                onTimerComplete && onTimerComplete({
                                    type: 'settingsChange',
                                    tickingVolume: prevVolume
                                });
                            }
                        }}
                        aria-label={tickingVolume > 0 ? '关闭滴答声' : '开启滴答声'}
                        title={tickingVolume > 0 ? '关闭滴答声' : '开启滴答声'}
                    >
                        <span role="img" aria-hidden="true">
                            {tickingVolume > 0 ? '🔊' : '🔇'}
                        </span>
                    </button>

                    <button
                        className={`sound-button ${alarmVolume > 0 ? 'on' : 'off'}`}
                        onClick={() => {
                            if (alarmVolume > 0) {
                                // 存储当前音量以便稍后恢复
                                window.localStorage.setItem('prevAlarmVolume', alarmVolume);
                                // 静音
                                if (alarmSound.current) {
                                    alarmSound.current.volume = 0;
                                }
                                // 触发onSettingsChange事件
                                onTimerComplete && onTimerComplete({
                                    type: 'settingsChange',
                                    alarmVolume: 0
                                });
                            } else {
                                // 恢复音量
                                const prevVolume = parseInt(window.localStorage.getItem('prevAlarmVolume') || '70', 10);
                                if (alarmSound.current) {
                                    alarmSound.current.volume = prevVolume / 100;
                                }
                                // 触发onSettingsChange事件
                                onTimerComplete && onTimerComplete({
                                    type: 'settingsChange',
                                    alarmVolume: prevVolume
                                });
                            }
                        }}
                        aria-label={alarmVolume > 0 ? '关闭闹钟声' : '开启闹钟声'}
                        title={alarmVolume > 0 ? '关闭闹钟声' : '开启闹钟声'}
                    >
                        <span role="img" aria-hidden="true">
                            {alarmVolume > 0 ? '🔔' : '🔕'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
});

// 添加displayName以解决linter警告
Timer.displayName = 'Timer';

export default Timer; 