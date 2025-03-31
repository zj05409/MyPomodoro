const { contextBridge, ipcRenderer } = require('electron')

// 日志函数
const logMessage = (message, type = 'info') => {
    const timestamp = new Date().toISOString();
    if (type === 'error') {
        console.error(`[${timestamp}] [预加载脚本] ${message}`);
    } else {
        console.log(`[${timestamp}] [预加载脚本] ${message}`);
    }
};

logMessage('预加载脚本开始执行');

// 确保在路径导入前进行错误处理
let path;
try {
    path = require('path');
    logMessage('路径模块加载成功');
} catch (error) {
    logMessage(`路径模块加载失败: ${error.message}`, 'error');

    // 提供一个基本实现以避免致命错误
    path = {
        join: (...args) => {
            const result = args.join('/');
            logMessage(`path.join调用，返回: ${result}`);
            return result;
        },
        resolve: (...args) => {
            const result = args.join('/');
            logMessage(`path.resolve调用，返回: ${result}`);
            return result;
        }
    };
}

// 检查API是否可用
const isElectronAvailable = () => {
    const isAvailable = window && window.process && window.process.type;
    logMessage(`Electron API可用性检查: ${isAvailable ? '可用' : '不可用'}`);
    return isAvailable;
};

// 创建安全的IPC封装
const safeIpcInvoke = async (channel, ...args) => {
    try {
        logMessage(`发送IPC请求: ${channel}`);
        const result = await ipcRenderer.invoke(channel, ...args);
        logMessage(`IPC请求成功: ${channel}`);
        return result;
    } catch (error) {
        logMessage(`IPC请求失败: ${channel}, 错误: ${error.message}`, 'error');
        return null;
    }
};

// 导出API到渲染进程
try {
    contextBridge.exposeInMainWorld('electronAPI', {
        // 检查是否运行在Electron中
        isElectron: isElectronAvailable(),

        // 发送系统通知
        sendNotification: (options) => safeIpcInvoke('send-notification', options),

        // 最小化到托盘
        minimizeToTray: () => safeIpcInvoke('minimize-to-tray'),

        // 获取应用资源路径
        getResourcePath: (resourceName) => safeIpcInvoke('get-resource-path', resourceName),

        // 添加调试功能
        debug: {
            getVersion: () => process.versions,
            getEnv: () => process.env,
            testPathModule: () => {
                try {
                    return {
                        success: true,
                        result: path.join('test', 'path')
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message
                    };
                }
            }
        }
    });

    logMessage('API成功暴露到渲染进程');
} catch (error) {
    logMessage(`暴露API失败: ${error.message}`, 'error');
}

logMessage('预加载脚本执行完成'); 