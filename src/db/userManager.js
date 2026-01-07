import dbConnection from './connection.js';

class UserManager {
  constructor() {
    this.db = dbConnection;
  }

  // Get user by telegram_id
  async getUserByTelegramId(telegramId) {
    if (!this.db.isAvailable()) {
      console.warn('⚠️ Database unavailable, returning null');
      return null;
    }

    try {
      const query = `
        SELECT
          id, telegram_id, telegram_user_name,
          balance, "VIP_level", is_active,
          language_code, first_name, last_name,
          created_at, is_newcomer, username
        FROM users
        WHERE telegram_id = $1
      `;
      
      const result = await this.db.getPool().query(query, [telegramId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error fetching user:', error.message);
      return null;
    }
  }

  // Create new user
  async createUser(telegramUser) {
    if (!this.db.isAvailable()) {
      console.warn('⚠️ Database unavailable, cannot create user');
      return null;
    }

    try {
      const query = `
        INSERT INTO users (
          telegram_id,
          telegram_user_name,
          username,
          first_name,
          last_name,
          language_code,
          balance,
          "VIP_level",
          is_active,
          is_newcomer
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const values = [
        telegramUser.id,
        telegramUser.username || null,
        telegramUser.username || null,
        telegramUser.first_name || null,
        telegramUser.last_name || null,
        telegramUser.language_code || 'ru',
        0.0, // Initial balance
        0,   // VIP level (0 = regular)
        true, // is_active
        true  // is_newcomer
      ];

      const result = await this.db.getPool().query(query, values);
      console.log(`✅ Created new user: ${telegramUser.id}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error creating user:', error.message);
      return null;
    }
  }

  // Update user balance
  async updateBalance(telegramId, amount) {
    if (!this.db.isAvailable()) {
      console.warn('⚠️ Database unavailable, cannot update balance');
      return false;
    }

    try {
      const query = `
        UPDATE users 
        SET balance = balance + $1
        WHERE telegram_id = $2
        RETURNING balance
      `;
      
      const result = await this.db.getPool().query(query, [amount, telegramId]);
      
      if (result.rows.length > 0) {
        console.log(`💰 Updated balance for user ${telegramId}: ${result.rows[0].balance}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error updating balance:', error.message);
      return false;
    }
  }

  // Update user language
  async updateLanguage(telegramId, languageCode) {
    if (!this.db.isAvailable()) {
      console.warn('⚠️ Database unavailable, cannot update language');
      return false;
    }

    try {
      const query = `
        UPDATE users 
        SET language_code = $1
        WHERE telegram_id = $2
      `;
      
      await this.db.getPool().query(query, [languageCode, telegramId]);
      console.log(`🌐 Updated language for user ${telegramId}: ${languageCode}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating language:', error.message);
      return false;
    }
  }

  // Update user VIP level
  async updateVipLevel(telegramId, vipLevel) {
    if (!this.db.isAvailable()) {
      console.warn('⚠️ Database unavailable, cannot update VIP level');
      return false;
    }

    try {
      const query = `
        UPDATE users
        SET "VIP_level" = $1
        WHERE telegram_id = $2
      `;
      
      await this.db.getPool().query(query, [vipLevel, telegramId]);
      console.log(`⭐ Updated VIP level for user ${telegramId}: ${vipLevel}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating VIP level:', error.message);
      return false;
    }
  }

  // Get user subscription type based on VIP_level
  getSubscriptionType(vipLevel) {
    return vipLevel > 0 ? 'PREMIUM' : 'FREE';
  }

  // Get daily request limit based on subscription
  getDailyLimit(subscription) {
    return subscription === 'PREMIUM' ? 1000 : 25;
  }

  // Check if user is active
  async isUserActive(telegramId) {
    const user = await this.getUserByTelegramId(telegramId);
    return user ? user.is_active : false;
  }
}

export default new UserManager();
