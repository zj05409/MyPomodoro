const { contextBridge, ipcRenderer } = require('electron')

// 检查API是否可用
const isElectronAvailable = () => {
    return window && window.process && window.process.type
}

contextBridge.exposeInMainWorld('electronAPI', {
    // 检查是否运行在Electron中
    isElectron: isElectronAvailable(),

    // 发送系统通知
    sendNotification: (options) => ipcRenderer.invoke('send-notification', options),

    // 最小化到托盘
    minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray')
}) 