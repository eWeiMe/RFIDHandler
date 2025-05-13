/**
 * RFID数据解析模块
 * 负责将原始的十六进制RFID数据转换为标准格式
 */
class RFIDParser {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {Function} options.dateFormatter - 日期格式化函数，用于RFID编号前缀
   * @param {number} options.rfidLength - RFID长度要求，默认为10
   */
  constructor(options = {}) {
    this.dateFormatter = options.dateFormatter || this.defaultDateFormatter;
    this.rfidLength = options.rfidLength || 10;
  }

  /**
   * 默认日期格式化函数 - 返回格式：YYMMDD
   * @param {Date} date - 日期对象
   * @returns {string} - 格式化后的日期字符串
   */
  defaultDateFormatter(date = new Date()) {
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * 将十六进制字符串转换为ASCII字符串
   * @param {string} hexStr - 十六进制字符串
   * @returns {string} - ASCII字符串
   */
  hexToAscii(hexStr) {
    const hex = hexStr.toString();
    let result = '';
    
    for (let i = 0; i < hex.length; i += 2) {
      const hexChar = hex.substr(i, 2);
      result += String.fromCharCode(parseInt(hexChar, 16));
    }
    
    return result;
  }

  /**
   * 验证RFID是否有效
   * @param {string} rfid - RFID字符串
   * @returns {boolean} - 是否有效
   */
  validateRFID(rfid) {
    // 基本验证：长度、仅包含数字等
    if (!rfid || rfid.length !== this.rfidLength) {
      return false;
    }
    
    // 数字验证
    return /^\d+$/.test(rfid);
  }

  /**
   * 解析原始十六进制数据为RFID数据对象
   * @param {Object} rawData - 原始数据对象
   * @param {string} rawData.data - 十六进制数据字符串
   * @param {string} rawData.ip - 来源IP地址
   * @param {Date} rawData.timestamp - 接收时间戳
   * @returns {Object|null} - 解析后的RFID数据对象，解析失败则返回null
   */
  parse(rawData) {
    try {
      const { data: hexData, ip, timestamp = new Date() } = rawData;
      
      if (!hexData || !ip) {
        console.warn('解析失败: 数据或IP缺失', rawData);
        return null;
      }

      // 解析十六进制数据为ASCII
      const asciiData = this.hexToAscii(hexData).trim();
      
      // 提取RFID号码
      const rfid = asciiData.replace(/\D/g, '');
      
      if (!this.validateRFID(rfid)) {
        console.warn(`无效的RFID: ${rfid}, 原始数据: ${hexData}`);
        return null;
      }

      // 添加日期前缀
      const datePrefix = this.dateFormatter(timestamp);
      const formattedRFID = `${datePrefix}-${rfid}`;
      
      return {
        rfid,
        formattedRFID,
        ip,
        timestamp,
        rawData: hexData
      };
    } catch (error) {
      console.error('RFID解析错误:', error);
      return null;
    }
  }

  /**
   * 自定义RFID格式化方法
   * @param {string} rfid - 原始RFID
   * @param {Object} options - 格式化选项
   * @returns {string} - 格式化后的RFID
   */
  formatRFID(rfid, options = {}) {
    const { prefix = this.dateFormatter(), separator = '-' } = options;
    return `${prefix}${separator}${rfid}`;
  }
}

export default RFIDParser; 