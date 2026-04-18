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
  deepseek:  { key: process.env.OPENROUTER_API_KEY, model: 'deepseek/deepseek-chat' },
  openrouter:{ key: process.env.OPENROUTER_API_KEY, model: 'meta-llama/llama-3.1-8b-instruct' },
  togetherai:{ key: process.env.OPENROUTER_API_KEY, model: 'mistralai/mixtral-8x22b-instruct' },
  cerebras:  { key: process.env.CEREBRAS_API_KEY,   model: 'llama3.1-8b' },
  qwen:      { key: process.env.OPENROUTER_API_KEY, model: 'qwen/qwen-2.5-72b-instruct' },
  nemotron:  { key: process.env.OPENROUTER_API_KEY, model: 'nvidia/llama-3.1-nemotron-70b-instruct' },
};

// Query handler
app.post('/query', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'No query provided' });

  const results = {};
  const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), ms));

  const calls = [
    { key: 'claude',     fn: callClaude },
    { key: 'gpt',        fn: callGPT },
    { key: 'gemini',     fn: callGemini },
    { key: 'groq',       fn: callGroq },
    { key: 'deepseek',   fn: callDeepSeek },
    { key: 'openrouter', fn: callOpenRouter },
    { key: 'togetherai', fn: callTogetherAI },
    { key: 'cerebras',   fn: callCerebras },
    { key: 'qwen',       fn: callQwen },
    { key: 'nemotron',   fn: callNemotron },
  ];

  await Promise.all(calls.map(async ({ key, fn }) => {
    try {
      results[key] = await Promise.race([fn(query), timeout(35000)]);
    } catch (e) {
      const detail = e.response?.data
        ? JSON.stringify(e.response.data).substring(0, 300)
        : e.message;
      results[key] = { error: detail };
    }
  }));

  const successfulResponses = Object.keys(results)
    .filter(k => results[k] && !results[k].error)
    .map(k => `### ${results[k].name}\n${results[k].content}`)
    .join('\n\n');

  if (successfulResponses) {
    try {
      const synthResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'anthropic/claude-3-haiku',
        messages: [
          { role: 'system', content: 'You synthesize responses from multiple AI models into one definitive answer. Be direct, comprehensive, and well-structured. Do not mention the individual models by name. Just provide the best possible answer.' },
          { role: 'user', content: `Original question: ${query}\n\nResponses from 10 AI models:\n\n${successfulResponses}\n\nProvide a Herculean Synthesis — the single best answer distilled from all of the above.` }
        ],
        max_tokens: 800,
      }, {
        headers: { 'Authorization': `Bearer ${APIs.claude.key}` },
      });
      results.synthesis = { content: synthResponse.data.choices?.[0]?.message?.content || '' };
    } catch (e) {
      results.synthesis = { error: 'Synthesis unavailable' };
    }
  }

  res.json(results);
});

async function callClaude(query) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: APIs.claude.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 1500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.claude.key}` },
  });
  return { name: 'Claude', icon: '🧠', confidence: 92, content: response.data.choices?.[0]?.message?.content || '' };
}

async function callGPT(query) {
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: APIs.gpt.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 1500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.gpt.key}` },
  });
  return { name: 'GPT', icon: '⚡', confidence: 88, content: response.data.choices?.[0]?.message?.content || '' };
}

async function callGemini(query) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: APIs.gemini.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 1500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.gemini.key}` },
  });
  return { name: 'Gemini', icon: '🎨', confidence: 85, content: response.data.choices?.[0]?.message?.content || '' };
}

async function callGroq(query) {
  const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
    model: APIs.groq.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 1500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.groq.key}` },
  });
  return { name: 'Groq', icon: '⚡', confidence: 90, content: response.data.choices?.[0]?.message?.content || '' };
}

async function callDeepSeek(query) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: APIs.deepseek.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 1500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.deepseek.key}` },
  });
  return { name: 'DeepSeek', icon: '🔮', confidence: 87, content: response.data.choices?.[0]?.message?.content || '' };
}

async function callOpenRouter(query) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: APIs.openrouter.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 1500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.openrouter.key}` },
  });
  return { name: 'Llama 3', icon: '🦙', confidence: 84, content: response.data.choices?.[0]?.message?.content || '' };
}

async function callTogetherAI(query) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: APIs.togetherai.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 1500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.togetherai.key}` },
  });
  return { name: 'Mistral', icon: '🌟', confidence: 86, content: response.data.choices?.[0]?.message?.content || '' };
}

async function callCerebras(query) {
  const response = await axios.post('https://api.cerebras.ai/v1/chat/completions', {
    model: APIs.cerebras.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 1500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.cerebras.key}` },
  });
  return { name: 'Cerebras', icon: '⚙️', confidence: 83, content: response.data.choices?.[0]?.message?.content || '' };
}

async function callQwen(query) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: APIs.qwen.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 1500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.qwen.key}` },
  });
  return { name: 'Qwen 2.5', icon: '🐉', confidence: 86, content: response.data.choices?.[0]?.message?.content || '' };
}

async function callNemotron(query) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: APIs.nemotron.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 1500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.nemotron.key}` },
  });
  return { name: 'Nemotron', icon: '🔬', confidence: 88, content: response.data.choices?.[0]?.message?.content || '' };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
