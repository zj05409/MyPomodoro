import React, { useState } from 'react';

interface TimerSettingsProps {
    pomodoroTime: number;
    shortBreakTime: number;
    longBreakTime: number;
    longBreakInterval: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    onSettingsChange: (settings: {
        pomodoroTime: number;
        shortBreakTime: number;
        longBreakTime: number;
        longBreakInterval: number;
        autoStartBreaks: boolean;
        autoStartPomodoros: boolean;
    }) => void;
    onClose: () => void;
}

const TimerSettings: React.FC<TimerSettingsProps> = ({
    pomodoroTime,
    shortBreakTime,
    longBreakTime,
    longBreakInterval,
    autoStartBreaks,
    autoStartPomodoros,
    onSettingsChange,
    onClose
}) => {
    const [formValues, setFormValues] = useState({
        pomodoroTime: pomodoroTime / 60,
        shortBreakTime: shortBreakTime / 60,
        longBreakTime: longBreakTime / 60,
        longBreakInterval,
        autoStartBreaks,
        autoStartPomodoros
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            setFormValues({ ...formValues, [name]: checked });
            return;
        }

        const numValue = parseInt(value, 10);
        if (isNaN(numValue)) return;

        // 验证数值范围
        let validatedValue = numValue;
        switch (name) {
            case 'pomodoroTime':
                validatedValue = Math.max(1, Math.min(120, numValue));
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

        setFormValues({ ...formValues, [name]: validatedValue });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 转换分钟为秒
        onSettingsChange({
            pomodoroTime: formValues.pomodoroTime * 60,
            shortBreakTime: formValues.shortBreakTime * 60,
            longBreakTime: formValues.longBreakTime * 60,
            longBreakInterval: formValues.longBreakInterval,
            autoStartBreaks: formValues.autoStartBreaks,
            autoStartPomodoros: formValues.autoStartPomodoros
        });

        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            action();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-labelledby="settings-title"
            aria-modal="true"
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                <h2 id="settings-title" className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">计时器设置</h2>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* 时间设置 */}
                        <div>
                            <label htmlFor="pomodoroTime" className="setting-label">
                                番茄工作时长（分钟）
                            </label>
                            <input
                                type="number"
                                id="pomodoroTime"
                                name="pomodoroTime"
                                min="1"
                                max="120"
                                value={formValues.pomodoroTime}
                                onChange={handleInputChange}
                                className="setting-input"
                                aria-label="番茄工作时长（分钟）"
                                aria-describedby="pomodoroTime-desc"
                            />
                            <p id="pomodoroTime-desc" className="text-xs text-gray-500 mt-1">工作时间应介于1至120分钟之间</p>
                        </div>

                        <div>
                            <label htmlFor="shortBreakTime" className="setting-label">
                                短休息时长（分钟）
                            </label>
                            <input
                                type="number"
                                id="shortBreakTime"
                                name="shortBreakTime"
                                min="1"
                                max="30"
                                value={formValues.shortBreakTime}
                                onChange={handleInputChange}
                                className="setting-input"
                                aria-label="短休息时长（分钟）"
                                aria-describedby="shortBreakTime-desc"
                            />
                            <p id="shortBreakTime-desc" className="text-xs text-gray-500 mt-1">短休息时间应介于1至30分钟之间</p>
                        </div>

                        <div>
                            <label htmlFor="longBreakTime" className="setting-label">
                                长休息时长（分钟）
                            </label>
                            <input
                                type="number"
                                id="longBreakTime"
                                name="longBreakTime"
                                min="1"
                                max="60"
                                value={formValues.longBreakTime}
                                onChange={handleInputChange}
                                className="setting-input"
                                aria-label="长休息时长（分钟）"
                                aria-describedby="longBreakTime-desc"
                            />
                            <p id="longBreakTime-desc" className="text-xs text-gray-500 mt-1">长休息时间应介于1至60分钟之间</p>
                        </div>

                        <div>
                            <label htmlFor="longBreakInterval" className="setting-label">
                                长休息间隔（番茄数）
                            </label>
                            <input
                                type="number"
                                id="longBreakInterval"
                                name="longBreakInterval"
                                min="1"
                                max="10"
                                value={formValues.longBreakInterval}
                                onChange={handleInputChange}
                                className="setting-input"
                                aria-label="长休息间隔（番茄数）"
                                aria-describedby="longBreakInterval-desc"
                            />
                            <p id="longBreakInterval-desc" className="text-xs text-gray-500 mt-1">完成多少个番茄钟后休息较长时间，值应介于1至10之间</p>
                        </div>

                        {/* 自动开始设置 */}
                        <div className="flex items-center mt-2">
                            <input
                                type="checkbox"
                                id="autoStartBreaks"
                                name="autoStartBreaks"
                                checked={formValues.autoStartBreaks}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-tomato focus:ring-tomato border-gray-300 rounded"
                                aria-label="番茄钟结束后自动开始休息"
                            />
                            <label htmlFor="autoStartBreaks" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                番茄钟结束后自动开始休息
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="autoStartPomodoros"
                                name="autoStartPomodoros"
                                checked={formValues.autoStartPomodoros}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-tomato focus:ring-tomato border-gray-300 rounded"
                                aria-label="休息后自动开始番茄钟"
                            />
                            <label htmlFor="autoStartPomodoros" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                休息后自动开始番茄钟
                            </label>
                        </div>
                    </div>

                    {/* 按钮 */}
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            onKeyDown={(e) => handleKeyDown(e, onClose)}
                            className="button button-secondary"
                            aria-label="取消"
                            tabIndex={0}
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="button button-primary"
                            aria-label="保存设置"
                            tabIndex={0}
                        >
                            保存
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TimerSettings; 