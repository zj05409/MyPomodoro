import React, { useState } from 'react';
import './TimerSettings.css';

const TimerSettings = ({
    isOpen,
    onClose,
    pomodoroTime,
    shortBreakTime,
    longBreakTime,
    longBreakInterval,
    autoStartBreaks,
    autoStartPomodoros,
    alarmVolume,
    tickingVolume,
    onSettingsChange
}) => {
    const [settings, setSettings] = useState({
        pomodoroTime,
        shortBreakTime,
        longBreakTime,
        longBreakInterval,
        autoStartBreaks,
        autoStartPomodoros,
        alarmVolume,
        tickingVolume
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            setSettings({ ...settings, [name]: checked });
            return;
        }

        const numValue = parseInt(value, 10);
        if (isNaN(numValue)) return;

        // 验证数值范围
        let validatedValue = numValue;
        switch (name) {
            case 'pomodoroTime':
                validatedValue = Math.max(1, Math.min(60, numValue));
                break;
            case 'shortBreakTime':
                validatedValue = Math.max(1, Math.min(30, numValue));
                break;
            case 'longBreakTime':
                validatedValue = Math.max(1, Math.min(60, numValue));
                break;
            case 'longBreakInterval':
                validatedValue = Math.max(1, Math.min(10, numValue));
                break;
        }

        setSettings({ ...settings, [name]: validatedValue });
    };

    const handleSave = () => {
        onSettingsChange(settings);
        onClose();
    };

    const handleCancel = () => {
        setSettings({
            pomodoroTime,
            shortBreakTime,
            longBreakTime,
            longBreakInterval,
            autoStartBreaks,
            autoStartPomodoros,
            alarmVolume,
            tickingVolume
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="settings-overlay">
            <div className="settings-modal">
                <div className="settings-header">
                    <h2>番茄钟设置</h2>
                    <button
                        className="close-button"
                        onClick={handleCancel}
                        aria-label="关闭设置"
                    >
                        &times;
                    </button>
                </div>

                <div className="settings-content">
                    <div className="settings-section">
                        <h3>时间设置（分钟）</h3>

                        <div className="setting-item">
                            <label htmlFor="pomodoroTime">番茄时长</label>
                            <input
                                id="pomodoroTime"
                                type="number"
                                name="pomodoroTime"
                                min="1"
                                max="60"
                                value={settings.pomodoroTime}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="setting-item">
                            <label htmlFor="shortBreakTime">短休息时长</label>
                            <input
                                id="shortBreakTime"
                                type="number"
                                name="shortBreakTime"
                                min="1"
                                max="30"
                                value={settings.shortBreakTime}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="setting-item">
                            <label htmlFor="longBreakTime">长休息时长</label>
                            <input
                                id="longBreakTime"
                                type="number"
                                name="longBreakTime"
                                min="1"
                                max="60"
                                value={settings.longBreakTime}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="setting-item">
                            <label htmlFor="longBreakInterval">长休息间隔（番茄数）</label>
                            <input
                                id="longBreakInterval"
                                type="number"
                                name="longBreakInterval"
                                min="1"
                                max="10"
                                value={settings.longBreakInterval}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="settings-section">
                        <h3>自动设置</h3>

                        <div className="setting-item checkbox">
                            <input
                                id="autoStartBreaks"
                                type="checkbox"
                                name="autoStartBreaks"
                                checked={settings.autoStartBreaks}
                                onChange={handleInputChange}
                            />
                            <label htmlFor="autoStartBreaks">自动开始休息</label>
                        </div>

                        <div className="setting-item checkbox">
                            <input
                                id="autoStartPomodoros"
                                type="checkbox"
                                name="autoStartPomodoros"
                                checked={settings.autoStartPomodoros}
                                onChange={handleInputChange}
                            />
                            <label htmlFor="autoStartPomodoros">自动开始番茄</label>
                        </div>
                    </div>

                    <div className="settings-section">
                        <h3>音量设置</h3>

                        <div className="setting-item slider">
                            <label htmlFor="alarmVolume">闹钟音量: {settings.alarmVolume}%</label>
                            <input
                                id="alarmVolume"
                                type="range"
                                name="alarmVolume"
                                min="0"
                                max="100"
                                value={settings.alarmVolume}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="setting-item slider">
                            <label htmlFor="tickingVolume">滴答声音量: {settings.tickingVolume}%</label>
                            <input
                                id="tickingVolume"
                                type="range"
                                name="tickingVolume"
                                min="0"
                                max="100"
                                value={settings.tickingVolume}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="settings-footer">
                    <button
                        className="button-secondary"
                        onClick={handleCancel}
                    >
                        取消
                    </button>
                    <button
                        className="button-primary"
                        onClick={handleSave}
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimerSettings; 