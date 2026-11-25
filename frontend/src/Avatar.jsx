// PLACEHOLDER avatar (Phase 5 not done): a simple animated face, NOT a realistic human.
// Replace this component with a digital-human provider (HeyGen, D-ID, Simli, etc.).
export default function Avatar({ gender, state }) {
  const skin = gender === 'male' ? '#d9a47c' : '#e8b894';
  const hair = gender === 'male' ? '#2b1d14' : '#4a2a1a';
  return (
    <svg viewBox="0 0 200 240" className={'avatar ' + state}>
      {gender === 'female' && <ellipse cx="100" cy="120" rx="78" ry="105" fill={hair} />}
      <ellipse cx="100" cy="115" rx="62" ry="78" fill={skin} />
      <path d={gender === 'male' ? 'M38 95 Q100 10 162 95 Q150 55 100 48 Q50 55 38 95Z' : 'M36 100 Q100 5 164 100 Q140 50 100 45 Q60 50 36 100Z'} fill={hair} />
      <ellipse className="eye" cx="78" cy="110" rx="8" ry="6" fill="#fff" />
      <ellipse className="eye" cx="122" cy="110" rx="8" ry="6" fill="#fff" />
      <circle cx="78" cy="110" r="3.5" fill="#222" />
      <circle cx="122" cy="110" r="3.5" fill="#222" />
      <path d="M100 118 L96 140 L104 140" stroke="#b88562" fill="none" strokeWidth="2" />
      <ellipse className="mouth" cx="100" cy="162" rx="16" ry="5" fill="#8b2e3c" />
    </svg>
  );
}
