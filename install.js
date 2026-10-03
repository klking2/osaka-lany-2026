/* Home-screen entry: native prompt where available, readable steps elsewhere. */
(() => {
  const button=document.getElementById('install-app');
  const status=document.getElementById('install-status');
  const help=document.getElementById('install-help');
  const standalone=window.matchMedia('(display-mode: standalone)');
  let pendingPrompt=null;
  function isStandalone(){return standalone.matches||navigator.standalone===true;}
  function installed(){
    pendingPrompt=null;button.disabled=true;button.textContent='已加入主畫面';
    status.textContent='可從手機主畫面的「大阪 LANY」圖示開啟。';help.open=false;
  }
  function showHelp(message){
    status.textContent=message;help.open=true;help.querySelector('summary').focus();
  }
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();if(isStandalone())return;
    pendingPrompt=event;button.disabled=false;
    status.textContent='按「加入手機主畫面」，再於瀏覽器安裝視窗確認。';
  });
  window.addEventListener('appinstalled',installed);
  standalone.addEventListener('change',()=>{if(isStandalone())installed();});
  button.addEventListener('click',async()=>{
    if(isStandalone()){installed();return;}
    if(!pendingPrompt){
      const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
      showHelp(ios?'iPhone 請用 Safari 的「分享」→「加入主畫面」完成；步驟已在下方展開。':'請按下方步驟，在手機瀏覽器加入主畫面。');return;
    }
    const prompt=pendingPrompt;pendingPrompt=null;button.disabled=true;
    try{
      await prompt.prompt();const choice=await prompt.userChoice;
      if(button.textContent==='已加入主畫面')return;
      if(choice.outcome==='accepted')status.textContent='已確認安裝；完成後可從手機主畫面開啟。';
      else showHelp('已取消安裝；稍後可依下方步驟加入主畫面。');
    }catch{showHelp('安裝視窗未能開啟，請依下方步驟加入主畫面。');}
    finally{if(button.textContent!=='已加入主畫面')button.disabled=false;}
  });
  if(isStandalone())installed();
})();
