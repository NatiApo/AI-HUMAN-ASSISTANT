import mysql from 'mysql2/promise';
import 'dotenv/config';
export const pool = mysql.createPool({
  host: process.env.DB_HOST, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  waitForConnections: true, connectionLimit: 10, charset: 'utf8mb4'
});
export async function audit(userId, action, detail, ip) {
  try { await pool.execute('INSERT INTO audit_logs (user_id, action, detail, ip) VALUES (?,?,?,?)', [userId ?? null, action, detail ?? null, ip ?? null]); } catch {}
}
