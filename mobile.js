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
  fetch('./places.json?v=62').then(r=>{if(!r.ok)throw Error();return r.json();}).then(places=>{
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
      const assets=['./guide-data.json?v=62','./guides.js?v=62','./index.html','./trip-data.json','./places.json?v=62','./mobile.js?v=66','./mobile.css?v=66'];
      const cache=await caches.open('osaka-lany-2026-v25');
      const found=await Promise.all(assets.map(path=>cache.match(new URL(path,location.href).href)));
      if(found.some(x=>!x))throw Error('下載未完整'); ready=true; connection();
    }).catch(()=>status('離線包未完成：請保持連網並重新載入。私人瀏覽模式可能不支援。'));
  } else status('此瀏覽器不支援離線包；請用 Safari 或 Chrome 的 HTTPS 網址。');

  const walletStatus=$('wallet-status'); let db; const objectUrls=[];
  const request=indexedDB.open('osaka-private-wallet-v1',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('files',{keyPath:'id'});
  request.onerror=()=>{walletStatus.textContent='這個瀏覽器不能儲存私人票券；請保留原 PDF／圖片。';$('wallet-file').disabled=true;};
  const operation=(mode,fn)=>new Promise((resolve,reject)=>{const tx=db.transaction('files',mode);let result;const r=fn(tx.objectStore('files'));r.onsuccess=()=>{result=r.result;};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});
  const viewer=$('wallet-viewer'),viewerImage=$('wallet-viewer-image');
  const closeViewer=()=>{if(viewer.open)viewer.close();};
  $('wallet-viewer-close').onclick=closeViewer;
  $('wallet-viewer-zoom').onclick=()=>{
    const zoomed=viewerImage.classList.toggle('actual-size');
    $('wallet-viewer-zoom').textContent=zoomed?'適合螢幕':'原始大小';
  };
  viewer.addEventListener('close',()=>{viewerImage.removeAttribute('src');viewerImage.classList.remove('actual-size');});
  function ticketTitle(file){
    if(typeof file.title==='string'&&file.title.trim())return file.title.trim();
    const name=file.name||'',owner=/Edward|Long/i.test(name)?'Edward':/同行者|Fanny/i.test(name)?'同行者':'';
    const person=owner?'｜'+owner:'';
    if(/護照/.test(name))return '護照影本'+person;
    if(/Visit Japan|入境海關/i.test(name))return 'Visit Japan Web｜入境及海關 QR'+person;
    if(/登機證/.test(name))return '去程電子登機證｜香港 → 關西'+person;
    if(/Loppi/i.test(name))return 'LANY 演唱會｜Lawson 取票 QR 碼';
    if(/最新開場|時間変更/.test(name))return 'LANY 演唱會｜最新開場及演出時間通知';
    if(/Lawson海外|非日本用戶/.test(name))return 'Lawson｜海外旅客取票操作說明';
    if(/原始預訂/.test(name))return 'LANY 演唱會｜原始訂單（時間以最新通知為準）';
    if(/門票收據/.test(name))return 'LANY 演唱會｜購票收據';
    if(/訂位詳情/.test(name))return 'LANY 演唱會｜已付款預訂紀錄（非入場票）';
    if(/酒店|住宿訂房/.test(name))return '酒店｜住宿預訂確認';
    if(/機票|HK Express訂單/.test(name))return 'HK Express｜機票訂單（非登機證）';
    if(/保險|旅遊保/.test(name))return '旅遊保險｜保單及保障文件';
    return file.blob?.type==='application/pdf'?'私人旅程文件｜待填標題':'私人票券圖片｜待填標題';
  }
  window.osakaTicketTitle=ticketTitle;
  function showImage(file,url){
    $('wallet-viewer-title').textContent=ticketTitle(file);
    viewerImage.alt=ticketTitle(file);viewerImage.src=url;viewerImage.classList.remove('actual-size');
    $('wallet-viewer-zoom').textContent='原始大小';viewer.showModal();
  }
  async function renderWallet() {
    closeViewer();objectUrls.splice(0).forEach(url=>URL.revokeObjectURL(url));$('wallet-files').replaceChildren();
    const files=await operation('readonly',store=>store.getAll());
    files.sort((a,b)=>a.name.localeCompare(b.name,'zh-Hant'));
    files.forEach(file=>{
      const title=ticketTitle(file);
      const row=el('details',undefined,'wallet-card reading-toggle');
      const summary=el('summary',title,'wallet-title');row.append(summary);
      const content=el('div',undefined,'wallet-content');row.append(content);
      const url=URL.createObjectURL(file.blob);objectUrls.push(url);
      if(['image/jpeg','image/png','image/webp'].includes(file.blob.type)){
        const preview=el('button',undefined,'wallet-image-button');preview.type='button';preview.setAttribute('aria-label','放大 '+title);
        const img=el('img');img.src=url;img.alt=title;img.loading='lazy';img.decoding='async';preview.append(img);
        preview.onclick=()=>showImage(file,url);content.append(preview);
        content.append(el('p','點圖片放大；原圖儲存在本機，可離線查看。','wallet-image-hint'));
      }
      const actions=el('div',undefined,'wallet-actions');
      const open=el('a','開啟原檔');open.href=url;open.target='_blank';open.rel='noopener';
      const save=el('a','下載備份');save.href=url;save.download=file.name;
      const rename=el('button','修改標題');rename.type='button';rename.onclick=async()=>{
        const title=prompt('這是什麼票券？輸入用途及持有人（原始檔名保持不變）：',ticketTitle(file));
        if(title===null)return;
        if(!title.trim()||title.trim().length>200){walletStatus.textContent='請填寫 1 至 200 字的票券標題。';return;}
        try{await operation('readwrite',store=>store.put({...file,title:title.trim()}));await renderWallet();}catch{walletStatus.textContent='標題未能儲存，請重試。';}
      };
      const remove=el('button','移除');remove.type='button';remove.onclick=async()=>{
        if(!confirm('只移除這部裝置內的「'+file.name+'」？原檔不受影響。'))return;
        try{await operation('readwrite',store=>store.delete(file.id));await renderWallet();}catch{walletStatus.textContent='未能移除，請重試。';}
      };
      actions.append(open,save,rename,remove);content.append(actions);$('wallet-files').append(row);
    });
    $('wallet-count').textContent='這部裝置：'+files.length+' 份';
    walletStatus.textContent=files.length?'這部裝置已儲存 '+files.length+' 份私人文件。若數量不足，按上方「登入 Google 並載入最新票券」。':'這部裝置尚未載入私人文件。按上方「登入 Google 並載入最新票券」，完成後文件會出現在這裏。';
  }
  window.addEventListener('osaka-wallet-updated',()=>{if(db)renderWallet().catch(()=>{walletStatus.textContent='票券已新增，請重新載入查看。';});});
  request.onsuccess=()=>{db=request.result;renderWallet().catch(()=>{walletStatus.textContent='文件讀取失敗，請重新載入。';});};
  $('wallet-file').addEventListener('change',async event=>{
    if(!db){walletStatus.textContent='文件儲存尚未就緒，請稍後重試。';return;}
    try {
      const existing=await operation('readonly',store=>store.getAll());
      const digest=async blob=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))).map(b=>b.toString(16).padStart(2,'0')).join('');
      const hashes=new Set(await Promise.all(existing.map(f=>digest(f.blob))));
      for(const file of event.target.files) {
        if(!['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024)throw Error('只接受 20 MB 內的 PDF／JPG／PNG／WebP。');
        const hash=await digest(file);if(hashes.has(hash))continue;
        await operation('readwrite',store=>store.add({id:crypto.randomUUID(),name:file.name,title:ticketTitle({name:file.name,blob:file}),blob:file}));hashes.add(hash);
      }
      await renderWallet();
    }catch(error){walletStatus.textContent='未能完成儲存：'+error.message+' 請保留原檔。';}
    event.target.value='';
  });
})();
