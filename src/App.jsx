import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Award, RefreshCw, Flame, Users, Activity, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

// Import our modular view components
import DayItem from './components/DayItem';
import StrategiesView from './components/StrategiesView';
import RacesView from './components/RacesView';
import AthletesView from './components/AthletesView';
import AboutView from './components/AboutView';
import CoachingCalculator from './components/CoachingCalculator';

// --- Dynamic 16-Week Plan Generator ---
const getWorkoutForDay = (w, d) => {
  if (d === 6) return { type: 'rest', desc: 'Rest Day' };
  if (d === 7) {
    const miles = 8 + Math.min(w, 8);
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

// Map actual calendar dates to 16-week cycle starting July 20, 2026
const getPlanDayFromDate = (year, month, dayNum) => {
  const date = new Date(Date.UTC(year, month, dayNum));
  const start = new Date(Date.UTC(2026, 6, 20)); // July 20, 2026
  const diffTime = date.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays >= 0 && diffDays < 112) {
    const week = Math.floor(diffDays / 7) + 1;
    const day = (diffDays % 7) + 1;
    return { week, day, key: `w${week}d${day}` };
  }
  return null;
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [logs, setLogs] = useState({});
  const [planOverrides, setPlanOverrides] = useState({});
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  // Calendar State for Training Tracker
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // Default to August (7)
  const [selectedDayInfo, setSelectedDayInfo] = useState(null); // { week, day, key, plan, dateStr }

  // Dynamic state caches
  const [strategies, setStrategies] = useState([]);
  const [races, setRaces] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [xcResults, setXcResults] = useState([]);
  const [aboutProfile, setAboutProfile] = useState({
    name: 'Coach Daniel',
    role: 'Head Cross Country & Track Coach',
    location: 'Indianapolis, IN',
    bio: 'Dedicated to developing balanced runners, building strategic physical base capacities, and structuring positive team athletic programs.',
    achievements: '3x State Qualifier Appearances · 12 All-Conference Runners coached'
  });

  const monthNames = ["July", "August", "September", "October", "November"];
  const calendarMonths = [6, 7, 8, 9, 10]; // July (6) to Nov (10)

  useEffect(() => {
    document.documentElement.style.setProperty('--bg', '#f1f5f9');
    document.documentElement.style.setProperty('--bg2', '#ffffff');
    document.documentElement.style.setProperty('--bg3', '#e2e8f0');
    document.documentElement.style.setProperty('--border', 'rgba(15,43,92,0.1)');
    document.documentElement.style.setProperty('--border2', 'rgba(15,43,92,0.25)');
    document.documentElement.style.setProperty('--text', '#0f172a');
    document.documentElement.style.setProperty('--text2', '#334155');
    document.documentElement.style.setProperty('--text3', '#64748b');
    document.documentElement.style.setProperty('--accent', '#0f2b5c'); 
    document.documentElement.style.setProperty('--accent2', '#1e40af'); 
    document.documentElement.style.setProperty('--red', '#c2185b'); 
    document.documentElement.style.setProperty('--blue', '#0f2b5c');
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
      const { data: logRows } = await supabase.from('run_logs').select('*');
      if (logRows) {
        const formatted = {};
        logRows.forEach(row => { formatted[row.id] = row; });
        setLogs(formatted);
        localStorage.setItem('run_logs', JSON.stringify(formatted));
      }

      const { data: overrideRows } = await supabase.from('run_plan_overrides').select('*');
      if (overrideRows) {
        const formatted = {};
        overrideRows.forEach(row => { formatted[row.id] = row; });
        setPlanOverrides(formatted);
        localStorage.setItem('run_plan_overrides', JSON.stringify(formatted));
      }

      const { data: strategyRows } = await supabase.from('run_resources').select('*');
      if (strategyRows) setStrategies(strategyRows);

      const { data: raceRows } = await supabase.from('run_races').select('*');
      if (raceRows) setRaces(raceRows);

      const { data: athleteRows } = await supabase.from('run_athletes').select('*');
      if (athleteRows) setAthletes(athleteRows);

      const { data: xcRows } = await supabase.from('run_xc').select('*');
      if (xcRows) setXcResults(xcRows);

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
    fetchAllData();
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
    fetchAllData();
  };

  const handleSavePlanOverride = async (dayKey, overrideData) => {
    const updated = { ...planOverrides, [dayKey]: overrideData };
    setPlanOverrides(updated);
    localStorage.setItem('run_plan_overrides', JSON.stringify(updated));
    showToast("Training plan customized!", "success");

    if (supabaseConnected) {
      await supabase.from('run_plan_overrides').upsert({
        id: dayKey,
        w: overrideData.w,
        d: overrideData.d,
        type: overrideData.type,
        desc: overrideData.desc,
        workout: overrideData.workout
      });
    }
    fetchAllData();
  };

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* TOAST SYSTEM */}
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

      {/* NAVBAR */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'var(--accent)', borderBottom: '3px solid var(--red)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', height: '58px', justifyContent: 'space-between' }}>
          
          <div onClick={() => setCurrentPage('home')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>
              <circle cx="50" cy="50" r="45" fill="#ffffff" />
              <path d="M25 65 L45 35 L55 55 L75 25" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M45 65 L55 45 L65 55 L85 25" stroke="var(--red)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: supabaseConnected ? '#4ade80' : '#f87171', border: '1px solid #ffffff' }} />
          </div>

          <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
            {['tracker', 'strategies', 'races', 'athletes', 'paces', 'about'].map((tab) => (
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

      {/* CONTENT */}
      <main style={{ flex: 1, paddingTop: '80px', maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '80px 2rem 4rem' }}>
        
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
                <Activity style={{ color: 'var(--accent)', marginBottom: '10px' }} />
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

        {/* TRACKER VIEW - REDESIGNED AS EDITABLE CALENDAR */}
        {currentPage === 'tracker' && (
          <div>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--accent)' }}>TRAINING LOG CALENDAR</h2>
              <p style={{ fontSize: '13px', color: 'var(--text3)' }}>Plan and log your training cycle inside an interactive calendar grid. Click any calendar day to log metrics or edit the prescription.</p>
            </div>

            {/* MONTH FILTER BUTTONS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '1.5rem' }}>
              {calendarMonths.map((mIdx) => (
                <button
                  key={mIdx}
                  onClick={() => {
                    setCurrentMonth(mIdx);
                    setSelectedDayInfo(null);
                  }}
                  style={{
                    padding: '12px', borderRadius: '8px', border: '1px solid var(--border)',
                    background: currentMonth === mIdx ? 'var(--accent)' : 'var(--bg2)',
                    color: currentMonth === mIdx ? '#ffffff' : 'var(--text2)',
                    fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: '15px', cursor: 'pointer'
                  }}
                >
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][mIdx]}
                </button>
              ))}
            </div>

            {/* CALENDAR GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border2)', border: '1px solid var(--border2)', backgroundColor: 'var(--bg3)', marginBottom: '2rem' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} style={{ background: '#f8fafc', padding: '10px', textAlign: 'center', fontWeight: 600, fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>{d}</div>
              ))}
              
              {/* Fill blanks */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`tracker-empty-${i}`} style={{ background: 'var(--bg2)', minHeight: '95px', opacity: 0.5 }} />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateInfo = getPlanDayFromDate(currentYear, currentMonth, dayNum);
                
                let dayPlan = null;
                let log = {};
                if (dateInfo) {
                  const defaultPlan = getDayPlan(dateInfo.week, dateInfo.day);
                  const overridePlan = planOverrides[dateInfo.key] || {};
                  dayPlan = { ...defaultPlan, ...overridePlan };
                  log = logs[dateInfo.key] || {};
                }

                const badgeColors = {
                  easy: '#e0f2fe', long: '#e0e7ff', tempo: '#fef3c7', intervals: '#fce7f3', hills: '#f3e8ff', rest: '#e2e8f0'
                };
                const bgTypeColor = dayPlan ? (badgeColors[dayPlan.type] || '#f1f5f9') : '#ffffff';

                return (
                  <div
                    key={`tracker-day-${dayNum}`}
                    onClick={() => {
                      if (dateInfo && dayPlan) {
                        setSelectedDayInfo({
                          week: dateInfo.week,
                          day: dateInfo.day,
                          key: dateInfo.key,
                          plan: dayPlan,
                          dateStr: `${monthNames[currentMonth - 6]} ${dayNum}, ${currentYear}`
                        });
                      }
                    }}
                    style={{
                      background: 'var(--bg2)', minHeight: '95px', padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      cursor: dateInfo ? 'pointer' : 'default',
                      border: selectedDayInfo?.key === dateInfo?.key && dateInfo ? '2.5px solid var(--accent)' : 'none',
                      opacity: dateInfo ? 1 : 0.4
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontWeight: 600 }}>{dayNum}</span>
                      {log.done && <span style={{ fontSize: '10px', color: 'var(--green)' }}>✓ {log.miles}m</span>}
                    </div>

                    {dayPlan ? (
                      <div style={{ 
                        fontSize: '9px', padding: '3px 4px', borderRadius: '4px', background: bgTypeColor, color: 'var(--text)', 
                        fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap'
                      }}>
                        {dayPlan.desc}
                      </div>
                    ) : (
                      <span style={{ fontSize: '9px', color: 'var(--text3)', fontStyle: 'italic' }}>No training</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* EDITABLE SELECTION DRAWER */}
            {selectedDayInfo && (
              <div style={{ marginTop: '1.5rem', borderTop: '2px solid var(--accent)', paddingTop: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--accent)', marginBottom: '1rem' }}>
                  Logs and Customization for {selectedDayInfo.dateStr} (Week {selectedDayInfo.week}, Day {selectedDayInfo.day})
                </h3>
                <DayItem 
                  key={selectedDayInfo.key}
                  dayKey={selectedDayInfo.key}
                  day={selectedDayInfo.plan}
                  logged={logs[selectedDayInfo.key] || {}}
                  onSave={handleSaveLog}
                  onClear={handleClearLog}
                  onSavePlanOverride={handleSavePlanOverride}
                />
              </div>
            )}
          </div>
        )}

        {currentPage === 'strategies' && (
          <StrategiesView 
            strategies={strategies} xcResults={xcResults} athletes={athletes} supabaseConnected={supabaseConnected} onRefresh={fetchAllData} 
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

        {currentPage === 'paces' && (
          <CoachingCalculator />
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
