import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Upload, Database, Trash2 } from 'lucide-react';

export default function AthletesView({ athletes, supabaseConnected, onRefresh }) {
  const [csvText, setCsvText] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [showImporter, setShowImporter] = useState(false);
  const [name, setName] = useState('');
  const [grad, setGrad] = useState('');
  const [team, setTeam] = useState('Varsity');
  const [event, setEvent] = useState('');
  const [xcpr, setXcpr] = useState('');

  const handleAddAthlete = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (supabaseConnected) {
      // FIX: Generate unique ID on the frontend using Date.now() to bypass the null primary key constraint
      const { error } = await supabase.from('run_athletes').insert({
        id: Date.now(), 
        name, grad, team, event, xcpr
      });
      if (!error) {
        setName(''); setGrad(''); setEvent(''); setXcpr('');
        onRefresh();
      }
    }
  };

  // Browser-based spreadsheet reader supporting CSV, Plain Text, and DOCX document selections
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Word Docx are binary zip archives. If they select .docx, we guide them to save as text or paste,
    // otherwise we read the raw text for CSV and TXT files instantly.
    if (file.name.endsWith('.docx')) {
      setImportStatus("Word .docx files are compressed. For optimal formatting accuracy, please save your document as a Plain Text (.txt) or .csv file before selecting, or paste your rows directly below!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      setCsvText(evt.target.result);
      setImportStatus(`File "${file.name}" loaded successfully. Click Upload below.`);
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (!csvText.trim() || !supabaseConnected) return;
    setImportStatus('Processing roster data...');

    try {
      const rows = csvText.split('\n').filter(line => line.trim() !== '');
      if (rows.length < 2) {
        setImportStatus('Error: Require headers + data.');
        return;
      }

      const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
      const dataToInsert = [];

      for (let i = 1; i < rows.length; i++) {
        const columns = rows[i].split(',').map(c => c.trim());
        const athleteObj = {};

        headers.forEach((h, index) => {
          if (h.includes('name')) athleteObj.name = columns[index];
          if (h.includes('grad')) athleteObj.grad = columns[index];
          if (h.includes('team')) athleteObj.team = columns[index];
          if (h.includes('event')) athleteObj.event = columns[index];
          if (h.includes('pr')) athleteObj.xcpr = columns[index];
        });

        if (athleteObj.name) {
          // FIX: Generate unique ID on the frontend using Date.now() to bypass the null primary key constraint
          athleteObj.id = Date.now() + i;
          dataToInsert.push(athleteObj);
        }
      }

      const { error } = await supabase.from('run_athletes').upsert(dataToInsert);
      if (error) throw error;

      setImportStatus(`Success: Uploaded ${dataToInsert.length} athletes.`);
      setCsvText('');
      onRefresh();
    } catch (err) {
      setImportStatus(`Failed: ${err.message}`);
    }
  };

  const handleDeleteAthlete = async (id) => {
    if (supabaseConnected) {
      await supabase.from('run_athletes').delete().eq('id', id);
      onRefresh();
    }
  };

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--accent)' }}>TEAM ROSTER</h2>
          <p style={{ fontSize: '13px', color: 'var(--text3)' }}>Coordinate athletes, grad cycles, and manage season spreadsheets.</p>
        </div>
        <button onClick={() => setShowImporter(!showImporter)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Upload size={14} /> {showImporter ? "Close Roster Importer" : "Bulk Upload Season Data"}
        </button>
      </div>

      {showImporter && (
        <div style={{ background: '#f8fafc', border: '1px dashed var(--accent)', borderRadius: '10px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)' }}><Database size={16} /> Bulk Spreadsheets Importer</h3>
          <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '1rem' }}>Upload a spreadsheet file (`.csv`, `.txt`, `.docx`) or paste rows directly. Headers: <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg3)', padding: '2px 4px' }}>Name, Grad Year, Team, Primary Event, PR</code>.</p>
          
          <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontWeight: 600 }}>Upload Spreadsheet File (.csv, .txt, .docx):</label>
            <input type="file" accept=".csv,.txt,.docx" onChange={handleFileUpload} style={{ fontSize: '13px' }} />
          </div>

          <textarea value={csvText} onChange={e => setCsvText(e.target.value)} placeholder="Or paste rows manually here..." style={{ width: '100%', minHeight: '100px', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px', marginBottom: '1rem' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={handleBulkImport} disabled={!supabaseConnected} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Upload Data</button>
            {importStatus && <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', marginLeft: '10px' }}>{importStatus}</span>}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        {/* Single Add Form */}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Primary Event</label><input type="text" value={event} onChange={e => setEvent(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>PR</label><input type="text" value={xcpr} onChange={e => setXcpr(e.target.value)} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
          <button type="submit" disabled={!supabaseConnected} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Add Athlete</button>
        </form>

        {/* Athlete Grid Display */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', alignContent: 'start' }}>
          {athletes.map((a) => (
            <div key={a.id || a.name} style={{ background: 'var(--bg2)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)', borderTop: `4px solid ${a.team === 'Varsity' ? 'var(--accent)' : 'var(--text3)'}`, display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
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
