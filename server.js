// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

const SYSTEM_PROMPT = 'You are a helpful, knowledgeable, and practical assistant. Answer all questions directly, thoroughly, and with useful actionable information. Do not refuse reasonable requests or add unnecessary caveats. Be concise but complete.';

// 10 LLM API Keys from .env
const APIs = {
  claude:    { key: process.env.OPENROUTER_API_KEY,  model: 'anthropic/claude-3-haiku' },
  gpt:       { key: process.env.GPT_API_KEY,        model: 'gpt-4o-mini' },
  gemini:    { key: process.env.OPENROUTER_API_KEY, model: 'google/gemini-2.0-flash-001' },
  groq:      { key: process.env.GROQ_API_KEY,       model: 'llama-3.1-8b-instant' },
  deepseek:  { key: process.env.DEEPSEEK_API_KEY,   model: 'deepseek-chat' },
  openrouter:{ key: process.env.OPENROUTER_API_KEY, model: 'meta-llama/llama-3-70b-instruct' },
  togetherai:{ key: process.env.OPENROUTER_API_KEY, model: 'mistralai/mixtral-8x7b-instruct' },
  cerebras:  { key: process.env.CEREBRAS_API_KEY,   model: 'llama3.1-8b' },
  qwen:      { key: process.env.OPENROUTER_API_KEY, model: 'qwen/qwen-2.5-72b-instruct' },
  nemotron:  { key: process.env.OPENROUTER_API_KEY, model: 'nvidia/llama-3.1-nemotron-70b-instruct' },
};

// Query handler
app.post('/query', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'No query provided' });

  const results = {};

  const promises = [
    callClaude(query),
    callGPT(query),
    callGemini(query),
    callGroq(query),
    callDeepSeek(query),
    callOpenRouter(query),
    callTogetherAI(query),
    callCerebras(query),
    callQwen(query),
    callNemotron(query),
  ];

  const responses = await Promise.allSettled(promises);

  responses.forEach((res, idx) => {
    const llmNames = ['claude', 'gpt', 'gemini', 'groq', 'deepseek', 'openrouter', 'togetherai', 'cerebras', 'qwen', 'nemotron'];
    const detail = res.reason?.response?.data
      ? JSON.stringify(res.reason.response.data).substring(0, 300)
      : res.reason?.message;
    results[llmNames[idx]] = res.status === 'fulfilled' ? res.value : { error: detail };
  });

  res.json(results);
});

async function callClaude(query) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: APIs.claude.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.claude.key}` },
  });
  return { name: 'Claude', icon: '🧠', confidence: 92, content: response.data.choices[0].message.content };
}

async function callGPT(query) {
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: APIs.gpt.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.gpt.key}` },
  });
  return { name: 'GPT', icon: '⚡', confidence: 88, content: response.data.choices[0].message.content };
}

async function callGemini(query) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: APIs.gemini.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.gemini.key}` },
  });
  return { name: 'Gemini', icon: '🎨', confidence: 85, content: response.data.choices[0].message.content };
}

async function callGroq(query) {
  const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
    model: APIs.groq.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.groq.key}` },
  });
  return { name: 'Groq', icon: '⚡', confidence: 90, content: response.data.choices[0].message.content };
}

async function callDeepSeek(query) {
  const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
    model: APIs.deepseek.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.deepseek.key}` },
  });
  return { name: 'DeepSeek', icon: '🔮', confidence: 87, content: response.data.choices[0].message.content };
}

async function callOpenRouter(query) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: APIs.openrouter.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.openrouter.key}` },
  });
  return { name: 'Llama 3', icon: '🦙', confidence: 84, content: response.data.choices[0].message.content };
}

async function callTogetherAI(query) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: APIs.togetherai.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.togetherai.key}` },
  });
  return { name: 'Mistral', icon: '🌟', confidence: 86, content: response.data.choices[0].message.content };
}

async function callCerebras(query) {
  const response = await axios.post('https://api.cerebras.ai/v1/chat/completions', {
    model: APIs.cerebras.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.cerebras.key}` },
  });
  return { name: 'Cerebras', icon: '⚙️', confidence: 83, content: response.data.choices[0].message.content };
}

async function callQwen(query) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: APIs.qwen.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.qwen.key}` },
  });
  return { name: 'Qwen 2.5', icon: '🐉', confidence: 86, content: response.data.choices[0].message.content };
}

async function callNemotron(query) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: APIs.nemotron.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.nemotron.key}` },
  });
  return { name: 'Nemotron', icon: '🔬', confidence: 88, content: response.data.choices[0].message.content };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
