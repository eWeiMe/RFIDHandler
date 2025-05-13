/**
 * TCP客户端连接管理器
 * 负责管理RFID设备的TCP连接状态
 */
class ConnectionManager {
  /**
   * 构造函数
   */
  constructor() {
    // 存储所有客户端的状态信息
    this.clients = new Map();
    // 连接计数
    this.connectionCount = 0;
  }

  /**
   * 添加一个客户端
   * @param {string} ip - 客户端IP地址
   * @param {Object} clientInfo - 客户端信息
   * @returns {Object} - 添加后的客户端信息
   */
  addClient(ip, clientInfo = {}) {
    const timestamp = new Date();
    const defaultInfo = {
      status: 'connected',
      connectedAt: timestamp,
      lastActive: timestamp,
      stats: {
        dataReceived: 0,
        errors: 0
      }
    };

    const client = {
      ...defaultInfo,
      ...clientInfo
    };

    this.clients.set(ip, client);
    this.connectionCount++;
    
    return client;
  }

  /**
   * 移除客户端
   * @param {string} ip - 客户端IP地址
   * @returns {boolean} - 是否成功移除
   */
  removeClient(ip) {
    if (!this.clients.has(ip)) {
      return false;
    }
    
    this.clients.delete(ip);
    this.connectionCount = Math.max(0, this.connectionCount - 1);
    
    return true;
  }

  /**
   * 更新客户端状态
   * @param {string} ip - 客户端IP地址
   * @param {Object} updateInfo - 更新信息
   * @returns {Object|null} - 更新后的客户端信息，若客户端不存在则返回null
   */
  updateClientStatus(ip, updateInfo = {}) {
    if (!this.clients.has(ip)) {
      return null;
    }
    
    const client = this.clients.get(ip);
    const updatedClient = {
      ...client,
      ...updateInfo,
      lastActive: new Date()
    };
    
    // 如果更新了stats属性，需要合并而不是覆盖
    if (updateInfo.stats && client.stats) {
      updatedClient.stats = {
        ...client.stats,
        ...updateInfo.stats
      };
    }
    
    this.clients.set(ip, updatedClient);
    return updatedClient;
  }

  /**
   * 更新客户端数据接收统计
   * @param {string} ip - 客户端IP地址
   * @param {boolean} success - 数据处理是否成功
   * @returns {Object|null} - 更新后的客户端信息
   */
  updateClientDataStats(ip, success = true) {
    if (!this.clients.has(ip)) {
      // 如果客户端不存在，先添加它
      this.addClient(ip);
    }
    
    const client = this.clients.get(ip);
    const stats = {
      ...client.stats
    };
    
    if (success) {
      stats.dataReceived = (stats.dataReceived || 0) + 1;
    } else {
      stats.errors = (stats.errors || 0) + 1;
    }
    
    return this.updateClientStatus(ip, { stats });
  }

  /**
   * 获取客户端信息
   * @param {string} ip - 客户端IP地址
   * @returns {Object|null} - 客户端信息，若不存在则返回null
   */
  getClient(ip) {
    return this.clients.get(ip) || null;
  }

  /**
   * 获取所有客户端列表
   * @returns {Array} - 客户端信息数组
   */
  getAllClients() {
    return Array.from(this.clients.entries()).map(([ip, client]) => ({
      ip,
      ...client
    }));
  }

  /**
   * 获取所有已连接的客户端数量
   * @returns {number} - 客户端数量
   */
  getConnectionCount() {
    return this.connectionCount;
  }

  /**
   * 判断是否有活跃连接
   * @returns {boolean} - 是否有活跃连接
   */
  hasActiveConnections() {
    return this.connectionCount > 0;
  }

  /**
   * 重置所有连接
   */
  resetConnections() {
    this.clients.clear();
    this.connectionCount = 0;
  }
}

export default ConnectionManager; 