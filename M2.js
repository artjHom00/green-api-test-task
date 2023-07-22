
const amqp = require('amqplib');
const logger = require('./logger');

async function processTask(data) {
    try {
      if (data.task === 'sort_array') {
        const arrayToSort = data.payload;
        arrayToSort.sort((a, b) => a - b); // Сортируем массив по возрастанию
        return { result: arrayToSort }; // Возвращаем отсортированный массив в качестве результата задания
      } else {
        // Обработка других типов заданий, если необходимо
        return { error: 'Unknown task type' };
      }
    } catch (error) {
      console.error(error);
      return { error: 'Error processing the task' };
    }
}

(async () => {
    try {
        
        const connection = await amqp.connect('amqp://localhost');
        logger.info('[M2] Connected to RabbitMQ');
        
        channel = await connection.createChannel();
        await channel.assertQueue('tasks');
    
        channel.consume('tasks', async (message) => {
        logger.info('[M2] New task received')
        
        const data = JSON.parse(message.content.toString());
        const result = await processTask(data);
        
        logger.info('[M2] Task processed')
        
        // Отправляем результат обработки задания в другую очередь (можно использовать различные очереди для разных типов результатов)
        await channel.assertQueue('results');
        
        // Добавляем идентификатор задания в ответ, чтобы M1 мог идентифицировать результат
        const resultWithTaskId = {
            ...result,
            taskId: data.taskId,
        };

        await channel.sendToQueue('results', Buffer.from(JSON.stringify(resultWithTaskId)));
        // Подтверждаем обработку задания
        channel.ack(message);
        });
    } catch (error) {
        logger.error(error);
    }
})()