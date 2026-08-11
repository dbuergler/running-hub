import React, { useState } from 'react';
import { Activity, Clock } from 'lucide-react';

export default function CoachingCalculator() {
  const [distance, setDistance] = useState('5K');
  const [timeStr, setTimeStr] = useState('18:30'); // MM:SS template
  const [paces, setPaces] = useState(null);

  const calculatePaces = (e) => {
    e.preventDefault();
    const parts = timeStr.split(':').map(Number);
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
      alert("Please enter time in MM:SS format (e.g., 18:30)");
      return;
    }

    const totalSeconds = parts[0] * 60 + parts[1];
    
    // Equivalent pace mathematics formulas approximated for baseline training zones
    let baseEasySec, baseTempoSec, baseIntervalSec;
    
    if (distance === '5K') {
      const milePace = totalSeconds / 3.106;
      baseEasySec = milePace * 1.35; // Easy zone 135%
      baseTempoSec = milePace * 1.12; // Tempo zone 112%
      baseIntervalSec = milePace * 0.96; // 5K pace speed intervals
    } else {
      // Mile Formula
      baseEasySec = totalSeconds * 1.50;
      baseTempoSec = totalSeconds * 1.25;
      baseIntervalSec = totalSeconds * 1.05;
    }

    const formatTime = (secs) => {
      const m = Math.floor(secs / 60);
      const s = Math.round(secs % 60);
      return `${m}:${String(s).padStart(2, '0')}/mi`;
    };

    setPaces({
      easy: formatTime(baseEasySec),
      tempo: formatTime(baseTempoSec),
      intervals: formatTime(baseIntervalSec),
      lap400: formatTime(baseIntervalSec / 4).replace('/mi', '') // Equivalent 400m splits
    });
  };

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--accent)' }}>COACHING PACE CALCULATOR</h2>
        <p style={{ fontSize: '13px', color: 'var(--text3)' }}>Determine precise individual training zones and split workouts based on recent performance times.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Input parameters */}
        <div>
          <form onSubmit={calculatePaces} style={{ background: 'var(--bg2)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={18} /> Performance Input</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Select Test Event</label>
              <select value={distance} onChange={e => setDistance(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <option value="5K">5K XC / Track</option>
                <option value="Mile">1600m / Mile</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Time (MM:SS)</label>
              <input type="text" value={timeStr} onChange={e => setTimeStr(e.target.value)} required placeholder="e.g. 18:30" style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
            </div>
            <button type="submit" style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Calculate Targets</button>
          </form>
        </div>

        {/* Calculated target values display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Individual Training Zones</h3>
          {paces ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: 'var(--bg2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', borderLeft: '4px solid #10b981' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>EASY RUN RECOVERY</span>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>{paces.easy}</h4>
                <p style={{ fontSize: '11px', color: 'var(--text3)' }}>Target for standard recovery runs and baseline LSD loops.</p>
              </div>
              <div style={{ background: 'var(--bg2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', borderLeft: '4px solid #f59e0b' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>THRESHOLD TEMPO</span>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>{paces.tempo}</h4>
                <p style={{ fontSize: '11px', color: 'var(--text3)' }}>Target pace for continuous tempos and cruise interval sets.</p>
              </div>
              <div style={{ background: 'var(--bg2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', borderLeft: '4px solid var(--red)' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>VO2 MAX INTERVALS</span>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--red)', marginTop: '2px' }}>{paces.intervals}</h4>
                <p style={{ fontSize: '11px', color: 'var(--text3)' }}>Repeats (800m/1000m target splits) · <strong>400m Rep Target: {paces.lap400}</strong></p>
              </div>
            </div>
          ) : (
            <div style={{ border: '1px dashed var(--border)', borderRadius: '8px', padding: '3rem', textAlign: 'center', color: 'var(--text3)' }}>
              Input a benchmark time on the left to estimate athletic pace splits.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
