import React, { useState } from 'react';
import { Clock, Trophy } from 'lucide-react';

export default function CoachingCalculator() {
  const [distance, setDistance] = useState('5K');
  const [timeStr, setTimeStr] = useState('18:30'); 
  const [results, setResults] = useState(null);

  // Flexible Parser: Converts MM:SS or HH:MM:SS into total seconds
  const parseTimeToSeconds = (str) => {
    if (!str) return 0;
    const parts = str.split(':').map(p => p.trim()).map(Number);
    if (parts.some(isNaN)) return 0;

    if (parts.length === 3) {
      // HH:MM:SS (e.g. 3:15:00)
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // MM:SS (e.g. 18:30)
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
      return parts[0] * 60;
    }
    return 0;
  };

  // Formatter: Displays hours if >= 1 hour (HH:MM:SS), otherwise MM:SS
  const formatSecondsToClock = (totalSec) => {
    if (!totalSec || isNaN(totalSec) || totalSec <= 0) return '—';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = Math.round(totalSec % 60);

    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const formatPacePerMile = (secPerMile) => {
    if (!secPerMile || isNaN(secPerMile) || secPerMile <= 0) return '—';
    const mins = Math.floor(secPerMile / 60);
    const secs = Math.round(secPerMile % 60);
    return `${mins}:${String(secs).padStart(2, '0')}/mi`;
  };

  const calculatePaces = (e) => {
    e.preventDefault();
    const totalSec = parseTimeToSeconds(timeStr);

    if (totalSec <= 0) {
      alert("Please enter a valid time (e.g. 18:30, 1:28:45, or 3:15:00)");
      return;
    }

    // Convert benchmark performance into equivalent 1-Mile base seconds
    let mileSec = 0;
    if (distance === 'Mile') mileSec = totalSec;
    else if (distance === '5K') mileSec = totalSec / 3.1068;
    else if (distance === '10K') mileSec = totalSec / 6.2137;
    else if (distance === 'Half Marathon') mileSec = totalSec / 13.1094;
    else if (distance === 'Marathon') mileSec = totalSec / 26.2188;

    // Riegel / VDOT Fatigue Model Predictions: T2 = T1 * (D2/D1)^1.06
    const predMile = mileSec;
    const pred5K = mileSec * Math.pow(3.1068, 1.06);
    const pred10K = mileSec * Math.pow(6.2137, 1.06);
    const predHalf = mileSec * Math.pow(13.1094, 1.06);
    const predMarathon = mileSec * Math.pow(26.2188, 1.06);

    // Training Pace Targets
    const easyPace = mileSec * 1.35;      // Easy Z2 recovery
    const tempoPace = mileSec * 1.12;     // Lactate Threshold Tempo
    const intervalPace = mileSec * 0.96;  // VO2 Max Intervals
    const lap400Sec = intervalPace / 4;   // 400m Track split

    setResults({
      easy: formatPacePerMile(easyPace),
      tempo: formatPacePerMile(tempoPace),
      intervals: formatPacePerMile(intervalPace),
      lap400: `${Math.floor(lap400Sec / 60) > 0 ? Math.floor(lap400Sec / 60) + ':' : ''}${String(Math.round(lap400Sec % 60)).padStart(2, '0')}s`,
      predictions: {
        mile: formatSecondsToClock(predMile),
        fiveK: formatSecondsToClock(pred5K),
        tenK: formatSecondsToClock(pred10K),
        half: formatSecondsToClock(predHalf),
        marathon: formatSecondsToClock(predMarathon)
      }
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
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Benchmark Time (MM:SS or HH:MM:SS)</label>
              <input 
                type="text" 
                value={timeStr} 
                onChange={e => setTimeStr(e.target.value)} 
                required 
                placeholder="e.g. 18:30, 1:28:45, or 3:15:00" 
                style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} 
              />
            </div>
            <button type="submit" className="btn-interactive" style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Calculate Targets</button>
          </form>
        </div>

        {/* Display calculated metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Training Zones */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '1rem' }}>Individual Training Zones</h3>
            {results ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'var(--bg2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', borderLeft: '4px solid #10b981' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>EASY RECOVERY PACE</span>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>{results.easy}</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text3)' }}>Target pace for recovery jogs and weekend long runs.</p>
                </div>
                <div style={{ background: 'var(--bg2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', borderLeft: '4px solid #f59e0b' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>THRESHOLD TEMPO</span>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>{results.tempo}</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text3)' }}>Comfortably hard pace. Used to train lactate threshold clearance.</p>
                </div>
                <div style={{ background: 'var(--bg2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', borderLeft: '4px solid var(--red)' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>VO2 MAX INTERVALS</span>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--red)', marginTop: '2px' }}>{results.intervals}</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text3)' }}>Repeats (800m/1000m target splits) · <strong>400m Track Target: {results.lap400}</strong></p>
                </div>
              </div>
            ) : (
              <div style={{ border: '1px dashed var(--border)', borderRadius: '8px', padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>
                Input a benchmark time on the left to estimate athletic pace splits.
              </div>
            )}
          </div>

          {/* Equivalent Race Time Predictions (HH:MM:SS) */}
          {results && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trophy size={18} color="var(--red)" /> Equivalent Race Predictions
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                <div style={{ background: 'var(--bg2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>MILE</span>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--accent)', marginTop: '2px' }}>{results.predictions.mile}</div>
                </div>
                <div style={{ background: 'var(--bg2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>5K</span>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--accent)', marginTop: '2px' }}>{results.predictions.fiveK}</div>
                </div>
                <div style={{ background: 'var(--bg2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>10K</span>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--accent)', marginTop: '2px' }}>{results.predictions.tenK}</div>
                </div>
                <div style={{ background: 'var(--bg2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>HALF MARATHON</span>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--red)', marginTop: '2px' }}>{results.predictions.half}</div>
                </div>
                <div style={{ background: 'var(--bg2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>FULL MARATHON</span>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--red)', marginTop: '2px' }}>{results.predictions.marathon}</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
