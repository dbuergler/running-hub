import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Upload, Database, Trash2, X, Edit2 } from 'lucide-react';
import mammoth from 'mammoth';
import { Modal } from '../App';

export default function AthletesView({ athletes, supabaseConnected, onRefresh, showToast }) {
  const [csvText, setCsvText] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [showImporter, setShowImporter] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const fileInputRef = useRef(null);

  // Modal State for Editing Runner
  const [selectedAthleteModal, setSelectedAthleteModal] = useState(null);

  // Form states supporting Lifetime PR vs. Current Season PR
  const [name, setName] = useState('');
  const [grad, setGrad] = useState('');
  const [team, setTeam] = useState('Varsity');
  const [event, setEvent] = useState('5K XC / Track');
  const [xcpr, setXcpr] = useState(''); // Current Season PR
  const [fivekpr, setFivekpr] = useState(''); // Lifetime PR

  const handleAddAthlete = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (supabaseConnected) {
      const { error } = await supabase.from('run_athletes').insert({
        id: Date.now(), 
        name, grad, team, event, xcpr, fivekpr
      });
      if (!error) {
        setName(''); setGrad(''); setXcpr(''); setFivekpr('');
        showToast("Athlete successfully registered!", "success");
        onRefresh();
      } else {
        showToast("Error adding athlete: " + error.message, "warning");
      }
    }
  };

  const handleUpdateAthleteModal = async (e) => {
    e.preventDefault();
    if (!selectedAthleteModal || !supabaseConnected) return;

    const { error } = await supabase.from('run_athletes').upsert({
      id: selectedAthleteModal.id,
      name: selectedAthleteModal.name,
      grad: selectedAthleteModal.grad,
      team: selectedAthleteModal.team,
      event: selectedAthleteModal.event,
      xcpr: selectedAthleteModal.xcpr, // Current Season PR
      fivekpr: selectedAthleteModal.fivekpr // Lifetime PR
    });

    if (!error) {
      showToast("Athlete records updated!", "success");
      setSelectedAthleteModal(null);
      onRefresh();
    } else {
      showToast("Error updating athlete: " + error.message, "warning");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFileName(file.name);

    if (file.name.endsWith('.docx')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const arrayBuffer = evt.target.result;
        mammoth.extractRawText({ arrayBuffer })
          .then(result => {
            setCsvText(result.value);
            showToast(`Extracted roster text from Word document "${file.name}"!`, "success");
          })
          .catch(err => {
            showToast("Error reading Word file: " + err.message, "warning");
          });
      };
      reader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.pdf')) {
      showToast("For PDF documents, please select and copy the text inside the PDF, then paste below.", "warning");
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setCsvText(evt.target.result);
        showToast(`Loaded "${file.name}"!`, "success");
      };
      reader.readAsText(file);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFileName('');
    setCsvText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast("Selected file cleared.", "warning");
  };

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
        let athEvent = '5K XC / Track';
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
            xcpr: athPR || '—',
            fivekpr: athPR || '—'
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
      setSelectedFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onRefresh();
    } catch (err) {
      showToast("Error importing roster: " + err.message, "warning");
    }
  };

  const handleDeleteAthlete = async (id) => {
    if (supabaseConnected) {
      await supabase.from('run_athletes').delete().eq('id', id);
      setSelectedAthleteModal(null);
      showToast("Athlete removed from roster.", "warning");
      onRefresh();
    }
  };

  const totalRoster = athletes.length;
  const varsityCount = athletes.filter(a => a.team === 'Varsity').length;
  const jvCount = athletes.filter(a => a.team === 'JV').length;

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--accent)' }}>TEAM ROSTER & STATS</h2>
          <p style={{ fontSize: '13px', color: 'var(--text3)' }}>Coordinate athletes, grad cycles, and track Lifetime vs. Season PRs.</p>
        </div>
        <button onClick={() => setShowImporter(!showImporter)} className="btn-interactive" style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Upload size={14} /> {showImporter ? "Close Roster Importer" : "Bulk Upload Season Data"}
        </button>
      </div>

      {/* TEAM SQUAD QUICK STATS BAR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
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
        <div style={{ background: '#f8fafc', border: '1px dashed var(--accent)', borderRadius: '10px', padding: '1.5rem', marginBottom: '2.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}><Database size={16} /> Bulk Spreadsheets Importer</h3>
          <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '1rem' }}>Upload any spreadsheet file (`.csv`, `.txt`, `.docx`) or paste rows directly. No headers required!</p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".csv,.txt,.docx,.pdf" 
              onChange={handleFileUpload} 
              style={{ fontSize: '13px', flex: 1 }} 
            />
            {selectedFileName && (
              <button 
                type="button" 
                onClick={clearSelectedFile} 
                title="Clear file"
                style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <textarea value={csvText} onChange={e => setCsvText(e.target.value)} placeholder="Or paste manually here..." style={{ width: '100%', minHeight: '100px', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px', marginBottom: '1rem' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={handleBulkImport} disabled={!supabaseConnected} className="btn-interactive" style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Upload Data</button>
            {importStatus && <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{importStatus}</span>}
          </div>
        </div>
      )}

      {/* CENTERED REGISTER ATHLETE FORM */}
      <div style={{ maxWidth: '560px', margin: '0 auto 3rem' }}>
        <form onSubmit={handleAddAthlete} style={{ background: 'var(--bg2)', padding: '1.75rem', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(15,43,92,0.06)', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '10px', color: 'var(--accent)', textAlign: 'center' }}>
            Register Athlete
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Will Lewis" style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Grad Class</label>
              <input type="text" value={grad} onChange={e => setGrad(e.target.value)} placeholder="e.g. 12" style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
            </div>
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
              <option value="5K XC / Track">5K XC / Track</option>
              <option value="10K">10K</option>
              <option value="Half Marathon">Half Marathon</option>
              <option value="Marathon">Marathon</option>
              <option value="Mile">Mile</option>
              <option value="800m">800m</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Lifetime PR</label>
              <input type="text" value={fivekpr} onChange={e => setFivekpr(e.target.value)} placeholder="e.g. 16:12" style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Season PR</label>
              <input type="text" value={xcpr} onChange={e => setXcpr(e.target.value)} placeholder="e.g. 16:45" style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
            </div>
          </div>
          <button type="submit" disabled={!supabaseConnected} className="btn-interactive" style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', marginTop: '6px' }}>
            Add Athlete
          </button>
        </form>
      </div>

      {/* FULL-WIDTH ROSTER GRID BELOW THE FORM */}
      <div style={{ borderTop: '2px solid var(--border)', paddingTop: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>Active Roster</h3>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>{athletes.length} Athletes Enrolled</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1.25rem' }}>
          {athletes.map((a) => (
            <div 
              key={a.id || a.name} 
              onClick={() => setSelectedAthleteModal(a)}
              className="card-interactive" 
              style={{ background: 'var(--bg2)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)', borderTop: `4px solid ${a.team === 'Varsity' ? 'var(--accent)' : 'var(--text3)'}`, display: 'flex', flexDirection: 'column', gap: '6px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>Grad: {a.grad || '—'}</span>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg3)' }}>{a.team}</span>
              </div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>{a.name}</h4>
              <p style={{ fontSize: '12px', color: 'var(--text2)' }}><strong>Event:</strong> {a.event || '5K'}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                <div style={{ padding: '4px 8px', background: '#f8fafc', borderLeft: '3px solid var(--red)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <strong>Season PR:</strong> {a.xcpr || '—'}
                </div>
                <div style={{ padding: '4px 8px', background: '#f8fafc', borderLeft: '3px solid var(--accent)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <strong>Lifetime PR:</strong> {a.fivekpr || '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EDIT ATHLETE MODAL OVER BLURRED BACKGROUND */}
      <Modal 
        isOpen={!!selectedAthleteModal} 
        onClose={() => setSelectedAthleteModal(null)}
        title={selectedAthleteModal ? `Edit Athlete: ${selectedAthleteModal.name}` : ''}
      >
        {selectedAthleteModal && (
          <form onSubmit={handleUpdateAthleteModal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Name</label>
              <input type="text" value={selectedAthleteModal.name} onChange={e => setSelectedAthleteModal({ ...selectedAthleteModal, name: e.target.value })} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Grad Class</label>
                <input type="text" value={selectedAthleteModal.grad || ''} onChange={e => setSelectedAthleteModal({ ...selectedAthleteModal, grad: e.target.value })} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Team Group</label>
                <select value={selectedAthleteModal.team || 'Varsity'} onChange={e => setSelectedAthleteModal({ ...selectedAthleteModal, team: e.target.value })} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <option value="Varsity">Varsity</option><option value="JV">JV</option><option value="Freshman">Freshman</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Lifetime PR</label>
                <input type="text" value={selectedAthleteModal.fivekpr || ''} onChange={e => setSelectedAthleteModal({ ...selectedAthleteModal, fivekpr: e.target.value })} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Season PR</label>
                <input type="text" value={selectedAthleteModal.xcpr || ''} onChange={e => setSelectedAthleteModal({ ...selectedAthleteModal, xcpr: e.target.value })} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <button type="submit" className="btn-interactive" style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Update Records</button>
              {supabaseConnected && (
                <button type="button" onClick={() => handleDeleteAthlete(selectedAthleteModal.id)} style={{ background: 'var(--red)', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Trash2 size={14} /> Remove Athlete
                </button>
              )}
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
