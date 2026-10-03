/* Validation shared by browser sync and local regression checks. No credentials. */
(() => {
  const MAX_FILE=20*1024*1024, MAX_TOTAL=64*1024*1024;
  const types=['application/pdf','image/jpeg','image/png','image/webp'];
  function check(ok,message='同步檔案格式不正確') { if(!ok)throw Error(message); }
  function str(value,max=10000) {check(typeof value==='string'&&value.length<=max);return value;}
  function dict(value,validate) {
    check(value&&typeof value==='object'&&!Array.isArray(value));
    const result={};check(Object.keys(value).length<=500);
    for(const [key,item] of Object.entries(value)) {
      check(/^[a-zA-Z0-9_/-]{1,100}$/.test(key)&&!['__proto__','prototype','constructor'].includes(key));
      check(validate(item));result[key]=item;
    }
    return result;
  }
  function state(value) {
    check(value&&typeof value==='object');
    check(Number.isSafeInteger(value.revision)&&value.revision>=0);
    check(Number.isSafeInteger(value.publishedRevision)&&value.publishedRevision>=0);
    check(Array.isArray(value.days)&&value.days.length===4);
    const days=value.days.map((d,i)=>{
      check(d.day===['10/4','10/5','10/6','10/7'][i]);
      check(Number.isFinite(d.width)&&d.width>=0&&d.width<=100);
      check(Array.isArray(d.items)&&d.items.length<=200);
      return {day:d.day,label:str(d.label,500),read:str(d.read),density:str(d.density,100),width:d.width,
        items:d.items.map(row=>{check(Array.isArray(row)&&row.length===4);return row.map(x=>str(x));})};
    });
    check(Array.isArray(value.taskItems)&&value.taskItems.length<=300);
    const seen=new Set();
    const taskItems=value.taskItems.map(t=>{
      const id=str(t.id,100);check(/^[a-zA-Z0-9_-]+$/.test(id)&&!seen.has(id));seen.add(id);
      return {id,title:str(t.title,1000),note:str(t.note),priority:str(t.priority,100)};
    });
    return {revision:value.revision,publishedRevision:value.publishedRevision,
      updatedAt:typeof value.updatedAt==='string'?str(value.updatedAt,100):'',
      editedDays:dict(value.editedDays||{},x=>typeof x==='boolean'),
      taskChecks:dict(value.taskChecks||{},x=>typeof x==='boolean'),
      food:dict(value.food||{},x=>typeof x==='boolean'||(typeof x==='string'&&x.length<=100)),
      taskItems,days,notes:str(value.notes,1000000)};
  }
  async function digest(bytes) {
    const data=typeof bytes==='string'?new TextEncoder().encode(bytes):bytes;
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  function encode(bytes) {let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s);}
  function decode(s) {check(typeof s==='string'&&s.length<=Math.ceil(MAX_FILE/3)*4&&s.length%4===0&&/^[A-Za-z0-9+/]*={0,2}$/.test(s),'票券資料格式或大小不正確');const raw=atob(s);check(raw.length<=MAX_FILE);return Uint8Array.from(raw,c=>c.charCodeAt(0));}
  async function snapshot(value) {
    check(value?.format==='osaka-private-v1','這不是大阪私人同步檔');
    check(typeof value.createdAt==='string'&&Number.isFinite(Date.parse(value.createdAt)));
    check(Array.isArray(value.files)&&value.files.length<=100);
    const result={format:value.format,createdAt:value.createdAt,device:str(value.device,80),state:state(value.state),files:[]};
    let size=0;const hashes=new Set();
    for(const file of value.files) {
      check(types.includes(file.type),'票券只接受 PDF／JPG／PNG／WebP');
      const bytes=decode(file.data);size+=bytes.length;check(size<=MAX_TOTAL,'私人票券總容量上限為 64 MB');
      const hash=await digest(bytes);check(hash===file.sha256,'票券內容校驗失敗，未載入');
      if(hashes.has(hash))continue;hashes.add(hash);
      result.files.push({id:'sha256-'+hash,name:str(file.name,500),type:file.type,data:file.data,sha256:hash});
    }
    return result;
  }
  const api={state,snapshot,digest,encode,decode,MAX_FILE,MAX_TOTAL,types};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else globalThis.OsakaSyncCore=api;
})();
