import fetch from 'node-fetch';
import OpenAI from 'openai';
import chalk from 'chalk';

export async function callLLM(prompt) {
  const mode = process.env.LLM_MODE || 'ollama';

  if (mode === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
    const client = new OpenAI({ apiKey });

    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0
    });

    return res.choices[0].message.content.trim();
  }

  if (mode === 'ollama') {
    try {
      const model = process.env.OLLAMA_MODEL || 'codellama:7b';
      const res = await fetch(`http://localhost:11434/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: false })
      });

      if (!res.ok) throw new Error('Ollama API error — is it running?');
      const data = await res.json();
      return data.response.trim();
    } catch (err) {
      console.error(chalk.red('❌ Ollama call failed:'), err.message);
      process.exit(1);
    }
  }

  throw new Error(`Unknown LLM_MODE: ${mode}`);
}
