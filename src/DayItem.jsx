import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

export default function DayItem({ dayKey, day, logged, onSave, onClear }) {
  const [expanded, setExpanded] = useState(false);
  const [miles, setMiles] = useState(logged.miles || '');
  const [pace, setPace] = useState(logged.pace || '');
  const [feel, setFeel] = useState(logged.feel || '');
  const [notes, setNotes] = useState(logged.notes || '');

  const saveClick = (e) => {
    e.stopPropagation();
    onSave(dayKey, { miles, pace, feel, notes });
    setExpanded(false);
  };

  const clearClick = (e) => {
    e.stopPropagation();
    setMiles(''); setPace(''); setFeel(''); setNotes('');
    onClear(dayKey);
    setExpanded(false);
  };

  return (
    <div style={{ background: 'var(--bg2)', border: `1px solid ${logged.done ? '#a8dab5' : 'var(--border)'}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>Day {day.d}</span>
          <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', background: 'var(--bg3)', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase' }}>{day.type}</span>
          <span style={{ fontSize: '14px', color: 'var(--text)' }}>{day.desc}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {logged.done && <span style={{ fontSize: '11px', color: 'var(--green)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> Logged ({logged.miles} mi)</span>}
          <span style={{ color: 'var(--text3)' }}>{expanded ? '▴' : '▾'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: '#fafaf9' }}>
          {day.workout && (
            <div style={{ background: 'var(--bg3)', padding: '8px 12px', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text2)', marginBottom: '1rem' }}>
              Workout Detail: {day.workout}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>Miles Run</label>
              <input type="number" step="0.1" value={miles} onChange={e => setMiles(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border2)', borderRadius: '6px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>Avg Pace</label>
              <input type="text" value={pace} onChange={e => setPace(e.target.value)} placeholder="7:30/mi" style={{ padding: '8px', border: '1px solid var(--border2)', borderRadius: '6px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>Effort (1-10)</label>
              <input type="number" min="1" max="10" value={feel} onChange={e => setFeel(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border2)', borderRadius: '6px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '1rem' }}>
            <label style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>Workout Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border2)', borderRadius: '6px', minHeight: '60px' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={saveClick} style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Save Log</button>
            {logged.done && <button onClick={clearClick} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--red)', borderRadius: '6px', color: 'var(--red)', cursor: 'pointer', fontSize: '12px' }}>Clear</button>}
          </div>
        </div>
      )}
    </div>
  );
}
