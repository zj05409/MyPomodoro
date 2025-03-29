const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification } = require('electron')
const path = require('path')
const isDev = process.env.npm_lifecycle_event === 'electron:dev'

let mainWindow
let tray

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 400,
        minHeight: 500,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, '../public/tomato.png'),
        show: false, // 不立即显示窗口
    })

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    }

    // 设置文件协议，使得加载本地音频文件更容易
    mainWindow.webContents.session.protocol.registerFileProtocol('file', (request, callback) => {
        const url = request.url.substr(7)
        callback(decodeURI(url))
    })

    // 当应用程序准备好显示时，再显示窗口，避免闪烁
    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    })

    // 防止窗口关闭时退出应用，而是最小化到托盘
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault()
            mainWindow.hide()
            return false
        }
    })

    // 开发模式下刷新页面快捷键
    if (isDev) {
        mainWindow.webContents.on('before-input-event', (event, input) => {
            if (input.control && input.key.toLowerCase() === 'r') {
                mainWindow.reload()
            }
        })
    }
}

// 创建系统托盘
function createTray() {
    const iconPath = path.join(__dirname, '../public/tomato.png')
    const trayIcon = nativeImage.createFromPath(iconPath)
    tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))

    const contextMenu = Menu.buildFromTemplate([
        {
            label: '显示应用',
            click: () => {
                mainWindow.show()
            }
        },
        {
            label: '退出',
            click: () => {
                app.isQuitting = true
                app.quit()
            }
        }
    ])

    tray.setToolTip('番茄工作法')
    tray.setContextMenu(contextMenu)

    // 点击托盘图标切换窗口显示状态
    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide()
        } else {
            mainWindow.show()
        }
    })
}

// 处理来自渲染进程的通知请求
ipcMain.handle('send-notification', (event, { title, body }) => {
    const notification = new Notification({
        title,
        body,
        icon: path.join(__dirname, '../public/tomato.png')
    })
    notification.show()
    return true
})

// 处理来自渲染进程的最小化到托盘请求
ipcMain.handle('minimize-to-tray', () => {
    mainWindow.hide()
    return true
})

// 阻止应用程序多次启动
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', () => {
        // 如果用户尝试打开第二个实例，将会聚焦到现有窗口
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.show()
            mainWindow.focus()
        }
    })
}

app.whenReady().then(() => {
    createWindow()
    createTray()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
    app.isQuitting = true
}) 