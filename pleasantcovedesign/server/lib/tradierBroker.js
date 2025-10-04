'use strict';

const axios = require('axios');
const { loadOrders, saveOrders, loadPositions, savePositions, loadIdempotency, saveIdempotency } = require('./persistence');
const { CONFIG } = require('./config');

class TradierBroker {
  constructor() {
    this.baseUrl = process.env.TRADIER_BASE_URL || 'https://sandbox.tradier.com/v1';
    this.token = process.env.TRADIER_TOKEN || process.env.TRADIER_API_KEY;
    this.accountId = process.env.TRADIER_ACCOUNT_ID || 'paper'; // Default to paper trading account
  }

  getHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Place an order via Tradier API
   * @param {Object} order - Order details
   * @param {string} order.symbol - Stock symbol
   * @param {string} order.side - 'buy' or 'sell'
   * @param {number} order.quantity - Number of shares
   * @param {string} order.type - 'market', 'limit', 'stop', 'stop_limit'
   * @param {number} order.price - Limit price (if applicable)
   * @param {string} order.duration - 'day', 'gtc', 'pre', 'post'
   */
  async placeOrder(order) {
    try {
      const payload = {
        class: 'equity',
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity,
        type: order.type || 'market',
        duration: order.duration || 'day'
      };

      // Add price for limit/stop orders
      if (order.type === 'limit' || order.type === 'stop_limit') {
        payload.price = order.price;
      }
      if (order.type === 'stop' || order.type === 'stop_limit') {
        payload.stop = order.stopPrice || order.price;
      }

      const response = await axios.post(
        `${this.baseUrl}/accounts/${this.accountId}/orders`,
        payload,
        { headers: this.getHeaders() }
      );

      if (response.data.order) {
        return {
          id: response.data.order.id,
          status: response.data.order.status,
          symbol: order.symbol,
          side: order.side,
          quantity: order.quantity,
          type: order.type,
          price: order.price,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('Invalid order response from Tradier');
      }
    } catch (error) {
      console.error('TradierBroker placeOrder error:', error.response?.data || error.message);
      throw new Error(`Order placement failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get order status by ID
   */
  async getOrderStatus(orderId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/accounts/${this.accountId}/orders/${orderId}`,
        { headers: this.getHeaders() }
      );

      if (response.data.order) {
        const order = response.data.order;
        return {
          id: order.id,
          status: order.status,
          symbol: order.symbol,
          side: order.side,
          quantity: order.quantity,
          filledQuantity: order.executed_quantity || 0,
          avgPrice: order.avg_fill_price || null,
          timestamp: order.created_at
        };
      }
      return null;
    } catch (error) {
      console.error('TradierBroker getOrderStatus error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Get all orders for account
   */
  async getOrders() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/accounts/${this.accountId}/orders`,
        { headers: this.getHeaders() }
      );

      if (response.data.orders && response.data.orders.order) {
        const orders = Array.isArray(response.data.orders.order)
          ? response.data.orders.order
          : [response.data.orders.order];

        return orders.map(order => ({
          id: order.id,
          status: order.status,
          symbol: order.symbol,
          side: order.side,
          quantity: order.quantity,
          filledQuantity: order.executed_quantity || 0,
          avgPrice: order.avg_fill_price || null,
          timestamp: order.created_at
        }));
      }
      return [];
    } catch (error) {
      console.error('TradierBroker getOrders error:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Get account positions
   */
  async getPositions() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/accounts/${this.accountId}/positions`,
        { headers: this.getHeaders() }
      );

      if (response.data.positions && response.data.positions.position) {
        const positions = Array.isArray(response.data.positions.position)
          ? response.data.positions.position
          : [response.data.positions.position];

        return positions.map(pos => ({
          symbol: pos.symbol,
          quantity: parseInt(pos.quantity),
          costBasis: parseFloat(pos.cost_basis),
          marketValue: parseFloat(pos.market_value),
          unrealizedPnL: parseFloat(pos.unrealized_pnl),
          unrealizedPnLPct: parseFloat(pos.unrealized_pnl_pct)
        }));
      }
      return [];
    } catch (error) {
      console.error('TradierBroker getPositions error:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Get account balance/cash
   */
  async getBalance() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/accounts/${this.accountId}/balances`,
        { headers: this.getHeaders() }
      );

      if (response.data.balances) {
        const balance = response.data.balances;
        return {
          totalCash: parseFloat(balance.total_cash),
          buyingPower: parseFloat(balance.buying_power),
          totalValue: parseFloat(balance.total_value),
          unrealizedPnL: parseFloat(balance.unrealized_pnl || 0),
          realizedPnL: parseFloat(balance.realized_pnl || 0)
        };
      }
      return null;
    } catch (error) {
      console.error('TradierBroker getBalance error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId) {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/accounts/${this.accountId}/orders/${orderId}`,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        orderId: orderId,
        message: 'Order cancelled successfully'
      };
    } catch (error) {
      console.error('TradierBroker cancelOrder error:', error.response?.data || error.message);
      throw new Error(`Order cancellation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Sync fills and update positions locally
   */
  async syncFills() {
    try {
      const orders = await this.getOrders();
      const positions = await this.getPositions();
      const balance = await this.getBalance();

      // Update local storage with latest data
      saveOrders(orders);
      savePositions(positions);

      return {
        orders,
        positions,
        balance,
        syncedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('TradierBroker syncFills error:', error);
      throw error;
    }
  }

  /**
   * Get complete portfolio data (balance + positions)
   */
  async getPortfolio() {
    try {
      const [balance, positions] = await Promise.all([
        this.getBalance(),
        this.getPositions()
      ]);

      // Calculate equity and P&L
      const equity = balance.totalValue - balance.totalCash;
      const openPnl = balance.unrealizedPnL || 0;
      const dayPnl = 0; // Would need day-specific data from broker

      return {
        cash: balance.totalCash,
        equity: equity,
        day_pnl: dayPnl,
        open_pnl: openPnl,
        positions: positions.map(pos => ({
          symbol: pos.symbol,
          qty: pos.quantity,
          avg_cost: pos.costBasis / pos.quantity,
          last: pos.marketValue / pos.quantity,
          pnl: pos.unrealizedPnL
        }))
      };
    } catch (error) {
      console.error('TradierBroker getPortfolio error:', error.response?.data || error.message);
      return {
        cash: 0,
        equity: 0,
        day_pnl: 0,
        open_pnl: 0,
        positions: []
      };
    }
  }

  /**
   * Health check for broker connection
   */
  async healthCheck() {
    try {
      const balance = await this.getBalance();
      return {
        ok: !!balance,
        latency: 0, // Could measure actual latency
        lastSync: new Date().toISOString()
      };
    } catch (error) {
      return {
        ok: false,
        error: error.message,
        lastSync: null
      };
    }
  }
}

module.exports = { TradierBroker };
