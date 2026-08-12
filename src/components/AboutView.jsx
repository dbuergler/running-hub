import React, { useState } from 'react';
import { Edit2, MapPin, Trophy, User, Megaphone, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function AboutView({ profile, supabaseConnected, onSaveProfile, showToast }) {
  const [editing, setEditing] = useState(false);
  
  // Profile forms
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [location, setLocation] = useState(profile.location);
  const [bio, setBio] = useState(profile.bio);
  const [achievements, setAchievements] = useState(profile.achievements);
  const [weeklyMessage, setWeeklyMessage] = useState(profile.weeklyMessage || '');

  // Accomplishments Timeline states
  const [newHonor, setNewHonor] = useState('');
  const [newYear, setNewYear] = useState('2026');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveProfile({ 
      name, role, location, bio, achievements, weeklyMessage, 
      accomplishments: profile.accomplishments || [] 
    });
    setEditing(false);
  };

  const handleAddHonor = () => {
    if (!newHonor.trim()) return;
    const honorsList = profile.accomplishments || [];
    const updatedHonors = [...honorsList, { year: newYear, title: newHonor }].sort((a,b) => b.year - a.year);
    
    onSaveProfile({ ...profile, accomplishments: updatedHonors });
    setNewHonor('');
    showToast("Honor successfully recorded!", "success");
  };

  const handleDeleteHonor = (indexToDelete) => {
    const honorsList = profile.accomplishments || [];
    const updatedHonors = honorsList.filter((_, i) => i !== indexToDelete);
    onSaveProfile({ ...profile, accomplishments: updatedHonors });
    showToast("Honor entry deleted.", "warning");
  };

  const dynamicHonors = profile.accomplishments || [
    { year: '2025', title: 'XC Boys Sectional Champions' },
    { year: '2024', title: 'Marion County Coach of the Year' }
  ];

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--accent)' }}>COACHING PROFILE</h2>
          <p style={{ fontSize: '13px', color: 'var(--text3)' }}>Update and view your dynamic profile credentials, philosophy, and achievements.</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Edit2 size={14} /> Edit Profile
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} style={{ background: 'var(--bg2)', padding: '2rem', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>Edit Coach Profile</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Coaching Title</label><input type="text" value={role} onChange={e => setRole(e.target.value)} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Location</label><input type="text" value={location} onChange={e => setLocation(e.target.value)} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Overview Accolades</label><input type="text" value={achievements} onChange={e => setAchievements(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Weekly Team Announcement</label><input type="text" value={weeklyMessage} onChange={e => setWeeklyMessage(e.target.value)} placeholder="Announcements displayed on about page..." style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Bio</label><textarea value={bio} onChange={e => setBio(e.target.value)} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', minHeight: '100px' }} /></div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" disabled={!supabaseConnected} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Save Profile</button>
            <button type="button" onClick={() => setEditing(false)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Weekly Announcement Bulletin Banner */}
          {profile.weeklyMessage && (
            <div style={{ background: 'var(--bg2)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)', borderLeft: '5px solid var(--red)', display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(15,43,92,0.05)' }}>
              <Megaphone style={{ color: 'var(--red)', flexShrink: 0 }} size={24} />
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase' }}>Weekly Team Announcement</span>
                <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 500, marginTop: '2px' }}>{profile.weeklyMessage}</p>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            
            {/* Visual card */}
            <div style={{ background: 'var(--accent)', color: '#ffffff', borderRadius: '15px', padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', borderBottom: '6px solid var(--red)', boxShadow: '0 10px 15px -3px rgba(15,43,92,0.15)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, color: 'var(--accent)' }}>
                {profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700 }}>{profile.name}</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>{profile.role}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '1rem', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {profile.location}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Trophy size={14} /> {profile.achievements || 'No highlights declared.'}</div>
              </div>
            </div>

            {/* Philosophy details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: 'var(--bg2)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(15,43,92,0.05)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--accent)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={18} /> Coaching Bio & Principles</h3>
                <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7 }}>{profile.bio}</p>
              </div>
            </div>
          </div>

          {/* DYNAMIC ACCOMPLISHMENTS TIMELINE */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--accent)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Trophy size={20} /> TEAM CHAMPIONSHIPS & HONORS</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              {/* Form */}
              <div style={{ background: 'var(--bg2)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--accent)', marginBottom: '12px' }}>Log New Team Honor</h4>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input type="text" value={newYear} onChange={e => setNewYear(e.target.value)} placeholder="Year" style={{ width: '80px', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
                  <input type="text" value={newHonor} onChange={e => setNewHonor(e.target.value)} placeholder="e.g. Marion County Champions" style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
                </div>
                <button onClick={handleAddHonor} style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Plus size={14} /> Add Achievement</button>
              </div>

              {/* Timeline list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {dynamicHonors.map((item, index) => (
                  <div key={index} style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'var(--bg2)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border)', position: 'relative' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--red)', minWidth: '40px' }}>{item.year}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 600 }}>{item.title}</span>
                    <button onClick={() => handleDeleteHonor(index)} style={{ border: 'none', background: 'none', color: 'var(--text3)', cursor: 'pointer', marginLeft: 'auto' }}><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
