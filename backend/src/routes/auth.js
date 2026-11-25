import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool, audit } from '../db.js';
import { sign } from '../auth.js';
const r = Router();
const valid = (e, p) => typeof e === 'string' && /^\S+@\S+\.\S+$/.test(e) && typeof p === 'string' && p.length >= 8;

r.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!valid(email, password) || !name) return res.status(400).json({ error: 'Valid email, name and password (8+ chars) required' });
    const [ex] = await pool.execute('SELECT id FROM users WHERE email=?', [email]);
    if (ex.length) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 12);
    const [ins] = await pool.execute('INSERT INTO users (email,password_hash,name) VALUES (?,?,?)', [email, hash, name]);
    await pool.execute('INSERT INTO user_preferences (user_id) VALUES (?)', [ins.insertId]);
    await audit(ins.insertId, 'register', null, req.ip);
    res.json({ token: sign({ id: ins.insertId, role: 'user' }), name });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Registration failed' }); }
});

r.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const [rows] = await pool.execute('SELECT * FROM users WHERE email=?', [email || '']);
    const u = rows[0];
    if (!u || !(await bcrypt.compare(password || '', u.password_hash))) {
      await audit(u?.id, 'login_failed', email, req.ip);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    await audit(u.id, 'login', null, req.ip);
    res.json({ token: sign(u), name: u.name });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Login failed' }); }
});
export default r;
