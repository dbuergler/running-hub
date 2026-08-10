import React, { useState } from 'react';
import { CheckCircle, Settings } from 'lucide-react';

export default function DayItem({ dayKey, day, logged, onSave, onClear, onSavePlanOverride }) {
  const [expanded, setExpanded] = useState(false);
  const [editingPlan, setEditingPlan] = useState(false);

  // Training log state variables
  const [miles, setMiles] = useState(logged.miles || '');
  const [pace, setPace] = useState(logged.pace || '');
  const [feel, setFeel] = useState(logged.feel || '');
  const [notes, setNotes] = useState(logged.notes || '');

  // Customizable plan override states
  const [customType, setCustomType] = useState(day.type || 'easy');
  const [customDesc, setCustomDesc] = useState(day.desc || '');
  const [customWorkout, setCustomWorkout] = useState(day.workout || '');

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

  const savePlanOverrideClick = (e) => {
    e.stopPropagation();
    onSavePlanOverride(dayKey, {
      d: day.d,
      type: customType,
      desc: customDesc,
      workout: customWorkout
    });
    setEditingPlan(false);
  };

  const badgeColors = {
    easy: { bg: '#e0f2fe', color: '#0369a1' },
    long: { bg: '#e0e7ff', color: '#4338ca' },
    tempo: { bg: '#fef3c7', color: '#b45309' },
    intervals: { bg: '#fce7f3', color: '#be185d' },
    hills: { bg: '#f3e8ff', color: '#6b21a8' },
    rest: { bg: '#e2e8f0', color: '#475569' }
  };

  const activeColors = badgeColors[day.type] || badgeColors.easy;

  return (
    <div style={{ background: 'var(--bg2)', border: `1px solid ${logged.done ? '#a8dab5' : 'var(--border)'}`, borderRadius: '10px', overflow: 'hidden' }}>
      
      {/* CARD HEADER */}
      <div onClick={() => { if (!editingPlan) setExpanded(!expanded); }} style={{ padding: '1.15rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>Day {day.d}</span>
          <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '20px', background: activeColors.bg, color: activeColors.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{day.type}</span>
          <span style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>{day.desc}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {logged.done && (
            <span style={{ fontSize: '11px', color: 'var(--green)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={14} /> Logged ({logged.miles} mi)
            </span>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); setEditingPlan(!editingPlan); setExpanded(true); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}
          >
            <Settings size={15} />
          </button>
          <span style={{ color: 'var(--text3)' }}>{expanded ? '▴' : '▾'}</span>
        </div>
      </div>

      {/* PLAN CUSTOMIZATION ACCORDION */}
      {editingPlan && (
        <div style={{ padding: '1.25rem', borderTop: '2px dashed var(--accent)', background: '#f8fafc' }}>
          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--accent)', marginBottom: '12px' }}>Customize Training Day Plan</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>Pill Type</label>
              <select value={customType} onChange={e => setCustomType(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border2)', borderRadius: '6px' }}>
                <option value="easy">Easy</option>
                <option value="long">Long Run</option>
                <option value="tempo">Tempo</option>
                <option value="intervals">Intervals</option>
                <option value="hills">Hills</option>
                <option value="rest">Rest</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
              <label style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>Description Title</label>
              <input type="text" value={customDesc} onChange={e => setCustomDesc(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border2)', borderRadius: '6px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '1rem' }}>
            <label style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>Prescribed Workout Details</label>
            <input type="text" value={customWorkout} onChange={e => setCustomWorkout(e.target.value)} placeholder="Warmup, cooldown, active repeats..." style={{ padding: '8px', border: '1px solid var(--border2)', borderRadius: '6px' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={savePlanOverrideClick} style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Apply Customization</button>
            <button onClick={() => setEditingPlan(false)} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border2)', borderRadius: '6px', color: 'var(--text3)', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* WORKOUT LOGGING EXPANSION */}
      {expanded && !editingPlan && (
        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', background: '#fafaf9' }}>
          {day.workout && (
            <div style={{ background: 'var(--bg3)', padding: '10px 14px', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text2)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              <strong>Prescribed Plan:</strong> {day.workout}
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
            <label style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>Workout Notes / Splitting Details</label>
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
