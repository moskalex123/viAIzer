import axios from 'axios';

async function diagnoseGoogleAI() {
  const API_KEY = process.env.GOOGLE_AI_API_KEY || 'AIzaSyDiNrawHWRAnKrFdNJNrsC420oHEjEj91M';
  
  console.log('🔍 Диагностика подключения к Google AI API...');
  console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'Не указан');

  // Тестовый запрос
  const testData = {
    contents: [{
      parts: [{
        text: "Ответь одним словом: 'Тест'"
      }]
    }]
  };

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`,
      testData,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    console.log('✅ Успешное подключение!');
    console.log('Ответ:', response.data.candidates[0].content.parts[0].text);

  } catch (error) {
    console.log('❌ Ошибка подключения:');
    
    if (error.response) {
      console.log('Статус:', error.response.status);
      console.log('Код ошибки:', error.response.data.error?.code);
      console.log('Сообщение:', error.response.data.error?.message);
      
      // Анализ конкретных ошибок
      switch (error.response.status) {
        case 403:
          if (error.response.data.error?.message?.includes('suspended')) {
            console.log('\n🚨 ПРОБЛЕМА: Аккаунт приостановлен!');
            console.log('Действия:');
            console.log('1. Проверьте Google Cloud Console');
            console.log('2. Убедитесь в отсутствии блокировок');
            console.log('3. Проверьте настройки биллинга');
            console.log('4. Свяжитесь с поддержкой Google');
          } else {
            console.log('Проблема с авторизацией - проверьте API ключ');
          }
          break;
        case 401:
          console.log('Неверный API ключ');
          break;
        case 429:
          console.log('Превышены лимиты запросов');
          break;
        default:
          console.log('Неизвестная ошибка API');
      }
    } else if (error.code === 'ENOTFOUND') {
      console.log('Проблемы с интернет-соединением');
    } else {
      console.log('Другая ошибка:', error.message);
    }
  }
}

// Альтернативный тест - проверка доступности API
async function testAPIEndpoint() {
  const API_KEY = process.env.GOOGLE_AI_API_KEY || 'YOUR_API_KEY';
  
  try {
    console.log('\n🌐 Проверка доступности API...');
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`,
      { timeout: 5000 }
    );
    console.log('✅ API endpoint доступен');
    console.log('Доступные модели:', response.data.models?.length || 0);
  } catch (error) {
    console.log('❌ API endpoint недоступен:', error.response?.status || error.message);
  }
}

// Запуск диагностики
async function main() {
  await diagnoseGoogleAI();
  await testAPIEndpoint();
}

main();