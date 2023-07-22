const express = require('express');
const app = express();
const amqp = require('amqplib');
const logger = require('./logger');
require('dotenv').config();

if(!process.env.RABBITMQ_CONNECTION_STRING) {
  throw new Error('No RabbitMQ connection string provided in .env file')
}

let connection;
// Объект для хранения результатов заданий
let taskResults = {};


amqp.connect(process.env.RABBITMQ_CONNECTION_STRING).then(async (res) => {
  connection = res
  logger.info('[M1] RabbitMQ Connected')
  
  let channel = await res.createChannel()

  channel.assertQueue('results').then(() => {
    channel.consume('results', (message) => {
      const data = JSON.parse(message.content.toString());
      const taskId = data.taskId;

      taskResults[taskId] = data; // Сохраняем результат задания по его уникальному идентификатору

      channel.ack(message); // Подтверждаем обработку сообщения
    });
  });
});

// Функция для ожидания результата задания
function waitForResult(taskId) {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (taskResults[taskId] !== undefined) {
        clearInterval(interval);
        const result = taskResults[taskId];
        delete taskResults[taskId]; // Удаляем результат, чтобы не занимать память
        resolve(result);
      }
    }, 100);
  });
} 

app.get('/process', async (req, res) => {
  try {
    
    let generateRandomArray = length => {
      const array = [];
      for (let i = 0; i < length; i++) {
        array.push(Math.floor(Math.random() * 100)); // Генерируем случайное число от 0 до 99
      }
      return array;
    }
    const taskId = Date.now()
    const array = generateRandomArray(2000); // Генерируем случайный массив из 20 элементов
    
    const data = {
      taskId,
      task: 'sort_array', // Задание для микросервиса М2
      payload: array, // Массив для сортировки
    };

    channel = await connection.createChannel();
    await channel.assertQueue('tasks');

    // Опубликовать сообщение в очереди RabbitMQ для микросервиса М2
    await channel.sendToQueue('tasks', Buffer.from(JSON.stringify(data)));
    logger.info('[M1] Request accepted. Processing...');

    // Ждем, пока M2 обработает задание и вернет результат
    const result = await waitForResult(taskId);

    logger.info('[M1] Request result succesfully received!')

    res.json(result); // Возвращаем результат задания клиенту

  } catch (error) {
    logger.error(error);
    res.status(500).send('Internal Server Error');
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => {

  logger.info(`[M1] Listening at http://localhost:${port}`);

});