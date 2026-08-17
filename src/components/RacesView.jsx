import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '../App';

const CalendarIcon = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
  </svg>
);

export default function RacesView({ races, supabaseConnected, onRefresh, showToast }) {
  const [calendarType, setCalendarType] = useState('team');
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // Aug
  
  // Modal States
  const [selectedRaceModal, setSelectedRaceModal] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

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
      setCurrentMonth(11); setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0); setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleAddRace = async (e) => {
    e.preventDefault();
    if (!name.trim() || !date) return;

    if (supabaseConnected) {
      const { error } = await supabase.from('run_races').insert({
        id: Date.now(), 
        name, date, dist, status, ag: calendarType, notes
      });
      if (!error) {
        setName(''); setNotes('');
        setShowScheduleModal(false);
        showToast("Race successfully scheduled!", "success");
        onRefresh();
      } else {
        showToast("Error scheduling event: " + error.message, "warning");
      }
    }
  };

  const handleDeleteRace = async (id) => {
    if (supabaseConnected) {
      await supabase.from('run_races').delete().eq('id', id);
      setSelectedRaceModal(null);
      showToast("Race event deleted.", "warning");
      onRefresh();
    }
  };

  const handleDaySelect = (dayNum) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    setDate(`${currentYear}-${formattedMonth}-${formattedDay}`);
    setShowScheduleModal(true);
  };

  const defaultRaces = [
    { ag: 'team', name: 'Indiana XC Semi-State Invitational', date: '2026-08-24', dist: '5K', status: 'upcoming', notes: 'Key early season team target.' },
    { ag: 'personal', name: 'Indianapolis Monumental Marathon', date: '2026-11-07', dist: 'Marathon', status: 'goal', notes: 'Personal sub-3:15 attempt.' }
  ];

  const currentDisplayList = supabaseConnected ? races : defaultRaces;
  const filteredRaces = currentDisplayList.filter(r => (r.ag || 'team').toLowerCase() === calendarType);

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--accent)' }}>TEAM & PERSONAL CALENDARS</h2>
          <p style={{ fontSize: '13px', color: 'var(--text3)' }}>Plan upcoming events in an interactive grid view. Switch between lists or schedule events.</p>
        </div>
        <button onClick={() => setShowScheduleModal(true)} className="btn-interactive" style={{ background: 'var(--red)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CalendarIcon size={14} /> Schedule Event
        </button>
      </div>

      {/* SIDE-BY-SIDE GRID LAYOUT: Left = Calendar Grid, Right = Races This Year List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* LEFT SIDE: MONTHLY GRID CALENDAR */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--accent)', color: '#fff', padding: '12px 20px', borderRadius: '10px 10px 0 0', borderBottom: '3px solid var(--red)' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, textTransform: 'uppercase' }}>{monthNames[currentMonth]} {currentYear}</h3>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><ChevronRight size={20} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border2)', border: '1px solid var(--border2)', backgroundColor: 'var(--bg3)', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} style={{ background: '#f8fafc', padding: '8px', textAlign: 'center', fontWeight: 600, fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>{d}</div>
            ))}
            
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} style={{ background: 'var(--bg2)', minHeight: '75px', opacity: 0.5 }} />
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
                    background: 'var(--bg2)', minHeight: '75px', padding: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', border: date === dateStr ? '2px solid var(--red)' : 'none',
                    transition: 'background 0.1s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseOut={e => e.currentTarget.style.background = 'var(--bg2)'}
                >
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontWeight: 600 }}>{dayNum}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '3px' }}>
                    {dayRaces.map((r, i) => {
                      const type = (r.ag || 'team').toLowerCase();
                      return (
                        <div 
                          key={r.id || i} 
                          onClick={(e) => { e.stopPropagation(); setSelectedRaceModal(r); }}
                          style={{ 
                            fontSize: '8.5px', fontWeight: 600, padding: '2px 4px', borderRadius: '3px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap',
                            background: type === 'team' ? '#dbeafe' : '#fce7f3',
                            color: type === 'team' ? 'var(--accent)' : 'var(--red)',
                            border: `1px solid ${type === 'team' ? '#93c5fd' : '#fbcfe8'}`
                          }}
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
        </div>

        {/* RIGHT SIDE: RACES THIS YEAR LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            <button onClick={() => setCalendarType('team')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: calendarType === 'team' ? 'var(--accent)' : 'var(--bg2)', color: calendarType === 'team' ? '#ffffff' : 'var(--text2)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>🛡️ Team Target</button>
            <button onClick={() => setCalendarType('personal')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: calendarType === 'personal' ? 'var(--red)' : 'var(--bg2)', color: calendarType === 'personal' ? '#ffffff' : 'var(--text2)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>🏃 Personal Goal</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
            {filteredRaces.map((r) => {
              const isTeam = (r.ag || 'team').toLowerCase() === 'team';
              return (
                <div key={r.id || r.name} onClick={() => setSelectedRaceModal(r)} className="card-interactive" style={{ background: 'var(--bg2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', borderLeft: `4px solid ${isTeam ? 'var(--accent)' : 'var(--red)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{r.name} ({r.dist})</h4>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>{r.date} · {isTeam ? "Team" : "Personal"}</span>
                  </div>
                </div>
              );
            })}
            {filteredRaces.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '12px', padding: '3rem 0' }}>No races listed on this schedule yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* SCHEDULE RACE EVENT MODAL */}
      <Modal 
        isOpen={showScheduleModal} 
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Race Event"
      >
        <form onSubmit={handleAddRace} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => setCalendarType('team')} style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', background: calendarType === 'team' ? 'var(--accent)' : 'var(--bg2)', color: calendarType === 'team' ? '#ffffff' : 'var(--text2)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>🛡️ Team Target</button>
            <button type="button" onClick={() => setCalendarType('personal')} style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', background: calendarType === 'personal' ? 'var(--red)' : 'var(--bg2)', color: calendarType === 'personal' ? '#ffffff' : 'var(--text2)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>🏃 Personal Goal</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Race Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. State Championship" style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Scheduled Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Distance</label>
              <select value={dist} onChange={e => setDist(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <option value="5K">5K XC / Track</option>
                <option value="10K">10K</option>
                <option value="Half Marathon">Half Marathon</option>
                <option value="Marathon">Marathon</option>
                <option value="Mile">Mile</option>
                <option value="800m">800m</option>
                <option value="Other">Other</option>
              </select>
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
          <button type="submit" disabled={!supabaseConnected} className="btn-interactive" style={{ background: calendarType === 'team' ? 'var(--accent)' : 'var(--red)', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
            {supabaseConnected ? "Schedule Event" : "Offline"}
          </button>
        </form>
      </Modal>

      {/* RACE DETAILS & DELETE MODAL */}
      <Modal 
        isOpen={!!selectedRaceModal} 
        onClose={() => setSelectedRaceModal(null)}
        title={selectedRaceModal?.name || ''}
      >
        {selectedRaceModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '13px', color: 'var(--text2)' }}><strong>Date:</strong> {selectedRaceModal.date}</p>
            <p style={{ fontSize: '13px', color: 'var(--text2)' }}><strong>Distance:</strong> {selectedRaceModal.dist}</p>
            <p style={{ fontSize: '13px', color: 'var(--text2)' }}><strong>Target Type:</strong> {(selectedRaceModal.ag || 'team').toUpperCase()}</p>
            {selectedRaceModal.notes && <p style={{ fontSize: '13px', color: 'var(--text3)', fontStyle: 'italic' }}>{selectedRaceModal.notes}</p>}
            {supabaseConnected && selectedRaceModal.id && (
              <button 
                onClick={() => handleDeleteRace(selectedRaceModal.id)} 
                style={{ border: 'none', background: 'var(--red)', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}
              >
                <Trash2 size={14} /> Delete Event
              </button>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
}
