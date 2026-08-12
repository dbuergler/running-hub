import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Upload, Database, Trash2, Trophy } from 'lucide-react';

export default function AthletesView({ athletes, supabaseConnected, onRefresh, showToast }) {
  const [csvText, setCsvText] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [showImporter, setShowImporter] = useState(false);
  const [name, setName] = useState('');
  const [grad, setGrad] = useState('');
  const [team, setTeam] = useState('Varsity');
  const [event, setEvent] = useState('5K');
  const [xcpr, setXcpr] = useState('');

  const handleAddAthlete = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (supabaseConnected) {
      const { error } = await supabase.from('run_athletes').insert({
        id: Date.now(), 
        name, grad, team, event, xcpr
      });
      if (!error) {
        setName(''); setGrad(''); setXcpr('');
        showToast("Athlete successfully registered!", "success");
        onRefresh();
      } else {
        showToast("Error adding athlete: " + error.message, "warning");
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.name.endsWith('.docx') || file.name.endsWith('.pdf')) {
      showToast("Binary file loaded! For optimal results, copy-paste your text directly below.", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      setCsvText(evt.target.result);
      showToast(`Roster file "${file.name}" loaded successfully!`, "success");
    };
    reader.readAsText(file);
  };

  // Upgraded: Smart Regex Headerless Parser
  const handleBulkImport = async () => {
    if (!csvText.trim() || !supabaseConnected) return;

    try {
      const lines = csvText.split('\n').filter(line => line.trim() !== '');
      const dataToInsert = [];

      lines.forEach((line, index) => {
        const cols = line.split(/[,\t|]/).map(c => c.trim());
        if (cols.length === 0 || cols[0].toLowerCase().includes('name')) return;

        let athName = '';
        let athGrad = '';
        let athTeam = 'Varsity';
        let athEvent = '5K';
        let athPR = '';

        cols.forEach(col => {
          if (/^20\d{2}$/.test(col)) {
            athGrad = col;
          } else if (/^\d{1,2}:\d{2}(\.\d+)?$/.test(col)) {
            athPR = col;
          } else if (/^(varsity|jv|freshman|v|f)$/i.test(col)) {
            const lower = col.toLowerCase();
            athTeam = lower.startsWith('v') ? 'Varsity' : lower.startsWith('f') ? 'Freshman' : 'JV';
          } else if (/^(5k|mile|1600m|3200m|800m)$/i.test(col)) {
            athEvent = col;
          } else if (/^[a-zA-Z\s.-]+$/.test(col) && col.length > 2) {
            athName = col;
          }
        });

        if (athName) {
          dataToInsert.push({
            id: Date.now() + index,
            name: athName,
            grad: athGrad,
            team: athTeam,
            event: athEvent,
            xcpr: athPR
          });
        }
      });

      if (dataToInsert.length === 0) {
        showToast("Error: No valid athlete data found. Check spacing.", "warning");
        return;
      }

      const { error } = await supabase.from('run_athletes').upsert(dataToInsert);
      if (error) throw error;

      showToast(`Successfully imported ${dataToInsert.length} athletes!`, "success");
      setCsvText('');
      onRefresh();
    } catch (err) {
      showToast("Error importing roster: " + err.message, "warning");
    }
  };

  const handleDeleteAthlete = async (id) => {
    if (supabaseConnected) {
      await supabase.from('run_athletes').delete().eq('id', id);
      showToast("Athlete removed from roster.", "warning");
      onRefresh();
    }
  };

  // Team Stats Calculations
  const totalRoster = athletes.length;
  const varsityCount = athletes.filter(a => a.team === 'Varsity').length;
  const jvCount = athletes.filter(a => a.team === 'JV').length;

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--accent)' }}>TEAM ROSTER & STATS</h2>
          <p style={{ fontSize: '13px', color: 'var(--text3)' }}>Coordinate athletes, grad cycles, and manage season spreadsheets.</p>
        </div>
        <button onClick={() => setShowImporter(!showImporter)} className="btn-interactive" style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Upload size={14} /> {showImporter ? "Close Roster Importer" : "Bulk Upload Season Data"}
        </button>
      </div>

      {/* TEAM SQUAD QUICK STATS BAR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--bg2)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)', borderLeft: '5px solid var(--accent)' }}>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>TOTAL ATHLETES</span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'var(--accent)', marginTop: '2px' }}>{totalRoster} Runners</h3>
        </div>
        <div style={{ background: 'var(--bg2)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)', borderLeft: '5px solid var(--red)' }}>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>VARSITY SQUAD</span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'var(--red)', marginTop: '2px' }}>{varsityCount} Runners</h3>
        </div>
        <div style={{ background: 'var(--bg2)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)', borderLeft: '5px solid var(--accent2)' }}>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>JV / FRESHMAN</span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'var(--accent2)', marginTop: '2px' }}>{jvCount} Runners</h3>
        </div>
      </div>

      {showImporter && (
        <div style={{ background: '#f8fafc', border: '1px dashed var(--accent)', borderRadius: '10px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}><Database size={16} /> Bulk Spreadsheets Importer</h3>
          <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '1rem' }}>Upload any spreadsheet file (`.csv`, `.txt`, `.docx`, `.pdf`) or paste rows directly. No headers required—our smart parser automatically detects data!</p>
          
          <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontWeight: 600 }}>Upload Spreadsheet File (.csv, .txt, .docx, .pdf):</label>
            <input type="file" accept=".csv,.txt,.docx,.pdf" onChange={handleFileUpload} style={{ fontSize: '13px' }} />
          </div>

          <textarea value={csvText} onChange={e => setCsvText(e.target.value)} placeholder="Or paste manually here..." style={{ width: '100%', minHeight: '100px', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px', marginBottom: '1rem' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={handleBulkImport} disabled={!supabaseConnected} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Upload Data</button>
            {importStatus && <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{importStatus}</span>}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        <form onSubmit={handleAddAthlete} style={{ background: 'var(--bg2)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: 'var(--accent)' }}>Register Athlete</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Grad Class</label><input type="text" value={grad} onChange={e => setGrad(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Team Group</label>
              <select value={team} onChange={e => setTeam(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <option value="Varsity">Varsity</option><option value="JV">JV</option><option value="Freshman">Freshman</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Primary Event</label>
            <select value={event} onChange={e => setEvent(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }}>
              <option value="5K">5K XC / Track</option>
              <option value="10K">10K</option>
              <option value="Half Marathon">Half Marathon</option>
              <option value="Marathon">Marathon</option>
              <option value="Mile">Mile</option>
              <option value="800m">800m</option>
              <option value="400m">400m</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>PR</label><input type="text" value={xcpr} onChange={e => setXcpr(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
          <button type="submit" disabled={!supabaseConnected} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Add Athlete</button>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', alignContent: 'start' }}>
          {athletes.map((a) => (
            <div key={a.id || a.name} className="card-interactive" style={{ background: 'var(--bg2)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)', borderTop: `4px solid ${a.team === 'Varsity' ? 'var(--accent)' : 'var(--text3)'}`, display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>Grad: {a.grad || '—'}</span>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg3)' }}>{a.team}</span>
              </div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>{a.name}</h4>
              <p style={{ fontSize: '12px', color: 'var(--text2)' }}><strong>Event:</strong> {a.event || '—'}</p>
              {a.xcpr && <div style={{ marginTop: '5px', padding: '4px 8px', background: '#f8fafc', borderLeft: '3px solid var(--red)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}><strong>PR:</strong> {a.xcpr}</div>}
              {supabaseConnected && a.id && <button onClick={() => handleDeleteAthlete(a.id)} style={{ position: 'absolute', bottom: '12px', right: '12px', border: 'none', background: 'none', color: 'var(--red)', cursor: 'pointer' }}><Trash2 size={14} /></button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
