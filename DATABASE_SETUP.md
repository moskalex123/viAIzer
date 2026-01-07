# Database Setup Guide

This guide explains how to set up and configure the PostgreSQL database for multi-user support in the Gemini Bot.

## 📋 Prerequisites

- PostgreSQL server (version 12 or higher recommended)
- Database credentials (host, port, database name, user, password)
- Basic knowledge of SQL commands

## 🚀 Quick Setup

### 1. Create the Database

If you don't have a database yet, create one:

```sql
CREATE DATABASE taigerdb;
```

### 2. Create the Users Table

The bot requires a `users` table with the following schema:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  telegram_user_name VARCHAR(255),
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  language_code VARCHAR(10) DEFAULT 'ru',
  balance DECIMAL(10, 2) DEFAULT 0.00,
  VIP_level INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_newcomer BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_vip_level ON users(VIP_level);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. Configure Environment Variables

Add the following to your `.env` file:

```env
# Enable database integration
DB_ENABLED=true

# Database connection settings
DB_HOST=94.141.161.21
DB_PORT=5433
DB_NAME=taigerdb
DB_USER=taiger
DB_PASSWORD=Pp969291
```

### 4. Test the Connection

Run the test script to verify database connectivity:

```bash
node test-multi-user-integration.js
```

## 🔧 Configuration Options

### Database Connection Pool

The bot uses connection pooling for better performance. Default settings:

```javascript
{
  max: 20,                          // Maximum pool size
  idleTimeoutMillis: 30000,         // Close idle connections after 30s
  connectionTimeoutMillis: 2000,   // Connection timeout
}
```

You can modify these in `src/db/connection.js`.

### Retry Logic

The bot automatically retries failed connections:

- **Max retries**: 3 attempts
- **Retry delay**: 2 seconds (exponential backoff)
- **Graceful fallback**: Switches to in-memory sessions if all retries fail

## 📊 Database Schema Details

### Table: users

| Column | Type | Description | Default |
|--------|------|-------------|---------|
| `id` | SERIAL | Primary key | Auto-increment |
| `telegram_id` | BIGINT | Telegram user ID (unique) | Required |
| `telegram_user_name` | VARCHAR(255) | Telegram username | NULL |
| `username` | VARCHAR(255) | Display username | NULL |
| `first_name` | VARCHAR(255) | User's first name | NULL |
| `last_name` | VARCHAR(255) | User's last name | NULL |
| `language_code` | VARCHAR(10) | User's language preference | 'ru' |
| `balance` | DECIMAL(10, 2) | User's balance | 0.00 |
| `VIP_level` | INTEGER | VIP subscription level | 0 |
| `is_active` | BOOLEAN | User account status | true |
| `is_newcomer` | BOOLEAN | First-time user flag | true |
| `created_at` | TIMESTAMP | Account creation time | NOW() |
| `updated_at` | TIMESTAMP | Last update time | NOW() |

### VIP Levels

| Level | Subscription | Daily Limit | Description |
|-------|--------------|-------------|-------------|
| 0 | FREE | 25 | Basic user |
| 1 | PREMIUM | 1000 | Premium user |

## 🔐 Security Considerations

### 1. Database User Permissions

Create a dedicated database user with minimal required permissions:

```sql
-- Create user
CREATE USER taiger WITH PASSWORD 'Pp969291';

-- Grant permissions
GRANT CONNECT ON DATABASE taigerdb TO taiger;
GRANT USAGE ON SCHEMA public TO taiger;
GRANT SELECT, INSERT, UPDATE ON users TO taiger;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO taiger;
```

### 2. Environment Variables

- Never commit `.env` files to version control
- Use strong passwords
- Rotate passwords regularly
- Use different credentials for development and production

### 3. Network Security

- Use SSL/TLS for database connections in production
- Restrict database access to specific IP addresses
- Use firewall rules to limit access
- Consider using a VPN for remote database access

## 🧪 Testing

### Manual Testing

```bash
# Test database connection
node test-multi-user-integration.js

# Start bot with database
npm start
```

### Automated Testing

The test suite includes 16 tests covering:

1. Database connection
2. User creation
3. User retrieval
4. Balance updates
5. Language updates
6. Subscription type mapping
7. Daily limit calculation
8. Session management
9. Session mode updates
10. Session language updates
11. Conversation history
12. History clearing
13. Daily requests tracking
14. Balance refresh
15. Session counting
16. Cleanup and disconnection

## 🔄 Migration from In-Memory Sessions

If you're migrating from the old in-memory session system:

### 1. Backup Existing Data

Export any important session data before migration.

### 2. Enable Database

Set `DB_ENABLED=true` in your `.env` file.

### 3. Restart the Bot

The bot will automatically:
- Connect to the database
- Create users for existing Telegram users on first interaction
- Migrate session data to the new hybrid system

### 4. Verify Migration

Check that:
- Users can log in
- Balances are correct
- Settings persist across restarts
- All features work as expected

## 🐛 Troubleshooting

### Connection Issues

**Problem**: "Connection timeout" or "Connection refused"

**Solutions**:
1. Verify `DB_HOST` and `DB_PORT` are correct
2. Check firewall rules
3. Ensure PostgreSQL is running
4. Test connectivity: `telnet <host> <port>`

### Authentication Issues

**Problem**: "Password authentication failed"

**Solutions**:
1. Verify `DB_USER` and `DB_PASSWORD`
2. Check pg_hba.conf for authentication settings
3. Reset database user password if needed

### Permission Issues

**Problem**: "Permission denied" or "Access denied"

**Solutions**:
1. Grant required permissions to database user
2. Check table and schema ownership
3. Verify user has SELECT, INSERT, UPDATE permissions

### Table Not Found

**Problem**: "Relation 'users' does not exist"

**Solutions**:
1. Run the table creation SQL script
2. Verify you're connected to the correct database
3. Check table name case sensitivity

### Performance Issues

**Problem**: Slow queries or timeouts

**Solutions**:
1. Create indexes on frequently queried columns
2. Optimize connection pool settings
3. Monitor database performance
4. Consider database scaling or caching

## 📈 Monitoring

### Log Database Events

The bot logs important database events:

```javascript
// Connection status
✅ Database connected successfully
❌ Database connection failed (attempt 1/3)

// User operations
✅ User created: telegram_id=123456789
✅ Balance updated: telegram_id=123456789, new_balance=100.00

// Fallback mode
⚠️  Database unavailable, using fallback mode
```

### Health Checks

Monitor database health by checking:
- Connection pool status
- Query response times
- Error rates
- Active session count

## 🚀 Production Deployment

### 1. Use Environment Variables

Never hardcode credentials in source code.

### 2. Enable SSL

Configure SSL for secure connections:

```env
DB_SSL=true
DB_SSL_MODE=require
```

### 3. Connection Pool Tuning

Adjust pool settings based on your load:

```javascript
{
  max: 50,                          // Increase for high traffic
  idleTimeoutMillis: 10000,         // Shorter timeout
  connectionTimeoutMillis: 5000,    // Longer timeout
}
```

### 4. Backup Strategy

Implement regular database backups:

```bash
# Daily backup
pg_dump -h <host> -U <user> -d <database> > backup_$(date +%Y%m%d).sql

# Restore
psql -h <host> -U <user> -d <database> < backup_20240101.sql
```

### 5. Monitoring Setup

Set up monitoring for:
- Database connection status
- Query performance
- Error rates
- Resource usage

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js pg Library](https://node-postgres.com/)
- [Connection Pooling Guide](https://node-postgres.com/features/pooling)

## 💡 Best Practices

1. **Always use prepared statements** to prevent SQL injection
2. **Implement proper error handling** for all database operations
3. **Use transactions** for multi-step operations
4. **Monitor database performance** regularly
5. **Keep database schema versioned** for easy rollbacks
6. **Test database migrations** in development first
7. **Implement proper logging** for debugging
8. **Use connection pooling** for better performance
9. **Set appropriate timeouts** to prevent hanging
10. **Plan for scaling** from the beginning

## 🆘 Support

If you encounter issues:

1. Check the logs for error messages
2. Verify database credentials and connectivity
3. Review this troubleshooting guide
4. Test with `test-multi-user-integration.js`
5. Check PostgreSQL server logs
6. Consult PostgreSQL documentation

## ✅ Setup Checklist

- [ ] Database created
- [ ] Users table created with correct schema
- [ ] Indexes created
- [ ] Database user created with proper permissions
- [ ] Environment variables configured
- [ ] Connection tested with test script
- [ ] SSL/TLS configured (production)
- [ ] Backup strategy implemented
- [ ] Monitoring setup
- [ ] Documentation updated

Your database is now ready for multi-user support! 🎉
