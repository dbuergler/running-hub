import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Zap, CheckSquare, Compass, ShieldAlert, Trash2 } from 'lucide-react';

export default function StrategiesView({ strategies, supabaseConnected, onRefresh }) {
  const [activeTab, setActiveTab] = useState('tactics');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [cat, setCat] = useState('Tactics');
  const [tags, setTags] = useState('');

  const handleAddStrategy = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (supabaseConnected) {
      const { error } = await supabase.from('run_resources').insert({
        title, content, cat, tags
      });
      if (!error) {
        setTitle(''); setContent(''); setTags('');
        onRefresh();
      }
    } else {
      alert("Database connection required to save strategies.");
    }
  };

  const handleDelete = async (id) => {
    if (supabaseConnected) {
      await supabase.from('run_resources').delete().eq('id', id);
      onRefresh();
    }
  };

  const defaultStrategies = [
    { cat: 'Tactics', title: 'XC Goal Pacing', content: 'Run even effort, not even splits. Settle the first mile, work the second mile, and run the third mile on raw strength.', tags: 'Pacing, XC' },
    { cat: 'Terrain', title: 'Up-Hill Mechanics', content: 'Shorten stride, elevate arm drive, and charge for 10 paces over the crest to establish visual gaps.', tags: 'Hills, Strength' },
    { cat: 'Terrain', title: 'Mud & Loose Grass', content: 'Shorten stride length and increase your cadence slightly to limit slipping.', tags: 'Footing, Mud' }
  ];

  const currentDisplayList = supabaseConnected ? strategies : defaultStrategies;

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--accent)' }}>STRATEGIES PORTAL</h2>
        <p style={{ fontSize: '13px', color: 'var(--text3)' }}>Add and configure custom pacing plans, checklist routines, and hill strategy notes.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <form onSubmit={handleAddStrategy} style={{ background: 'var(--bg2)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: 'var(--accent)' }}>Create New Strategy</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Strategy Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Settle & Surge" required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Category</label>
            <select value={cat} onChange={e => setCat(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }}>
              <option value="Tactics">Tactics</option>
              <option value="Terrain">Terrain</option>
              <option value="Checklist">Checklist</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Tags</label>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="XC, Speed" style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Instruction Details</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} required placeholder="Instructions for runners..." style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', minHeight: '100px' }} />
          </div>
          <button type="submit" disabled={!supabaseConnected} style={{ background: 'var(--red)', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
            {supabaseConnected ? "Add to Database" : "Database Offline"}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
            {['Tactics', 'Terrain', 'Checklist'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} style={{ background: 'none', border: 'none', padding: '6px 12px', fontWeight: 700, color: activeTab === tab.toLowerCase() ? 'var(--red)' : 'var(--text3)', borderBottom: activeTab === tab.toLowerCase() ? '2px solid var(--red)' : 'none', cursor: 'pointer' }}>{tab}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentDisplayList.filter(s => s.cat.toLowerCase() === activeTab).map((s) => (
              <div key={s.id || s.title} style={{ background: 'var(--bg2)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border)', borderLeft: '4px solid var(--accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>{s.title}</h4>
                  {supabaseConnected && s.id && (
                    <button onClick={() => handleDelete(s.id)} style={{ border: 'none', background: 'none', color: 'var(--red)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '8px', lineHeight: 1.6 }}>{s.content}</p>
                {s.tags && (
                  <div style={{ marginTop: '10px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {s.tags.split(',').map(tag => (
                      <span key={tag} style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', background: 'var(--bg3)', padding: '2px 6px', borderRadius: '4px' }}>{tag.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
