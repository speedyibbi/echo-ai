import 'dotenv/config';

import Koa from 'koa';
import serve from 'koa-static';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { join } from 'path';

const app = new Koa();
const server = createServer(app.callback());
const io = new Server(server);

app.use(serve(join(__dirname, 'public')));

app.use(async (ctx) => {
	if (ctx.path === '/' && ctx.method === 'GET') {
		ctx.body = 'Echo AI Chatbot';
	}
});

io.on('connection', (socket) => {
	console.log('A user connected');

	socket.on('message', (msg) => {
		console.log('Message received: ' + msg);
		socket.emit('message', "Hello, I'm Echo.");
	});

	socket.on('disconnect', () => {
		console.log('A user disconnected');
	});
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
