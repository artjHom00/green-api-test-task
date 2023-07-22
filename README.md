# Green-API Entry Task, Artem Gasparyan

## Installation

1. Clone repository
2. Install dependencies
```sh
$ npm install
```
3. Create .env file and enter RabbitMQ connection string and HTTP Server port, if needed
#### Example of .env file:
```.env
RABBITMQ_CONNECTION_STRING=amqp://localhost
PORT=80
```
4. Install "concurrently"
```sh
$ npm install -g concurrently
```
5. Start the script
```sh
$ npm run start
```

#### Default task is sorting of an array consisting of 2000 elements.

## Usage
Enter http://localhost:3000/process (if using default port) to send a request to RabbitMQ. 
Logs can be viewed in files "app.log" & "error.log"
