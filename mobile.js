/* Public app shell; optional private snapshots are handled by private-sync.js. */
(() => {
  const $ = id => document.getElementById(id);
  const el = (tag, text, className) => { const n=document.createElement(tag); if(text!==undefined)n.textContent=text; if(className)n.className=className; return n; };
  window.renderOfflineRoutes = days => {
    const root=$('offline-routes'); root.replaceChildren();
    days.forEach(day => {
      const card=el('article',undefined,'route-card'); card.append(el('h4',day.day+' · '+day.label));
      const list=el('ol');
      day.items.forEach(([time,title,note]) => { const li=el('li'); li.append(el('time',time),el('b',title),el('small',note)); list.append(li); });
      card.append(list); root.append(card);
    });
  };
  // The inline itinerary renderer may finish before this deferred file runs.
  const timeline=document.getElementById('day-timeline');
  if(timeline.children.length) {
    try { const saved=JSON.parse(localStorage.getItem('osaka-mobile-state-v1')); if(saved?.days)window.renderOfflineRoutes(saved.days); else fetch('./trip-data.json').then(r=>r.json()).then(s=>window.renderOfflineRoutes(s.days)); } catch { /* Main app reports storage errors. */ }
  }
  fetch('./places.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(places=>{
    places.forEach(place=>{
      const card=el('article',undefined,'place-card'); card.append(el('b',place.name),el('p',place.day+' · '+place.kind),el('p',place.query),el('p',place.note));
      const link=el('a','Google 地圖／導航 ↗（需網絡）'); link.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(place.query); link.target='_blank'; link.rel='noreferrer'; card.append(link); $('offline-places').append(card);
    });
  }).catch(()=>{$('offline-places').textContent='地點清單尚未下載，請連網重新載入。';});
  const active=()=>document.querySelectorAll('.mobile-tabs a').forEach(a=>{if(a.hash===location.hash)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  window.addEventListener('hashchange',active); active();
  let ready=false;
  function status(message) { $('offline-status').textContent=message; $('offline-status').dataset.ready=String(ready); }
  const connection=()=>status(ready ? (navigator.onLine?'離線包已備妥 · 請在手機開飛行模式重開本頁驗收。':'目前離線 · 可查看已下載行程、餐廳及路線。'):'離線包尚未備妥，請保持連網。');
  window.addEventListener('online',connection); window.addEventListener('offline',connection);
  if('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(async()=>{
      // Check actual shell contents, not just registration success.
      const registration=await navigator.serviceWorker.getRegistration();
      if(!registration?.active)throw Error('離線服務尚未啟用');
      const assets=['./index.html','./trip-data.json','./places.json','./mobile.js','./mobile.css'];
      const cache=await caches.open('osaka-lany-2026-v14');
      const found=await Promise.all(assets.map(path=>cache.match(new URL(path,location.href).href)));
      if(found.some(x=>!x))throw Error('下載未完整'); ready=true; connection();
    }).catch(()=>status('離線包未完成：請保持連網並重新載入。私人瀏覽模式可能不支援。'));
  } else status('此瀏覽器不支援離線包；請用 Safari 或 Chrome 的 HTTPS 網址。');

  const walletStatus=$('wallet-status'); let db; const objectUrls=[];
  const request=indexedDB.open('osaka-private-wallet-v1',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('files',{keyPath:'id'});
  request.onerror=()=>{walletStatus.textContent='這個瀏覽器不能儲存私人票券；請保留原 PDF／圖片。';$('wallet-file').disabled=true;};
  const operation=(mode,fn)=>new Promise((resolve,reject)=>{const tx=db.transaction('files',mode);let result;const r=fn(tx.objectStore('files'));r.onsuccess=()=>{result=r.result;};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});
  async function renderWallet() {
    objectUrls.splice(0).forEach(url=>URL.revokeObjectURL(url)); $('wallet-files').replaceChildren();
    const files=await operation('readonly',store=>store.getAll());
    files.forEach(file=>{
      const row=el('div',undefined,'wallet-row'); row.append(el('span',file.name));
      const url=URL.createObjectURL(file.blob); objectUrls.push(url);
      const open=el('a','開啟'); open.href=url; open.target='_blank'; open.rel='noopener';
      const save=el('a','下載備份'); save.href=url; save.download=file.name;
      const remove=el('button','移除'); remove.type='button'; remove.onclick=async()=>{
        if(!confirm('只移除這部裝置內的「'+file.name+'」？原檔不受影響。'))return;
        try {await operation('readwrite',store=>store.delete(file.id));await renderWallet();}catch{walletStatus.textContent='未能移除，請重試。';}
      }; row.append(open,save,remove); $('wallet-files').append(row);
    });
    walletStatus.textContent=files.length?'已儲存 '+files.length+' 份文件在這部裝置。':'尚未加入私人文件。';
  }
  window.addEventListener('osaka-wallet-updated',()=>{if(db)renderWallet().catch(()=>{walletStatus.textContent='票券已新增，請重新載入查看。';});});
  request.onsuccess=()=>{db=request.result;renderWallet().catch(()=>{walletStatus.textContent='文件讀取失敗，請重新載入。';});};
  $('wallet-file').addEventListener('change',async event=>{
    if(!db){walletStatus.textContent='文件儲存尚未就緒，請稍後重試。';return;}
    try {
      for(const file of event.target.files) {
        if(!['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024)throw Error('只接受 20 MB 內的 PDF／JPG／PNG／WebP。');
        await operation('readwrite',store=>store.put({id:crypto.randomUUID(),name:file.name,blob:file}));
      }
      await renderWallet();
    }catch(error){walletStatus.textContent='未能完成儲存：'+error.message+' 請保留原檔。';}
    event.target.value='';
  });
})();
