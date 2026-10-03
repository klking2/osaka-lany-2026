/* Opt-in, versioned Drive app-data snapshots. Tokens live only in memory. */
(() => {
  const C=window.OsakaSyncCore,$=id=>document.getElementById(id);
  const scope='https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.email';
  const API='https://www.googleapis.com/drive/v3/files';
  let token='',expires=0,client=null,busy=false,files=[],email='',dbPromise;
  const message=text=>{$('sync-status').textContent=text;};
  function controls(){
    const connected=token&&Date.now()<expires;
    $('sync-connect').disabled=busy||!client;
    for(const id of ['sync-upload','sync-list','sync-disconnect'])$(id).disabled=busy||!connected;
    $('sync-restore').disabled=busy||!connected||!$('sync-versions').value;
    $('sync-restore-wallet').disabled=busy||!connected||!$('sync-versions').value;
    $('sync-versions').disabled=busy;$('sync-undo').disabled=busy;
  }
  async function work(fn){if(busy)return;busy=true;controls();try{await fn();}catch(e){message(e.message||'同步失敗；本機資料仍保留。');}finally{busy=false;controls();}}
  function authorize(){if(!token||Date.now()>=expires){token='';controls();throw Error('Google 授權已到期，請重新連接；本機資料仍保留。');}}
  async function request(url,options={}){
    authorize();const u=new URL(url);if(u.origin!=='https://www.googleapis.com')throw Error('同步端點不正確');
    const r=await fetch(url,{...options,headers:{...options.headers,Authorization:'Bearer '+token},cache:'no-store'});
    if(r.status===401){token='';expires=0;controls();throw Error('Google 授權已到期，請重新連接。');}
    if(!r.ok)throw Error('Drive 操作未完成（HTTP '+r.status+'）；本機資料未移除。');
    return r;
  }
  function openDB(){return dbPromise||(dbPromise=new Promise((resolve,reject)=>{
    const r=indexedDB.open('osaka-private-wallet-v1',1);
    r.onupgradeneeded=()=>r.result.createObjectStore('files',{keyPath:'id'});
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('私人票券儲存無法開啟'));
  }));}
  async function wallet(){const db=await openDB();return new Promise((resolve,reject)=>{
    const tx=db.transaction('files','readonly'),r=tx.objectStore('files').getAll();
    tx.oncomplete=()=>resolve(r.result);tx.onabort=tx.onerror=()=>reject(Error('私人票券未能讀取'));
  });}
  async function addWallet(incoming){
    // Never overwrite or delete local attachments. Equal bytes are deduplicated.
    const existing=await wallet(),hashes=new Set();
    for(const f of existing)hashes.add(await C.digest(await f.blob.arrayBuffer()));
    const additions=[];for(const f of incoming){if(hashes.has(f.sha256))continue;hashes.add(f.sha256);additions.push({id:crypto.randomUUID(),name:f.name,blob:new Blob([C.decode(f.data)],{type:f.type})});}
    const db=await openDB();await new Promise((resolve,reject)=>{
      const tx=db.transaction('files','readwrite'),store=tx.objectStore('files');
      for(const f of additions)store.add(f);
      tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(Error('票券儲存失敗；原有票券未更動。'));
    });
    window.dispatchEvent(new Event('osaka-wallet-updated'));return additions.length;
  }
  async function collect(){
    if(!window.osakaPrivateState?.read())throw Error('請先等候行程載入完成');
    const state=C.state(window.osakaPrivateState.read());
    const result={format:'osaka-private-v1',createdAt:new Date().toISOString(),device:$('sync-device').value.trim()||'未命名裝置',state,files:[]};
    const local=await wallet();let total=0;
    if(local.length>100)throw Error('每次最多同步 100 份票券');
    for(const f of local){
      total+=f.blob.size;if(f.blob.size>C.MAX_FILE||total>C.MAX_TOTAL)throw Error('每份票券上限 20 MB，合計上限 64 MB');
      if(!C.types.includes(f.blob.type))throw Error('票券只接受 PDF／JPG／PNG／WebP');
      const bytes=new Uint8Array(await f.blob.arrayBuffer());
      result.files.push({name:f.name,type:f.blob.type,data:C.encode(bytes),sha256:await C.digest(bytes)});
    }
    return C.snapshot(result);
  }
  async function readSnapshot(id){
    if(!/^[\w-]+$/.test(id))throw Error('版本 ID 不正確');
    const r=await request(API+'/'+id+'?alt=media');
    if(Number(r.headers.get('content-length'))>100*1024*1024)throw Error('版本檔案過大');
    const blob=await r.blob();if(blob.size>100*1024*1024)throw Error('版本檔案過大');
    return {text:await blob.text()};
  }
  async function listVersions(){
    const found=[];let pageToken='';
    do{
      const params=new URLSearchParams({spaces:'appDataFolder',q:"trashed = false and appProperties has { key='osakaSync' and value='v1' }",fields:'nextPageToken,files(id,name,createdTime,size)',orderBy:'createdTime desc',pageSize:'100'});
      if(pageToken)params.set('pageToken',pageToken);
      const data=await (await request(API+'?'+params)).json();found.push(...(data.files||[]));pageToken=data.nextPageToken||'';
    }while(pageToken&&found.length<500);
    files=found;const select=$('sync-versions');select.replaceChildren();
    const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent=files.length?'選擇要載入的版本（最新在上）':'Drive 尚未有私人版本';select.append(placeholder);
    for(const f of files){const o=document.createElement('option');o.value=f.id;o.textContent=new Date(f.createdTime).toLocaleString()+' · '+f.name;select.append(o);}
    controls();return files.length;
  }
  async function upload(){
    message('正在整理行程及票券…');const snapshot=await collect();const text=JSON.stringify(snapshot);const content=new Blob([text],{type:'application/json'});
    const name='大阪私人行程 · '+snapshot.device+' · '+snapshot.createdAt;
    const start=await request('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id',{
      method:'POST',headers:{'Content-Type':'application/json','X-Upload-Content-Type':'application/json','X-Upload-Content-Length':String(content.size)},
      body:JSON.stringify({name,mimeType:'application/json',parents:['appDataFolder'],appProperties:{osakaSync:'v1'}})
    });
    const location=start.headers.get('Location');if(!location||!location.startsWith('https://www.googleapis.com/upload/drive/'))throw Error('未取得安全的 Drive 上傳位置');
    message('正在上傳私人版本…');const saved=await (await request(location,{method:'PUT',headers:{'Content-Type':'application/json'},body:content})).json();
    message('正在回讀核對雲端版本…');const downloaded=await readSnapshot(saved.id);
    if(await C.digest(downloaded.text)!==await C.digest(text))throw Error('雲端回讀校驗未通過，請重新儲存；本機資料仍保留。');
    await listVersions();$('sync-versions').value=saved.id;
    const current=window.osakaPrivateState.read();const changed=JSON.stringify(C.state(current))!==JSON.stringify(snapshot.state);
    message('已儲存並回讀確認 · '+email+' · '+snapshot.files.length+' 份票券。'+(changed?'上傳期間行程有新修改，請再儲存一次。':'另一裝置登入同一帳戶後，選此版本載入。'));
  }
  async function restore(){
    const file=files.find(f=>f.id===$('sync-versions').value);if(!file)throw Error('請先選擇版本');
    message('正在下載及校驗私人版本…');const downloaded=await readSnapshot(file.id);const snapshot=await C.snapshot(JSON.parse(downloaded.text));
    if(!confirm('載入「'+snapshot.device+'」於 '+new Date(snapshot.createdAt).toLocaleString()+' 儲存的版本？\n將取代本機的行程、待辦、選餐及備註，並保留載入前備份。票券只新增缺少的內容，不刪除本機票券。')){message('已取消載入；本機資料未更動。');return;}
    window.osakaPrivateState.backup(); // Failing backup prevents all writes.
    const count=await addWallet(snapshot.files);
    window.osakaPrivateState.apply(snapshot.state);
    message('已載入 '+snapshot.device+' 的私人行程，新增 '+count+' 份票券；原有票券保留。這不會修改真實訂位。');
  }
  async function restoreWalletOnly(){
    const file=files.find(f=>f.id===$('sync-versions').value);if(!file)throw Error('請先選擇版本');
    message('正在下載及校驗私人票券…');
    const downloaded=await readSnapshot(file.id);const snapshot=await C.snapshot(JSON.parse(downloaded.text));
    const count=await addWallet(snapshot.files);
    message('已加入 '+count+' 份私人票券；重複圖片已略過，手機行程、備註與原有票券均保留。');
    location.hash='#offline-wallet';window.revealReading?.('#offline-wallet',true);
  }
  $('sync-restore-wallet').onclick=()=>work(restoreWalletOnly);
  $('sync-undo').onclick=()=>work(async()=>{if(confirm('還原最近一次載入前的行程、待辦、選餐及備註？票券保持現狀。')){window.osakaPrivateState.undo();message('已還原載入前的行程；票券保持現狀。');}});
  $('sync-upload').onclick=()=>work(upload);
  $('sync-list').onclick=()=>work(async()=>{const n=await listVersions();message(email+' · 找到 '+n+' 個私人版本（最多顯示最新 500 個）');});
  $('sync-restore').onclick=()=>work(restore);$('sync-versions').onchange=controls;
  $('sync-disconnect').onclick=()=>{token='';expires=0;email='';files=[];$('sync-versions').replaceChildren();message('已中斷本頁連接；本機與 Drive 版本均保留。');controls();};
  $('sync-device').onchange=()=>{try{localStorage.setItem('osaka-sync-device-name',$('sync-device').value);}catch{}};
  try{$('sync-device').value=localStorage.getItem('osaka-sync-device-name')||'';}catch{}
  window.addEventListener('osaka-state-saved',()=>{if(!busy)message('本機行程已修改；需要時按「儲存到私人 Drive」同步。');});
  async function initialize(){
    const r=await fetch('./sync-config.json');if(!r.ok)throw Error('同步設定未能載入');const config=await r.json();
    if(!/^[\w-]+\.apps\.googleusercontent\.com$/.test(config.clientId||''))throw Error('私人同步設定尚未完成');
    await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.onload=resolve;s.onerror=()=>reject(Error('Google 登入未能載入；請連網後重試'));document.head.append(s);});
    client=google.accounts.oauth2.initTokenClient({client_id:config.clientId,scope,include_granted_scopes:false,
      callback:response=>work(async()=>{
        if(response.error||!response.access_token)throw Error('Google 授權未完成');
        if(!google.accounts.oauth2.hasGrantedAllScopes(response,'https://www.googleapis.com/auth/drive.appdata','https://www.googleapis.com/auth/userinfo.email'))throw Error('需要私人應用程式資料及電郵辨識權限才能同步');
        token=response.access_token;expires=Date.now()+(Number(response.expires_in)||0)*1000-60000;
        try{const user=await (await request('https://www.googleapis.com/oauth2/v3/userinfo')).json();if(!user.email)throw Error('未能確認登入帳戶');email=user.email;await listVersions();message('已連接 '+email+'。請選擇儲存本機版本或載入另一裝置版本。');}catch(e){token='';expires=0;throw e;}
      }),error_callback:()=>{message('登入視窗未完成，請再按連接 Google Drive。');controls();}});
    $('sync-connect').onclick=()=>{token='';expires=0;email='';files=[];$('sync-versions').replaceChildren();controls();client.requestAccessToken({prompt:'select_account'});};
    message('尚未連接。兩部裝置請使用同一個 Google 帳戶。');controls();
  }
  controls();initialize().catch(e=>message(e.message));
})();
