import React, { useState } from 'react';
import { Clock } from 'lucide-react';

export default function CoachingCalculator() {
  const [distance, setDistance] = useState('5K');
  const [timeStr, setTimeStr] = useState('18:30'); 
  const [paces, setPaces] = useState(null);

  const calculatePaces = (e) => {
    e.preventDefault();
    const parts = timeStr.split(':').map(Number);
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
      alert("Please enter time in MM:SS format (e.g., 18:30 or 1:18:42 for longer events)");
      return;
    }

    const totalSeconds = parts[0] * 60 + parts[1];
    let milePaceSeconds = 0;

    // Convert different benchmark race times to baseline equivalent mile paces
    if (distance === 'Mile') {
      milePaceSeconds = totalSeconds;
    } else if (distance === '5K') {
      milePaceSeconds = totalSeconds / 3.106;
    } else if (distance === '10K') {
      milePaceSeconds = totalSeconds / 6.213;
    } else if (distance === 'Half Marathon') {
      milePaceSeconds = totalSeconds / 13.11;
    } else if (distance === 'Marathon') {
      // For marathon, handle if they inputted HH:MM:SS format (e.g., 3:15:00)
      milePaceSeconds = totalSeconds / 26.22;
    }

    // Equivalent pace mathematics formulas (VDOT index metrics)
    const easyPaceSec = milePaceSeconds * 1.35; // Easy recovery pace (135% of race pace)
    const tempoPaceSec = milePaceSeconds * 1.12; // Lactate Threshold pace (112% of race pace)
    const intervalPaceSec = milePaceSeconds * 0.95; // VO2 max intervals (95% of race pace)

    const formatTime = (secs) => {
      const m = Math.floor(secs / 60);
      const s = Math.round(secs % 60);
      return `${m}:${String(s).padStart(2, '0')}/mi`;
    };

    setPaces({
      easy: formatTime(easyPaceSec),
      tempo: formatTime(tempoPaceSec),
      intervals: formatTime(intervalPaceSec),
      lap400: formatTime(intervalPaceSec / 4).replace('/mi', '')
    });
  };

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--accent)' }}>COACHING PACE CALCULATOR</h2>
        <p style={{ fontSize: '13px', color: 'var(--text3)' }}>Determine precise individual training zones and split workouts based on recent performance times.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Inputs */}
        <div>
          <form onSubmit={calculatePaces} style={{ background: 'var(--bg2)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={18} /> Performance Input</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Select Benchmark Distance</label>
              <select value={distance} onChange={e => setDistance(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <option value="Mile">Mile / 1600m</option>
                <option value="5K">5K XC / Track</option>
                <option value="10K">10K Road / Track</option>
                <option value="Half Marathon">Half Marathon</option>
                <option value="Marathon">Marathon</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Time (MM:SS)</label>
              <input type="text" value={timeStr} onChange={e => setTimeStr(e.target.value)} required placeholder="e.g. 18:30" style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
            </div>
            <button type="submit" style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Calculate Targets</button>
          </form>
        </div>

        {/* Display calculated metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Individual Training Zones</h3>
          {paces ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: 'var(--bg2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', borderLeft: '4px solid #10b981' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>EASY RECOVERY PACE</span>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>{paces.easy}</h4>
                <p style={{ fontSize: '11px', color: 'var(--text3)' }}>Target pace for recovery jogs and weekend long runs.</p>
              </div>
              <div style={{ background: 'var(--bg2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', borderLeft: '4px solid #f59e0b' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>THRESHOLD TEMPO</span>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>{paces.tempo}</h4>
                <p style={{ fontSize: '11px', color: 'var(--text3)' }}>Comfortably hard pace. Used to train lactate threshold clearance.</p>
              </div>
              <div style={{ background: 'var(--bg2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', borderLeft: '4px solid var(--red)' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>VO2 MAX INTERVALS</span>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--red)', marginTop: '2px' }}>{paces.intervals}</h4>
                <p style={{ fontSize: '11px', color: 'var(--text3)' }}>Repeats (800m/1000m target splits) · <strong>400m Track Target: {paces.lap400}</strong></p>
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
