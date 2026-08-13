import React, { useState } from 'react';
import { Edit2, MapPin, Trophy, User, Megaphone } from 'lucide-react';
import RoncalliLogo from './RoncalliLogo';

export default function AboutView({ profile, athletes = [], supabaseConnected, onSaveProfile, showToast }) {
  const [editing, setEditing] = useState(false);
  
  // Profile forms
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [location, setLocation] = useState(profile.location);
  const [bio, setBio] = useState(profile.bio);
  const [achievements, setAchievements] = useState(profile.achievements);
  const [weeklyMessage, setWeeklyMessage] = useState(profile.weeklyMessage || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveProfile({ 
      name, role, location, bio, achievements, weeklyMessage
    });
    setEditing(false);
  };

  const parseTimeToSeconds = (t) => {
    if (!t) return 999999;
    const parts = t.split(':').map(Number);
    if (parts.length !== 2) return 999999;
    return parts[0] * 60 + parts[1];
  };

  // Safe fallback guard to guarantee athletes array is iterable
  const safeAthletes = Array.isArray(athletes) ? athletes : [];
  const sortedLeaderboard = [...safeAthletes]
    .filter(a => a.xcpr)
    .sort((a, b) => parseTimeToSeconds(a.xcpr) - parseTimeToSeconds(b.xcpr))
    .slice(0, 5);

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--accent)' }}>COACHING PROFILE</h2>
          <p style={{ fontSize: '13px', color: 'var(--text3)' }}>Update and view your dynamic profile credentials, philosophy, and achievements.</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="btn-interactive" style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
            
            {/* Visual card featuring Roncalli R logo */}
            <div style={{ background: 'var(--accent)', color: '#ffffff', borderRadius: '15px', padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', borderBottom: '6px solid var(--red)', boxShadow: '0 10px 15px -3px rgba(15,43,92,0.15)' }}>
              <RoncalliLogo size={80} />
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

          {/* DYNAMIC TEAM LEADERBOARD */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--accent)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Trophy size={20} /> TEAM 5K LEADERBOARD</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', gridColumn: 'span 2' }}>
                {sortedLeaderboard.map((item, index) => (
                  <div key={item.id || index} style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'var(--bg2)', padding: '12px 18px', borderRadius: '10px', border: '1px solid var(--border)', borderLeft: index === 0 ? '5px solid #fbbf24' : '5px solid var(--accent)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: index === 0 ? '#fbbf24' : 'var(--text2)', minWidth: '30px' }}>#{index + 1}</span>
                    <div>
                      <span style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 700 }}>{item.name}</span>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text3)', display: 'block' }}>{item.team} · Class of {item.grad}</span>
                    </div>
                    <span style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--red)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {index === 0 && <Trophy size={16} color="#fbbf24" />} {item.xcpr}
                    </span>
                  </div>
                ))}
                {sortedLeaderboard.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '13px', padding: '2rem 0' }}>No athletes with logged PRs found on the roster yet.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
