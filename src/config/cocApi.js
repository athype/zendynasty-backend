const { Client } = require('clashofclans.js');

class CocClientManager {
  constructor() {
    this.client = new Client();
    this.isLoggedIn = false;
    this.loginPromise = null;
  }

  async initialize() {
    if (this.loginPromise) {
      return this.loginPromise;
    }

    this.loginPromise = this._performLogin();
    return this.loginPromise;
  }

  async _performLogin() {
    try {
      if (this.isLoggedIn) {
        return this.client;
      }

      if (!process.env.COC_EMAIL || !process.env.COC_PASSWORD) {
        throw new Error('COC_EMAIL and COC_PASSWORD environment variables are required');
      }

      await this.client.login({
        email: process.env.COC_EMAIL,
        password: process.env.COC_PASSWORD
      });

      this.isLoggedIn = true;
      console.log('CocClient connected successfully');
      return this.client;
    } catch (error) {
      console.error('Error connecting CocClient:', error);
      throw error;
    }
  }

  getClient() {
    if (!this.isLoggedIn) {
      throw new Error('CoC Client not initialized. Call initialize() first.');
    }
    return this.client;
  }

  async getClientAsync() {
    if (!this.isLoggedIn) {
      await this.initialize();
    }
    return this.client;
  }

  isReady() {
    return this.isLoggedIn;
  }
}

const cocClientManager = new CocClientManager();

module.exports = cocClientManager;