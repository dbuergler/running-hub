import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Trash2, FileText, TrendingUp, X, Edit2 } from 'lucide-react';
import mammoth from 'mammoth';
import { Modal } from '../App';

export default function StrategiesView({ strategies, xcResults, athletes, supabaseConnected, onRefresh, showToast }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [rawPasteText, setRawPasteText] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [showImporter, setShowImporter] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const fileInputRef = useRef(null);

  // Modal State for Strategy Click
  const [selectedPlanModal, setSelectedPlanModal] = useState(null);

  // States for the Athlete Progression Graph
  const [selectedAthlete, setSelectedAthlete] = useState('overall'); 
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
        showToast("Race plan saved successfully!", "success");
        onRefresh();
      } else {
        showToast("Error saving plan: " + error.message, "warning");
      }
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
            setRawPasteText(result.value);
            showToast(`Extracted text from Word document "${file.name}"!`, "success");
          })
          .catch(err => {
            showToast("Error decoding Word document: " + err.message, "warning");
          });
      };
      reader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.pdf')) {
      showToast("For PDF documents, please select and copy the text inside the PDF, then paste below.", "warning");
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setRawPasteText(evt.target.result);
        showToast(`Loaded "${file.name}"!`, "success");
      };
      reader.readAsText(file);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFileName('');
    setRawPasteText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast("Selected file cleared.", "warning");
  };

  const handleBulkImport = async () => {
    if (!rawPasteText.trim() || !supabaseConnected) return;

    try {
      const lines = rawPasteText.split('\n').filter(line => line.trim() !== '');
      const listToInsert = [];

      lines.forEach((line) => {
        const parts = line.split(/[,\t|]/).map(p => p.trim());
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

      showToast(`Successfully imported ${listToInsert.length} race plans!`, "success");
      setRawPasteText('');
      setSelectedFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onRefresh();
    } catch (err) {
      showToast("Error importing data: " + err.message, "warning");
    }
  };

  const handleDelete = async (id) => {
    if (supabaseConnected) {
      await supabase.from('run_resources').delete().eq('id', id);
      showToast("Race plan removed.", "warning");
      setSelectedPlanModal(null);
      onRefresh();
    }
  };

  const handleAddXCResult = async (e) => {
    e.preventDefault();
    if (!selectedAthlete || selectedAthlete === 'overall' || !meetName || !meetTime || !meetDate) {
      showToast("Please select a specific runner to log a meet result.", "warning");
      return;
    }

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
        showToast("Meet result logged successfully!", "success");
        onRefresh();
      } else {
        showToast("Error saving meet result: " + error.message, "warning");
      }
    }
  };

  const timeToSeconds = (timeStr) => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0;
    return parts[0] * 60 + parts[1];
  };

  const getGraphScalingMetrics = (filteredResults) => {
    const timesInSeconds = filteredResults.map(r => timeToSeconds(r.time)).filter(s => s > 0);
    const minSec = timesInSeconds.length ? Math.min(...timesInSeconds) : 900;
    const maxSec = timesInSeconds.length ? Math.max(...timesInSeconds) : 1200;
    const paddingOffset = (maxSec - minSec) * 0.1 || 30;

    return {
      min: Math.max(0, minSec - paddingOffset),
      max: maxSec + paddingOffset
    };
  };

  const renderSVGGraph = () => {
    if (selectedAthlete === 'overall') {
      const grouped = {};
      xcResults.forEach(r => {
        if (!grouped[r.athlete]) grouped[r.athlete] = [];
        grouped[r.athlete].push(r);
      });

      const validAthletes = Object.keys(grouped).filter(ath => grouped[ath].length >= 2);
      if (validAthletes.length === 0) {
        return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text3)' }}>Add at least 2 meet results for one or more athletes to plot.</div>;
      }

      const allFilteredResults = xcResults.filter(r => validAthletes.includes(r.athlete));
      const metrics = getGraphScalingMetrics(allFilteredResults);

      const colorPalette = ['#d31034', '#005bb7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

      return (
        <div style={{ position: 'relative', width: '100%', flex: 1 }}>
          <svg viewBox="0 0 520 220" style={{ width: '100%', height: '100%' }}>
            <line x1="50" y1="20" x2="500" y2="20" stroke="#e2e8f0" strokeWidth="1" />
            <line x1="50" y1="100" x2="500" y2="100" stroke="#e2e8f0" strokeWidth="1" />
            <line x1="50" y1="180" x2="500" y2="180" stroke="#e2e8f0" strokeWidth="1" />

            {validAthletes.map((ath, athIdx) => {
              const runnerData = grouped[ath].sort((a, b) => new Date(a.date) - new Date(b.date));
              const points = runnerData.map((r, i) => {
                const x = 50 + (i * (450 / Math.max(1, runnerData.length - 1)));
                const ySec = timeToSeconds(r.time);
                const y = 20 + ((metrics.max - ySec) / (metrics.max - metrics.min)) * 160;
                return { x, y, ...r };
              });

              const color = colorPalette[athIdx % colorPalette.length];

              return (
                <g key={ath}>
                  <polyline fill="none" stroke={color} strokeWidth="3" points={points.map(p => `${p.x},${p.y}`).join(' ')} />
                  {points.map((p, pIdx) => (
                    <circle key={pIdx} cx={p.x} cy={p.y} r="5" fill={color} stroke="#ffffff" strokeWidth="1.5" title={`${ath}: ${p.time}`} />
                  ))}
                </g>
              );
            })}
          </svg>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
            {validAthletes.map((ath, idx) => (
              <span key={ath} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', background: colorPalette[idx % colorPalette.length], borderRadius: '50%' }} />
                {ath}
              </span>
            ))}
          </div>
        </div>
      );
    } else {
      const runnerData = xcResults
        .filter(r => r.athlete === selectedAthlete)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      if (runnerData.length < 2) {
        return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text3)' }}>Log at least 2 meet results for this athlete to plot trendlines.</div>;
      }

      const metrics = getGraphScalingMetrics(runnerData);
      const points = runnerData.map((r, i) => {
        const x = 50 + (i * (450 / Math.max(1, runnerData.length - 1)));
        const ySec = timeToSeconds(r.time);
        const y = 20 + ((metrics.max - ySec) / (metrics.max - metrics.min)) * 160;
        return { x, y, ...r };
      });

      return (
        <div style={{ position: 'relative', width: '100%', flex: 1 }}>
          <svg viewBox="0 0 520 220" style={{ width: '100%', height: '100%' }}>
            <line x1="50" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="50" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="50" y1="180" x2="500" y2="180" stroke="#f1f5f9" strokeWidth="1" />

            <polyline fill="none" stroke="var(--red)" strokeWidth="4" points={points.map(p => `${p.x},${p.y}`).join(' ')} />
            {points.map((p, index) => (
              <g key={index}>
                <circle cx={p.x} cy={p.y} r="6" fill="var(--accent)" stroke="#ffffff" strokeWidth="2" />
                <text x={p.x} y={p.y - 12} fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle" fill="var(--text)" fontWeight="bold">{p.time}</text>
                <text x={p.x} y="205" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle" fill="var(--text3)">{p.meet.substring(0, 10)}</text>
              </g>
            ))}
          </svg>
        </div>
      );
    }
  };

  const defaultStrategies = [
    { title: 'XC Goal Pacing', content: 'Run even effort, not even splits. Settle the first mile, work the second mile, and run the third mile on raw strength.', tags: 'Pacing, XC' },
    { title: 'Up-Hill Mechanics', content: 'Shorten stride, elevate arm drive, and charge for 10 paces over the crest to establish visual gaps.', tags: 'Hills, Strength' }
  ];

  const currentDisplayList = supabaseConnected ? strategies : defaultStrategies;

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--accent)' }}>COACHING RACE PLANS</h2>
          <p style={{ fontSize: '13px', color: 'var(--text3)' }}>Add and configure custom race plans, tactical guides, or mental cues for your athletes.</p>
        </div>
        <button 
          onClick={() => setShowImporter(!showImporter)} 
          className="btn-interactive"
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <FileText size={14} /> {showImporter ? "Close Bulk Importer" : "Import Plans from Docs / Excel"}
        </button>
      </div>

      {showImporter && (
        <div style={{ background: '#f8fafc', border: '1px dashed var(--accent)', borderRadius: '10px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px' }}>Excel, Docs, or CSV Clipboard Importer</h3>
          <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '1rem', lineHeight: 1.5 }}>
            Upload any spreadsheet or Word document file (`.csv`, `.txt`, `.docx`) or paste rows directly below.
          </p>
          
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

          <textarea value={rawPasteText} onChange={e => setRawPasteText(e.target.value)} placeholder="Or paste manually here..." style={{ width: '100%', minHeight: '100px', padding: '10px', border: '1px solid var(--border2)', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px', marginBottom: '1rem' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={handleBulkImport} disabled={!supabaseConnected} className="btn-interactive" style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Compile & Import Plans</button>
            {importStatus && <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{importStatus}</span>}
          </div>
        </div>
      )}

      {/* PLANS DISPLAY GRID WITH CLICKABLE MODALS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div>
          <form onSubmit={handleAddStrategy} style={{ background: 'var(--bg2)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: 'var(--accent)' }}>Create New Race Plan</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Plan Name</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Tags</label><input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="XC, Hills" style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Plan Details</label><textarea value={content} onChange={e => setContent(e.target.value)} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', minHeight: '120px' }} /></div>
            <button type="submit" disabled={!supabaseConnected} className="btn-interactive" style={{ background: 'var(--red)', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Add to Database</button>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {currentDisplayList.map((s) => (
            <div 
              key={s.id || s.title} 
              onClick={() => setSelectedPlanModal(s)}
              className="card-interactive" 
              style={{ background: 'var(--bg2)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border)', borderLeft: '4px solid var(--accent)', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>{s.title}</h4>
                <Edit2 size={15} style={{ color: 'var(--text3)' }} />
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '8px', lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {s.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* PLAN DETAIL MODAL WITH BLURRED BACKGROUND */}
      <Modal 
        isOpen={!!selectedPlanModal} 
        onClose={() => setSelectedPlanModal(null)}
        title={selectedPlanModal?.title || ''}
      >
        {selectedPlanModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.7 }}>{selectedPlanModal.content}</p>
            {selectedPlanModal.tags && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '10px' }}>
                {selectedPlanModal.tags.split(',').map(tag => (
                  <span key={tag} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'var(--bg3)', padding: '3px 8px', borderRadius: '4px' }}>{tag.trim()}</span>
                ))}
              </div>
            )}
            {supabaseConnected && selectedPlanModal.id && (
              <button 
                onClick={() => handleDelete(selectedPlanModal.id)} 
                style={{ alignSelf: 'flex-start', border: 'none', background: 'var(--red)', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={14} /> Delete Strategy
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* --- SEASON PROGRESSION PLOT GRAPH --- */}
      <div style={{ borderTop: '2px solid var(--border)', paddingTop: '2.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--accent)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={22} /> ATHLETE SEASON PROGRESSION
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '1.5rem' }}>Select any runner or view the entire team roster combined on the same plot grid.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {/* Left Side: Add Result Form */}
          <form onSubmit={handleAddXCResult} style={{ background: 'var(--bg2)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>Log Season Meet Time</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Select Athlete</label>
              <select value={selectedAthlete} onChange={e => setSelectedAthlete(e.target.value)} required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <option value="overall">-- View Team Overall --</option>
                {athletes.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Meet Name</label>
              <input type="text" value={meetName} onChange={e => setMeetName(e.target.value)} required placeholder="e.g. Semi-State Invite" style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
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
            <button type="submit" disabled={!supabaseConnected || selectedAthlete === 'overall'} className="btn-interactive" style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Save Meet Time</button>
          </form>

          {/* Right Side: Dynamic SVG Plot */}
          <div style={{ background: 'var(--bg2)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: '300px', boxShadow: '0 4px 6px -1px rgba(15,43,92,0.06)' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--accent)', marginBottom: '1rem' }}>
              {selectedAthlete === 'overall' ? "Roster Progression Overall" : `${selectedAthlete} - 5K Progression`}
            </h4>
            {renderSVGGraph()}
          </div>
        </div>
      </div>
    </div>
  );
}
