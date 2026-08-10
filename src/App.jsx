import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Calendar, Award, RefreshCw, Flame, Users } from 'lucide-react';

// Import our modular view components
import DayItem from './components/DayItem';
import StrategiesView from './components/StrategiesView';
import RacesView from './components/RacesView';
import AthletesView from './components/AthletesView';
import AboutView from './components/AboutView';

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

  // Dynamic states linked to our Supabase databases
  const [strategies, setStrategies] = useState([]);
  const [races, setRaces] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [aboutProfile, setAboutProfile] = useState({
    name: 'Coach Daniel',
    role: 'Head Cross Country & Track Coach',
    location: 'Indianapolis, IN',
    bio: 'Dedicated to developing balanced runners, building strategic physical base capacities, and structuring positive team athletic programs.',
    achievements: '3x State Qualifier Appearances · 12 All-Conference Runners coached'
  });

  // Inject Team Colors (Red, Blue, & White)
  useEffect(() => {
    document.documentElement.style.setProperty('--bg', '#f1f5f9');
    document.documentElement.style.setProperty('--bg2', '#ffffff');
    document.documentElement.style.setProperty('--bg3', '#e2e8f0');
    document.documentElement.style.setProperty('--border', 'rgba(15,43,92,0.1)');
    document.documentElement.style.setProperty('--border2', 'rgba(15,43,92,0.25)');
    document.documentElement.style.setProperty('--text', '#0f172a');
    document.documentElement.style.setProperty('--text2', '#334155');
    document.documentElement.style.setProperty('--text3', '#64748b');
    document.documentElement.style.setProperty('--accent', '#0f2b5c'); // Deep Royal Blue
    document.documentElement.style.setProperty('--accent2', '#1e40af'); // Vibrant Blue
    document.documentElement.style.setProperty('--red', '#c2185b'); // Crimson Red
    document.documentElement.style.setProperty('--blue', '#0f2b5c');
  }, []);

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
        fetchAllData();
      }
    } catch (err) {
      setSupabaseConnected(false);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { data: logRows } = await supabase.from('run_logs').select('*');
      if (logRows) {
        const formatted = {};
        logRows.forEach(row => { formatted[row.id] = row; });
        setLogs(formatted);
        localStorage.setItem('run_logs', JSON.stringify(formatted));
      }

      const { data: strategyRows } = await supabase.from('run_resources').select('*');
      if (strategyRows) setStrategies(strategyRows);

      const { data: raceRows } = await supabase.from('run_races').select('*');
      if (raceRows) setRaces(raceRows);

      const { data: athleteRows } = await supabase.from('run_athletes').select('*');
      if (athleteRows) setAthletes(athleteRows);

      const { data: settingRows } = await supabase.from('run_settings').select('*').eq('id', 'about').single();
      if (settingRows && settingRows.data) setAboutProfile(settingRows.data);

    } catch (err) {
      console.error(err);
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
      {/* NAVIGATION BAR */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'var(--accent)', borderBottom: '3px solid var(--red)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', height: '58px', justifyContent: 'space-between' }}>
          <a onClick={() => setCurrentPage('home')} style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, letterSpacing: '0.04em', color: '#ffffff', textDecoration: 'none', cursor: 'pointer' }}>RUN/</a>
          <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
            {['tracker', 'strategies', 'races', 'athletes', 'about'].map((tab) => (
              <span 
                key={tab}
                onClick={() => setCurrentPage(tab)} 
                style={{ 
                  cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, 
                  color: currentPage === tab ? '#ffffff' : 'rgba(255,255,255,0.7)', 
                  borderBottom: currentPage === tab ? '2px solid #ffffff' : 'none',
                  paddingBottom: '4px', textTransform: 'uppercase' 
                }}
              >
                {tab}
              </span>
            ))}
          </div>
        </div>
      </nav>

      {/* CONTENT FRAME */}
      <main style={{ flex: 1, paddingTop: '58px', maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '58px 2rem 4rem' }}>
        
        {/* DATABASE CONNECTION BANNER */}
        <div style={{ margin: '1rem 0 2rem', padding: '10px 15px', borderRadius: '8px', background: supabaseConnected ? '#f0faf3' : '#fdf0f0', border: `1px solid ${supabaseConnected ? '#a8dab5' : '#e8a0a0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: supabaseConnected ? 'var(--green)' : 'var(--red)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: supabaseConnected ? 'var(--green)' : 'var(--red)' }} />
            {supabaseConnected ? "Database Synced (Supabase Live)" : "Offline Mode (Local Storage Only)"}
          </div>
          {supabaseConnected && (
            <button onClick={fetchAllData} disabled={loading} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text3)' }}>
              <RefreshCw size={14} className={loading ? "spin" : ""} />
            </button>
          )}
        </div>

        {/* HOME VIEW */}
        {currentPage === 'home' && (
          <div style={{ padding: '2rem 0' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(44px, 8vw, 80px)', fontWeight: 700, lineHeight: 0.95, textTransform: 'uppercase', marginBottom: '1.5rem', color: 'var(--accent)' }}>
              TEAM TRACKER.<br />COACHING HUB.<br /><span style={{ color: 'var(--red)' }}>RUN STRONGER.</span>
            </h1>
            <p style={{ color: 'var(--text2)', maxWidth: '480px', marginBottom: '2.5rem', fontSize: '15px', lineHeight: 1.6 }}>
              A collaborative team coaching ecosystem. Track personal logs, manage dynamic athlete rosters, and document race-day pacing frameworks in one central hub.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div onClick={() => setCurrentPage('tracker')} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: '10px', padding: '1.5rem', cursor: 'pointer' }}>
                <Calendar style={{ color: 'var(--accent)', marginBottom: '10px' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>Training Logs</h3>
                <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Log running logs from the 16-week cycle.</p>
              </div>
              <div onClick={() => setCurrentPage('strategies')} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderTop: '4px solid var(--red)', borderRadius: '10px', padding: '1.5rem', cursor: 'pointer' }}>
                <Award style={{ color: 'var(--red)', marginBottom: '10px' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>Race Strategies</h3>
                <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>View and configure custom strategy card notes.</p>
              </div>
              <div onClick={() => setCurrentPage('athletes')} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderTop: '4px solid var(--accent)', borderRadius: '10px', padding: '1.5rem', cursor: 'pointer' }}>
                <Users style={{ color: 'var(--accent)', marginBottom: '10px' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>Athletes & Roster</h3>
                <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Track rosters, season stats, and upload lists.</p>
              </div>
            </div>
          </div>
        )}

        {/* TRACKER VIEW */}
        {currentPage === 'tracker' && (
          <div>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--accent)' }}>TRAINING TRACKER</h2>
              <p style={{ fontSize: '13px', color: 'var(--text3)' }}>Log workout metrics, times, efforts, and details for the selected training cycle.</p>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {[1].map((wk) => (
                <button
                  key={wk}
                  onClick={() => setActiveWeek(wk)}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)',
                    background: activeWeek === wk ? 'var(--accent)' : 'transparent',
                    color: activeWeek === wk ? '#ffffff' : 'var(--text3)',
                    cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600
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
                    key={dayKey} dayKey={dayKey} day={day} logged={loggedVal} 
                    onSave={handleSaveLog} onClear={handleClearLog} 
                  />
                );
              })}
            </div>
          </div>
        )}

        {currentPage === 'strategies' && (
          <StrategiesView 
            strategies={strategies} supabaseConnected={supabaseConnected} onRefresh={fetchAllData} 
          />
        )}

        {currentPage === 'races' && (
          <RacesView 
            races={races} supabaseConnected={supabaseConnected} onRefresh={fetchAllData} 
          />
        )}

        {currentPage === 'athletes' && (
          <AthletesView 
            athletes={athletes} supabaseConnected={supabaseConnected} onRefresh={fetchAllData} 
          />
        )}

        {currentPage === 'about' && (
          <AboutView 
            profile={aboutProfile} supabaseConnected={supabaseConnected} 
            onSaveProfile={(data) => {
              setAboutProfile(data);
              if (supabaseConnected) {
                supabase.from('run_settings').upsert({ id: 'about', data });
              }
            }} 
          />
        )}
      </main>
    </div>
  );
}
