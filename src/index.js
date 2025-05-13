/**
 * RFID Handler
 * 通用RFID数据处理组件，可用于多个Electron应用中
 */

import RFIDHandler from './core/RFIDHandler.js';
import RFIDParser from './core/RFIDParser.js';
import ConnectionManager from './core/ConnectionManager.js';
import EventEmitter from './core/EventEmitter.js';

// 导出主类及相关模块
export {
  RFIDParser,
  ConnectionManager,
  EventEmitter
};

// 默认导出RFIDHandler主类
export default RFIDHandler; 