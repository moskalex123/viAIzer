import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

class GeminiBotCopy {
  constructor() {
    this.bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // OpenRouter configuration
    this.openrouter = {
      enabled: process.env.OPENROUTER === 'true',
      apiKey: process.env.OPENROUTER_API_KEY,
      modelName: process.env.NANO_OPENROUTER_MODEL_NAME || 'google/gemini-2.5-flash-image'
    };
    
    // kie.ai configuration
    this.kieAI = {
      enabled: process.env.KIE_AI_ENABLED === 'true',
      apiKey: process.env.KIE_AI_API_KEY,
      baseUrl: 'https://api.kie.ai/api/v1/jobs',
      pollInterval: parseInt(process.env.KIE_AI_POLL_INTERVAL) || 2000,
      maxWaitTime: parseInt(process.env.KIE_AI_MAX_WAIT_TIME) || 120000,
      model: 'google/nano-banana-edit', // Changed to edit model
      defaultParams: {
        output_format: 'png',
        image_size: '1:1'
      }
    };
    
    // User sessions and state management
    this.userSessions = new Map();
    
    // Bot configuration based on analysis
    this.config = {
      maxDailyRequests: {
        FREE: 25,
        PREMIUM: 1000
      },
      modes: {
        'ChatGPT': { name: 'ChatGPT', description: 'GPT-4 модель от OpenAI' },
        'Nano Banana': { name: 'Nano Banana', description: 'Работа с изображениями через OpenRouter' },
        'Nano Banana Edit (kie.ai)': { name: 'Nano Banana Edit (kie.ai)', description: 'Редактирование изображений через kie.ai' },
        'Sora 2': { name: 'Sora 2', description: 'Модель для генерации видео' }
      },
      languages: {
        'ru': { name: 'Русский', flag: '🇷🇺' },
        'en': { name: 'English', flag: '🇬🇧' }
      }
    };
    
    this.initializeBot();
  }

  initializeBot() {
    console.log('🤖 Initializing Gemini Bot Copy...');
    
    // Log OpenRouter configuration
    if (this.openrouter.enabled) {
      console.log(`✅ OpenRouter enabled with model: ${this.openrouter.modelName}`);
    } else {
      console.log('⚠️ OpenRouter disabled, using simulated responses');
    }
    
    // Log kie.ai configuration
    if (this.kieAI.enabled) {
      console.log(`✅ kie.ai enabled with model: ${this.kieAI.model}`);
    } else {
      console.log('⚠️ kie.ai disabled');
    }
    
    // Command handlers
    this.bot.onText(/\/start/, this.handleStart.bind(this));
    this.bot.onText(/\/menu/, this.handleMenu.bind(this));
    this.bot.onText(/\/profile/, this.handleProfile.bind(this));
    this.bot.onText(/\/info/, this.handleInfo.bind(this));
    this.bot.onText(/\/newdialogue/, this.handleNewDialogue.bind(this));
    this.bot.onText(/\/help/, this.handleHelp.bind(this));
    
    // Callback query handlers (inline button clicks)
    this.bot.on('callback_query', this.handleCallbackQuery.bind(this));
    
    // Message handlers
    this.bot.on('message', this.handleMessage.bind(this));
    
    console.log('✅ Bot initialized successfully!');
  }

  // Session management
  getUserSession(userId) {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, {
        id: userId,
        mode: null,
        language: 'ru',
        registrationDate: new Date(),
        dailyRequests: 0,
        lastRequestDate: new Date().toDateString(),
        subscription: 'FREE',
        balance: 0.0,
        conversationHistory: []
      });
    }
    
    const session = this.userSessions.get(userId);
    
    // Reset daily requests if it's a new day
    const today = new Date().toDateString();
    if (session.lastRequestDate !== today) {
      session.dailyRequests = 0;
      session.lastRequestDate = today;
    }
    
    return session;
  }

  // Command handlers
  async handleStart(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const session = this.getUserSession(userId);
    
    const welcomeText = this.getLocalizedText('welcome', session.language);
    
    await this.bot.sendMessage(chatId, welcomeText, {
      reply_markup: this.getMainMenuKeyboard()
    });
  }

  async handleMenu(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const session = this.getUserSession(userId);
    
    const menuText = this.getLocalizedText('menu', session.language);
    
    await this.bot.sendMessage(chatId, menuText, {
      reply_markup: this.getMainMenuKeyboard()
    });
  }

  async handleProfile(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const session = this.getUserSession(userId);
    
    const profileText = this.generateProfileText(session);
    
    await this.bot.sendMessage(chatId, profileText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '🪙 Купить подписку / 🔋', callback_data: 'buy_subscription' }
        ]]
      }
    });
  }

  async handleInfo(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const session = this.getUserSession(userId);
    
    const infoText = this.getLocalizedText('info', session.language);
    
    await this.bot.sendMessage(chatId, infoText, {
      parse_mode: 'HTML'
    });
  }

  async handleNewDialogue(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const session = this.getUserSession(userId);
    
    // Clear conversation history
    session.conversationHistory = [];
    
    const text = this.getLocalizedText('new_dialogue', session.language);
    
    await this.bot.sendMessage(chatId, text);
  }

  async handleHelp(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const session = this.getUserSession(userId);
    
    const helpText = this.getLocalizedText('help', session.language);
    
    await this.bot.sendMessage(chatId, helpText, {
      parse_mode: 'HTML'
    });
  }

  // Callback query handler (inline button clicks)
  async handleCallbackQuery(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const session = this.getUserSession(userId);
    
    // Answer the callback query
    await this.bot.answerCallbackQuery(callbackQuery.id);
    
    console.log(`🖱️ User ${userId} clicked: ${data}`);
    
    switch (data) {
      case 'select_mode':
        await this.showModeSelection(chatId, session);
        break;
      case 'buy_subscription':
        await this.showSubscriptionOptions(chatId, session);
        break;
      case 'profile':
        await this.handleProfile({ chat: { id: chatId }, from: { id: userId } });
        break;
      case 'text_mode':
        await this.handleTextMode(chatId, session);
        break;
      case 'design_mode':
        await this.handleDesignMode(chatId, session);
        break;
      case 'premium_services':
        await this.showPremiumServices(chatId, session);
        break;
      default:
        if (data.startsWith('mode_')) {
          const mode = data.replace('mode_', '');
          await this.setUserMode(chatId, session, mode);
        } else if (data.startsWith('lang_')) {
          const lang = data.replace('lang_', '');
          await this.setUserLanguage(chatId, session, lang);
        }
        break;
    }
  }

  // Message handler
  async handleMessage(msg) {
    console.log(`📨 handleMessage called`);
    
    // Check if this is a valid message with required fields
    if (!msg || !msg.chat || !msg.from) {
      console.log(`⚠️ Invalid message structure, skipping`);
      return;
    }
    
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const session = this.getUserSession(userId);
    
    console.log(`📨 Received message from user ${userId} in chat ${chatId}`);
    console.log(`🔧 Current session mode: ${session.mode}`);

    if (msg.photo) {
      console.log(`📸 PHOTO DETECTED`);
      
      // Check if user has selected a mode
      if (!session.mode) {
        console.log(`❌ No mode selected, asking user to select mode`);
        const text = this.getLocalizedText('no_mode_selected', session.language);
        await this.bot.sendMessage(chatId, text);
        await this.showModeSelection(chatId, session);
        return;
      }
      
      // Get image URL from Telegram
      const photos = msg.photo;
      const largest = photos[photos.length - 1];
      const fileId = largest.file_id;
      console.log(`📎 Getting file link for file_id: ${fileId}`);
      const imageUrl = await this.bot.getFileLink(fileId);
      console.log(`🔗 Image URL: ${imageUrl}`);
      
      const prompt = msg.caption || 'Edit this image';
      console.log(`💬 Caption/Prompt: ${prompt}`);
      
      // Route based on mode
      if (session.mode === 'Nano Banana Edit (kie.ai)') {
        console.log(`🎨 Routing image to kie.ai Edit processing`);
        await this.generateKieAIResponse(chatId, session, prompt, imageUrl);
      } else {
        console.log(`📡 Routing image to OpenRouter processing`);
        await this.handleImageInput(chatId, session, msg);
      }
      return;
    }

    if (!msg.text || msg.text.startsWith('/')) return;

    if (msg.text === '👤 Профиль') {
      await this.handleProfile(msg);
      return;
    } else if (msg.text === '🖋 Текст') {
      await this.handleTextMode(chatId, session);
      return;
    } else if (msg.text === '🎨 Дизайн') {
      await this.handleDesignMode(chatId, session);
      return;
    } else if (msg.text === '⚙️ Выбрать нейросеть') {
      await this.showModeSelection(chatId, session);
      return;
    } else if (msg.text === '💰 Премиум-услуги') {
      await this.showPremiumServices(chatId, session);
      return;
    }

    await this.handleAIConversation(chatId, session, msg.text);
  }

  // Mode selection
  async showModeSelection(chatId, session) {
    console.log(`📋 Showing mode selection to user ${session.id}`);
    
    const text = this.getLocalizedText('select_mode', session.language);
    
    const keyboard = {
      inline_keyboard: Object.keys(this.config.modes).map(mode => [{
        text: mode,
        callback_data: `mode_${mode}`
      }])
    };
    
    await this.bot.sendMessage(chatId, text, {
      reply_markup: keyboard
    });
  }

  async setUserMode(chatId, session, mode) {
    console.log(`🔧 Setting user mode to: ${mode}`);
    
    if (this.config.modes[mode]) {
      session.mode = mode;
      console.log(`✅ Mode successfully set to: ${mode}`);
      
      const text = this.getLocalizedText('mode_selected', session.language)
        .replace('{mode}', mode);
      
      // Add mode-specific instructions
      let modeInstructions = '';
      if (mode === 'Nano Banana Edit (kie.ai)') {
        modeInstructions = '\n\n💡 <b>Как использовать:</b>\n1. Отправьте изображение\n2. В подписи к изображению опишите, как вы хотите его изменить\n\n📸 Поддерживается до 10 изображений за раз (до 10MB каждое)';
      } else if (mode === 'Nano Banana') {
        modeInstructions = '\n\n💡 <b>Возможности:</b>\n• Анализ изображений\n• Генерация изображений\n• Текстовые ответы\n\n📸 Можете отправлять фотографии с подписью для анализа.';
      }
      
      await this.bot.sendMessage(chatId, text + modeInstructions, { parse_mode: 'HTML' });
    } else {
      console.log(`❌ Mode not found: ${mode}`);
      const text = this.getLocalizedText('mode_not_found', session.language);
      await this.bot.sendMessage(chatId, text);
    }
  }

  // Text mode handler
  async handleTextMode(chatId, session) {
    if (!session.mode) {
      const text = this.getLocalizedText('no_mode_selected', session.language);
      await this.bot.sendMessage(chatId, text);
      await this.showModeSelection(chatId, session);
      return;
    }
    
    const text = this.getLocalizedText('text_mode_ready', session.language)
      .replace('{mode}', session.mode);
    
    await this.bot.sendMessage(chatId, text);
  }

  // Design mode handler
  async handleDesignMode(chatId, session) {
    if (!session.mode) {
      const text = this.getLocalizedText('no_mode_selected', session.language);
      await this.bot.sendMessage(chatId, text);
      await this.showModeSelection(chatId, session);
      return;
    }
    
    const text = this.getLocalizedText('design_mode_ready', session.language)
      .replace('{mode}', session.mode);
    
    await this.bot.sendMessage(chatId, text);
  }

  // Premium services
  async showPremiumServices(chatId, session) {
    const text = this.getLocalizedText('premium_services', session.language);
    
    await this.bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: [[
          { text: '🪙 Купить подписку', callback_data: 'buy_subscription' }
        ]]
      }
    });
  }

  async showSubscriptionOptions(chatId, session) {
    const text = this.getLocalizedText('subscription_options', session.language);
    
    await this.bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '💎 Премиум на месяц - 299 🔋', callback_data: 'sub_premium_30d' }],
          [{ text: '💎 Премиум на год - 2999 🔋', callback_data: 'sub_premium_365d' }],
          [{ text: '🪙 Купить 🔋', callback_data: 'buy_batteries' }]
        ]
      }
    });
  }

  // AI conversation handler
  async handleAIConversation(chatId, session, userMessage) {
    console.log(`💬 Handling AI conversation for user ${session.id}`);
    console.log(`🔧 Current mode: ${session.mode}`);
    console.log(`📝 User message: ${userMessage}`);
    
    if (!session.mode) {
      console.log(`❌ No mode selected`);
      const text = this.getLocalizedText('no_mode_selected', session.language);
      await this.bot.sendMessage(chatId, text);
      await this.showModeSelection(chatId, session);
      return;
    }
    
    // Check if user is trying to use kie.ai Edit without an image
    if (session.mode === 'Nano Banana Edit (kie.ai)') {
      console.log(`⚠️ User sent text to kie.ai Edit mode without image`);
      const text = this.getLocalizedText('kieai_needs_image', session.language);
      await this.bot.sendMessage(chatId, text);
      return;
    }
    
    // Check daily limits
    const maxRequests = this.config.maxDailyRequests[session.subscription];
    if (session.dailyRequests >= maxRequests) {
      console.log(`🚫 Daily limit reached`);
      const text = this.getLocalizedText('daily_limit_reached', session.language)
        .replace('{limit}', maxRequests);
      await this.bot.sendMessage(chatId, text);
      return;
    }
    
    try {
      session.dailyRequests++;
      console.log(`📈 Incremented daily requests to ${session.dailyRequests}`);
      session.conversationHistory.push({ role: 'user', content: userMessage });
      
      let response;
      
      console.log(`🔄 Routing to mode handler: ${session.mode}`);
      switch (session.mode) {
        case 'ChatGPT':
          console.log(`🤖 Using ChatGPT mode`);
          response = await this.generateChatGPTResponse(session);
          break;
        case 'Nano Banana':
          console.log(`🍌 Using Nano Banana mode`);
          response = await this.generateNanoBananaResponse(session);
          break;
        case 'Sora 2':
          console.log(`🎬 Using Sora 2 mode`);
          response = await this.generateSora2Response(session);
          break;
        default:
          console.log(`❓ Unknown mode: ${session.mode}`);
          response = this.getLocalizedText('mode_not_supported', session.language);
      }
      
      session.conversationHistory.push({ role: 'assistant', content: response });
      console.log(`📤 Sending AI response`);
      
      await this.bot.sendMessage(chatId, response);
      
    } catch (error) {
      console.error('💥 AI Generation Error:', error);
      console.error('Error stack:', error.stack);
      const text = this.getLocalizedText('ai_error', session.language);
      await this.bot.sendMessage(chatId, text);
    }
  }

  // AI response generators
  async generateChatGPTResponse(session) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: session.conversationHistory.slice(-10), // Keep last 10 messages
        max_tokens: 1000,
        temperature: 0.7
      });
      
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('ChatGPT Error:', error);
      return this.getLocalizedText('chatgpt_error', session.language);
    }
  }

  async generateNanoBananaResponse(session) {
    // Use OpenRouter API if enabled, otherwise simulate response
    if (this.openrouter.enabled && this.openrouter.apiKey) {
      return await this.generateOpenRouterResponse(session);
    } else {
      // Fallback to simulated response
      const lastMessage = session.conversationHistory[session.conversationHistory.length - 1];
      return `🍌 Nano Banana: Быстрый ответ на "${lastMessage.content}"`;
    }
  }

  async generateOpenRouterResponse(session) {
    try {
      const lastMessage = session.conversationHistory[session.conversationHistory.length - 1];
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openrouter.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://t.me/your_bot_username',
          'X-Title': 'GeminiAI Bot'
        },
        body: JSON.stringify({
          model: this.openrouter.modelName,
          messages: [
            { role: 'user', content: lastMessage.content }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });
      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }
      const data = await response.json();
      console.log('OpenRouter response:', JSON.stringify(data, null, 2));
      const m = data.choices?.[0]?.message;
      // Prefer images first
      if (Array.isArray(m?.images) && m.images.length > 0) {
        const img = m.images[0];
        if (img.type === 'image_url' && img.image_url?.url) {
          const u = img.image_url.url;
          if (u.startsWith('data:image/')) {
            const b64 = u.split(',')[1];
            const buff = Buffer.from(b64, 'base64');
            await this.bot.sendPhoto(chatId, buff, { filename: 'image.png' });
            return 'Изображение отправлено';
          } else {
            await this.bot.sendPhoto(chatId, u);
            return 'Изображение отправлено';
          }
        }
      }
      if (Array.isArray(m?.content)) {
        const textPart = m.content.find(p => p.type === 'text');
        const outputImage = m.content.find(p => p.type === 'output_image' || p.type === 'image_url' || p.type === 'image');
        if (outputImage && outputImage.image_url?.url) {
          const url = outputImage.image_url.url;
          await this.bot.sendPhoto(chatId, url);
          return textPart?.text ? `🍌 Nano Banana: ${textPart.text}` : 'Изображение отправлено';
        }
        if (textPart?.text) {
          return `🍌 Nano Banana: ${textPart.text}`;
        }
      }
      if (typeof m?.content === 'string' && m.content) {
        return `🍌 Nano Banana: ${m.content}`;
      }
      return 'Нет ответа от модели';
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      const lastMessage = session.conversationHistory[session.conversationHistory.length - 1];
      return `🍌 Nano Banana: Быстрый ответ на "${lastMessage.content}"`;
    }
  }

  // kie.ai API methods
  async createKieAITask(prompt, imageUrl) {
    console.log(`🚀 Creating kie.ai Edit task`);
    console.log(`📝 Prompt: "${prompt}"`);
    console.log(`🖼️ Image URL: ${imageUrl}`);
    
    if (!this.kieAI.enabled || !this.kieAI.apiKey) {
      console.log(`❌ kie.ai is not enabled or API key is missing`);
      throw new Error('kie.ai is not enabled or API key is missing');
    }

    if (!imageUrl) {
      console.log(`❌ Image URL is required for Nano Banana Edit`);
      throw new Error('Image URL is required for editing');
    }

    const requestBody = {
      model: this.kieAI.model,
      input: {
        prompt: prompt,
        image_urls: [imageUrl], // Array of image URLs (up to 10)
        output_format: this.kieAI.defaultParams.output_format,
        image_size: this.kieAI.defaultParams.image_size
      }
    };
    
    console.log(`📤 kie.ai createTask request:`, JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${this.kieAI.baseUrl}/createTask`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.kieAI.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`📥 kie.ai createTask response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ kie.ai API error (${response.status}): ${errorText}`);
      throw new Error(`kie.ai API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`📥 kie.ai createTask response data:`, JSON.stringify(data, null, 2));
    
    if (data.code !== 200) {
      console.error(`❌ kie.ai API error: ${data.msg}`);
      throw new Error(`kie.ai API error: ${data.msg}`);
    }

    console.log(`✅ kie.ai task created with ID: ${data.data.taskId}`);
    return data.data.taskId;
  }

  async pollKieAITask(taskId) {
    console.log(`📡 Starting to poll kie.ai task: ${taskId}`);
    const startTime = Date.now();
    
    while (Date.now() - startTime < this.kieAI.maxWaitTime) {
      console.log(`📡 Polling kie.ai task ${taskId}...`);
      const response = await fetch(`${this.kieAI.baseUrl}/recordInfo?taskId=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.kieAI.apiKey}`
        }
      });

      console.log(`📥 kie.ai poll response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ kie.ai poll error (${response.status}): ${errorText}`);
        throw new Error(`kie.ai poll error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.code !== 200) {
        console.error(`❌ kie.ai poll error: ${data.msg}`);
        throw new Error(`kie.ai poll error: ${data.msg}`);
      }

      const taskData = data.data;
      
      console.log(`📊 kie.ai task ${taskId} status: ${taskData.state}`);

      if (taskData.state === 'success') {
        console.log(`✅ kie.ai task ${taskId} succeeded`);
        const resultJson = JSON.parse(taskData.resultJson);
        console.log(`📋 kie.ai task result:`, JSON.stringify(resultJson, null, 2));
        return {
          success: true,
          resultUrls: resultJson.resultUrls || [],
          costTime: taskData.costTime
        };
      } else if (taskData.state === 'fail') {
        console.log(`❌ kie.ai task ${taskId} failed`);
        console.log(`📋 kie.ai failure details - Code: ${taskData.failCode}, Message: ${taskData.failMsg}`);
        return {
          success: false,
          failCode: taskData.failCode,
          failMsg: taskData.failMsg
        };
      }

      // Wait before next poll
      console.log(`⏳ Waiting ${this.kieAI.pollInterval}ms before next poll`);
      await new Promise(resolve => setTimeout(resolve, this.kieAI.pollInterval));
    }

    console.log(`⏰ kie.ai task ${taskId} timed out after ${this.kieAI.maxWaitTime}ms`);
    throw new Error('kie.ai task timeout');
  }

  async generateKieAIResponse(chatId, session, prompt, imageUrl) {
    console.log(`🎨 Starting kie.ai Edit generation`);
    console.log(`📝 Prompt: ${prompt}`);
    console.log(`🖼️ Image URL: ${imageUrl}`);
    
    if (!this.kieAI.enabled || !this.kieAI.apiKey) {
      console.log(`❌ kie.ai is not enabled or API key is missing`);
      const text = this.getLocalizedText('kieai_disabled', session.language);
      await this.bot.sendMessage(chatId, text);
      return;
    }

    if (!imageUrl) {
      console.log(`❌ No image URL provided`);
      const text = this.getLocalizedText('kieai_needs_image', session.language);
      await this.bot.sendMessage(chatId, text);
      return;
    }

    try {
      // Send "processing" message
      console.log(`📤 Sending "processing" message`);
      const processingMsg = await this.bot.sendMessage(
        chatId, 
        '🎨 Редактирую изображение через Nano Banana Edit (kie.ai)...'
      );

      // Create task
      console.log(`🎨 Creating kie.ai Edit task`);
      const taskId = await this.createKieAITask(prompt, imageUrl);
      console.log(`✅ kie.ai task created: ${taskId}`);

      // Update message
      console.log(`📤 Updating message with task ID`);
      await this.bot.editMessageText(
        `⏳ Задача создана (ID: ${taskId})\nОжидание результата...`,
        { chat_id: chatId, message_id: processingMsg.message_id }
      );

      // Poll for results
      console.log(`📡 Starting to poll for results`);
      const result = await this.pollKieAITask(taskId);
      console.log(`📥 Received result:`, JSON.stringify(result, null, 2));

      if (result.success && result.resultUrls && result.resultUrls.length > 0) {
        console.log(`✅ Successfully edited ${result.resultUrls.length} images`);
        // Delete "processing" message
        await this.bot.deleteMessage(chatId, processingMsg.message_id);

        // Send all edited images
        for (const imageUrl of result.resultUrls) {
          console.log(`📤 Sending edited image: ${imageUrl}`);
          await this.bot.sendPhoto(chatId, imageUrl, {
            caption: `🍌 Nano Banana Edit (kie.ai)\n\n📝 Изменения: ${prompt}\n⏱️ Время обработки: ${result.costTime}ms`
          });
        }

        // Update conversation history
        session.conversationHistory.push({
          role: 'assistant',
          content: `Изображение отредактировано: "${prompt}"`
        });
        console.log(`💾 Updated conversation history`);

      } else if (!result.success) {
        console.log(`❌ Edit failed - Code: ${result.failCode}, Message: ${result.failMsg}`);
        await this.bot.editMessageText(
          `❌ Ошибка редактирования:\nКод: ${result.failCode}\nСообщение: ${result.failMsg}`,
          { chat_id: chatId, message_id: processingMsg.message_id }
        );
      } else {
        console.log(`❌ No images were generated`);
        await this.bot.editMessageText(
          '❌ Изображение не было обработано',
          { chat_id: chatId, message_id: processingMsg.message_id }
        );
      }

    } catch (error) {
      console.error('💥 kie.ai Edit Error:', error);
      console.error('Error stack:', error.stack);
      await this.bot.sendMessage(
        chatId,
        `❌ Ошибка при редактировании через kie.ai:\n${error.message}`
      );
    }
  }

  async handleImageInput(chatId, session, msg) {
    console.log(`📥 Received image from user ${msg.from.id}`);
    
    if (!session || !session.id) {
      console.log('⚠️ Invalid session, skipping processing');
      return;
    }
    
    if (!this.openrouter.enabled || !this.openrouter.apiKey) {
      console.log('❌ OpenRouter is not enabled or API key is missing');
      const text = this.getLocalizedText('ai_error', session.language);
      await this.bot.sendMessage(chatId, text);
      return;
    }

    try {
      console.log(`📸 Processing ${msg.photo.length} photo sizes`);
      const photos = msg.photo;
      const largest = photos[photos.length - 1];
      console.log(`📏 Selected largest photo with file_id: ${largest.file_id}`);
      
      const fileId = largest.file_id;
      console.log(`📎 Getting file link`);
      const imageUrl = await this.bot.getFileLink(fileId);
      console.log(`🔗 Image URL: ${imageUrl}`);
      
      const prompt = msg.caption || 'Опишите изображение';
      console.log(`💬 Caption/Prompt: ${prompt}`);

      const res = await this.generateOpenRouterImageResponse(prompt, imageUrl);
      console.log(`📤 OpenRouter response received`);
      
      if (res.imageUrl) {
        console.log(`🖼️ Sending image from URL`);
        await this.bot.sendPhoto(chatId, res.imageUrl);
        if (res.text) {
          await this.bot.sendMessage(chatId, `🍌 Nano Banana: ${res.text}`);
        }
      } else if (res.imageData) {
        console.log(`🖼️ Sending base64 encoded image`);
        const buff = Buffer.from(res.imageData, 'base64');
        await this.bot.sendPhoto(chatId, buff);
        if (res.text) {
          await this.bot.sendMessage(chatId, `🍌 Nano Banana: ${res.text}`);
        }
      } else if (res.text) {
        console.log(`💬 Sending text response only`);
        await this.bot.sendMessage(chatId, `🍌 Nano Banana: ${res.text}`);
      } else {
        console.log(`⚠️ No data to send`);
        await this.bot.sendMessage(chatId, 'Нет данных для отправки');
      }
    } catch (e) {
      console.error('💥 OpenRouter Image Error:', e);
      console.error('Error stack:', e.stack);
      await this.bot.sendMessage(chatId, this.getLocalizedText('ai_error', session.language));
    }
  }

  async generateOpenRouterImageResponse(prompt, imageUrl) {
    console.log(`📡 Calling OpenRouter API`);
    console.log(`📝 Prompt: ${prompt}`);
    console.log(`🖼️ Image URL: ${imageUrl}`);
    
    const requestBody = {
      model: this.openrouter.modelName,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    };
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openrouter.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://t.me/your_bot_username',
        'X-Title': 'GeminiAI Bot'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`📥 OpenRouter API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenRouter API error (${response.status}): ${errorText}`);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const m = data.choices?.[0]?.message;
    
    if (typeof m?.content === 'string' && m.content.trim().length > 0) {
      return { text: m.content };
    }
    
    if (Array.isArray(m?.content)) {
      const textPart = m.content.find(p => p.type === 'text');
      const outputImage = m.content.find(p => p.type === 'output_image' || p.type === 'image_url' || p.type === 'image');
      
      if (outputImage?.image_url?.url) {
        return { text: textPart?.text, imageUrl: outputImage.image_url.url };
      }
      if (outputImage?.url) {
        return { text: textPart?.text, imageUrl: outputImage.url };
      }
      if (outputImage?.b64_json) {
        return { text: textPart?.text, imageData: outputImage.b64_json };
      }
      if (outputImage?.data) {
        return { text: textPart?.text, imageData: outputImage.data };
      }
      if (textPart?.text) {
        return { text: textPart.text };
      }
    }
    
    if (Array.isArray(m?.images) && m.images.length > 0) {
      const img = m.images[0];
      if (img.type === 'image_url' && img.image_url?.url) {
        const u = img.image_url.url;
        if (u.startsWith('data:image/')) {
          const b64 = u.split(',')[1];
          return { imageData: b64 };
        }
        return { imageUrl: u };
      }
    }
    
    const anyUrl = JSON.stringify(data).match(/https?:\/\/[^"\s]+\.(png|jpg|jpeg|webp)/i);
    if (anyUrl) {
      return { imageUrl: anyUrl[0] };
    }
    
    return { text: 'Нет ответа от модели' };
  }

  async generateSora2Response(session) {
    // Simulate Sora 2 response (video generation)
    const lastMessage = session.conversationHistory[session.conversationHistory.length - 1];
    return `🎬 Sora 2: Видео будет сгенерировано по запросу "${lastMessage.content}"\n\n⚠️ Видеогенерация временно недоступна`;
  }

  // Utility methods
  getMainMenuKeyboard() {
    return {
      keyboard: [
        [{ text: '👤 Профиль' }, { text: '🖋 Текст' }],
        [{ text: '🎨 Дизайн' }, { text: '⚙️ Выбрать нейросеть' }],
        [{ text: '💰 Премиум-услуги' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    };
  }

  generateProfileText(session) {
    const today = new Date().toDateString();
    const isNewDay = session.lastRequestDate !== today;
    const currentRequests = isNewDay ? 0 : session.dailyRequests;
    const maxRequests = this.config.maxDailyRequests[session.subscription];
    
    return `<b>👤 Профиль ${session.id}</b>

📅 Дата регистрации: ${session.registrationDate.toLocaleDateString('ru-RU')}
🔑 Ключ: ${session.subscription}
🧪 ${session.subscription} запросов сегодня: ${currentRequests}/${maxRequests}
💰 Баланс: ${session.balance.toFixed(1)} 🔋
🎟️ Подписка: ${session.subscription}
📅 Дата окончания: никогда
🆔 Уникальный ID: ${session.id}`;
  }

  getLocalizedText(key, language = 'ru') {
    const texts = {
      ru: {
        welcome: '👋 Добро пожаловать в GeminiAI!\n\nЯ могу помочь вам с:\n🤖 Чатом с ИИ\n🎨 Редактированием изображений\n📝 Работой с текстом\n\nВыберите режим в меню ниже:',
        menu: '🎯 Главное меню\n\nВыберите действие:',
        no_mode_selected: '❌ У вас не выбран режим. Пожалуйста, выберите режим в меню снизу.',
        select_mode: '🤖 Выберите нейросеть для работы:',
        mode_selected: '✅ Режим "{mode}" выбран!',
        mode_not_found: '❌ Режим не найден.',
        text_mode_ready: '✅ Режим "Текст" активирован!\n\nТекущая модель: {mode}\n\nОтправьте мне текстовое сообщение, и я помогу вам с ним.',
        design_mode_ready: '✅ Режим "Дизайн" активирован!\n\nТекущая модель: {mode}\n\nОпишите, что вы хотите создать.',
        new_dialogue: '💬 Диалог обновлён, продолжайте общаться!',
        daily_limit_reached: '⚠️ Вы достигли дневного лимита запросов ({limit}).\n\n💎 Купите премиум для увеличения лимита.',
        ai_error: '❌ Произошла ошибка при генерации ответа. Попробуйте ещё раз.',
        chatgpt_error: '❌ Ошибка подключения к ChatGPT. Попробуйте другой режим.',
        mode_not_supported: '❌ Этот режим временно недоступен.',
        kieai_disabled: '❌ kie.ai отключен. Проверьте настройки в .env файле.',
        kieai_needs_image: '📸 <b>Для редактирования нужно изображение</b>\n\n💡 <b>Как использовать Nano Banana Edit:</b>\n1. Отправьте изображение\n2. В подписи к изображению опишите, как вы хотите его изменить\n\n<b>Пример:</b>\n📷 [отправить фото]\n✏️ Подпись: "Сделай фон синим и добавь солнце"',
        help: '❓ <b>Помощь</b>\n\n<b>Доступные команды:</b>\n/menu - Главное меню\n/profile - Ваш профиль\n/info - Информация о боте\n/newdialogue - Новый диалог\n/help - Помощь\n\n<b>Режимы работы:</b>\n🤖 <b>ChatGPT</b> - Универсальный ИИ-ассистент\n🍌 <b>Nano Banana</b> - Анализ изображений (OpenRouter)\n✏️ <b>Nano Banana Edit (kie.ai)</b> - Редактирование изображений\n🎬 <b>Sora 2</b> - Генерация видео\n\n<b>Поддержка:</b> @your_support_username',
        info: 'ℹ️ <b>Информация о боте</b>\n\n<b>GeminiAI</b> - многофункциональный ИИ-бот\n\n<b>Возможности:</b>\n• Текстовая генерация\n• Редактирование изображений через ИИ (kie.ai)\n• Анализ изображений (OpenRouter)\n• Работа с кодом\n• Генерация идей\n• Помощь в обучении\n\n<b>Модели:</b>\n• ChatGPT (GPT-4)\n• Nano Banana (OpenRouter) - анализ\n• Nano Banana Edit (kie.ai) - редактирование\n• Sora 2 (видео)\n\n<b>Премиум:</b>\n• Увеличенные лимиты\n• Приоритетная поддержка\n• Дополнительные функции',
        premium_services: '💎 <b>Премиум-услуги</b>\n\n<b>Преимущества премиума:</b>\n• До 1000 запросов в день\n• Приоритетная обработка\n• Доступ ко всем моделям\n• Расширенные лимиты\n\n💰 Выберите подписку ниже:',
        subscription_options: '💎 <b>Подписки</b>\n\nВыберите подписку:\n\n📅 <b>На месяц</b> - 299 🔋\n• 1000 запросов/день\n• Все модели\n• Приоритетная поддержка\n\n📅 <b>На год</b> - 2999 🔋\n• Экономия 589 🔋\n• Все преимущества месячной подписки'
      },
      en: {
        welcome: '👋 Welcome to GeminiAI!\n\nI can help you with:\n🤖 AI Chat\n🎨 Image Editing\n📝 Text Processing\n\nSelect a mode from the menu below:',
        menu: '🎯 Main Menu\n\nChoose an action:',
        no_mode_selected: '❌ No mode selected. Please select a mode from the menu below.',
        select_mode: '🤖 Choose a neural network to work with:',
        mode_selected: '✅ Mode "{mode}" selected!',
        mode_not_found: '❌ Mode not found.',
        text_mode_ready: '✅ "Text" mode activated!\n\nCurrent model: {mode}\n\nSend me a text message and I will help you with it.',
        design_mode_ready: '✅ "Design" mode activated!\n\nCurrent model: {mode}\n\nDescribe what you want to create.',
        new_dialogue: '💬 Dialogue updated, continue communicating!',
        daily_limit_reached: '⚠️ You have reached the daily request limit ({limit}).\n\n💎 Buy premium to increase the limit.',
        ai_error: '❌ An error occurred while generating the response. Try again.',
        chatgpt_error: '❌ ChatGPT connection error. Try another mode.',
        mode_not_supported: '❌ This mode is temporarily unavailable.',
        kieai_disabled: '❌ kie.ai is disabled. Check settings in .env file.',
        kieai_needs_image: '📸 <b>Image required for editing</b>\n\n💡 <b>How to use Nano Banana Edit:</b>\n1. Send an image\n2. Add a caption describing the changes you want\n\n<b>Example:</b>\n📷 [send photo]\n✏️ Caption: "Make background blue and add sun"',
        help: '❓ <b>Help</b>\n\n<b>Available commands:</b>\n/menu - Main menu\n/profile - Your profile\n/info - Bot information\n/newdialogue - New dialogue\n/help - Help\n\n<b>Operating modes:</b>\n🤖 <b>ChatGPT</b> - Universal AI assistant\n🍌 <b>Nano Banana</b> - Image analysis (OpenRouter)\n✏️ <b>Nano Banana Edit (kie.ai)</b> - Image editing\n🎬 <b>Sora 2</b> - Video generation\n\n<b>Support:</b> @your_support_username',
        info: 'ℹ️ <b>Bot Information</b>\n\n<b>GeminiAI</b> - multifunctional AI bot\n\n<b>Capabilities:</b>\n• Text generation\n• AI-powered image editing (kie.ai)\n• Image analysis (OpenRouter)\n• Code work\n• Idea generation\n• Learning assistance\n\n<b>Models:</b>\n• ChatGPT (GPT-4)\n• Nano Banana (OpenRouter) - analysis\n• Nano Banana Edit (kie.ai) - editing\n• Sora 2 (video)\n\n<b>Premium:</b>\n• Increased limits\n• Priority support\n• Additional features',
        premium_services: '💎 <b>Premium Services</b>\n\n<b>Premium benefits:</b>\n• Up to 1000 requests per day\n• Priority processing\n• Access to all models\n• Extended limits\n\n💰 Choose a subscription below:',
        subscription_options: '💎 <b>Subscriptions</b>\n\nChoose a subscription:\n\n📅 <b>For a month</b> - 299 🔋\n• 1000 requests/day\n• All models\n• Priority support\n\n📅 <b>For a year</b> - 2999 🔋\n• Save 589 🔋\n• All benefits of monthly subscription'
      }
    };
    
    return texts[language][key] || texts['ru'][key] || key;
  }

  // Utility method to simulate typing
  async sendWithTyping(chatId, text, options = {}) {
    // Simulate typing
    await this.bot.sendChatAction(chatId, 'typing');
    
    // Small delay to simulate typing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    return await this.bot.sendMessage(chatId, text, options);
  }
}

// Initialize and start the bot
console.log('🚀 Starting Gemini Bot Copy...');
console.log('🔧 Environment variables:');
console.log('  BOT_TOKEN:', process.env.BOT_TOKEN ? 'SET' : 'NOT SET');
console.log('  OPENROUTER:', process.env.OPENROUTER);
console.log('  KIE_AI_ENABLED:', process.env.KIE_AI_ENABLED);
const bot = new GeminiBotCopy();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down bot...');
  bot.bot.stopPolling();
  process.exit(0);
});