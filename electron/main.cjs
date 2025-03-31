const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification, net } = require('electron')
// 安全导入path模块
let path;
try {
    path = require('path')
} catch (error) {
    console.error('无法加载path模块:', error);
    // 提供基本实现
    path = {
        join: (...args) => args.join('/'),
        resolve: (...args) => args.join('/')
    };
}

// 开发环境下安装开发者工具扩展
async function installDevTools() {
    try {
        console.log('尝试安装Electron开发者工具扩展...');

        // 如果可能，使用Electron Devtools Installer
        try {
            const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');

            const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
            const extensions = [REACT_DEVELOPER_TOOLS];

            console.log('开始安装开发者工具扩展...');

            for (const extension of extensions) {
                try {
                    await installExtension(extension, { forceDownload });
                    console.log(`已成功安装扩展: ${extension.id}`);
                } catch (err) {
                    console.error(`安装扩展失败 ${extension.id}:`, err);
                }
            }
        } catch (e) {
            console.log('electron-devtools-installer 不可用，尝试其他方法');
        }
    } catch (error) {
        console.error('安装开发者工具时出错:', error);
    }
}

// 改进开发环境检测
const isDev = process.env.npm_lifecycle_event === 'electron:dev' || process.env.NODE_ENV === 'development'

console.log('当前环境:', isDev ? '开发环境' : '生产环境');
console.log('npm_lifecycle_event:', process.env.npm_lifecycle_event);
console.log('NODE_ENV:', process.env.NODE_ENV);

let mainWindow
let tray

// 支持远程调试，以防内置开发者工具无法工作
if (process.env.NODE_ENV === 'development') {
    try {
        console.log('启用Electron远程调试...');
        // 在启用远程调试时，用户可以通过Chrome浏览器访问 chrome://inspect 来连接
        app.commandLine.appendSwitch('remote-debugging-port', '9222');
        // 允许不安全的内容（开发环境）
        app.commandLine.appendSwitch('allow-insecure-localhost', 'true');
        app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
    } catch (error) {
        console.error('设置远程调试时出错:', error);
    }
}

// 检查指定端口的开发服务器是否可用
async function checkServerAvailable(port) {
    return new Promise((resolve) => {
        const request = net.request({
            method: 'GET',
            url: `http://localhost:${port}`
        });

        request.on('response', () => {
            resolve(true);
        });

        request.on('error', () => {
            resolve(false);
        });

        request.end();
    });
}

// 尝试寻找可用的开发服务器端口
async function findDevServerPort() {
    // 常用的Vite端口
    const possiblePorts = [5173, 5174, 5175, 5176, 3000];
    console.log('正在寻找可用的开发服务器端口...');

    for (const port of possiblePorts) {
        console.log(`检查端口 ${port}...`);
        const isAvailable = await checkServerAvailable(port);
        if (isAvailable) {
            console.log(`✅ 找到开发服务器运行在端口 ${port}`);
            return port;
        }
    }

    console.error('❌ 无法找到可用的开发服务器');
    return null;
}

async function createWindow() {
    // 创建窗口配置
    const windowConfig = {
        width: 800,
        height: 600,
        minWidth: 400,
        minHeight: 500,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            devTools: true,
            webSecurity: isDev ? false : true,
            enableRemoteModule: false,
            enableWebSQL: false,
        },
        icon: path.join(__dirname, '../public/tomato.png'),
        show: false, // 不立即显示窗口
    };

    try {
        mainWindow = new BrowserWindow(windowConfig);

        // 创建应用菜单
        const template = [
            {
                label: '文件',
                submenu: [
                    { role: 'quit', label: '退出' }
                ]
            },
            {
                label: '视图',
                submenu: [
                    { role: 'reload', label: '刷新' },
                    { role: 'forceReload', label: '强制刷新' },
                    { type: 'separator' },
                    { role: 'resetZoom', label: '重置缩放' },
                    { role: 'zoomIn', label: '放大' },
                    { role: 'zoomOut', label: '缩小' },
                    { type: 'separator' },
                    { role: 'togglefullscreen', label: '切换全屏' }
                ]
            }
        ];

        // 在开发环境中添加开发者工具菜单
        if (isDev) {
            template.push({
                label: '开发',
                submenu: [
                    {
                        label: '开发者工具',
                        click: () => {
                            mainWindow.webContents.toggleDevTools();
                        },
                        accelerator: process.platform === 'darwin' ? 'Cmd+Alt+I' : 'Ctrl+Shift+I'
                    }
                ]
            });
        }

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);

        if (isDev) {
            // 寻找开发服务器端口
            const port = await findDevServerPort();
            if (port) {
                console.log(`正在加载开发服务器: http://localhost:${port}`);
                mainWindow.loadURL(`http://localhost:${port}`);
            } else {
                console.error('无法连接到开发服务器，尝试加载本地文件');
                mainWindow.loadFile(path.join(__dirname, '../index.html'));
            }

            // 强制打开开发者工具，并确保它显示
            console.log('正在打开开发者工具...');
            try {
                // 使用更直接的方法打开开发者工具
                setTimeout(() => {
                    console.log('延迟打开开发者工具');
                    mainWindow.webContents.openDevTools({ mode: 'right' });
                }, 2000);
            } catch (error) {
                console.error('打开开发者工具失败:', error);
            }

            // 监听页面加载完成后再次尝试打开开发者工具
            mainWindow.webContents.on('did-finish-load', () => {
                console.log('页面加载完成，确保开发者工具已打开');
                if (!mainWindow.webContents.isDevToolsOpened()) {
                    mainWindow.webContents.openDevTools({ mode: 'right' });
                }
            });
        } else {
            console.log('加载生产环境构建文件');
            // 修改生产环境下的加载路径
            const indexPath = path.join(__dirname, '../dist/index.html');
            console.log('加载路径:', indexPath);
            mainWindow.loadFile(indexPath).catch(error => {
                console.error('加载生产环境文件失败:', error);
                // 尝试使用 file:// 协议加载
                mainWindow.loadURL(`file://${indexPath}`).catch(err => {
                    console.error('使用 file:// 协议加载失败:', err);
                });
            });
        }

        // 设置文件协议，使得加载本地音频文件更容易
        mainWindow.webContents.session.protocol.registerFileProtocol('file', (request, callback) => {
            const url = request.url.substr(7);
            callback(decodeURI(url));
        });

        // 当应用程序准备好显示时，再显示窗口，避免闪烁
        mainWindow.once('ready-to-show', () => {
            mainWindow.show();
        });

        // 防止窗口关闭时退出应用，而是最小化到托盘
        mainWindow.on('close', (event) => {
            if (!app.isQuitting) {
                event.preventDefault();
                mainWindow.hide();
                return false;
            }
        });

        // 开发模式下刷新页面快捷键
        if (isDev) {
            mainWindow.webContents.on('before-input-event', (event, input) => {
                if (input.control && input.key.toLowerCase() === 'r') {
                    mainWindow.reload();
                }
            });
        }

        // 监听页面加载错误
        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            console.error(`页面加载失败: ${errorDescription} (${errorCode})`);
            if (isDev) {
                // 在开发模式下，显示一个错误页面
                mainWindow.loadURL(`data:text/html,
                    <html>
                        <head><title>加载错误</title></head>
                        <body>
                            <h1>开发服务器连接失败</h1>
                            <p>错误: ${errorDescription}</p>
                            <p>请确保开发服务器正在运行</p>
                            <button onclick="window.location.reload()">重试</button>
                        </body>
                    </html>
                `);
            }
        });
    } catch (error) {
        console.error('创建窗口时发生错误:', error);
    }
}

// 创建系统托盘
function createTray() {
    try {
        const iconPath = path.join(__dirname, '../public/tomato.png')
        const trayIcon = nativeImage.createFromPath(iconPath)
        tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))

        const contextMenu = Menu.buildFromTemplate([
            {
                label: '显示应用',
                click: () => {
                    if (mainWindow) mainWindow.show()
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
            if (mainWindow) {
                if (mainWindow.isVisible()) {
                    mainWindow.hide()
                } else {
                    mainWindow.show()
                }
            }
        })
    } catch (error) {
        console.error('创建托盘时发生错误:', error);
    }
}

// 处理来自渲染进程的通知请求
ipcMain.handle('send-notification', (event, { title, body }) => {
    try {
        const notification = new Notification({
            title,
            body,
            icon: path.join(__dirname, '../public/tomato.png')
        })
        notification.show()
        return true
    } catch (error) {
        console.error('发送通知时发生错误:', error);
        return false;
    }
})

// 处理来自渲染进程的最小化到托盘请求
ipcMain.handle('minimize-to-tray', () => {
    try {
        if (mainWindow) mainWindow.hide()
        return true
    } catch (error) {
        console.error('最小化到托盘时发生错误:', error);
        return false;
    }
})

// 处理资源路径请求
ipcMain.handle('get-resource-path', (event, resourceName) => {
    try {
        const isDev = process.env.NODE_ENV === 'development';

        // 生产环境中的资源路径查找策略
        if (!isDev) {
            // 尝试多个可能的路径
            const possiblePaths = [
                path.join(app.getAppPath(), resourceName),                  // 应用根目录
                path.join(app.getAppPath(), 'dist', resourceName),          // dist目录
                path.join(process.resourcesPath, 'app', resourceName),      // resources/app目录
                path.join(process.resourcesPath, 'app', 'dist', resourceName), // resources/app/dist目录
                path.join(__dirname, '..', resourceName),                   // 相对于main.js的上级目录
                path.join(__dirname, '..', 'dist', resourceName),           // 相对于main.js的上级dist目录
            ];

            // 记录所有可能的路径
            console.log('可能的资源路径:', possiblePaths);

            // 返回第一个存在的路径 (在渲染进程中尝试)
            return possiblePaths;
        }

        // 开发环境
        return path.join(app.getAppPath(), 'public', resourceName);
    } catch (error) {
        console.error('获取资源路径出错:', error);
        return `./${resourceName}`;
    }
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

app.whenReady().then(async () => {
    console.log('应用程序准备就绪...');

    try {
        // 开发环境下安装开发者工具扩展
        if (isDev) {
            await installDevTools();
        }

        await createWindow();
        createTray();

        // 注册开发工具快捷键
        if (isDev) {
            // 注册 F12 快捷键打开开发者工具
            mainWindow.webContents.on('before-input-event', (event, input) => {
                if (input.key === 'F12') {
                    console.log('F12 被按下，切换开发者工具');
                    mainWindow.webContents.toggleDevTools();
                    event.preventDefault();
                }
            });

            // 注册 Ctrl+Shift+I 快捷键打开开发者工具（macOS 上是 Cmd+Option+I）
            mainWindow.webContents.on('before-input-event', (event, input) => {
                if ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i') {
                    console.log('开发者工具快捷键被按下');
                    mainWindow.webContents.toggleDevTools();
                    event.preventDefault();
                }
            });
        }
    } catch (error) {
        console.error('启动应用程序时发生错误:', error);
    }

    app.on('activate', async function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            await createWindow();
        }
    });
}).catch(error => {
    console.error('应用启动失败:', error);
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
    app.isQuitting = true
}) 