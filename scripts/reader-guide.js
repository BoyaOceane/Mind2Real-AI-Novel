// Real actions advance onboarding; help itself never calls the model.
globalThis.JimoGuide = (() => {
 const key='reader_walkthrough_v1', home=!!document.getElementById('openingBookTitle');
 let step='', viewStep='';
 const steps=['api','idea','ready'];
 const help=document.createElement('dialog'); help.id='quickstartGuide'; help.className='quickstart-guide'; help.setAttribute('aria-labelledby','quickstartGuideTitle');
 help.innerHTML=`<button class="panel-close" id="closeHelp" aria-label="关闭使用说明">关闭 ×</button><h2 id="quickstartGuideTitle">${home?'首页使用说明':'阅读页使用说明'}</h2>${home?`<button class="reader-primary" id="restartGuide">带我一步步开始</button><h3>这次想看什么</h3><p>写题材、人设或想发生的事，也可以留空随机。点击“生成简介”，喜欢就“开始阅读”。当前想法与阅读偏好一起生效，冲突时优先当前想法；清空后不再使用旧想法。“换个故事”也应用当前想法。</p><h3>阅读偏好与书架</h3><p>姓名与主角性别在首页填写。“阅读偏好”可设置喜欢和不喜欢的题材；可选测评用几个问题了解你想体验的爽点、关系和主角性格，帮助故事更合口味，不做也能开始阅读。书架可找回保存的故事。</p><h3>API 设置</h3><p>右上角“API设置”粘贴自己的 Key；<a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer">去 DeepSeek 官方平台创建 ↗</a>。“仅保存”不会调用模型。生成使用你自己的账户额度，体验包没有附赠 Key。</p>`:`<h3>继续看与改走向</h3><p>“继续看”续写下一段；“改走向”可以选择行动或写自己的想法。生成中可以停止，阅读位置由你自己控制。</p><h3>更多：资料与阅读设置</h3><p>“故事资料”查看世界、角色和线索。“字号”调整大小。“这本故事的后续方向”只影响后续，不改写已发生的剧情。长期口味在“我的阅读偏好”修改。</p><h3>备份与创作工具</h3><p>“更多 → 导出与备份”导出正文 TXT 或备份故事 JSON。“高级创作工具”提供段落编辑、文风档案和表达避雷。Key 在“更多 → API 设置”修改。</p>`}<details><summary>保存与启动问题</summary><p>故事、偏好和 Key 保存在当前浏览器。升级前备份故事 JSON，保持原浏览器及 localhost:8080。启动窗口保持打开；环境缺失可使用包内“修复运行环境”。生成失败按提示检查 Key、余额或网络。</p></details>`;
 document.body.append(help); help.querySelector('#closeHelp').onclick=()=>help.close(); help.addEventListener('keydown',e=>e.stopPropagation());
 const coach=document.createElement('section'); coach.id='guidedStart'; coach.className='guided-start'; coach.hidden=true; coach.setAttribute('aria-label','首次使用引导');
 coach.innerHTML='<div class="guide-progress" aria-live="polite"></div><p class="guide-message"></p><div class="guide-navigation"><button class="reader-secondary" id="guidePrevious" aria-label="上一步">〈 上一步</button><button class="reader-secondary" id="guideNext" aria-label="下一步">下一步 〉</button></div><button class="reader-secondary" id="pauseGuide">稍后继续</button>'; document.body.append(coach);
 function store(s){viewStep='';step=s;try{localStorage.setItem(key,s);localStorage.setItem('reader_quickstart_seen_v1','1');}catch{}}
 function paint(){
  const shown=viewStep||(step==='reading'?'ready':step);
  coach.dataset.step=shown;
  if(home)document.querySelector('#apiPanelOverlay .api-save-btn').textContent=step==='api'?'保存，下一步':'保存并生成简介';
  document.querySelectorAll('.guide-target').forEach(e=>e.classList.remove('guide-target'));
  coach.hidden=!step||['paused','done'].includes(step); if(coach.hidden)return;
  let target;
  if(home){const panel=document.getElementById('apiPanelOverlay'),inside=panel.classList.contains('open')&&shown==='api'; (inside?panel.querySelector('.api-panel')||document.getElementById('apiKeyInput').parentElement:document.body).append(coach); target=document.getElementById(shown==='api'?(inside?'apiKeyInput':'openApiSettings'):shown==='idea'?'storyIdeaForm':'enterWorld');}
  else target=document.getElementById('btnDirectContinue');
  target?.classList.add('guide-target');
  coach.querySelector('.guide-progress').textContent=shown==='api'?'第 1 / 3 步 · 设置 API':shown==='idea'?'第 2 / 3 步 · 生成简介':'第 3 / 3 步 · 开始阅读';
  coach.querySelector('.guide-message').textContent=shown==='api'?'点“API设置”，粘贴自己的 Key，再点“保存，下一步”。设置框里有官方获取入口。保存不会发起生成。':shown==='idea'?'在“这次想看什么”写一句想法，也可以留空随机。然后点“生成简介”。失败时按提示修改或重试，成功后进入下一步。':home?(typeof opening!=='undefined'&&opening?.ready?'简介已生成。喜欢就点“开始阅读”，也可以修改想法重新生成。':'简介生成成功后，点“开始阅读”。还没生成？先回第二步，点“生成简介”。'):'你已进入故事！“继续看”接着读，“改走向”让故事按你的想法发展。其它功能在“更多 → 使用说明”。';
  coach.querySelector('#guidePrevious').disabled=shown==='api';
  coach.querySelector('#guideNext').disabled=shown==='ready';
  coach.querySelector('#pauseGuide').textContent=home?'稍后继续':'知道了，开始读';
 }
 function move(delta){
  const shown=viewStep||(step==='reading'?'ready':step);
  viewStep=steps[Math.max(0,Math.min(2,steps.indexOf(shown)+delta))];
  if(home&&document.getElementById('apiPanelOverlay').classList.contains('open'))closeApi();
  paint();
 }
 coach.querySelector('#guidePrevious').onclick=()=>move(-1);
 coach.querySelector('#guideNext').onclick=()=>move(1);
 coach.querySelector('#pauseGuide').onclick=()=>{store(home?'paused':'done');paint();};
 function start(){help.close();store(localStorage.getItem('deepseek_api_key')?(typeof opening!=='undefined'&&opening?.ready?'ready':'idea'):'api');paint();if(step==='api')openApi();else document.getElementById(step==='ready'?'enterWorld':'generalPreference').focus();}
 help.querySelector('#restartGuide')?.addEventListener('click',start);
 function apiSaved(){if(step!=='api')return false;store('idea');paint();document.getElementById('generalPreference').focus();return true;}
 function openingChanged(ready){if(step==='idea'&&ready)store('ready');else if(step==='ready'&&!ready)store('idea');paint();}
 function syncCompleted(){
  if(!home||!['api','idea','ready'].includes(step))return;
  const saved=!!localStorage.getItem('deepseek_api_key');
  if(step==='api'&&saved)store('idea');
  if(step==='idea'&&typeof opening!=='undefined'&&opening?.ready&&/^故事已准备好|^世界已准备好/.test(document.getElementById('openingStatus').textContent))store('ready');
  paint();
 }
 function init(){try{step=localStorage.getItem(key)||'';if(home&&!step&&!localStorage.getItem('reader_quickstart_seen_v1')&&!localStorage.getItem('deepseek_api_key')&&!localStorage.getItem('current_story_session')&&!JSON.parse(localStorage.getItem('story_history')||'[]').length)store('api');if(home&&['idea','ready'].includes(step))store(typeof opening!=='undefined'&&opening?.ready?'ready':'idea');if(!home&&!['ready','reading'].includes(step))step='';if(!home&&step==='ready')store('reading');}catch{step='';}paint();syncCompleted();
  if(home){
   new MutationObserver(syncCompleted).observe(document.getElementById('apiPanelOverlay'),{attributes:true,attributeFilter:['class']});
   new MutationObserver(syncCompleted).observe(document.getElementById('openingStatus'),{childList:true,subtree:true,characterData:true});
   window.addEventListener('storage',event=>{if(event.key==='deepseek_api_key'||event.key==='pending_immersive_opening_v1')syncCompleted();});
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 return{open:()=>{if(!help.open)help.showModal();},close:()=>help.close(),apiSaved,openingChanged};
})();


