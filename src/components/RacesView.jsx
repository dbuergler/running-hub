import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Trash2 } from 'lucide-react';

export default function RacesView({ races, supabaseConnected, onRefresh }) {
  const [calendarType, setCalendarType] = useState('team');
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [dist, setDist] = useState('5K');
  const [status, setStatus] = useState('upcoming');
  const [notes, setNotes] = useState('');

  const handleAddRace = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (supabaseConnected) {
      const { error } = await supabase.from('run_races').insert({
        name, date, dist, status, ag: calendarType, notes
      });
      if (!error) {
        setName(''); setDate(''); setNotes('');
        onRefresh();
      }
    }
  };

  const handleDeleteRace = async (id) => {
    if (supabaseConnected) {
      await supabase.from('run_races').delete().eq('id', id);
      onRefresh();
    }
  };

  const defaultRaces = [
    { ag: 'team', name: 'Indiana XC Semi-State Invitational', date: '2026-10-24', dist: '5K', status: 'upcoming', notes: 'Key early season team target.' },
    { ag: 'personal', name: 'Indianapolis Monumental Marathon', date: '2026-11-07', dist: 'Marathon', status: 'goal', notes: 'Personal sub-3:15 target.' }
  ];

  const currentDisplayList = supabaseConnected ? races : defaultRaces;
  const filteredRaces = currentDisplayList.filter(r => (r.ag || 'team').toLowerCase() === calendarType);

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--accent)' }}>RACE SCHEDULES</h2>
        <p style={{ fontSize: '13px', color: 'var(--text3)' }}>Track personal and team schedules in one location.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
        <button onClick={() => setCalendarType('team')} style={{ flex: 1, padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', background: calendarType === 'team' ? 'var(--accent)' : 'var(--bg2)', color: calendarType === 'team' ? '#ffffff' : 'var(--text2)', fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>🛡️ Team Calendar</button>
        <button onClick={() => setCalendarType('personal')} style={{ flex: 1, padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', background: calendarType === 'personal' ? 'var(--red)' : 'var(--bg2)', color: calendarType === 'personal' ? '#ffffff' : 'var(--text2)', fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>🏃 Personal Calendar</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <form onSubmit={handleAddRace} style={{ background: 'var(--bg2)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: calendarType === 'team' ? 'var(--accent)' : 'var(--red)' }}>Add {calendarType === 'team' ? 'Team' : 'Personal'} Race</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Race Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Distance</label><input type="text" value={dist} onChange={e => setDist(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }}>
              <option value="upcoming">Upcoming</option>
              <option value="goal">Goal Event</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', minHeight: '80px' }} /></div>
          <button type="submit" disabled={!supabaseConnected} style={{ background: calendarType === 'team' ? 'var(--accent)' : 'var(--red)', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Schedule Race</button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredRaces.map((r) => (
            <div key={r.id || r.name} style={{ background: 'var(--bg2)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)', borderLeft: `5px solid ${calendarType === 'team' ? 'var(--accent)' : 'var(--red)'}`, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>{r.date}</span>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '3px 8px', borderRadius: '20px', background: '#e2e8f0', color: 'var(--text2)' }}>{r.status}</span>
              </div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>{r.name}</h4>
              <p style={{ fontSize: '12px', color: 'var(--text2)' }}><strong>Distance:</strong> {r.dist}</p>
              {r.notes && <p style={{ fontSize: '12px', color: 'var(--text3)', fontStyle: 'italic' }}>{r.notes}</p>}
              {supabaseConnected && r.id && <button onClick={() => handleDeleteRace(r.id)} style={{ alignSelf: 'flex-end', border: 'none', background: 'none', color: 'var(--red)', cursor: 'pointer' }}><Trash2 size={15} /></button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
