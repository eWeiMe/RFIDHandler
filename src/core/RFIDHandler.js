import EventEmitter from './EventEmitter.js';
import RFIDParser from './RFIDParser.js';
import ConnectionManager from './ConnectionManager.js';

/**
 * RFID处理器主类
 * 整合事件系统、数据解析和连接管理，提供完整的RFID处理功能
 */
class RFIDHandler extends EventEmitter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {boolean} options.autoProcess - 是否自动处理收到的数据
   * @param {Function} options.dateFormatter - 日期格式化函数
   * @param {Object} options.apiAdapter - API适配器，用于替代window.api依赖
   * @param {number} options.rfidLength - RFID长度要求
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      autoProcess: true,
      rfidLength: 10,
      ...options
    };
    
    // 初始化解析器
    this.parser = new RFIDParser({
      dateFormatter: this.options.dateFormatter,
      rfidLength: this.options.rfidLength
    });
    
    // 初始化连接管理器
    this.connectionManager = new ConnectionManager();
    
    // 初始化API适配器
    this.initApiAdapter(this.options.apiAdapter);
    
    // 最近处理的数据缓存
    this.lastProcessedData = null;
  }

  /**
   * 初始化API适配器
   * @param {Object} apiAdapter - API适配器对象
   */
  initApiAdapter(apiAdapter = {}) {
    this.apiAdapter = apiAdapter || {};
    
    // 设置TCP数据监听
    if (this.apiAdapter.onTcpData) {
      this.apiAdapter.onTcpData(data => this.handleTcpData(data));
    }
    
    // 设置TCP状态监听
    if (this.apiAdapter.onTcpStatus) {
      this.apiAdapter.onTcpStatus(status => this.handleTcpStatus(status));
    }
    
    // 其他可能的事件监听...
    this.emit('initialized', { 
      hasAdapter: !!this.apiAdapter,
      autoProcess: this.options.autoProcess
    });
  }

  /**
   * 处理接收到的TCP数据
   * @param {Object} data - 接收到的数据对象
   * @returns {Object|null} - 处理后的数据，如果处理失败则返回null
   */
  handleTcpData(data) {
    // 确保数据有效
    if (!data || !data.data || !data.ip) {
      this.emit('error', { 
        message: '无效的TCP数据格式', 
        data 
      });
      return null;
    }
    
    // 更新连接状态
    this.connectionManager.updateClientDataStats(data.ip, true);
    
    // 触发原始数据事件
    this.emit('rawData', data);
    
    // 如果设置了自动处理，则解析并处理数据
    if (this.options.autoProcess) {
      return this.processData(data);
    }
    
    return data;
  }

  /**
   * 处理TCP连接状态变更
   * @param {Object} status - 状态信息
   */
  handleTcpStatus(status) {
    const { ip, connected } = status;
    
    if (!ip) {
      this.emit('error', { 
        message: '无效的TCP状态信息', 
        status 
      });
      return;
    }
    
    if (connected) {
      this.connectionManager.addClient(ip);
    } else {
      this.connectionManager.removeClient(ip);
    }
    
    this.emit('connectionStatus', { 
      ip, 
      connected, 
      clientsCount: this.connectionManager.getConnectionCount() 
    });
  }

  /**
   * 处理RFID数据
   * @param {Object} rawData - 原始数据
   * @returns {Object|null} - 处理后的数据，如果处理失败则返回null
   */
  processData(rawData) {
    try {
      // 解析RFID数据
      const parsedData = this.parser.parse(rawData);
      
      if (!parsedData) {
        this.connectionManager.updateClientDataStats(rawData.ip, false);
        this.emit('parseError', { 
          message: 'RFID解析失败', 
          rawData 
        });
        return null;
      }
      
      // 缓存最近处理的数据
      this.lastProcessedData = parsedData;
      
      // 触发数据就绪事件
      this.emit('dataReady', parsedData);
      
      return parsedData;
    } catch (error) {
      this.emit('error', { 
        message: '数据处理错误', 
        error: error.message, 
        rawData 
      });
      return null;
    }
  }

  /**
   * 手动处理数据（用于非自动处理模式）
   * @param {Object} data - 要处理的数据
   * @returns {Object|null} - 处理后的数据
   */
  manualProcess(data) {
    return this.processData(data);
  }

  /**
   * 获取连接管理器
   * @returns {ConnectionManager} - 连接管理器实例
   */
  getConnectionManager() {
    return this.connectionManager;
  }

  /**
   * 获取所有客户端列表
   * @returns {Array} - 客户端列表
   */
  getClients() {
    return this.connectionManager.getAllClients();
  }

  /**
   * 获取最近处理的RFID数据
   * @returns {Object|null} - 最近处理的数据，如果没有则返回null
   */
  getLastProcessedData() {
    return this.lastProcessedData;
  }

  /**
   * 模拟接收数据（用于测试和调试）
   * @param {Object|string} mockData - 模拟数据，可以是完整对象或RFID字符串
   * @param {string} [ip='127.0.0.1'] - 模拟IP地址
   * @returns {Object|null} - 处理后的数据
   */
  simulateDataReceive(mockData, ip = '127.0.0.1') {
    let data;
    
    if (typeof mockData === 'string') {
      // 如果是字符串，构建一个模拟数据对象
      data = {
        data: mockData,
        ip,
        timestamp: new Date()
      };
    } else {
      // 确保数据有IP
      data = {
        ...mockData,
        ip: mockData.ip || ip,
        timestamp: mockData.timestamp || new Date()
      };
    }
    
    this.emit('simulatedData', data);
    return this.handleTcpData(data);
  }

  /**
   * 重置处理器状态
   */
  reset() {
    this.connectionManager.resetConnections();
    this.lastProcessedData = null;
    this.emit('reset');
  }
}

export default RFIDHandler; 