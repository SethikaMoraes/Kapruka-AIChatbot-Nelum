/**
 * Nelum Event Bus Utility
 * Implements a lightweight, publish-subscribe event system for decoupling
 * agent communication, session updates, and client notifications.
 */

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Register an event listener for a given event name.
   * @param {string} eventName 
   * @param {Function} callback 
   */
  subscribe(eventName, callback) {
    if (typeof callback !== 'function') {
      throw new Error(`EventBus Error: Callback for event "${eventName}" must be a function.`);
    }
    
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    
    this.listeners.get(eventName).add(callback);
    
    console.log(`[EventBus] Subscribed to event: "${eventName}". Total listeners: ${this.listeners.get(eventName).size}`);
    
    // Return unsubscribe function
    return () => this.unsubscribe(eventName, callback);
  }

  /**
   * Unsubscribe a specific listener callback from an event.
   * @param {string} eventName 
   * @param {Function} callback 
   */
  unsubscribe(eventName, callback) {
    if (this.listeners.has(eventName)) {
      const callbacks = this.listeners.get(eventName);
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(eventName);
      }
      console.log(`[EventBus] Unsubscribed from event: "${eventName}".`);
    }
  }

  /**
   * Publish an event with payload data to all registered listeners.
   * @param {string} eventName 
   * @param {any} payload 
   */
  publish(eventName, payload) {
    if (!this.listeners.has(eventName)) {
      console.log(`[EventBus] Published event "${eventName}" with no listeners.`);
      return;
    }

    const callbacks = this.listeners.get(eventName);
    console.log(`[EventBus] Publishing "${eventName}" to ${callbacks.size} listeners.`);
    
    for (const callback of callbacks) {
      try {
        callback(payload);
      } catch (error) {
        console.error(`[EventBus] Error in listener for event "${eventName}":`, error);
      }
    }
  }

  /**
   * Clear all subscribers.
   */
  clear() {
    this.listeners.clear();
    console.log('[EventBus] Cleared all listeners.');
  }
}

export const eventBus = new EventBus();
export default eventBus;
