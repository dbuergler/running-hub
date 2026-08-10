import React, { useState } from 'react';
import { Edit2, MapPin, Trophy, User } from 'lucide-react';

export default function AboutView({ profile, supabaseConnected, onSaveProfile }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [location, setLocation] = useState(profile.location);
  const [bio, setBio] = useState(profile.bio);
  const [achievements, setAchievements] = useState(profile.achievements);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveProfile({ name, role, location, bio, achievements });
    setEditing(false);
  };

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Accolades</label><input type="text" value={achievements} onChange={e => setAchievements(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Bio</label><textarea value={bio} onChange={e => setBio(e.target.value)} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', minHeight: '100px' }} /></div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" disabled={!supabaseConnected} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Save Profile</button>
            <button type="button" onClick={() => setEditing(false)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          <div style={{ background: 'var(--accent)', color: '#ffffff', borderRadius: '15px', padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', borderBottom: '6px solid var(--red)' }}>
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
          <div style={{ background: 'var(--bg2)', padding: '2rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--accent)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={18} /> Coaching Bio</h3>
            <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.7 }}>{profile.bio}</p>
          </div>
        </div>
      )}
    </div>
  );
}
