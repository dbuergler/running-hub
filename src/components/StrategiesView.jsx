import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Trash2, FileText, TrendingUp } from 'lucide-react';

export default function StrategiesView({ strategies, xcResults, athletes, supabaseConnected, onRefresh }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [rawPasteText, setRawPasteText] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [showImporter, setShowImporter] = useState(false);

  // States for the Athlete Progression Graph
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [meetName, setMeetName] = useState('');
  const [meetDate, setMeetDate] = useState('');
  const [meetTime, setMeetTime] = useState('');

  const handleAddStrategy = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (supabaseConnected) {
      const { error } = await supabase.from('run_resources').insert({
        id: Date.now(),
        title,
        content,
        cat: 'Strategy',
        tags
      });
      if (!error) {
        setTitle(''); setContent(''); setTags('');
        onRefresh();
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      setRawPasteText(evt.target.result);
      setImportStatus(`File "${file.name}" loaded successfully. Click Compile below.`);
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (!rawPasteText.trim() || !supabaseConnected) return;
    setImportStatus('Processing data into the database...');

    try {
      const lines = rawPasteText.split('\n').filter(line => line.trim() !== '');
      const listToInsert = [];

      lines.forEach((line) => {
        const parts = line.split(/\t|\|/).map(p => p.trim());
        if (parts.length >= 2) {
          listToInsert.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            title: parts[0],
            content: parts[1],
            cat: 'Strategy',
            tags: parts[2] || 'Imported'
          });
        }
      });

      const { error } = await supabase.from('run_resources').insert(listToInsert);
      if (error) throw error;

      setImportStatus(`Success: Imported ${listToInsert.length} race plans.`);
      setRawPasteText('');
      onRefresh();
    } catch (err) {
      setImportStatus(`Failed: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (supabaseConnected) {
      await supabase.from('run_resources').delete().eq('id', id);
      onRefresh();
    }
  };

  // Add a Meet Result to run_xc
  const handleAddXCResult = async (e) => {
    e.preventDefault();
    if (!selectedAthlete || !meetName || !meetTime || !meetDate) return;

    if (supabaseConnected) {
      const { error } = await supabase.from('run_xc').insert({
        id: Date.now(),
        athlete: selectedAthlete,
        meet: meetName,
        time: meetTime,
        date: meetDate,
        dist: '5K'
      });
      if (!error) {
        setMeetName(''); setMeetTime('');
        onRefresh();
      } else {
        alert("Error saving result: " + error.message);
      }
    }
  };

  const timeToSeconds = (timeStr) => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0;
    return parts[0] * 60 + parts[1];
  };

  // Filter and sort the selected runner's times for the progression graph
  const runnerResults = xcResults
    .filter(r => r.athlete === selectedAthlete)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Determine scaling metrics for the Custom SVG Line graph
  const timesInSeconds = runnerResults.map(r => timeToSeconds(r.time)).filter(s => s > 0);
  const minSec = timesInSeconds.length ? Math.min(...timesInSeconds) : 900; // default 15 mins
  const maxSec = timesInSeconds.length ? Math.max(...timesInSeconds) : 1200; // default 20 mins
  const paddingOffset = (maxSec - minSec) * 0.1 || 30;

  const graphMin = Math.max(0, minSec - paddingOffset);
  const graphMax = maxSec + paddingOffset;

  const plotPoints = runnerResults.map((r, i) => {
    const x = 50 + (i * (450 / Math.max(1, runnerResults.length - 1)));
    const ySec = timeToSeconds(r.time);
    // Lower times (faster) mapped higher on the grid (lower y coordinate in SVG space)
    const y = 20 + ((graphMax - ySec) / (graphMax - graphMin)) * 160;
    return { x, y, ...r };
  });

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--accent)' }}>COACHING RACE PLANS</h2>
          <p style={{ fontSize: '13px', color: 'var(--text3)' }}>Add and configure custom race plans, tactical guides, or mental cues for your athletes.</p>
        </div>
        <button 
          onClick={() => setShowImporter(!showImporter)} 
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <FileText size={14} /> {showImporter ? "Close Bulk Importer" : "Import Plans from Docs / Excel"}
        </button>
      </div>

      {showImporter && (
        <div style={{ background: '#f8fafc', border: '1px dashed var(--accent)', borderRadius: '10px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px' }}>Excel, Docs, or CSV File Importer</h3>
          <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '1rem' }}>Upload a spreadsheet file (`.csv`, `.txt`, `.docx`) or paste rows directly. Columns must be: Plan Name | Plan Details | Tags</p>
          <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <input type="file" accept=".csv,.txt,.docx" onChange={handleFileUpload} style={{ fontSize: '13px' }} />
          </div>
          <textarea value={rawPasteText} onChange={e => setRawPasteText(e.target.value)} placeholder="Or paste manually here..." style={{ width: '100%', minHeight: '100px', padding: '10px', border: '1px solid var(--border2)', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px', marginBottom: '1rem' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={handleBulkImport} disabled={!supabaseConnected} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Compile & Import Plans</button>
            {importStatus && <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{importStatus}</span>}
          </div>
        </div>
      )}

      {/* STRATEGIES GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div>
          <form onSubmit={handleAddStrategy} style={{ background: 'var(--bg2)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: 'var(--accent)' }}>Create New Race Plan</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Plan Name</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Tags</label><input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="XC, Hills" style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Plan Details</label><textarea value={content} onChange={e => setContent(e.target.value)} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', minHeight: '120px' }} /></div>
            <button type="submit" disabled={!supabaseConnected} style={{ background: 'var(--red)', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Add to Database</button>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {currentDisplayList.slice(0, 4).map((s) => (
            <div key={s.id || s.title} style={{ background: 'var(--bg2)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border)', borderLeft: '4px solid var(--accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>{s.title}</h4>
                {supabaseConnected && s.id && <button onClick={() => handleDelete(s.id)} style={{ border: 'none', background: 'none', color: 'var(--red)', cursor: 'pointer' }}><Trash2 size={16} /></button>}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '8px', lineHeight: 1.6 }}>{s.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* --- SEASON PROGRESSION PLOT GRAPH (SVG BASED) --- */}
      <div style={{ borderTop: '2px solid var(--border)', paddingTop: '2.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--accent)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={22} /> ATHLETE SEASON PROGRESSION
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '1.5rem' }}>Select any runner from your team roster to plot and study their 5K time performance progression over the season.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {/* Left Side: Add Result Form */}
          <form onSubmit={handleAddXCResult} style={{ background: 'var(--bg2)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>Log Season Meet Time</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Select Athlete</label>
              <select value={selectedAthlete} onChange={e => setSelectedAthlete(e.target.value)} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <option value="">-- Select Runner --</option>
                {athletes.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Meet Name</label>
              <input type="text" value={meetName} onChange={e => setMeetName(e.target.value)} required placeholder="e.g. County Invite" style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Meet Date</label>
                <input type="date" value={meetDate} onChange={e => setMeetDate(e.target.value)} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>5K Time (MM:SS)</label>
                <input type="text" value={meetTime} onChange={e => setMeetTime(e.target.value)} required placeholder="e.g. 17:14" style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
            </div>
            <button type="submit" disabled={!supabaseConnected} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Save Meet Time</button>
          </form>

          {/* Right Side: Dynamic SVG Plot */}
          <div style={{ background: 'var(--bg2)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--accent)', marginBottom: '1rem' }}>
              {selectedAthlete ? `${selectedAthlete} - 5K Progression` : "Progression Plot Grid"}
            </h4>

            {plotPoints.length >= 2 ? (
              <div style={{ position: 'relative', width: '100%', flex: 1 }}>
                <svg viewBox="0 0 520 220" style={{ width: '100%', height: '100%' }}>
                  {/* Grid Lines */}
                  <line x1="50" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="50" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="50" y1="180" x2="500" y2="180" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="50" y1="180" x2="500" y2="180" stroke="var(--text3)" strokeWidth="2" />

                  {/* SVG Progression Line */}
                  <polyline
                    fill="none"
                    stroke="var(--red)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={plotPoints.map(p => `${p.x},${p.y}`).join(' ')}
                  />

                  {/* Circles & Tooltip Data Points */}
                  {plotPoints.map((p, index) => (
                    <g key={index}>
                      <circle cx={p.x} cy={p.y} r="6" fill="var(--accent)" stroke="#ffffff" strokeWidth="2" />
                      <text x={p.x} y={p.y - 12} fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle" fill="var(--text)" fontWeight="bold">
                        {p.time}
                      </text>
                      <text x={p.x} y="205" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle" fill="var(--text3)">
                        {p.meet.substring(0, 8)}..
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            ) : (
              <div style={{ flex: 1, border: '1px dashed var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: '13px', textAlign: 'center', padding: '2rem' }}>
                Select an athlete with at least two logged meet results to generate a trendline.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
