/* Public, offline reading guides. No private state or ticket data is stored here. */
(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let data = { guides: [] };
  const safeURL = value => /^(https:\/\/|tel:\+?[0-9-]+$|#[a-z0-9-]+$)/i.test(value) ? value : '#itinerary';
  const text = guide => [guide.title,guide.prepare,...guide.steps,guide.action,guide.confirm,guide.fallback,...guide.links.map(l=>l.label)].join(' ').toLowerCase();
  const matches = (guide, query) => !query || text(guide).includes(query.toLowerCase());
  const forDay = day => data.guides.filter(g => g.day === day);
  const find = (day, item) => forDay(day).find(g => g.aliases.includes(item[1]));
  function render(guide, { open = false, suffix = '' } = {}) {
    const links = values => values.map(l => `<a href="${esc(safeURL(l.url))}"${l.url.startsWith('https:')?' target="_blank" rel="noopener noreferrer"':''}>${esc(l.label)}</a>`).join('');
    return `<details class="reading-toggle stop-guide" id="guide-${esc(guide.id+suffix)}"${open?' open':''}>
      <summary class="reading-heading">展開：怎樣去／到場怎樣做<span class="guide-name">${esc(guide.title)}</span></summary>
      <div class="guide-body">
        <h4>出發前準備</h4><p>${esc(guide.prepare)}</p>
        <h4>一步一步走</h4><ol>${guide.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>
        <h4>到場操作／時間提醒</h4><p class="guide-alert">${esc(guide.action)}</p>
        <h4>完成確認</h4><p>${esc(guide.confirm)}</p>
        <h4>延誤／失敗備案</h4><p>${esc(guide.fallback)}</p>
        <div class="guide-links">${links(guide.links)}</div>
        <p class="guide-source">資料核對：${esc(guide.checkedAt)}。路程及候位緩衝為行程建議；實際依現場。${guide.sources.length?' 來源：':''}</p>
        <div class="guide-sources">${links(guide.sources)}</div>
      </div></details>`;
  }
  window.OsakaGuides = { find, forDay, matches, render, byId: id => data.guides.find(g=>g.id===id) };
  fetch('./guide-data.json?v=62').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();}).then(value=>{
    if(!Array.isArray(value.guides))throw Error('指南格式無效');
    data=value;
    document.getElementById('guide-status').textContent='逐站指南已載入 · '+value.timeNote;
    window.dispatchEvent(new Event('osaka-guides-ready'));
  }).catch(()=>{
    document.getElementById('guide-status').textContent='詳細指南未能載入，請連網重新整理；原有行程仍可閱讀。';
  });
})();
