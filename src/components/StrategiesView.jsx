import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Trash2, FileText } from 'lucide-react';

export default function StrategiesView({ strategies, supabaseConnected, onRefresh }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [rawPasteText, setRawPasteText] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [showImporter, setShowImporter] = useState(false);

  const handleAddStrategy = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (supabaseConnected) {
      const { error } = await supabase.from('run_resources').insert({
        title,
        content,
        cat: 'Strategy', // Hardcoded into category column for schema continuity
        tags
      });
      if (!error) {
        setTitle(''); setContent(''); setTags('');
        onRefresh();
      }
    }
  };

  // Dynamic parser for copy-pasted Excel blocks (tab-separated) or Google Doc lines
  const handleBulkImport = async () => {
    if (!rawPasteText.trim() || !supabaseConnected) return;
    setImportStatus('Processing pasted data...');

    try {
      const lines = rawPasteText.split('\n').filter(line => line.trim() !== '');
      const listToInsert = [];

      lines.forEach((line) => {
        // Splitting by Tabs (Excel) or Pipe Symbol (Google Docs formats)
        const parts = line.split(/\t|\|/).map(p => p.trim());
        if (parts.length >= 2) {
          listToInsert.push({
            title: parts[0],
            content: parts[1],
            cat: 'Strategy',
            tags: parts[2] || 'Imported'
          });
        }
      });

      if (listToInsert.length === 0) {
        setImportStatus('Failed: Ensure you copy-paste format as "Title | Plan Instructions"');
        return;
      }

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

  const defaultStrategies = [
    { title: 'XC Goal Pacing', content: 'Run even effort, not even splits. Settle the first mile, work the second mile, and run the third mile on raw strength.', tags: 'Pacing, XC' },
    { title: 'Up-Hill Mechanics', content: 'Shorten stride, elevate arm drive, and charge for 10 paces over the crest to establish visual gaps.', tags: 'Hills, Strength' }
  ];

  const currentDisplayList = supabaseConnected ? strategies : defaultStrategies;

  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
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

      {/* Spreadsheet / Doc Importer Panel */}
      {showImporter && (
        <div style={{ background: '#f8fafc', border: '1px dashed var(--accent)', borderRadius: '10px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px' }}>Excel & Docs Clipboard Importer</h3>
          <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '1rem', lineHeight: 1.5 }}>
            Paste plans copied directly from your Google Docs or Excel rows. Ensure columns are separated by tabs (simply copy rows from Excel) or divided by a vertical line (|) like this: <br />
            <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg3)', padding: '2px 4px' }}>Plan Name | Plan Details / Instructions | Tags</code>
          </p>
          <textarea 
            value={rawPasteText} 
            onChange={e => setRawPasteText(e.target.value)} 
            placeholder="Example:&#10;Corner Surge | Accelerate 5 steps immediately after turning corners | Tactics&#10;Finish Line Kick | Drive knees high, relax jaw in the final 300m | Speed" 
            style={{ width: '100%', minHeight: '100px', padding: '10px', border: '1px solid var(--border2)', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '12px', marginBottom: '1rem' }} 
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={handleBulkImport} disabled={!supabaseConnected} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Compile & Import Plans</button>
            {importStatus && <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{importStatus}</span>}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Creation Form */}
        <div>
          <form onSubmit={handleAddStrategy} style={{ background: 'var(--bg2)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: 'var(--accent)' }}>Create New Race Plan</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Plan Name</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Settle & Surge" required style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Tags / Key Focus Area</label>
              <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="XC, Hills, Mental" style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Plan Details</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} required placeholder="Provide race plans for runners..." style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', minHeight: '120px' }} />
            </div>
            <button type="submit" disabled={!supabaseConnected} style={{ background: 'var(--red)', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Add to Database</button>
          </form>
        </div>

        {/* Display List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {currentDisplayList.map((s) => (
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
  );
}
