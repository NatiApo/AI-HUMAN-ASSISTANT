
const providers = {
  async anthropic({ system, messages }) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is missing');
    }

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'claude-sonnet-4-6',
        max_tokens: 1500,
        system,
        messages
      })
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data?.error?.message || 'Anthropic API error');
    return data.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
  },

  async groq({ system, messages }) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is missing');
    }

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: system },
          ...messages
        ],
        max_completion_tokens: 1500,
        temperature: 0.7
      })
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data?.error?.message || `Groq API error (${r.status})`);

    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) throw new Error('Groq returned an empty response');
    return reply;
  }
};

export async function complete(args) {
  const provider = providers[process.env.LLM_PROVIDER || 'anthropic'];
  if (!provider) throw new Error('Unknown LLM_PROVIDER');
  return provider(args);
}
