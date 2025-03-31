// 测试Electron环境
console.log('开始测试Electron环境...');

try {
    // 测试基本Node模块
    const path = require('path');
    console.log('✅ path模块加载成功:', typeof path.join === 'function');

    const os = require('os');
    console.log('✅ os模块加载成功:', typeof os.platform === 'function');

    // 测试Electron特定模块
    try {
        const electron = require('electron');
        console.log('✅ electron模块加载成功:', Object.keys(electron).join(', '));
    } catch (err) {
        console.log('❌ electron模块加载失败 (这在非Electron环境中是正常的):', err.message);
    }

    // 测试path函数
    console.log('path.join测试:', path.join(__dirname, '..', 'public'));

    console.log('环境测试完成!');
} catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
} 