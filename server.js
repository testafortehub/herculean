// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
app.use(express.json());
app.use(cors());

// Maintenance mode toggle (set MAINTENANCE=true to activate)
if (process.env.MAINTENANCE === 'true') {
  app.get('*', (req, res) => {
    res.send(`<!DOCTYPE html><html><body style="background:#0a0a0f;color:#fff;text-align:center;padding:40px;font-family:Arial">
      <h1 style="color:#c9a227">HERCULEAN</h1>
      <p>Coming August 2028</p>
      <p>Get on the waitlist: <a href="https://www.paypal.me/robvallarelli" style="color:#c9a227">notify me</a></p>
    </body></html>`);
  });
  app.listen(3001, () => console.log('MAINTENANCE MODE — port 3001'));
  process.exit(0);
}

const SYSTEM_PROMPT = 'You are a helpful, knowledgeable, and practical assistant. Answer all questions directly, thoroughly, and with useful actionable information. Do not refuse reasonable requests or add unnecessary caveats. Be concise but complete.';

// 10 LLM API Keys from .env
const APIs = {
  claude:    { key: process.env.OPENROUTER_API_KEY,  model: 'anthropic/claude-3-haiku' },
  gpt:       { key: process.env.GPT_API_KEY,        model: 'gpt-4o-mini' },
  gemini:    { key: process.env.OPENROUTER_API_KEY, model: 'google/gemini-2.0-flash-lite-001' },
  groq:      { key: process.env.GROQ_API_KEY,       model: 'llama-3.1-8b-instant' },
  deepseek:  { key: process.env.OPENROUTER_API_KEY, model: 'microsoft/phi-4' },
  openrouter:{ key: process.env.OPENROUTER_API_KEY, model: 'meta-llama/llama-3.1-8b-instruct' },
  togetherai:{ key: process.env.OPENROUTER_API_KEY, model: 'mistralai/mixtral-8x22b-instruct' },
  cerebras:  { key: process.env.CEREBRAS_API_KEY,   model: 'llama3.1-8b' },
  qwen:      { key: process.env.OPENROUTER_API_KEY, model: 'qwen/qwen-2.5-72b-instruct' },
  nemotron:  { key: process.env.OPENROUTER_API_KEY, model: 'nvidia/llama-3.1-nemotron-70b-instruct' },
};

// Health check endpoint for Railway
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Prompt improvement function
function improvePrompt(query) {
  const improvements = [
    'Be specific and clear about what you need.',
    'Include relevant context or constraints.',
    'Ask for the format or structure you want.',
  ];
  if (!query) return query;
  const improved = `${query}\n\nPlease provide a detailed, well-structured response.`;
  return improved;
}

// Query handler
app.post('/query', async (req, res) => {
  try {
    const { query, mode = 'search', improvePrompt: shouldImprove = false } = req.body;
    if (!query) return res.status(400).json({ error: 'No query provided' });

  let finalQuery = query;
  if (shouldImprove) {
    finalQuery = improvePrompt(query);
  }

  const modeHandlers = {
    search: (q) => q,
    code: (q) => `Review this code for security, performance, readability, and architecture issues:\n\n${q}`,
    research: (q) => `Provide scholarly analysis with citations and methodology gaps: ${q}`,
    competitive: (q) => `Conduct SWOT competitive intelligence analysis: ${q}`
  };

  const processedQuery = modeHandlers[mode] ? modeHandlers[mode](finalQuery) : finalQuery;

  const results = {};
  const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), ms));

  const calls = [
    { key: 'claude',     fn: callClaude,     ms: 35000 },
    { key: 'gpt',        fn: callGPT,        ms: 35000 },
    { key: 'gemini',     fn: callGemini,     ms: 90000 },
    { key: 'groq',       fn: callGroq,       ms: 35000 },
    { key: 'deepseek',   fn: callDeepSeek,   ms: 90000 },
    { key: 'openrouter', fn: callOpenRouter, ms: 55000 },
    { key: 'togetherai', fn: callTogetherAI, ms: 35000 },
    { key: 'cerebras',   fn: callCerebras,   ms: 35000 },
    { key: 'qwen',       fn: callQwen,       ms: 55000 },
    { key: 'nemotron',   fn: callNemotron,   ms: 35000 },
  ];

  await Promise.all(calls.map(async ({ key, fn, ms }) => {
    const startTime = Date.now();
    try {
      const result = await Promise.race([fn(processedQuery), timeout(ms)]);
      results[key] = { ...result, responseTime: Date.now() - startTime };
    } catch (e) {
      const detail = e.response?.data
        ? JSON.stringify(e.response.data).substring(0, 300)
        : e.message;
      results[key] = { error: detail, responseTime: Date.now() - startTime };
    }
  }));

  const successfulResponses = Object.keys(results)
    .filter(k => results[k] && !results[k].error)
    .map(k => `### ${results[k].name}\n${results[k].content}`)
    .join('\n\n');

  // For code mode: find strongest response (first successful one with best quality)
  let strongestModel = null;
  let strongestReason = '';
  if (mode === 'code') {
    const successful = Object.keys(results).filter(k => results[k] && !results[k].error);
    if (successful.length > 0) {
      strongestModel = successful[0];
      const resp = results[strongestModel];
      const hasErrors = (resp.content.match(/error|critical|vulnerability|bug/gi) || []).length;
      const hasRecommendations = (resp.content.match(/recommend|should|consider|improve/gi) || []).length;
      strongestReason = hasErrors > 0 ? `identified ${hasErrors} critical security issues` :
                        hasRecommendations > 0 ? `provided detailed improvement recommendations` :
                        `offered comprehensive code analysis`;
    }
  }

  if (successfulResponses) {
    try {
      const synthesisPrompts = {
        synthesis: {
          system: 'You synthesize responses from multiple AI models into one definitive answer. Be direct, comprehensive, and well-structured. Do not mention the individual models by name. Just provide the best possible answer.',
          user: `Original question: ${query}\n\nResponses from 10 AI models:\n\n${successfulResponses}\n\nProvide a Herculean Synthesis — the single best answer distilled from all of the above.`
        },
        debate: {
          system: 'Synthesize these diverse perspectives into a balanced summary. Identify areas of agreement, disagreement, and the strongest arguments from each angle. Be objective and fair to all viewpoints.',
          user: `Original topic: ${query}\n\nPerspectives from 10 AI models:\n\n${successfulResponses}\n\nSynthesized Debate Summary:\n1. Areas of agreement\n2. Key disagreements\n3. Strongest arguments per perspective`
        },
        consistency: {
          system: 'Analyze these responses to identify consistency and inconsistency patterns. Flag any contradictions or hallucinations. Determine which models agree and which diverge.',
          user: `Claim to verify: "${query}"\n\nResponses from 10 AI models:\n\n${successfulResponses}\n\nConsistency Analysis:\n- Agreement rate\n- Key contradictions\n- Confidence assessment`
        },
        code: {
          system: 'Synthesize code review feedback from multiple models into a comprehensive security and quality report. Prioritize by severity (critical → minor).',
          user: `Code review findings from 10 AI models:\n\n${successfulResponses}\n\nComprehensive Code Review Summary:\n1. Critical Issues\n2. Performance Issues\n3. Readability/Architecture\n4. Best Practices`
        },
        optimizer: {
          system: 'Synthesize prompt improvement suggestions into one definitive optimization guide. Highlight the most impactful improvements.',
          user: `Original prompt: "${query}"\n\nOptimization suggestions from 10 AI models:\n\n${successfulResponses}\n\nTop 5 Improvements for Prompt Optimization`
        }
      };

      const synthPrompt = synthesisPrompts[mode] || synthesisPrompts.synthesis;
      const synthResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'anthropic/claude-3-haiku',
        messages: [
          { role: 'system', content: synthPrompt.system },
          { role: 'user', content: synthPrompt.user }
        ],
        max_tokens: 1500,
      }, {
        headers: { 'Authorization': `Bearer ${APIs.claude.key}` },
      });
      let synthContent = synthResponse.data.choices?.[0]?.message?.content || '';

      // For code mode: prepend strongest model line
      if (mode === 'code' && strongestModel) {
        const modelName = results[strongestModel].name;
        synthContent = `The leading response for this prompt came from ${modelName} because it ${strongestReason}\n\n${synthContent}`;
      }

      results.synthesis = { content: synthContent };
    } catch (e) {
      results.synthesis = { error: 'Synthesis unavailable' };
    }
  }

  res.json(results);
  } catch (err) {
    console.error('Query endpoint error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Improve prompt endpoint
app.post('/improve', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

    const improvementPrompt = `You are an expert in prompt engineering. Your task is to improve the following prompt to make it more effective, specific, and actionable. The improved prompt should:

1. Be more specific and clear about the desired output
2. Include relevant context, constraints, and edge cases
3. Ask for the format or structure of the response
4. Use clear language and logical structure
5. Anticipate follow-up questions and address them proactively

Original prompt: "${prompt}"

Provide ONLY the improved prompt, nothing else. Do not include explanations or metadata. Return the improved prompt as-is, ready to use.`;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: APIs.claude.model,
      messages: [{ role: 'user', content: improvementPrompt }],
      max_tokens: 1000,
    }, {
      headers: { 'Authorization': `Bearer ${APIs.claude.key}` },
    });

    const improved = response.data.choices?.[0]?.message?.content || '';
    if (!improved) return res.status(500).json({ error: 'Failed to improve prompt' });

    res.json({ improved });
  } catch (err) {
    console.error('Improve endpoint error:', err);
    res.status(500).json({ error: 'Failed to improve prompt' });
  }
});

async function callClaude(query) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: APIs.claude.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 1500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.claude.key}` },
  });
  const usage = response.data.usage || {};
  return {
    name: 'Claude', icon: '🧠', confidence: 92,
    content: response.data.choices?.[0]?.message?.content || '',
    tokens: { prompt: usage.prompt_tokens || 0, completion: usage.completion_tokens || 0 },
    cost: (usage.prompt_tokens || 0) * 0.07 / 1000000 + (usage.completion_tokens || 0) * 0.30 / 1000000
  };
}

async function callGPT(query) {
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: APIs.gpt.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 2000,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.gpt.key}` },
  });
  const usage = response.data.usage || {};
  return {
    name: 'GPT', icon: '⚡', confidence: 88,
    content: response.data.choices?.[0]?.message?.content || '',
    tokens: { prompt: usage.prompt_tokens || 0, completion: usage.completion_tokens || 0 },
    cost: (usage.prompt_tokens || 0) * 0.15 / 1000000 + (usage.completion_tokens || 0) * 0.60 / 1000000
  };
}

async function callGemini(query) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: APIs.gemini.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 2200,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.gemini.key}` },
  });
  const usage = response.data.usage || {};
  return {
    name: 'Gemini', icon: '🎨', confidence: 85,
    content: response.data.choices?.[0]?.message?.content || '',
    tokens: { prompt: usage.prompt_tokens || 0, completion: usage.completion_tokens || 0 },
    cost: (usage.prompt_tokens || 0) * 0.05 / 1000000 + (usage.completion_tokens || 0) * 0.15 / 1000000
  };
}

async function callGroq(query) {
  const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
    model: APIs.groq.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 1500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.groq.key}` },
  });
  const usage = response.data.usage || {};
  return {
    name: 'Groq', icon: '⚡', confidence: 90,
    content: response.data.choices?.[0]?.message?.content || '',
    tokens: { prompt: usage.prompt_tokens || 0, completion: usage.completion_tokens || 0 },
    cost: 0
  };
}

async function callDeepSeek(query) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: APIs.deepseek.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 1500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.deepseek.key}` },
  });
  const usage = response.data.usage || {};
  return {
    name: 'Phi-4', icon: '🔷', confidence: 87,
    content: response.data.choices?.[0]?.message?.content || '',
    tokens: { prompt: usage.prompt_tokens || 0, completion: usage.completion_tokens || 0 },
    cost: (usage.prompt_tokens || 0) * 0.06 / 1000000 + (usage.completion_tokens || 0) * 0.18 / 1000000
  };
}

async function callOpenRouter(query) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: APIs.openrouter.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 3000,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.openrouter.key}` },
  });
  const usage = response.data.usage || {};
  return {
    name: 'Llama 3', icon: '🦙', confidence: 84,
    content: response.data.choices?.[0]?.message?.content || '',
    tokens: { prompt: usage.prompt_tokens || 0, completion: usage.completion_tokens || 0 },
    cost: (usage.prompt_tokens || 0) * 0.04 / 1000000 + (usage.completion_tokens || 0) * 0.12 / 1000000
  };
}

async function callTogetherAI(query) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: APIs.togetherai.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 9000,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.togetherai.key}` },
  });
  const usage = response.data.usage || {};
  return {
    name: 'Mistral', icon: '🌟', confidence: 86,
    content: response.data.choices?.[0]?.message?.content || '',
    tokens: { prompt: usage.prompt_tokens || 0, completion: usage.completion_tokens || 0 },
    cost: (usage.prompt_tokens || 0) * 0.04 / 1000000 + (usage.completion_tokens || 0) * 0.12 / 1000000
  };
}

async function callCerebras(query) {
  const response = await axios.post('https://api.cerebras.ai/v1/chat/completions', {
    model: APIs.cerebras.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 1500,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.cerebras.key}` },
  });
  const usage = response.data.usage || {};
  return {
    name: 'Cerebras', icon: '⚙️', confidence: 83,
    content: response.data.choices?.[0]?.message?.content || '',
    tokens: { prompt: usage.prompt_tokens || 0, completion: usage.completion_tokens || 0 },
    cost: 0
  };
}

async function callQwen(query) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: APIs.qwen.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 1600,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.qwen.key}` },
  });
  const usage = response.data.usage || {};
  return {
    name: 'Qwen 2.5', icon: '🐉', confidence: 86,
    content: response.data.choices?.[0]?.message?.content || '',
    tokens: { prompt: usage.prompt_tokens || 0, completion: usage.completion_tokens || 0 },
    cost: (usage.prompt_tokens || 0) * 0.05 / 1000000 + (usage.completion_tokens || 0) * 0.15 / 1000000
  };
}

async function callNemotron(query) {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: APIs.nemotron.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: query }],
    max_tokens: 1800,
  }, {
    headers: { 'Authorization': `Bearer ${APIs.nemotron.key}` },
  });
  const usage = response.data.usage || {};
  return {
    name: 'Nemotron', icon: '🔬', confidence: 88,
    content: response.data.choices?.[0]?.message?.content || '',
    tokens: { prompt: usage.prompt_tokens || 0, completion: usage.completion_tokens || 0 },
    cost: (usage.prompt_tokens || 0) * 0.05 / 1000000 + (usage.completion_tokens || 0) * 0.15 / 1000000
  };
}

// Serve static files after all API routes
app.use(express.static(__dirname));

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Validate API keys on startup
const missingKeys = [];
Object.entries(APIs).forEach(([service, config]) => {
  if (!config.key) missingKeys.push(service);
});
if (missingKeys.length > 0) {
  console.warn(`Warning: Missing API keys for: ${missingKeys.join(', ')}`);
}

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  const url = `http://localhost:${PORT}`;
  const platform = process.platform;
  let openCmd = platform === 'win32' ? `start ${url}` : platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`;
  exec(openCmd, (err) => { if (err) console.log('Browser auto-open skipped'); });
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
