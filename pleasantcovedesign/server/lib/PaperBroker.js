const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class PaperBroker extends EventEmitter {
  constructor(options = {}) {
    super();
    this.initialCash = options.initialCash || 100000;
    this.dataDir = options.dataDir || path.resolve(__dirname, '../data');
    this.persistenceEnabled = options.persistenceEnabled !== false;

    // State
    this.cash = this.initialCash;
    this.positions = new Map(); // symbol -> {qty, avgPrice, totalCost}
    this.orders = []; // order history
    this.pendingOrders = new Map(); // id -> order for limit orders

    // Ensure data directory exists
    if (this.persistenceEnabled) {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      this.loadState();
    }
  }

  // Load state from JSON files
  loadState() {
    try {
      const accountPath = path.join(this.dataDir, 'paper-account.json');
      const positionsPath = path.join(this.dataDir, 'paper-positions.json');
      const ordersPath = path.join(this.dataDir, 'paper-orders.json');

      if (fs.existsSync(accountPath)) {
        const accountData = JSON.parse(fs.readFileSync(accountPath, 'utf8'));
        this.cash = accountData.cash || this.initialCash;
      }

      if (fs.existsSync(positionsPath)) {
        const positionsData = JSON.parse(fs.readFileSync(positionsPath, 'utf8'));
        this.positions = new Map(Object.entries(positionsData));
      }

      if (fs.existsSync(ordersPath)) {
        this.orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
      }
    } catch (error) {
      console.warn('Error loading paper broker state:', error.message);
    }
  }

  // Save state to JSON files
  saveState() {
    if (!this.persistenceEnabled) return;

    try {
      const accountPath = path.join(this.dataDir, 'paper-account.json');
      const positionsPath = path.join(this.dataDir, 'paper-positions.json');
      const ordersPath = path.join(this.dataDir, 'paper-orders.json');

      fs.writeFileSync(accountPath, JSON.stringify({
        cash: this.cash,
        lastUpdated: new Date().toISOString()
      }, null, 2));

      fs.writeFileSync(positionsPath, JSON.stringify(Object.fromEntries(this.positions), null, 2));
      fs.writeFileSync(ordersPath, JSON.stringify(this.orders, null, 2));
    } catch (error) {
      console.warn('Error saving paper broker state:', error.message);
    }
  }

  // Get current account summary
  getAccount() {
    const positions = Array.from(this.positions.entries()).map(([symbol, pos]) => ({
      symbol,
      qty: pos.qty,
      avg_price: pos.avgPrice,
      total_cost: pos.totalCost
    }));

    const marketValue = positions.reduce((sum, pos) => sum + (pos.qty * pos.avgPrice), 0);
    const equity = this.cash + marketValue;

    return {
      cash: this.cash,
      equity,
      market_value: marketValue,
      positions_count: positions.length,
      positions
    };
  }

  // Get all positions
  getPositions() {
    return Array.from(this.positions.entries()).map(([symbol, pos]) => ({
      symbol,
      qty: pos.qty,
      avg_price: pos.avgPrice,
      total_cost: pos.totalCost
    }));
  }

  // Submit an order
  submitOrder(orderData) {
    const { symbol, side, qty, price, type = 'market' } = orderData;

    if (!symbol || !side || !qty) {
      throw new Error('Missing required order fields: symbol, side, qty');
    }

    const order = {
      id: this.generateOrderId(),
      symbol: symbol.toUpperCase(),
      side: side.toLowerCase(),
      qty: Math.abs(Number(qty)),
      price: price ? Number(price) : null,
      type: type.toLowerCase(),
      status: 'pending',
      created_at: new Date().toISOString(),
      filled_at: null,
      filled_qty: 0,
      filled_price: null
    };

    if (type === 'market') {
      return this.fillMarketOrder(order);
    } else if (type === 'limit') {
      return this.placeLimitOrder(order);
    } else {
      throw new Error(`Unsupported order type: ${type}`);
    }
  }

  // Fill a market order immediately
  fillMarketOrder(order) {
    const { symbol, side, qty } = order;
    const price = this.getCurrentPrice(symbol);

    if (!price) {
      throw new Error(`No price available for ${symbol}`);
    }

    order.filled_price = price;
    order.filled_qty = qty;
    order.status = 'filled';
    order.filled_at = new Date().toISOString();

    // Update positions and cash
    this.updatePosition(order);
    this.updateCash(order);

    // Add to order history
    this.orders.push(order);
    this.saveState();

    // Emit events
    this.emit('orderFilled', order);
    this.emit('positionUpdated', { symbol: order.symbol, position: this.positions.get(symbol) });

    return order;
  }

  // Place a limit order (simplified - fills immediately for now)
  placeLimitOrder(order) {
    // For simplicity, we'll fill limit orders immediately
    // In a real implementation, you'd check if the limit price is met
    return this.fillMarketOrder(order);
  }

  // Update position after order fill
  updatePosition(order) {
    const { symbol, side, filled_qty, filled_price } = order;
    const cost = filled_qty * filled_price;

    if (!this.positions.has(symbol)) {
      this.positions.set(symbol, {
        qty: 0,
        avgPrice: 0,
        totalCost: 0
      });
    }

    const position = this.positions.get(symbol);

    if (side === 'buy') {
      const newQty = position.qty + filled_qty;
      const newTotalCost = position.totalCost + cost;
      position.qty = newQty;
      position.totalCost = newTotalCost;
      position.avgPrice = newQty !== 0 ? newTotalCost / newQty : 0;
    } else if (side === 'sell') {
      if (position.qty >= filled_qty) {
        position.qty -= filled_qty;
        position.totalCost -= (position.avgPrice * filled_qty);
        if (position.qty <= 0) {
          this.positions.delete(symbol);
        }
      } else {
        throw new Error(`Insufficient position for ${symbol}: have ${position.qty}, need ${filled_qty}`);
      }
    }
  }

  // Update cash after order fill
  updateCash(order) {
    const { side, filled_qty, filled_price } = order;
    const amount = filled_qty * filled_price;

    if (side === 'buy') {
      if (this.cash < amount) {
        throw new Error('Insufficient cash for order');
      }
      this.cash -= amount;
    } else if (side === 'sell') {
      this.cash += amount;
    }
  }

  // Get current price for a symbol (mock implementation)
  getCurrentPrice(symbol) {
    // For now, return a mock price. In real implementation, this would
    // get the current market price from a quote service
    const basePrices = {
      'SPY': 450,
      'AAPL': 175,
      'QQQ': 380,
      'MSFT': 330,
      'NVDA': 450,
      'TSLA': 200
    };

    return basePrices[symbol] || 100; // Default to 100 if unknown symbol
  }

  // Get order history
  getOrderHistory(limit = 100) {
    return this.orders.slice(-limit);
  }

  // Generate unique order ID
  generateOrderId() {
    return `paper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Reset account (for testing)
  reset() {
    this.cash = this.initialCash;
    this.positions.clear();
    this.orders.length = 0;
    this.pendingOrders.clear();
    this.saveState();

    this.emit('reset');
  }

  // Get PnL summary
  getPnLSummary() {
    const positions = this.getPositions();
    let totalPnL = 0;
    let totalValue = 0;

    for (const pos of positions) {
      const currentPrice = this.getCurrentPrice(pos.symbol);
      const marketValue = pos.qty * currentPrice;
      const costBasis = pos.total_cost;
      const pnl = marketValue - costBasis;

      totalPnL += pnl;
      totalValue += marketValue;
    }

    return {
      total_pnl: totalPnL,
      total_value: totalValue,
      cash: this.cash,
      equity: this.cash + totalValue,
      positions_count: positions.length
    };
  }
}

module.exports = { PaperBroker };
