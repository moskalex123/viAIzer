import axios from 'axios';

// Test configuration
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN';
const TEST_CHAT_ID = process.env.TEST_CHAT_ID || 'YOUR_CHAT_ID';
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function testBot() {
  console.log('🧪 Testing Gemini Bot Copy');
  console.log('=====================================');
  
  if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN') {
    console.error('❌ BOT_TOKEN is required!');
    console.log('Set BOT_TOKEN environment variable or edit this file');
    process.exit(1);
  }
  
  try {
    // Test 1: Get bot info
    console.log('📋 Test 1: Getting bot information...');
    const botInfo = await axios.get(`${BASE_URL}/getMe`);
    
    if (botInfo.data.ok) {
      const bot = botInfo.data.result;
      console.log(`✅ Bot found!`);
      console.log(`   Name: ${bot.first_name}`);
      console.log(`   Username: @${bot.username}`);
      console.log(`   ID: ${bot.id}`);
    } else {
      console.log('❌ Failed to get bot info');
      return;
    }
    
    // Test 2: Send /start command (if chat ID provided)
    if (TEST_CHAT_ID && TEST_CHAT_ID !== 'YOUR_CHAT_ID') {
      console.log('\n📤 Test 2: Sending /start command...');
      
      const startResult = await axios.post(`${BASE_URL}/sendMessage`, {
        chat_id: TEST_CHAT_ID,
        text: '/start',
        parse_mode: 'HTML'
      });
      
      if (startResult.data.ok) {
        console.log('✅ /start command sent successfully');
        console.log(`   Message ID: ${startResult.data.result.message_id}`);
      } else {
        console.log('❌ Failed to send /start command');
      }
      
      // Test 3: Send regular message
      console.log('\n📤 Test 3: Sending test message...');
      
      const messageResult = await axios.post(`${BASE_URL}/sendMessage`, {
        chat_id: TEST_CHAT_ID,
        text: 'Hello bot! How are you?',
        parse_mode: 'HTML'
      });
      
      if (messageResult.data.ok) {
        console.log('✅ Test message sent successfully');
        console.log(`   Message ID: ${messageResult.data.result.message_id}`);
      } else {
        console.log('❌ Failed to send test message');
      }
      
      // Test 4: Send mode selection
      console.log('\n📤 Test 4: Testing mode selection...');
      
      const inlineKeyboard = {
        inline_keyboard: [
          [
            { text: '💬 ChatGPT', callback_data: 'mode_chatgpt' },
            { text: '🍌 Nano Banana', callback_data: 'mode_nano' }
          ],
          [
            { text: '🎥 Sora 2', callback_data: 'mode_sora' }
          ]
        ]
      };
      
      const modeResult = await axios.post(`${BASE_URL}/sendMessage`, {
        chat_id: TEST_CHAT_ID,
        text: 'Select a mode:',
        reply_markup: inlineKeyboard
      });
      
      if (modeResult.data.ok) {
        console.log('✅ Mode selection keyboard sent successfully');
        console.log(`   Message ID: ${modeResult.data.result.message_id}`);
      } else {
        console.log('❌ Failed to send mode selection');
      }
      
    } else {
      console.log('\n⚠️  Skipping message tests (no TEST_CHAT_ID provided)');
      console.log('To test messaging, set TEST_CHAT_ID to your Telegram user ID');
    }
    
    // Test 5: Get updates (webhook test)
    console.log('\n📡 Test 5: Checking for updates...');
    
    const updatesResult = await axios.get(`${BASE_URL}/getUpdates`);
    
    if (updatesResult.data.ok) {
      const updates = updatesResult.data.result;
      console.log(`✅ Found ${updates.length} updates`);
      
      if (updates.length > 0) {
        console.log('   Recent update types:');
        updates.slice(-5).forEach(update => {
          if (update.message) {
            console.log(`   - Message from ${update.message.from.first_name}`);
          } else if (update.callback_query) {
            console.log(`   - Callback query: ${update.callback_query.data}`);
          }
        });
      }
    } else {
      console.log('❌ Failed to get updates');
    }
    
    console.log('\n🎉 Bot testing completed!');
    console.log('\nNext steps:');
    console.log('1. Start the bot: npm start');
    console.log('2. Send /start to your bot in Telegram');
    console.log('3. Test mode selection and AI responses');
    console.log('4. Configure API keys for different modes');
    
  } catch (error) {
    console.error('❌ Bot test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run tests
testBot().catch(console.error);