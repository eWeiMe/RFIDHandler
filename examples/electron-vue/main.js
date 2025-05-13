const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const net = require('net');

// 服务器实例
let tcpServer = null;
// 连接的客户端
const tcpClients = new Set();
// 主窗口
let mainWindow = null;

// 创建TCP服务器
function createTCPServer() {
  if (tcpServer) return;
  
  // 创建TCP服务器并监听指定端口
  tcpServer = net.createServer();
  const PORT = 9100;

  // 当有新客户端连接时
  tcpServer.on('connection', (socket) => {
    const clientIP = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`[TCP] 新客户端连接: ${clientIP}`);
    
    // 添加到客户端集合
    tcpClients.add(socket);
    
    // 发送连接状态给渲染进程
    mainWindow?.webContents.send('tcp-status', {
      ip: socket.remoteAddress,
      connected: true
    });

    // 接收数据
    socket.on('data', (data) => {
      const hexData = data.toString('hex');
      console.log(`[TCP] 收到数据 (${clientIP}): ${hexData}`);
      
      // 发送数据给渲染进程
      mainWindow?.webContents.send('tcp-data', {
        data: hexData,
        ip: socket.remoteAddress,
        timestamp: new Date().toISOString()
      });
    });

    // 客户端断开连接
    socket.on('close', () => {
      console.log(`[TCP] 客户端断开: ${clientIP}`);
      tcpClients.delete(socket);
      
      // 发送断开状态给渲染进程
      mainWindow?.webContents.send('tcp-status', {
        ip: socket.remoteAddress,
        connected: false
      });
    });

    // 错误处理
    socket.on('error', (err) => {
      console.error(`[TCP] 客户端错误 (${clientIP}):`, err.message);
      tcpClients.delete(socket);
      
      // 发送错误状态给渲染进程
      mainWindow?.webContents.send('tcp-error', {
        ip: socket.remoteAddress,
        error: err.message
      });
    });
  });

  // 启动服务器
  tcpServer.listen(PORT, () => {
    console.log(`[TCP] 服务器已启动，监听端口 ${PORT}`);
  });

  // 服务器错误处理
  tcpServer.on('error', (err) => {
    console.error('[TCP] 服务器错误:', err.message);
  });
}

// 创建应用窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // 在生产环境中加载vue应用，在开发环境中使用开发服务器
  if (process.env.NODE_ENV === 'production') {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  }

  // 窗口关闭时清理资源
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 应用初始化完成后创建窗口
app.whenReady().then(() => {
  createWindow();
  createTCPServer();

  // 在macOS上点击dock图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出应用（Windows/Linux）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出前清理资源
app.on('before-quit', () => {
  if (tcpServer) {
    tcpServer.close();
  }
  
  // 关闭所有客户端连接
  for (const client of tcpClients) {
    client.destroy();
  }
  tcpClients.clear();
});

// IPC事件处理
ipcMain.on('simulate-tcp-data', (event, data) => {
  const { mockData, ip } = data;
  
  // 模拟数据接收
  mainWindow?.webContents.send('tcp-data', {
    data: mockData,
    ip: ip || '127.0.0.1',
    timestamp: new Date().toISOString()
  });
}); 