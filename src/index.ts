import 'dotenv/config';

import Koa from 'koa';
import serve from 'koa-static';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { join } from 'path';
import {
	GoogleGenerativeAI,
	HarmBlockThreshold,
	HarmCategory,
} from '@google/generative-ai';
import cors from '@koa/cors';

const app = new Koa();
const server = createServer(app.callback());
const io = new Server(server);

app.use(cors());
app.use(serve(join(__dirname, 'public')));

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({
	model: 'gemini-1.5-flash',
	safetySettings: [
		{
			category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
			threshold: HarmBlockThreshold.BLOCK_NONE,
		},
		{
			category: HarmCategory.HARM_CATEGORY_HARASSMENT,
			threshold: HarmBlockThreshold.BLOCK_NONE,
		},
		{
			category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
			threshold: HarmBlockThreshold.BLOCK_NONE,
		},
		{
			category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
			threshold: HarmBlockThreshold.BLOCK_NONE,
		},
	],
});

app.use(async (ctx) => {
	if (ctx.path === '/' && ctx.method === 'GET') {
		ctx.body = 'Echo AI Chatbot';
	}
});

io.on('connection', (socket) => {
	try {
		console.log('A user connected');

		const history: { role: string; parts: { text: string }[] }[] = [];

		socket.on('message', async (msg: string) => {
			try {
				const chat = model.startChat({ history });
				const result = await chat.sendMessage(msg);
				const response = result.response.text();

				socket.emit('message', response);

				history.push(
					{
						role: 'user',
						parts: [{ text: msg }],
					},
					{
						role: 'model',
						parts: [{ text: response }],
					}
				);
			} catch (err) {
				console.error(err);
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
