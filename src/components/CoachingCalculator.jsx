import React, { useState } from 'react';
import { Clock, Trophy, Timer, Flag } from 'lucide-react';

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
      // HH:MM:SS (e.g. 2:45:00)
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
      alert("Please enter a valid time (e.g. 18:30, 1:28:45, or 2:45:00)");
      return;
    }

    const DISTANCES = {
      'Mile': 1.0,
      '5K': 3.10686,
      '10K': 6.21371,
      'Half Marathon': 13.1094,
      'Marathon': 26.2188
    };

    const targetMiles = DISTANCES[distance] || 3.10686;

    // Riegel Fatigue Model: T2 = T1 * (D2 / D1)^1.06
    const predictTime = (d2Miles) => {
      return totalSec * Math.pow(d2Miles / targetMiles, 1.06);
    };

    // Equivalent Race Predictions
    const predMile = predictTime(1.0);
    const pred5K = predictTime(3.10686);
    const pred10K = predictTime(6.21371);
    const predHalf = predictTime(13.1094);
    const predMarathon = predictTime(26.2188);

    // Training Pace Calculations
    const equivalentMileSec = predMile;
    const easyPace = equivalentMileSec * 1.35;
    const tempoPace = equivalentMileSec * 1.12;
    const intervalPace = equivalentMileSec * 0.96;
    const lap400Sec = intervalPace / 4;

    // Target Race Checkpoint Splits Generator
    const avgPaceSec = totalSec / targetMiles;
    let splitsList = [];

    if (distance === 'Marathon') {
      splitsList = [
        { label: '5K Checkpoint', dist: '3.1 mi', time: formatSecondsToClock(avgPaceSec * 3.1068) },
        { label: '10K Checkpoint', dist: '6.2 mi', time: formatSecondsToClock(avgPaceSec * 6.2137) },
        { label: '15K Checkpoint', dist: '9.3 mi', time: formatSecondsToClock(avgPaceSec * 9.32) },
        { label: 'Half Marathon', dist: '13.1 mi', time: formatSecondsToClock(avgPaceSec * 13.1094) },
        { label: '20 Mile Mark', dist: '20.0 mi', time: formatSecondsToClock(avgPaceSec * 20.0) },
        { label: '30K Checkpoint', dist: '18.6 mi', time: formatSecondsToClock(avgPaceSec * 18.64) },
        { label: 'Marathon Finish', dist: '26.2 mi', time: formatSecondsToClock(totalSec) }
      ];
    } else if (distance === 'Half Marathon') {
      splitsList = [
        { label: 'Mile 1', dist: '1.0 mi', time: formatSecondsToClock(avgPaceSec * 1.0) },
        { label: '5K Checkpoint', dist: '3.1 mi', time: formatSecondsToClock(avgPaceSec * 3.1068) },
        { label: 'Mile 5', dist: '5.0 mi', time: formatSecondsToClock(avgPaceSec * 5.0) },
        { label: '10K Checkpoint', dist: '6.2 mi', time: formatSecondsToClock(avgPaceSec * 6.2137) },
        { label: 'Mile 10', dist: '10.0 mi', time: formatSecondsToClock(avgPaceSec * 10.0) },
        { label: 'Half Finish', dist: '13.1 mi', time: formatSecondsToClock(totalSec) }
      ];
    } else if (distance === '10K') {
      splitsList = [
        { label: 'Mile 1', dist: '1.0 mi', time: formatSecondsToClock(avgPaceSec * 1.0) },
        { label: 'Mile 2', dist: '2.0 mi', time: formatSecondsToClock(avgPaceSec * 2.0) },
        { label: '5K Checkpoint', dist: '3.1 mi', time: formatSecondsToClock(avgPaceSec * 3.1068) },
        { label: 'Mile 5', dist: '5.0 mi', time: formatSecondsToClock(avgPaceSec * 5.0) },
        { label: '10K Finish', dist: '6.2 mi', time: formatSecondsToClock(totalSec) }
      ];
    } else if (distance === '5K') {
      splitsList = [
        { label: 'Mile 1', dist: '1.0 mi', time: formatSecondsToClock(avgPaceSec * 1.0) },
        { label: 'Mile 2', dist: '2.0 mi', time: formatSecondsToClock(avgPaceSec * 2.0) },
        { label: 'Mile 3', dist: '3.0 mi', time: formatSecondsToClock(avgPaceSec * 3.0) },
        { label: '5K Finish', dist: '3.1 mi', time: formatSecondsToClock(totalSec) }
      ];
    } else if (distance === 'Mile') {
      splitsList = [
        { label: '400m Split', dist: '0.25 mi', time: formatSecondsToClock(totalSec / 4) },
        { label: '800m Split', dist: '0.50 mi', time: formatSecondsToClock(totalSec / 2) },
        { label: '1200m Split', dist: '0.75 mi', time: formatSecondsToClock((totalSec / 4) * 3) },
        { label: 'Mile Finish', dist: '1.0 mi', time: formatSecondsToClock(totalSec) }
      ];
    }

    setResults({
      avgPace: formatPacePerMile(avgPaceSec),
      easy: formatPacePerMile(easyPace),
      tempo: formatPacePerMile(tempoPace),
      intervals: formatPacePerMile(intervalPace),
      lap400: `${Math.floor(lap400Sec / 60) > 0 ? Math.floor(lap400Sec / 60) + ':' : ''}${String(Math.round(lap400Sec % 60)).padStart(2, '0')}s`,
      splits: splitsList,
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
        <p style={{ fontSize: '13px', color: 'var(--text3)' }}>Determine precise individual training zones and target race splits based on recent performance times.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Inputs */}
        <div>
          <form onSubmit={calculatePaces} style={{ background: 'var(--bg2)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={18} /> Performance Input</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Select Target Distance</label>
              <select value={distance} onChange={e => setDistance(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <option value="Mile">Mile / 1600m</option>
                <option value="5K">5K XC / Track</option>
                <option value="10K">10K Road / Track</option>
                <option value="Half Marathon">Half Marathon</option>
                <option value="Marathon">Marathon</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Target Time (MM:SS or HH:MM:SS)</label>
              <input 
                type="text" 
                value={timeStr} 
                onChange={e => setTimeStr(e.target.value)} 
                required 
                placeholder="e.g. 18:30, 1:28:45, or 2:45:00" 
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
                Input a target time on the left to estimate athletic pace splits.
              </div>
            )}
          </div>

          {/* TARGET RACE SPLITS */}
          {results && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Timer size={18} color="var(--red)" /> Target {distance} Checkpoint Splits (Req. Avg: {results.avgPace})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {results.splits.map((s, idx) => (
                  <div key={idx} style={{ background: 'var(--bg2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', borderTop: '3px solid var(--accent)' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)', display: 'block' }}>{s.label} ({s.dist})</span>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--red)', marginTop: '2px' }}>{s.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
