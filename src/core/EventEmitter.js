/**
 * 轻量级事件发射器，提供事件注册、触发和解绑功能
 */
class EventEmitter {
  constructor() {
    // 存储所有事件监听器
    this.listeners = {};
  }

  /**
   * 注册事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {EventEmitter} - 返回this，支持链式调用
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }

  /**
   * 移除特定事件的监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 要移除的回调函数，如不指定则移除该事件的所有监听器
   * @returns {EventEmitter} - 返回this，支持链式调用
   */
  off(event, callback) {
    if (!this.listeners[event]) return this;

    if (callback) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    } else {
      this.listeners[event] = [];
    }
    return this;
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {...any} args - 传递给监听器的参数
   * @returns {boolean} - 是否有监听器被触发
   */
  emit(event, ...args) {
    if (!this.listeners[event] || this.listeners[event].length === 0) {
      return false;
    }

    // 复制一份监听器列表，避免在执行过程中监听器被移除导致问题
    const callbacks = [...this.listeners[event]];
    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`事件处理器执行错误: ${event}`, error);
      }
    });
    return true;
  }

  /**
   * 移除所有事件监听器
   * @param {string} [event] - 可选，指定要清空的事件，不指定则清空所有事件
   * @returns {EventEmitter} - 返回this，支持链式调用
   */
  removeAllListeners(event) {
    if (event) {
      this.listeners[event] = [];
    } else {
      this.listeners = {};
    }
    return this;
  }

  /**
   * 一次性事件监听，触发后自动解绑
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {EventEmitter} - 返回this，支持链式调用
   */
  once(event, callback) {
    const onceWrapper = (...args) => {
      callback(...args);
      this.off(event, onceWrapper);
    };
    return this.on(event, onceWrapper);
  }
}

export default EventEmitter; 