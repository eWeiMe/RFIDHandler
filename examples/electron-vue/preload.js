const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露IPC通信接口给渲染进程
contextBridge.exposeInMainWorld('api', {
  // 发送模拟数据
  simulateTcpData: (data) => {
    ipcRenderer.send('simulate-tcp-data', data);
  },
  
  // 监听TCP数据事件
  on: (channel, callback) => {
    // 白名单channels
    const validChannels = ['tcp-data', 'tcp-status', 'tcp-error'];
    if (validChannels.includes(channel)) {
      // 清除任何现有监听器
      ipcRenderer.removeAllListeners(channel);
      
      // 添加新监听器
      ipcRenderer.on(channel, callback);
      
      // 返回清理函数
      return () => {
        ipcRenderer.removeListener(channel, callback);
      };
    }
  },
  
  // 移除特定频道的监听器
  removeAllListeners: (channel) => {
    const validChannels = ['tcp-data', 'tcp-status', 'tcp-error'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  }
}); 