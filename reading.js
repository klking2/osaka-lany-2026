/* Native disclosures; keep all original controls and storage untouched. */
(() => {
  const groups=()=>[...document.querySelectorAll('details.reading-toggle')];
  function reveal(hash,scroll){
    let target;try{target=document.getElementById(decodeURIComponent(hash.replace(/^#/,'')));}catch{return;}
    if(!target)return;
    for(let node=target;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;
    if(scroll)requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
  }
  window.revealReading = reveal;
  document.getElementById('expand-reading').onclick=()=>groups().forEach(node=>{node.open=true;});
  document.getElementById('collapse-reading').onclick=()=>groups().forEach(node=>{node.open=false;});
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const link=event.target.closest('a[href^="#"]');
    if(link)reveal(link.getAttribute('href'),true);
  });
  window.addEventListener('hashchange',()=>reveal(location.hash,true));
  if(location.hash)reveal(location.hash,false);
  let printedState;
  window.addEventListener('beforeprint',()=>{printedState=groups().map(node=>[node,node.open]);groups().forEach(node=>{node.open=true;});});
  window.addEventListener('afterprint',()=>{printedState?.forEach(([node,open])=>{node.open=open;});printedState=null;});
})();
