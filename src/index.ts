import 'dotenv/config';

import Koa from 'koa';
import serve from 'koa-static';
import { WebSocketServer } from 'ws';
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
const wss = new WebSocketServer({ server });

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

wss.on('connection', (ws) => {
	try {
		console.log('A user connected');

		const history: { role: string; parts: { text: string }[] }[] = [];

		ws.on('message', async (message: string) => {
			try {
				const msg = message.toString();
				const chat = model.startChat({ history });
				const result = await chat.sendMessage(msg);
				const response = result.response.text();

				ws.send(JSON.stringify({ type: 'message', data: response }));

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
				ws.send(
					JSON.stringify({ type: 'error', data: 'Something went wrong' })
				);
			}
		});

		ws.on('close', () => {
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
