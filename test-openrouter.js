#!/usr/bin/env node

// Test script for OpenRouter integration
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function testOpenRouter() {
  console.log('🧪 Testing OpenRouter API integration...');
  
  if (process.env.OPENROUTER !== 'true') {
    console.log('⚠️ OpenRouter is disabled in configuration');
    return;
  }
  
  if (!process.env.OPENROUTER_API_KEY) {
    console.log('❌ OPENROUTER_API_KEY is not set');
    return;
  }
  
  const modelName = process.env.NANO_OPENROUTER_MODEL_NAME || 'google/gemini-2.5-flash-image';
  
  try {
    console.log(`📡 Calling OpenRouter API with model: ${modelName}`);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://t.me/test_bot',
        'X-Title': 'GeminiAI Bot Test'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'user', content: 'Привет! Как дела?' }
        ],
        max_tokens: 100,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('✅ OpenRouter API test successful!');
    console.log('🤖 AI Response:', aiResponse);
    console.log('📊 Usage:', data.usage || 'No usage data');
    
  } catch (error) {
    console.error('❌ OpenRouter API test failed:', error.message);
  }
}

testOpenRouter().catch(console.error);