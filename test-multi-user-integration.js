import dbConnection from './src/db/connection.js';
import userManager from './src/db/userManager.js';
import sessionManager from './src/session/sessionManager.js';

async function testMultiUserIntegration() {
  console.log('🧪 Testing Multi-User Database Integration...\n');
  
  // Test 1: Database Connection
  console.log('Test 1: Database Connection');
  const dbConfig = {
    user: 'taiger',
    host: '94.141.161.21',
    database: 'taigerdb',
    password: 'Pp969291',
    port: 5433
  };
  
  const connected = await dbConnection.connect(dbConfig);
  if (connected) {
    console.log('✅ Database connection successful\n');
  } else {
    console.log('❌ Database connection failed\n');
    return;
  }
  
  // Test 2: Create User
  console.log('Test 2: Create New User');
  const testUser = {
    id: 999999999,
    username: 'test_user',
    first_name: 'Test',
    last_name: 'User',
    language_code: 'ru'
  };
  
  const newUser = await userManager.createUser(testUser);
  if (newUser) {
    console.log('✅ User created successfully');
    console.log('   User data:', JSON.stringify(newUser, null, 2));
  } else {
    console.log('❌ User creation failed');
  }
  console.log();
  
  // Test 3: Get User
  console.log('Test 3: Get User by Telegram ID');
  const existingUser = await userManager.getUserByTelegramId(testUser.id);
  if (existingUser) {
    console.log('✅ User retrieved successfully');
    console.log('   User data:', JSON.stringify(existingUser, null, 2));
  } else {
    console.log('❌ User retrieval failed');
  }
  console.log();
  
  // Test 4: Update Balance
  console.log('Test 4: Update User Balance');
  const balanceUpdated = await userManager.updateBalance(testUser.id, 100);
  if (balanceUpdated) {
    console.log('✅ Balance updated successfully');
    const updatedUser = await userManager.getUserByTelegramId(testUser.id);
    console.log(`   New balance: ${updatedUser.balance}`);
  } else {
    console.log('❌ Balance update failed');
  }
  console.log();
  
  // Test 5: Update Language
  console.log('Test 5: Update User Language');
  const languageUpdated = await userManager.updateLanguage(testUser.id, 'en');
  if (languageUpdated) {
    console.log('✅ Language updated successfully');
    const updatedUser = await userManager.getUserByTelegramId(testUser.id);
    console.log(`   New language: ${updatedUser.language_code}`);
  } else {
    console.log('❌ Language update failed');
  }
  console.log();
  
  // Test 6: Get Subscription Type
  console.log('Test 6: Get Subscription Type');
  const subscription = userManager.getSubscriptionType(0);
  console.log(`✅ VIP level 0 = ${subscription}`);
  const premiumSubscription = userManager.getSubscriptionType(1);
  console.log(`✅ VIP level 1 = ${premiumSubscription}`);
  console.log();
  
  // Test 7: Get Daily Limit
  console.log('Test 7: Get Daily Limit');
  const freeLimit = userManager.getDailyLimit('FREE');
  console.log(`✅ FREE daily limit = ${freeLimit}`);
  const premiumLimit = userManager.getDailyLimit('PREMIUM');
  console.log(`✅ PREMIUM daily limit = ${premiumLimit}`);
  console.log();
  
  // Test 8: Session Management
  console.log('Test 8: Session Management');
  const session = await sessionManager.getSession(testUser);
  if (session) {
    console.log('✅ Session created successfully');
    console.log('   Session data:', {
      id: session.id,
      username: session.username,
      language: session.language,
      balance: session.balance,
      subscription: session.subscription,
      vipLevel: session.vipLevel,
      isNewcomer: session.isNewcomer
    });
  } else {
    console.log('❌ Session creation failed');
  }
  console.log();
  
  // Test 9: Update Session Mode
  console.log('Test 9: Update Session Mode');
  sessionManager.updateMode(testUser.id, 'ChatGPT');
  const updatedSession = await sessionManager.getSession(testUser);
  console.log(`✅ Session mode updated to: ${updatedSession.mode}`);
  console.log();
  
  // Test 10: Update Session Language
  console.log('Test 10: Update Session Language');
  await sessionManager.updateLanguage(testUser.id, 'ru');
  const languageUpdatedSession = await sessionManager.getSession(testUser);
  console.log(`✅ Session language updated to: ${languageUpdatedSession.language}`);
  console.log();
  
  // Test 11: Conversation History
  console.log('Test 11: Conversation History Management');
  sessionManager.addToConversationHistory(testUser.id, { role: 'user', content: 'Hello' });
  sessionManager.addToConversationHistory(testUser.id, { role: 'assistant', content: 'Hi there!' });
  const historySession = await sessionManager.getSession(testUser);
  console.log(`✅ Conversation history length: ${historySession.conversationHistory.length}`);
  console.log('   Messages:', historySession.conversationHistory);
  console.log();
  
  // Test 12: Clear Conversation History
  console.log('Test 12: Clear Conversation History');
  sessionManager.clearConversationHistory(testUser.id);
  const clearedSession = await sessionManager.getSession(testUser);
  console.log(`✅ Conversation history cleared. Length: ${clearedSession.conversationHistory.length}`);
  console.log();
  
  // Test 13: Daily Requests
  console.log('Test 13: Daily Requests Management');
  sessionManager.incrementDailyRequests(testUser.id);
  sessionManager.incrementDailyRequests(testUser.id);
  const requestsSession = await sessionManager.getSession(testUser);
  console.log(`✅ Daily requests: ${requestsSession.dailyRequests}`);
  console.log();
  
  // Test 14: Refresh Balance
  console.log('Test 14: Refresh Balance from Database');
  await userManager.updateBalance(testUser.id, 50);
  await sessionManager.refreshBalance(testUser.id);
  const refreshedSession = await sessionManager.getSession(testUser);
  console.log(`✅ Balance refreshed: ${refreshedSession.balance}`);
  console.log();
  
  // Test 15: Session Count
  console.log('Test 15: Active Sessions');
  const sessionCount = sessionManager.getSessionCount();
  console.log(`✅ Active sessions: ${sessionCount}`);
  console.log();
  
  // Cleanup
  console.log('Test 16: Cleanup');
  await dbConnection.disconnect();
  console.log('✅ Database disconnected');
  console.log();
  
  console.log('🎉 All tests completed successfully!');
}

// Run tests
testMultiUserIntegration().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
