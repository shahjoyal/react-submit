// // src/components/BunkerDiagram.jsx
// // (This version expects props: clientBunkers, addBunkerLayer, removeTopLayer, bunkerCapacity)
// import React, { useEffect, useState, useRef } from 'react';
// import api from '../api/apiClient';
// import calcAFT from '../utils/calcAFT';
// //import { getColorForCoalName, sanitizePatternId } from './bunkerHelpers'; // If you used helper functions, otherwise inline

// // For simplicity, I'll inline the color & helper (copy from previous file if needed)
// function hashColor(name) {
//   let h = 2166136261 >>> 0;
//   const s = String(name || '');
//   for (let i = 0; i < s.length; i++) {
//     h ^= s.charCodeAt(i);
//     h = Math.imul(h, 16777619);
//   }
//   const hue = Math.abs(h) % 360;
//   const sat = 62 - ((h >>> 8) % 20);
//   const light = 42 + ((h >>> 16) % 12);
//   return `hsl(${hue} ${sat}% ${light}%)`;
// }
// function sanitizePatternIdLocal(s) {
//   return String(s).replace(/[^a-z0-9]/gi, '').slice(0, 64);
// }

// export default function BunkerDiagram({ clientBunkers = [], addBunkerLayer, removeTopLayer, bunkerCapacity = 0 }) {
//   const [coals, setCoals] = useState([]);
//   const [addOpen, setAddOpen] = useState({ open: false, bunkerIndex: null });
//   const [selectedCoalId, setSelectedCoalId] = useState('');
//   const [percent, setPercent] = useState('');
//   const tooltipRef = useRef();

//   useEffect(() => {
//     (async () => {
//       const list = await api.getCoals().catch(() => []);
//       setCoals(Array.isArray(list) ? list : []);
//     })();

//     let tip = document.getElementById('__bunker_tooltip_react');
//     if (!tip) {
//       tip = document.createElement('div');
//       tip.id = '__bunker_tooltip_react';
//       tip.style.position = 'absolute';
//       tip.style.padding = '8px';
//       tip.style.background = 'rgba(0,0,0,0.92)';
//       tip.style.color = '#fff';
//       tip.style.borderRadius = '8px';
//       tip.style.fontSize = '13px';
//       tip.style.pointerEvents = 'none';
//       tip.style.zIndex = '99999';
//       tip.style.display = 'none';
//       tip.style.boxShadow = '0 6px 20px rgba(0,0,0,0.45)';
//       document.body.appendChild(tip);
//     }
//     tooltipRef.current = tip;
//   }, []);

//   function openCoalPopup(i) {
//     setSelectedCoalId('');
//     setPercent('');
//     setAddOpen({ open: true, bunkerIndex: i });
//   }

//   function hideTooltip() {
//     const tip = tooltipRef.current;
//     if (tip) tip.style.display = 'none';
//   }

//   function showTooltip(ev, layer) {
//     const tip = tooltipRef.current;
//     if (!tip || !layer) return;
//     const coalDoc = (layer.coalDoc && typeof layer.coalDoc === 'object') ? layer.coalDoc : (window.COAL_DB || []).find(c => String(c._id) === String(layer.coalId));
//     const name = layer.coal || (coalDoc && (coalDoc.coal || coalDoc.name)) || '—';
//     const pct = (Number(layer.percent) || 0).toFixed(2) + '%';
//     const gcv = (layer.gcv !== undefined && layer.gcv !== null) ? Number(layer.gcv).toFixed(2) : (coalDoc && coalDoc.gcv !== undefined ? Number(coalDoc.gcv).toFixed(2) : '--');
//     const cost = (layer.cost !== undefined && layer.cost !== null) ? Number(layer.cost).toFixed(2) : (coalDoc && coalDoc.cost !== undefined ? Number(coalDoc.cost).toFixed(2) : '--');
//     const aftVal = coalDoc ? calcAFT(coalDoc) : calcAFT(layer);
//     const aftText = isFinite(aftVal) ? Number(aftVal).toFixed(2) : '--';

//     tip.innerHTML = `<div style="font-weight:700;margin-bottom:6px">${escapeHtml(name)}</div>
//       <div style="display:flex;justify-content:space-between"><span style="opacity:0.85">Percent</span><strong>${pct}</strong></div>
//       <div style="display:flex;justify-content:space-between"><span style="opacity:0.85">GCV</span><strong>${gcv}</strong></div>
//       <div style="display:flex;justify-content:space-between"><span style="opacity:0.85">Cost</span><strong>${cost}</strong></div>
//       <div style="display:flex;justify-content:space-between;margin-top:6px"><span style="opacity:0.85">AFT</span><strong>${aftText}</strong></div>`;

//     const left = Math.min(window.innerWidth - 260, ev.pageX + 12);
//     const top = Math.min(window.innerHeight - 120, ev.pageY + 12);
//     tip.style.left = left + 'px';
//     tip.style.top = top + 'px';
//     tip.style.display = 'block';
//   }

//   function escapeHtml(s) {
//     if (s === null || s === undefined) return '';
//     return String(s).replace(/[&<>"'`=\/]/g, function (c) {
//       return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#47;','`':'&#96;','=':'&#61;'}[c];
//     });
//   }

//   // Called from App when Clear is pressed in popup. Remove top layer from that bunker
//   async function handleClearTopLayer() {
//     const b = addOpen.bunkerIndex;
//     if (b === null) return;
//     removeTopLayer(b);
//     setAddOpen({ open: false, bunkerIndex: null });
//   }

//   // confirmAdd keeps same behaviour
//   async function confirmAdd() {
//     const b = addOpen.bunkerIndex;
//     if (b === null) return;
//     let pctNum = Number(percent || 0);
//     if (isNaN(pctNum)) pctNum = 0;
//     if (pctNum < 0) pctNum = 0;
//     if (pctNum > 100) pctNum = 100;
//     if (!selectedCoalId) {
//       alert('Select a coal first.');
//       return;
//     }
//     if (pctNum <= 0) {
//       alert('Enter a percent greater than 0 (max 100).');
//       return;
//     }
//     const layers = (clientBunkers[b] && clientBunkers[b].layers) ? clientBunkers[b].layers : [];
//     const existingSum = layers.reduce((s, x) => s + (Number(x.percent) || 0), 0);
//     if (existingSum >= 100) {
//       alert('Bunker is already at 100% — cannot add more.');
//       return;
//     }
//     const remaining = Math.max(0, 100 - existingSum);
//     if (pctNum > remaining) {
//       pctNum = remaining;
//       alert(`Percent reduced to ${pctNum}% to not exceed 100% in this bunker.`);
//     }

//     const doc = (coals || []).find(c => String(c._id) === String(selectedCoalId)) || (window.COAL_DB || []).find(c => String(c._id) === String(selectedCoalId));
//     const coalName = doc ? (doc.coal || doc.name || String(doc._id)) : String(selectedCoalId);
//     const color = (doc && (doc.color || doc.colour)) ? (doc.color || doc.colour) : hashColor(coalName);

//     const layer = {
//       coalId: selectedCoalId || (doc && doc._id) || null,
//       coal: coalName,
//       percent: pctNum,
//       gcv: doc ? (Number(doc.gcv) || undefined) : undefined,
//       cost: doc ? (Number(doc.cost) || undefined) : undefined,
//       coalDoc: doc || undefined,
//       color
//     };

//     addBunkerLayer(b, layer);
//     setAddOpen({ open: false, bunkerIndex: null });
//   }

//   // clip polygon & left positions
//   const clipPoly = '15,15 15,100 45,135 55,135 85,100 85,15';
//   const leftPercents = ['6.25%','18.75%','31.25%','43.75%','56.25%','68.75%','81.25%','93.75%'];

//   return (
//     <div className="diagram-in-grid" style={{ padding: 8 }}>
//       <div className="layout">
//         <div className="top-overlay" aria-hidden="true">
//           <div className="top-line" />
//           {leftPercents.map((left, idx) => <div className="arrow" key={'arrow-'+idx} style={{ left }} aria-hidden="true" />)}
//           {leftPercents.map((left, idx) => (
//             <button key={'add-'+idx} className="add-coal-overlay" style={{ left }} onClick={() => openCoalPopup(idx)} title={`Add coal to bunker ${idx+1}`}>+</button>
//           ))}
//         </div>

//         <div className="bunkers-grid" role="list">
//           {Array.from({ length: 8 }).map((_, i) => {
//             const layers = (clientBunkers[i] && clientBunkers[i].layers) ? clientBunkers[i].layers : [];
//             const clipId = `bunkerClip${i}`;
//             const totalH = 120;
//             let cum = 0;
//             return (
//               <div className="bunker" key={'bunker-'+i} data-bunker={i}>
//                 <svg viewBox="0 0 100 150" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
//                   <defs>
//                     <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
//                       <polygon points={clipPoly} />
//                     </clipPath>
//                     {layers.map((L, idx) => {
//                       const fillColor = L.color || hashColor(L.coal || L.coalId || `${i}-${idx}`);
//                       const patternId = sanitizePatternIdLocal(`ptn-${i}-${idx}-${fillColor}`);
//                       const patSize = 8;
//                       return (
//                         <pattern id={patternId} key={patternId} patternUnits="userSpaceOnUse" width={patSize} height={patSize}>
//                           <rect x="0" y="0" width={patSize} height={patSize} fill="transparent" />
//                           <circle cx={patSize/2} cy={patSize/2} r={patSize/3} fill={fillColor} />
//                           <circle cx={(patSize/2)+1} cy={(patSize/2)-1} r={Math.max(0.8, patSize/8)} fill="rgba(0,0,0,0.12)" />
//                         </pattern>
//                       );
//                     })}
//                   </defs>

//                   <path d="M10 10 V100 L45 140 M55 140 L90 100 V10" />

//                   <g clipPath={`url(#${clipId})`}>
//                     {layers.map((L, idx) => {
//                       const h = Math.max(0, (Number(L.percent) || 0) / 100 * totalH);
//                       const y = 140 - (cum + h);
//                       cum += h;
//                       const fillColor = L.color || hashColor(L.coal || L.coalId || `${i}-${idx}`);
//                       const patternId = sanitizePatternIdLocal(`ptn-${i}-${idx}-${fillColor}`);
//                       // add transition for smooth height & y changes (drain)
//                       return (
//                         <rect
//                           key={idx}
//                           x={12}
//                           y={y}
//                           width={76}
//                           height={h}
//                           fill={`url(#${patternId})`}
//                           rx="6"
//                           ry="6"
//                           onMouseEnter={(ev) => showTooltip(ev, L)}
//                           onMouseMove={(ev) => showTooltip(ev, L)}
//                           onMouseLeave={hideTooltip}
//                           style={{ transition: 'height 0.9s linear, y 0.9s linear' }}
//                         />
//                       );
//                     })}
//                   </g>
//                 </svg>

//                 <div className="label">Bunker {i+1}</div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Add-popup */}
//       {addOpen.open && (
//         <div className="popup">
//           <div className="popup-content" role="dialog" aria-modal="true">
//             <h3 style={{ marginTop: 0 }}>Add coal to Bunker {addOpen.bunkerIndex + 1}</h3>

//             <div className="popup-row">
//               <label>Coal</label>
//               {coals.length === 0 ? (
//                 <select disabled value="">
//                   <option value="">No coals available</option>
//                 </select>
//               ) : (
//                 <select value={selectedCoalId} onChange={(e) => setSelectedCoalId(e.target.value)}>
//                   <option value="">-- select coal --</option>
//                   {coals.map(c => (
//                     <option key={c._id || c.coal} value={c._id || c.coal}>
//                       {c.coal || c.name || (c._id || 'Unnamed')}
//                     </option>
//                   ))}
//                 </select>
//               )}
//             </div>

//             <div className="popup-row">
//               <label>Percent</label>
//               <input
//                 type="number"
//                 min={0}
//                 max={100}
//                 value={percent}
//                 onChange={(e) => {
//                   let v = e.target.value;
//                   if (v === '') { setPercent(''); return; }
//                   let n = Number(v);
//                   if (isNaN(n)) n = 0;
//                   if (n < 0) n = 0;
//                   if (n > 100) n = 100;
//                   setPercent(String(n));
//                 }}
//                 placeholder="%"
//               />
//             </div>

//             <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
//               <button className="btn btn-cancel" onClick={() => setAddOpen({ open:false, bunkerIndex:null })}>Cancel</button>
//               {/* Clear button now removes top layer (if any) */}
//               <button className="btn btn-clear" onClick={handleClearTopLayer}>Clear Last</button>
//               <button className="btn btn-save" onClick={confirmAdd} disabled={!selectedCoalId || Number(percent) <= 0}>Add</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
// src/components/BunkerDiagram.jsx
// (This version expects props: clientBunkers, addBunkerLayer, removeTopLayer, bunkerCapacity, onUserEdit)
import React, { useEffect, useState, useRef } from 'react';
import api from '../api/apiClient';
import calcAFT from '../utils/calcAFT';

// For simplicity, inline small helpers
function hashColor(name) {
  let h = 2166136261 >>> 0;
  const s = String(name || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hue = Math.abs(h) % 360;
  const sat = 62 - ((h >>> 8) % 20);
  const light = 42 + ((h >>> 16) % 12);
  return `hsl(${hue} ${sat}% ${light}%)`;
}
function sanitizePatternIdLocal(s) {
  return String(s).replace(/[^a-z0-9]/gi, '').slice(0, 64);
}

export default function BunkerDiagram({
  clientBunkers = [],
  addBunkerLayer,
  removeTopLayer,
  bunkerCapacity = 0,
  onUserEdit // optional callback prop: (key) => void
}) {
  const [coals, setCoals] = useState([]);
  const [addOpen, setAddOpen] = useState({ open: false, bunkerIndex: null });
  const [selectedCoalId, setSelectedCoalId] = useState('');
  const [percent, setPercent] = useState('');
  const tooltipRef = useRef();

  useEffect(() => {
    (async () => {
      const list = await api.getCoals().catch(() => []);
      setCoals(Array.isArray(list) ? list : []);
    })();

    let tip = document.getElementById('__bunker_tooltip_react');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = '__bunker_tooltip_react';
      tip.style.position = 'absolute';
      tip.style.padding = '8px';
      tip.style.background = 'rgba(0,0,0,0.92)';
      tip.style.color = '#fff';
      tip.style.borderRadius = '8px';
      tip.style.fontSize = '13px';
      tip.style.pointerEvents = 'none';
      tip.style.zIndex = '99999';
      tip.style.display = 'none';
      tip.style.boxShadow = '0 6px 20px rgba(0,0,0,0.45)';
      document.body.appendChild(tip);
    }
    tooltipRef.current = tip;
  }, []);

  function openCoalPopup(i) {
    setSelectedCoalId('');
    setPercent('');
    setAddOpen({ open: true, bunkerIndex: i });
  }

  function hideTooltip() {
    const tip = tooltipRef.current;
    if (tip) tip.style.display = 'none';
  }

  function showTooltip(ev, layer) {
    const tip = tooltipRef.current;
    if (!tip || !layer) return;
    const coalDoc = (layer.coalDoc && typeof layer.coalDoc === 'object') ? layer.coalDoc : (window.COAL_DB || []).find(c => String(c._id) === String(layer.coalId));
    const name = layer.coal || (coalDoc && (coalDoc.coal || coalDoc.name)) || '—';
    const pct = (Number(layer.percent) || 0).toFixed(2) + '%';
    const gcv = (layer.gcv !== undefined && layer.gcv !== null) ? Number(layer.gcv).toFixed(2) : (coalDoc && coalDoc.gcv !== undefined ? Number(coalDoc.gcv).toFixed(2) : '--');
    const cost = (layer.cost !== undefined && layer.cost !== null) ? Number(layer.cost).toFixed(2) : (coalDoc && coalDoc.cost !== undefined ? Number(coalDoc.cost).toFixed(2) : '--');
    const aftVal = coalDoc ? calcAFT(coalDoc) : calcAFT(layer);
    const aftText = isFinite(aftVal) ? Number(aftVal).toFixed(2) : '--';

    tip.innerHTML = `<div style="font-weight:700;margin-bottom:6px">${escapeHtml(name)}</div>
      <div style="display:flex;justify-content:space-between"><span style="opacity:0.85">Percent</span><strong>${pct}</strong></div>
      <div style="display:flex;justify-content:space-between"><span style="opacity:0.85">GCV</span><strong>${gcv}</strong></div>
      <div style="display:flex;justify-content:space-between"><span style="opacity:0.85">Cost</span><strong>${cost}</strong></div>
      <div style="display:flex;justify-content:space-between;margin-top:6px"><span style="opacity:0.85">AFT</span><strong>${aftText}</strong></div>`;

    const left = Math.min(window.innerWidth - 260, ev.pageX + 12);
    const top = Math.min(window.innerHeight - 120, ev.pageY + 12);
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
    tip.style.display = 'block';
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"'`=\/]/g, function (c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#47;','`':'&#96;','=':'&#61;'}[c];
    });
  }

  // Called from App when Clear is pressed in popup. Remove top layer from that bunker
  async function handleClearTopLayer() {
    const b = addOpen.bunkerIndex;
    if (b === null) return;
    removeTopLayer(b);
    // notify parent that user edited bunker layers
    if (typeof onUserEdit === 'function') onUserEdit('clientBunkers');
    setAddOpen({ open: false, bunkerIndex: null });
  }

  // confirmAdd keeps same behaviour
  async function confirmAdd() {
    const b = addOpen.bunkerIndex;
    if (b === null) return;
    let pctNum = Number(percent || 0);
    if (isNaN(pctNum)) pctNum = 0;
    if (pctNum < 0) pctNum = 0;
    if (pctNum > 100) pctNum = 100;
    if (!selectedCoalId) {
      alert('Select a coal first.');
      return;
    }
    if (pctNum <= 0) {
      alert('Enter a percent greater than 0 (max 100).');
      return;
    }
    const layers = (clientBunkers[b] && clientBunkers[b].layers) ? clientBunkers[b].layers : [];
    const existingSum = layers.reduce((s, x) => s + (Number(x.percent) || 0), 0);
    if (existingSum >= 100) {
      alert('Bunker is already at 100% — cannot add more.');
      return;
    }
    const remaining = Math.max(0, 100 - existingSum);
    if (pctNum > remaining) {
      pctNum = remaining;
      alert(`Percent reduced to ${pctNum}% to not exceed 100% in this bunker.`);
    }

    const doc = (coals || []).find(c => String(c._id) === String(selectedCoalId)) || (window.COAL_DB || []).find(c => String(c._id) === String(selectedCoalId));
    const coalName = doc ? (doc.coal || doc.name || String(doc._id)) : String(selectedCoalId);
    const color = (doc && (doc.color || doc.colour)) ? (doc.color || doc.colour) : hashColor(coalName);

    const layer = {
      coalId: selectedCoalId || (doc && doc._id) || null,
      coal: coalName,
      percent: pctNum,
      gcv: doc ? (Number(doc.gcv) || undefined) : undefined,
      cost: doc ? (Number(doc.cost) || undefined) : undefined,
      coalDoc: doc || undefined,
      color
    };

    addBunkerLayer(b, layer);
    // notify parent that user edited bunker layers
    if (typeof onUserEdit === 'function') onUserEdit('clientBunkers');
    setAddOpen({ open: false, bunkerIndex: null });
  }

  // clip polygon & left positions
  const clipPoly = '15,15 15,100 45,135 55,135 85,100 85,15';
  const leftPercents = ['6.25%','18.75%','31.25%','43.75%','56.25%','68.75%','81.25%','93.75%'];

  return (
    <div className="diagram-in-grid" style={{ padding: 8 }}>
      <div className="layout">
        <div className="top-overlay" aria-hidden="true">
          <div className="top-line" />
          {leftPercents.map((left, idx) => <div className="arrow" key={'arrow-'+idx} style={{ left }} aria-hidden="true" />)}
          {leftPercents.map((left, idx) => (
            <button key={'add-'+idx} className="add-coal-overlay" style={{ left }} onClick={() => openCoalPopup(idx)} title={`Add coal to bunker ${idx+1}`}>+</button>
          ))}
        </div>

        <div className="bunkers-grid" role="list">
          {Array.from({ length: 8 }).map((_, i) => {
            const layers = (clientBunkers[i] && clientBunkers[i].layers) ? clientBunkers[i].layers : [];
            const clipId = `bunkerClip${i}`;
            const totalH = 120;
            let cum = 0;
            return (
              <div className="bunker" key={'bunker-'+i} data-bunker={i}>
                <svg viewBox="0 0 100 150" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
                  <defs>
                    <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                      <polygon points={clipPoly} />
                    </clipPath>
                    {layers.map((L, idx) => {
                      const fillColor = L.color || hashColor(L.coal || L.coalId || `${i}-${idx}`);
                      const patternId = sanitizePatternIdLocal(`ptn-${i}-${idx}-${fillColor}`);
                      const patSize = 8;
                      return (
                        <pattern id={patternId} key={patternId} patternUnits="userSpaceOnUse" width={patSize} height={patSize}>
                          <rect x="0" y="0" width={patSize} height={patSize} fill="transparent" />
                          <circle cx={patSize/2} cy={patSize/2} r={patSize/3} fill={fillColor} />
                          <circle cx={(patSize/2)+1} cy={(patSize/2)-1} r={Math.max(0.8, patSize/8)} fill="rgba(0,0,0,0.12)" />
                        </pattern>
                      );
                    })}
                  </defs>

                  <path d="M10 10 V100 L45 140 M55 140 L90 100 V10" />

                  <g clipPath={`url(#${clipId})`}>
                    {layers.map((L, idx) => {
                      const h = Math.max(0, (Number(L.percent) || 0) / 100 * totalH);
                      const y = 140 - (cum + h);
                      cum += h;
                      const fillColor = L.color || hashColor(L.coal || L.coalId || `${i}-${idx}`);
                      const patternId = sanitizePatternIdLocal(`ptn-${i}-${idx}-${fillColor}`);
                      return (
                        <rect
                          key={idx}
                          x={12}
                          y={y}
                          width={76}
                          height={h}
                          fill={`url(#${patternId})`}
                          rx="6"
                          ry="6"
                          onMouseEnter={(ev) => showTooltip(ev, L)}
                          onMouseMove={(ev) => showTooltip(ev, L)}
                          onMouseLeave={hideTooltip}
                          style={{ transition: 'height 0.9s linear, y 0.9s linear' }}
                        />
                      );
                    })}
                  </g>
                </svg>

                <div className="label">Bunker {i+1}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add-popup */}
      {addOpen.open && (
        <div className="popup">
          <div className="popup-content" role="dialog" aria-modal="true">
            <h3 style={{ marginTop: 0 }}>Add coal to Bunker {addOpen.bunkerIndex + 1}</h3>

            <div className="popup-row">
              <label>Coal</label>
              {coals.length === 0 ? (
                <select disabled value="">
                  <option value="">No coals available</option>
                </select>
              ) : (
                <select
                  value={selectedCoalId}
                  onChange={(e) => {
                    setSelectedCoalId(e.target.value);
                    if (typeof onUserEdit === 'function') onUserEdit('clientBunkers');
                  }}
                >
                  <option value="">-- select coal --</option>
                  {coals.map(c => (
                    <option key={c._id || c.coal} value={c._id || c.coal}>
                      {c.coal || c.name || (c._id || 'Unnamed')}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="popup-row">
              <label>Percent</label>
              <input
                type="number"
                min={0}
                max={100}
                value={percent}
                onChange={(e) => {
                  let v = e.target.value;
                  if (v === '') { setPercent(''); if (typeof onUserEdit === 'function') onUserEdit('clientBunkers'); return; }
                  let n = Number(v);
                  if (isNaN(n)) n = 0;
                  if (n < 0) n = 0;
                  if (n > 100) n = 100;
                  setPercent(String(n));
                  if (typeof onUserEdit === 'function') onUserEdit('clientBunkers');
                }}
                placeholder="%"
              />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-cancel" onClick={() => setAddOpen({ open:false, bunkerIndex:null })}>Cancel</button>
              <button className="btn btn-clear" onClick={handleClearTopLayer}>Clear Last</button>
              <button className="btn btn-save" onClick={confirmAdd} disabled={!selectedCoalId || Number(percent) <= 0}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
