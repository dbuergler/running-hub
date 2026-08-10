import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  Calendar, BarChart2, Award, Info, RefreshCw, LogIn, LogOut, CheckCircle, Flame
} from 'lucide-react';

const WORKOUT_PLAN = [
  { w: 1, d: 1, type: 'easy', desc: '0–3 miles easy run' },
  { w: 1, d: 2, type: 'easy', desc: '4–6 miles easy run' },
  { w: 1, d: 3, type: 'intervals', desc: '6–7 miles with intervals', workout: '2mi warmup · 6×400m @1:35 (6:22/mi), 200m rec · 2mi cooldown' },
  { w: 1, d: 4, type: 'easy', desc: '0–3 miles easy run' },
  { w: 1, d: 5, type: 'easy', desc: '4 miles easy run' },
  { w: 1, d: 6, type: 'rest', desc: 'Rest' },
  { w: 1, d: 7, type: 'lsd', desc: '10 miles LSD' },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [activeWeek, setActiveWeek] = useState(1);
  const [logs, setLogs] = useState({});
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cachedLogs = localStorage.getItem('run_logs');
    if (cachedLogs) {
      try { setLogs(JSON.parse(cachedLogs)); } catch (e) { console.error(e); }
    }
    checkSupabaseConnection();
  }, []);

  const checkSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('run_logs').select('id').limit(1);
      if (!error) {
        setSupabaseConnected(true);
        fetchLogsFromSupabase();
      }
    } catch (err) {
      setSupabaseConnected(false);
    }
  };

  const fetchLogsFromSupabase = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('run_logs').select('*');
    if (!error && data) {
      const formatted = {};
      data.forEach(row => { formatted[row.id] = row; });
      setLogs(formatted);
      localStorage.setItem('run_logs', JSON.stringify(formatted));
    }
    setLoading(false);
  };

  const handleSaveLog = async (dayKey, logData) => {
    const updated = { ...logs, [dayKey]: { ...logData, done: true } };
    setLogs(updated);
    localStorage.setItem('run_logs', JSON.stringify(updated));

    if (supabaseConnected) {
      await supabase.from('run_logs').upsert({
        id: dayKey,
        done: true,
        miles: logData.miles,
        pace: logData.pace,
        time: logData.time,
        hr: logData.hr,
        feel: logData.feel,
        shoe: logData.shoe,
        splits: logData.splits,
        notes: logData.notes
      });
    }
  };

  const handleClearLog = async (dayKey) => {
    const updated = { ...logs };
    delete updated[dayKey];
    setLogs(updated);
    localStorage.setItem('run_logs', JSON.stringify(updated));

    if (supabaseConnected) {
      await supabase.from('run_logs').delete().eq('id', dayKey);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(245,243,238,0.94)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', height: '56px', justifyContent: 'space-between' }}>
          <a onClick={() => setCurrentPage('home')} style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--accent)', textDecoration: 'none', cursor: 'pointer' }}>RUN/</a>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span onClick={() => setCurrentPage('tracker')} style={{ cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, color: currentPage === 'tracker' ? 'var(--accent)' : 'var(--text2)', textTransform: 'uppercase' }}>Tracker</span>
            <span onClick={() => setCurrentPage('comeback')} style={{ cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, color: currentPage === 'comeback' ? 'var(--accent)' : 'var(--text2)', textTransform: 'uppercase' }}>Comeback</span>
            <span onClick={() => setCurrentPage('about')} style={{ cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, color: currentPage === 'about' ? 'var(--accent)' : 'var(--text2)', textTransform: 'uppercase' }}>About</span>
          </div>
        </div>
      </nav>

      <main style={{ flex: 1, paddingTop: '56px', maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '56px 2rem 2rem' }}>
        <div style={{ margin: '1rem 0', padding: '10px 15px', borderRadius: '8px', background: supabaseConnected ? '#f0faf3' : '#fdf0f0', border: `1px solid ${supabaseConnected ? '#a8dab5' : '#e8a0a0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: supabaseConnected ? 'var(--green)' : 'var(--red)' }} />
            {supabaseConnected ? "Database Connected (Autosyncing)" : "Offline Mode (Using LocalStorage)"}
          </div>
          {supabaseConnected && (
            <button onClick={fetchLogsFromSupabase} disabled={loading} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text2)' }}>
              <RefreshCw size={14} className={loading ? "spin" : ""} />
            </button>
          )}
        </div>

        {currentPage === 'home' && (
          <div style={{ padding: '2rem 0' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(44px, 8vw, 80px)', fontWeight: 700, lineHeight: 0.95, textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              Train.<br />Analyze.<br /><span style={{ color: 'var(--accent)' }}>Coach.</span>
            </h1>
            <p style={{ color: 'var(--text2)', maxWidth: '480px', marginBottom: '2rem', fontSize: '15px', lineHeight: 1.6 }}>
              A personal running management setup. Log workouts, study pacing patterns, and maintain training calendar logs inside a clean ecosystem.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div onClick={() => setCurrentPage('tracker')} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.5rem', cursor: 'pointer' }}>
                <Calendar style={{ color: 'var(--accent)', marginBottom: '10px' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>Training Tracker</h3>
                <p style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>Log running logs from the 16-week cycle.</p>
              </div>
              <div onClick={() => setCurrentPage('comeback')} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.5rem', cursor: 'pointer' }}>
                <Flame style={{ color: 'var(--red)', marginBottom: '10px' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>Comeback Plan</h3>
                <p style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>12-week gradual base building template.</p>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'tracker' && (
          <div>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700 }}>TRAINING TRACKER</h2>
              <p style={{ fontSize: '13px', color: 'var(--text2)' }}>Select a week to log workout metrics, times, efforts, and details.</p>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {[1].map((wk) => (
                <button
                  key={wk}
                  onClick={() => setActiveWeek(wk)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    background: activeWeek === wk ? '#faecd0' : 'transparent',
                    color: activeWeek === wk ? 'var(--accent)' : 'var(--text3)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px'
                  }}
                >
                  Week {wk}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {WORKOUT_PLAN.filter(p => p.w === activeWeek).map((day) => {
                const dayKey = `w${day.w}d${day.d}`;
                const loggedVal = logs[dayKey] || {};

                return (
                  <DayItem 
                    key={dayKey} 
                    dayKey={dayKey} 
                    day={day} 
                    logged={loggedVal} 
                    onSave={handleSaveLog} 
                    onClear={handleClearLog} 
                  />
                );
              })}
            </div>
          </div>
        )}

        {currentPage === 'comeback' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, marginBottom: '1rem' }}>COMEBACK PLAN</h2>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>12-Week Base Focus</h3>
              <p style={{ fontSize: '14px', color: 'var(--text2)', marginTop: '8px', lineHeight: 1.6 }}>
                A conservative building blueprint emphasizing routine over velocity. Connective tissues and bone structures adapt at slower rates than aerobic fitness metrics. Stay disciplined to avoid setbacks.
              </p>
            </div>
          </div>
        )}

        {currentPage === 'about' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, marginBottom: '1rem' }}>ABOUT</h2>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.5rem' }}>
              <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.6 }}>
                This is a running and coaching dashboard. Build the database, configure local tracking values, and organize athlete programs from a consolidated UI.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function DayItem({ dayKey, day, logged, onSave, onClear }) {
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
          <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', background: '#d4f0dc', color: '#1e6b35', fontWeight: 500, textTransform: 'uppercase' }}>{day.type}</span>
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
            <button onClick={saveClick} style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>Save Log</button>
            {logged.done && <button onClick={clearClick} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--red)', borderRadius: '6px', color: 'var(--red)', cursor: 'pointer', fontSize: '12px' }}>Clear</button>}
          </div>
        </div>
      )}
    </div>
  );
}
