import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// Import our modular view components
import DayItem from './components/DayItem';
import StrategiesView from './components/StrategiesView';
import RacesView from './components/RacesView';
import AthletesView from './components/AthletesView';
import AboutView from './components/AboutView';

// --- Dynamic 16-Week Plan Generator ---
const getWorkoutForDay = (w, d) => {
  if (d === 6) return { type: 'rest', desc: 'Rest Day' };
  if (d === 7) {
    const miles = 8 + Math.min(w, 8); // Long run builds from 9 to 16 miles
    return { type: 'long', desc: `Long Slow Distance — ${miles} miles`, workout: `Settle into comfortable Z2 aerobic pace. Practice race-day hydration every 3 miles.` };
  }
  if (d === 3) {
    if (w % 2 === 0) {
      return { type: 'intervals', desc: `Mile Repeats (Speed Focus)`, workout: `2mi warmup · 3x1mi @ 6:20-6:35/mi (800m jog recovery) · 2mi cooldown` };
    } else {
      return { type: 'intervals', desc: `400m Track Intervals`, workout: `2mi warmup · 8-10x400m @ 1:30 (200m jog recovery) · 2mi cooldown` };
    }
  }
  if (d === 5) {
    if (w % 2 === 0) {
      return { type: 'tempo', desc: `Lactate Threshold Tempo`, workout: `2mi warmup · 4mi comfortably hard @ 6:45-6:55/mi · 1.5mi cooldown` };
    } else {
      return { type: 'hills', desc: `Strength Hill Repeats`, workout: `2mi warmup · 6x60-sec steep hill efforts (jog down recovery) · 1.5mi cooldown` };
    }
  }
  const easyMiles = d === 2 || d === 4 ? '4-6' : '3-4';
  return { type: 'easy', desc: `Easy Recovery Run — ${easyMiles} miles` };
};

const getDayPlan = (w, d) => {
  const base = getWorkoutForDay(w, d);
  return { w, d, ...base };
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [activeMonth, setActiveMonth] = useState(1);
  const [activeWeek, setActiveWeek] = useState(1);
  const [logs, setLogs] = useState({});
  const [planOverrides, setPlanOverrides] = useState({});
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  // Dynamic States
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

  // Inject Team Colors and Browser Icon (Favicon)
  useEffect(() => {
    document.documentElement.style.setProperty('--bg', '#f1f5f9');
    document.documentElement.style.setProperty('--bg2', '#ffffff');
    document.documentElement.style.setProperty('--bg3', '#e2e8f0');
    document.documentElement.style.setProperty('--border', 'rgba(15,43,92,0.1)');
    document.documentElement.style.setProperty('--border2', 'rgba(15,43,92,0.25)');
    document.documentElement.style.setProperty('--text', '#0f172a');
    document.documentElement.style.setProperty('--text2', '#334155');
    document.documentElement.style.setProperty('--text3', '#64748b');
    document.documentElement.style.setProperty('--accent', '#0f2b5c'); // Deep Blue
    document.documentElement.style.setProperty('--accent2', '#1e40af'); // Vibrant Blue
    document.documentElement.style.setProperty('--red', '#c2185b'); // Crimson Red
    document.documentElement.style.setProperty('--blue', '#0f2b5c');

    // Dynamically inject matching browser tab icon (runner vector)
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.type = 'image/svg+xml';
    link.rel = 'shortcut icon';
    link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23c2185b"><circle cx="50" cy="50" r="40" fill="%230f2b5c"/><path d="M35 65 L45 35 L55 55 L65 35" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
    document.getElementsByTagName('head')[0].appendChild(link);
  }, []);

  useEffect(() => {
    const cachedLogs = localStorage.getItem('run_logs');
    if (cachedLogs) {
      try { setLogs(JSON.parse(cachedLogs)); } catch (e) { console.error(e); }
    }
    const cachedOverrides = localStorage.getItem('run_plan_overrides');
    if (cachedOverrides) {
      try { setPlanOverrides(JSON.parse(cachedOverrides)); } catch (e) { console.error(e); }
    }
    checkSupabaseConnection();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 4000);
  };

  const checkSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('run_logs').select('id').limit(1);
      if (!error) {
        setSupabaseConnected(true);
        showToast("Database Synced (Supabase Live)", "success");
        fetchAllData();
      } else {
        setSupabaseConnected(false);
        showToast("Offline Mode (Local Storage Only)", "warning");
      }
    } catch (err) {
      setSupabaseConnected(false);
      showToast("Offline Mode (Local Storage Only)", "warning");
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Logs
      const { data: logRows } = await supabase.from('run_logs').select('*');
      if (logRows) {
        const formatted = {};
        logRows.forEach(row => { formatted[row.id] = row; });
        setLogs(formatted);
        localStorage.setItem('run_logs', JSON.stringify(formatted));
      }

      // 2. Plan Customization Overrides
      const { data: overrideRows } = await supabase.from('run_plan_overrides').select('*');
      if (overrideRows) {
        const formatted = {};
        overrideRows.forEach(row => { formatted[row.id] = row; });
        setPlanOverrides(formatted);
        localStorage.setItem('run_plan_overrides', JSON.stringify(formatted));
      }

      // 3. Custom Coaching Strategies
      const { data: strategyRows } = await supabase.from('run_resources').select('*');
      if (strategyRows) setStrategies(strategyRows);

      // 4. Race Calendar
      const { data: raceRows } = await supabase.from('run_races').select('*');
      if (raceRows) setRaces(raceRows);

      // 5. Athlete Roster
      const { data: athleteRows } = await supabase.from('run_athletes').select('*');
      if (athleteRows) setAthletes(athleteRows);

      // 6. About Settings Profile
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
    showToast("Workout metrics saved!", "success");

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
    showToast("Workout log cleared.", "warning");

    if (supabaseConnected) {
      await supabase.from('run_logs').delete().eq('id', dayKey);
    }
  };

  // Callback to completely customize / overwrite a training day plan
  const handleSavePlanOverride = async (dayKey, overrideData) => {
    const updated = { ...planOverrides, [dayKey]: overrideData };
    setPlanOverrides(updated);
    localStorage.setItem('run_plan_overrides', JSON.stringify(updated));
    showToast("Training plan customized!", "success");

    if (supabaseConnected) {
      await supabase.from('run_plan_overrides').upsert({
        id: dayKey,
        w: activeWeek,
        d: overrideData.d,
        type: overrideData.type,
        desc: overrideData.desc,
        workout: overrideData.workout
      });
    }
  };

  const startWeek = (activeMonth - 1) * 4 + 1;
  const weeksInMonth = [startWeek, startWeek + 1, startWeek + 2, startWeek + 3];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* FLOATING CONNECTION TOAST */}
      {toast.visible && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 999,
          background: toast.type === 'success' ? '#f0faf3' : '#fdf0f0',
          border: `1px solid ${toast.type === 'success' ? '#a8dab5' : '#e8a0a0'}`,
          padding: '12px 20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          fontFamily: 'var(--font-mono)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px',
          color: toast.type === 'success' ? 'var(--green)' : 'var(--red)',
          transition: 'all 0.3s ease-in-out'
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: toast.type === 'success' ? 'var(--green)' : 'var(--red)' }} />
          {toast.message}
        </div>
      )}

      {/* NAVIGATION BAR WITH INTEGRATED ACTIVE DOT & ATHLETICS LOGO */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'var(--accent)', borderBottom: '3px solid var(--red)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', height: '58px', justifyContent: 'space-between' }}>
          
          <div onClick={() => setCurrentPage('home')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            {/* Elegant SVG Running Wings Logo */}
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>
              <circle cx="50" cy="50" r="45" fill="#ffffff" />
              <path d="M25 65 L45 35 L55 55 L75 25" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M45 65 L55 45 L65 55 L85 25" stroke="var(--red)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, letterSpacing: '0.04em', color: '#ffffff' }}>RUN/</span>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: supabaseConnected ? '#4ade80' : '#f87171', border: '1px solid #ffffff' }} />
          </div>

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
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>Race Plans</h3>
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
              <p style={{ fontSize: '13px', color: 'var(--text3)' }}>Log workout metrics, times, efforts, and details. Click any card to customize or edit the plan.</p>
            </div>

            {/* MONTH FILTER BLUEPRINTS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '1.5rem' }}>
              {[1, 2, 3, 4].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setActiveMonth(m);
                    setActiveWeek((m - 1) * 4 + 1); // Set automatically to the first week of that month block
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: activeMonth === m ? 'var(--accent)' : 'var(--bg2)',
                    color: activeMonth === m ? '#ffffff' : 'var(--text2)',
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    fontSize: '15px',
                    cursor: 'pointer'
                  }}
                >
                  Month {m} <span style={{ fontSize: '11px', display: 'block', fontWeight: 400, opacity: 0.8 }}>Wks {(m-1)*4 + 1}–{m*4}</span>
                </button>
              ))}
            </div>

            {/* WEEK SELECTOR SUB-PILLS */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.5rem', borderBottom: '1px dashed var(--border)', paddingBottom: '12px' }}>
              {weeksInMonth.map((wk) => (
                <button
                  key={wk}
                  onClick={() => setActiveWeek(wk)}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)',
                    background: activeWeek === wk ? 'var(--red)' : 'transparent',
                    color: activeWeek === wk ? '#ffffff' : 'var(--text3)',
                    cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600
                  }}
                >
                  Week {wk}
                </button>
              ))}
            </div>

            {/* DAY ITEM LISTS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                const dayKey = `w${activeWeek}d${dayNum}`;
                
                // Fetch the preset program day and merge with any active plan overrides in the database
                const defaultPlan = getDayPlan(activeWeek, dayNum);
                const overridePlan = planOverrides[dayKey] || {};
                const dayPlan = { ...defaultPlan, ...overridePlan };
                
                const loggedVal = logs[dayKey] || {};

                return (
                  <DayItem 
                    key={dayKey} 
                    dayKey={dayKey} 
                    day={dayPlan} 
                    logged={loggedVal} 
                    onSave={handleSaveLog} 
                    onClear={handleClearLog} 
                    onSavePlanOverride={handleSavePlanOverride}
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
