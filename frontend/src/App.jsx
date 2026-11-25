import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import Avatar from './Avatar.jsx';

const LANGS = { en: 'English', am: 'Amharic (አማርኛ)', om: 'Afaan Oromo' };
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

function Login({ onDone }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  async function submit(e) {
    e.preventDefault(); setErr('');
    try {
      const d = await api('/auth/' + mode, 'POST', f);
      localStorage.setItem('token', d.token); localStorage.setItem('name', d.name); onDone();
    } catch (x) { setErr(x.message); }
  }
  return (
    <div className="center">
      <form className="card" onSubmit={submit}>
        <h1>AI HUMAN</h1>
        <p>Your personal voice assistant</p>
        {mode === 'register' && <input placeholder="Name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />}
        <input placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
        <input placeholder="Password (8+ characters)" type="password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
        {err && <div className="err">{err}</div>}
        <button>{mode === 'login' ? 'Log in' : 'Create account'}</button>
        <a onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create an account' : 'I have an account'}</a>
      </form>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'));
  const [convs, setConvs] = useState([]);
  const [convId, setConvId] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [live, setLive] = useState(false);
  const [lang, setLang] = useState('en');
  const [gender, setGender] = useState('female');
  const [view, setView] = useState('chat');
  const [mems, setMems] = useState([]);
  const [newMem, setNewMem] = useState('');
  const [error, setError] = useState('');
  const recRef = useRef(null);
  const liveRef = useRef(false);
  const endRef = useRef(null);
  liveRef.current = live;

  const loadConvs = () => api('/conversations').then(setConvs).catch(() => {});
  const loadMems = () => api('/memories').then(setMems).catch(() => {});
  useEffect(() => { if (authed) { loadConvs(); loadMems(); } }, [authed]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith(lang));
    const pick = voices.find(v => gender === 'male' ? /male|david|mark|george/i.test(v.name) : /female|zira|aria|jenny|samantha/i.test(v.name)) || voices[0];
    if (pick) u.voice = pick;
    u.lang = lang === 'om' ? 'en' : lang;
    u.onstart = () => setSpeaking(true);
    u.onend = () => { setSpeaking(false); if (liveRef.current) startListening(); };
    window.speechSynthesis.speak(u);
  }
  function stopSpeaking() { window.speechSynthesis?.cancel(); setSpeaking(false); }

  async function send(text) {
    text = (text ?? input).trim();
    if (!text || busy) return;
    setInput(''); setError(''); setBusy(true); stopSpeaking();
    setMsgs(m => [...m, { role: 'user', content: text }]);
    try {
      const d = await api('/chat', 'POST', { message: text, conversationId: convId });
      setConvId(d.conversationId);
      setMsgs(m => [...m, { role: 'assistant', content: d.reply }]);
      loadConvs(); speak(d.reply);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  function startListening() {
    if (!SR) { setError('Speech recognition needs Chrome or Edge.'); return; }
    stopSpeaking();
    const rec = new SR();
    rec.lang = { en: 'en-US', am: 'am-ET', om: 'om-ET' }[lang];
    rec.interimResults = true;
    rec.onresult = e => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setInput(t);
      if (e.results[e.results.length - 1].isFinal) send(t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = e => { setListening(false); setError('Microphone: ' + e.error); setLive(false); };
    recRef.current = rec; rec.start(); setListening(true);
  }
  function toggleLive() {
    if (live) { setLive(false); recRef.current?.stop(); } else { setLive(true); startListening(); }
  }

  async function openConv(id) {
    setConvId(id); setView('chat');
    setMsgs(await api(`/conversations/${id}/messages`));
  }
  function newConv() { setConvId(null); setMsgs([]); setView('chat'); }
  async function delConv(id) { await api('/conversations/' + id, 'DELETE'); if (id === convId) newConv(); loadConvs(); }
  async function addMem() { if (!newMem.trim()) return; try { await api('/memories', 'POST', { content: newMem }); setNewMem(''); loadMems(); } catch (e) { setError(e.message); } }
  async function delMem(id) { await api('/memories/' + id, 'DELETE'); loadMems(); }
  function logout() { localStorage.clear(); setAuthed(false); }

  if (!authed) return <Login onDone={() => setAuthed(true)} />;
  const state = speaking ? 'speaking' : busy ? 'thinking' : listening ? 'listening' : 'idle';

  return (
    <div className="app">
      <aside>
        <div className="logo">AI HUMAN</div>
        <button onClick={newConv}>+ New Conversation</button>
        <button onClick={() => setView('memory')}>Memory</button>
        <div className="hist">
          {convs.map(c => (
            <div key={c.id} className={'conv ' + (c.id === convId ? 'on' : '')}>
              <span onClick={() => openConv(c.id)}>{c.title}</span>
              <b onClick={() => delConv(c.id)}>×</b>
            </div>
          ))}
        </div>
        <div className="soon">Coming next: Live Build, Documents, Projects</div>
        <button onClick={logout}>Log out</button>
      </aside>
      <main>
        <header>
          <select value={lang} onChange={e => setLang(e.target.value)}>
            {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={gender} onChange={e => setGender(e.target.value)}>
            <option value="female">Female assistant</option>
            <option value="male">Male assistant</option>
          </select>
          <span className="status">{state}</span>
        </header>
        {view === 'memory' ? (
          <div className="memory">
            <h2>Memory</h2>
            <p>Only things you add here are remembered. Do not store passwords or keys.</p>
            <div className="row">
              <input value={newMem} onChange={e => setNewMem(e.target.value)} placeholder="e.g. I prefer Amharic explanations" />
              <button onClick={addMem}>Add</button>
            </div>
            {mems.map(m => <div key={m.id} className="mem">{m.content}<b onClick={() => delMem(m.id)}>×</b></div>)}
          </div>
        ) : (
          <>
            <Avatar gender={gender} state={state} />
            <div className="msgs">
              {msgs.map((m, i) => <div key={i} className={'msg ' + m.role}>{m.content}</div>)}
              <div ref={endRef} />
            </div>
          </>
        )}
        {error && <div className="err">{error}</div>}
        <footer>
          <button className={listening ? 'rec' : ''} onClick={() => (listening ? recRef.current?.stop() : startListening())}>🎤</button>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type or speak..." />
          <button onClick={() => send()} disabled={busy}>Send</button>
          <button onClick={stopSpeaking}>Stop</button>
          <label><input type="checkbox" checked={live} onChange={toggleLive} /> Live</label>
        </footer>
      </main>
    </div>
  );
}
