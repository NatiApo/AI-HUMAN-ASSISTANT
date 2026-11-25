import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';
import { complete } from '../providers/llm.js';
const r = Router();
r.use(requireAuth);

r.get('/conversations', async (req, res) => {
  const [rows] = await pool.execute('SELECT id,title,updated_at FROM conversations WHERE user_id=? ORDER BY updated_at DESC LIMIT 100', [req.user.id]);
  res.json(rows);
});
r.get('/conversations/:id/messages', async (req, res) => {
  const [c] = await pool.execute('SELECT id FROM conversations WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  if (!c.length) return res.status(404).json({ error: 'Not found' });
  const [rows] = await pool.execute('SELECT id,role,content,created_at FROM messages WHERE conversation_id=? ORDER BY id', [req.params.id]);
  res.json(rows);
});
r.delete('/conversations/:id', async (req, res) => {
  await pool.execute('DELETE FROM conversations WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  res.json({ ok: true });
});
r.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json([]);
  const [rows] = await pool.execute(
    `SELECT m.id, m.conversation_id, m.content FROM messages m JOIN conversations c ON c.id=m.conversation_id
     WHERE c.user_id=? AND m.content LIKE ? ORDER BY m.id DESC LIMIT 30`, [req.user.id, `%${q}%`]);
  res.json(rows);
});

r.get('/memories', async (req, res) => {
  const [rows] = await pool.execute('SELECT id,content,category FROM memories WHERE user_id=? ORDER BY id DESC', [req.user.id]);
  res.json(rows);
});
r.post('/memories', async (req, res) => {
  const content = String(req.body?.content || '').slice(0, 1000).trim();
  if (!content) return res.status(400).json({ error: 'Content required' });
  if (/password|api[_ ]?key|secret|token/i.test(content)) return res.status(400).json({ error: 'Do not store passwords or secrets in memory' });
  const [ins] = await pool.execute('INSERT INTO memories (user_id,content) VALUES (?,?)', [req.user.id, content]);
  res.json({ id: ins.insertId, content });
});
r.delete('/memories/:id', async (req, res) => {
  await pool.execute('DELETE FROM memories WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

r.post('/chat', async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim().slice(0, 8000);
    if (!message) return res.status(400).json({ error: 'Message required' });
    let convId = Number(req.body?.conversationId) || null;
    if (convId) {
      const [c] = await pool.execute('SELECT id FROM conversations WHERE id=? AND user_id=?', [convId, req.user.id]);
      if (!c.length) return res.status(404).json({ error: 'Conversation not found' });
    } else {
      const [ins] = await pool.execute('INSERT INTO conversations (user_id,title) VALUES (?,?)', [req.user.id, message.slice(0, 60)]);
      convId = ins.insertId;
    }
    await pool.execute('INSERT INTO messages (conversation_id,role,content) VALUES (?,?,?)', [convId, 'user', message]);
    const [hist] = await pool.execute('SELECT role,content FROM (SELECT id,role,content FROM messages WHERE conversation_id=? ORDER BY id DESC LIMIT 30) t ORDER BY id', [convId]);
    const [mem] = await pool.execute('SELECT content FROM memories WHERE user_id=? ORDER BY id DESC LIMIT 50', [req.user.id]);
    const [[u]] = await pool.execute('SELECT name FROM users WHERE id=?', [req.user.id]);
    const system = `You are AI HUMAN, a warm, professional, voice-first personal assistant talking with ${u.name}.
Reply in the language the user writes in (English, Amharic, Afaan Oromo or others). Keep spoken-style answers concise and natural.
Never claim to have run code, remembered something not listed below, or verified something you cannot verify.
Long-term memories approved by the user:
${mem.length ? mem.map(m => '- ' + m.content).join('\n') : '(none)'}`;
    const reply = await complete({ system, messages: hist });
    await pool.execute('INSERT INTO messages (conversation_id,role,content) VALUES (?,?,?)', [convId, 'assistant', reply]);
    await pool.execute('UPDATE conversations SET updated_at=NOW() WHERE id=?', [convId]);
    res.json({ conversationId: convId, reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Chat failed' });
  }
});
export default r;
