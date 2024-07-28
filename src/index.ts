import 'dotenv/config';

import Koa from 'koa';
import serve from 'koa-static';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = new Koa();
const server = createServer(app.callback());
const io = new Server(server);

app.use(serve(join(__dirname, 'public')));

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.use(async (ctx) => {
	if (ctx.path === '/' && ctx.method === 'GET') {
		ctx.body = 'Echo AI Chatbot';
	}
});

io.on('connection', (socket) => {
	try {
		console.log('A user connected');

		socket.on('message', async (msg) => {
			try {
				const result = await model.generateContent(msg);
				socket.emit('message', result.response.text());
			} catch (_err) {
				socket.emit('error', 'Something went wrong');
			}
		});

		socket.on('disconnect', () => {
			console.log('A user disconnected');
		});
	} catch (err) {
		console.error(err);
	}
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
