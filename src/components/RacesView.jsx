import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

// --- Bulletproof Custom Inline Calendar Icon ---
const CalendarIcon = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
  </svg>
);

export default function RacesView({ races, supabaseConnected, onRefresh }) {
  const [calendarType, setCalendarType] = useState('team'); // 'team' or 'personal'
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // 0 = Jan, 7 = Aug
  
  // Form states
  const [name, setName] = useState('');
  const [date, setDate] = useState('2026-08-10');
  const [dist, setDist] = useState('5K');
  const [status, setStatus] = useState('upcoming');
  const [notes, setNotes] = useState('');

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleAddRace = async (e) => {
    e.preventDefault();
    if (!name.trim() || !date) return;

    if (supabaseConnected) {
      const { error } = await supabase.from('run_races').insert({
        name,
        date,
        dist,
        status,
        ag: calendarType,
        notes
      });
      if (!error) {
        setName(''); setNotes('');
        onRefresh();
      } else {
        alert("Database error: " + error.message);
      }
    }
  };

  const handleDeleteRace = async (id) => {
    if (supabaseConnected) {
      await supabase.from('run_races').delete().eq('id', id);
      onRefresh();
    }
  };

  const handleDaySelect = (dayNum) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    setDate(`${currentYear}-${formattedMonth}-${formattedDay}`);
  };

  const defaultRaces = [
    { ag: 'team', name: 'Indiana XC Semi-State Invitational', date: '2026-08-24', dist: '5K', status: 'upcoming', notes: 'Key early season team target.' },
    { ag: 'personal', name: 'Indianapolis Monumental Marathon', date: '2026-11-07', dist: 'Marathon', status: 'goal', notes: 'Personal sub-3:15 attempt.' }
  ];

  const currentDisplayList = supabaseConnected ? races : defaultRaces;

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--accent)' }}>TEAM & PERSONAL CALENDARS</h2>
        <p style={{ fontSize: '13px', color: 'var(--text3)' }}>Plan upcoming events in an interactive grid view. Toggle between lists or add races directly by clicking any calendar day.</p>
      </div>

      {/* CALENDAR NAVIGATION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--accent)', color: '#fff', padding: '12px 20px', borderRadius: '10px 10px 0 0', borderBottom: '3px solid var(--red)' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{monthNames[currentMonth]} {currentYear}</h3>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><ChevronRight size={20} /></button>
      </div>

      {/* CALENDAR GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border2)', border: '1px solid var(--border2)', backgroundColor: 'var(--bg3)', marginBottom: '2rem' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{ background: '#f8fafc', padding: '10px', textAlign: 'center', fontWeight: 600, fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>{d}</div>
        ))}
        
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} style={{ background: 'var(--bg2)', minHeight: '85px', opacity: 0.5 }} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const formattedMonth = String(currentMonth + 1).padStart(2, '0');
          const formattedDay = String(dayNum).padStart(2, '0');
          const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;

          const dayRaces = currentDisplayList.filter(r => r.date === dateStr);

          return (
            <div 
              key={`day-${dayNum}`} 
              onClick={() => handleDaySelect(dayNum)}
              style={{ 
                background: 'var(--bg2)', minHeight: '85px', padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', border: date === dateStr ? '2px solid var(--red)' : 'none',
                transition: 'background 0.1s'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--bg2)'}
            >
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontWeight: 600 }}>{dayNum}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '5px' }}>
                {dayRaces.map((r, i) => {
                  const type = (r.ag || 'team').toLowerCase();
                  return (
                    <div 
                      key={r.id || i} 
                      style={{ 
                        fontSize: '9px', fontWeight: 600, padding: '2px 4px', borderRadius: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap',
                        background: type === 'team' ? '#dbeafe' : '#fce7f3',
                        color: type === 'team' ? 'var(--accent)' : 'var(--red)',
                        border: `1px solid ${type === 'team' ? '#93c5fd' : '#fbcfe8'}`
                      }}
                      title={`${r.name} (${r.dist})`}
                    >
                      {r.name}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* CONTROLS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div>
          <form onSubmit={handleAddRace} style={{ background: 'var(--bg2)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CalendarIcon size={18} /> Schedule Race Event
            </h3>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setCalendarType('team')} style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', background: calendarType === 'team' ? 'var(--accent)' : 'var(--bg2)', color: calendarType === 'team' ? '#ffffff' : 'var(--text2)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>🛡️ Team Target</button>
              <button type="button" onClick={() => setCalendarType('personal')} style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', background: calendarType === 'personal' ? 'var(--red)' : 'var(--bg2)', color: calendarType === 'personal' ? '#ffffff' : 'var(--text2)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>🏃 Personal Goal</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Race Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. State Championship" style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Scheduled Date (Click grid day to set)</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Distance</label>
                <input type="text" value={dist} onChange={e => setDist(e.target.value)} placeholder="e.g. 5K" style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <option value="upcoming">Upcoming</option>
                  <option value="goal">Goal Event</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Target Pace / Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Strategy notes..." style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', minHeight: '60px' }} />
            </div>
            <button type="submit" disabled={!supabaseConnected} style={{ background: calendarType === 'team' ? 'var(--accent)' : 'var(--red)', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              {supabaseConnected ? "Schedule Event" : "Offline"}
            </button>
          </form>
        </div>

        {/* Right Side: List overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CalendarIcon size={18} /> Races This Year
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }}>
            {currentDisplayList.filter(r => new Date(r.date).getFullYear() === currentYear).map((r) => {
              const isTeam = (r.ag || 'team').toLowerCase() === 'team';
              return (
                <div key={r.id || r.name} style={{ background: 'var(--bg2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', borderLeft: `4px solid ${isTeam ? 'var(--accent)' : 'var(--red)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{r.name} ({r.dist})</h4>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>{r.date} · {isTeam ? "Team" : "Personal"}</span>
                  </div>
                  {supabaseConnected && r.id && (
                    <button onClick={() => handleDeleteRace(r.id)} style={{ border: 'none', background: 'none', color: 'var(--red)', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
