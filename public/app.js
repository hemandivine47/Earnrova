const tg=window.Telegram?.WebApp;tg?.ready();tg?.expand();
const CONFIG={rewardPerAd:.10,adsPerWindow:50,windowMs:2*60*60*1000,minWithdrawal:20};
let state={balance:0,totalEarned:0,adsInWindow:0,adsWindowStart:Date.now(),referrals:0,streak:1};
const $=id=>document.getElementById(id);
function money(n){return `$${Number(n||0).toFixed(2)}`}
function toast(t){const e=document.createElement('div');e.className='toast';e.textContent=t;document.body.appendChild(e);setTimeout(()=>e.remove(),2800)}
function formatTime(ms){let n=Math.max(0,Math.ceil(ms/1000));let h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=n%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function remaining(){return Math.max(0,CONFIG.windowMs-(Date.now()-Number(state.adsWindowStart||Date.now())))}
function render(){
  $('balance').textContent=money(state.balance);$('earned').textContent=money(state.totalEarned);
  $('adsToday').textContent=state.adsInWindow;$('referrals').textContent=state.referrals;
  const r=$('adReset');if(r)r.textContent=remaining()<=0?'Resetting…':`Next reset in ${formatTime(remaining())}`;
  const s=$('streak');s.innerHTML='';for(let i=1;i<=7;i++){const d=document.createElement('div');d.className='day '+(i<=state.streak?'active':'');d.innerHTML=`<b>${i}</b>DAY ${i}`;s.appendChild(d)}
}
async function api(path,opts={}){const r=await fetch('/api'+path,{headers:{'Content-Type':'application/json'},...opts});if(!r.ok){const d=await r.json().catch(()=>({}));const e=new Error(d.error||'Request failed');e.remainingMs=d.remainingMs;throw e}return r.json()}
async function load(){try{state=await api('/me',{method:'POST',body:JSON.stringify({initData:tg?.initData||''})});render()}catch(e){render();toast('Connect the deployed Telegram Mini App to save your account.')}}
function tasksView(){return `<h2>WATCH & EARN</h2><div class="task"><div class="task-icon">▷</div><div class="task-main"><b>Watch Ad</b><small>Earn ${money(CONFIG.rewardPerAd)} per completed ad</small></div><button class="start" id="watchAd" ${state.adsInWindow>=50?'disabled':''}>${state.adsInWindow>=50?'Limit reached':'Watch Ad'}</button></div><div class="card"><b>2-hour ad progress</b><div style="margin-top:12px;color:#9aacC5">${state.adsInWindow}/50</div><div id="taskReset" style="margin-top:8px;color:#9aacC5">Next reset in ${formatTime(remaining())}</div></div>`}
function referView(){const u=tg?.initDataUnsafe?.user;const link=`https://t.me/Earnrova_bot?start=${u?.id||'YOUR_ID'}`;return `<div class="card"><h3>👥 Invite & Earn</h3><p>Share your personal referral link with friends.</p><input class="input" readonly value="${link}"><button class="primary" id="copyRef">Copy referral link</button></div><div class="card"><b>Referral count</b><div style="font-size:28px;margin-top:7px">${state.referrals}</div></div>`}
function walletView(){return `<div class="wallet"><h3>Wallet</h3><p>Your balance: <b>${money(state.balance)}</b></p><p class="muted">Minimum withdrawal: ${money(CONFIG.minWithdrawal)}</p><input class="input" id="withdrawAddress" placeholder="Withdrawal details"><button class="primary" id="withdrawBtn">Request withdrawal</button></div>`}
function boardView(){return `<div class="card"><h3>🏆 Leaderboard</h3><p class="muted">Leaderboard will show verified activity and referrals.</p></div>`}
function show(view){document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.view===view));if(view==='tasks'){$('view').innerHTML=tasksView();bindTask()}else if(view==='refer'){$('view').innerHTML=referView();bindRef()}else if(view==='wallet'){$('view').innerHTML=walletView();bindWallet()}else if(view==='board')$('view').innerHTML=boardView();else location.reload()}
function bindTask(){const b=$('watchAd');b?.addEventListener('click',async()=>{if(state.adsInWindow>=50)return toast('50 ads reached. Wait for the 2-hour reset.');b.disabled=true;b.textContent='Loading…';try{if(typeof show_11627998!=='function')throw new Error('Monetag SDK not ready');await show_11627998();state=await api('/ads/complete',{method:'POST',body:JSON.stringify({initData:tg?.initData||''})});toast(`Ad completed. +${money(CONFIG.rewardPerAd)}`);render();if(state.adsInWindow>=50)show('tasks')}catch(e){toast(e.remainingMs?`Ad limit reached. Reset in ${formatTime(e.remainingMs)}.`:(e.message||'Ad was not completed.'))}finally{if($('watchAd')){$('watchAd').disabled=state.adsInWindow>=50;$('watchAd').textContent=state.adsInWindow>=50?'Limit reached':'Watch Ad'}}})}
function bindRef(){$('copyRef')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.querySelector('.input').value);toast('Referral link copied')}catch{toast('Copy the link manually')}})}
function bindWallet(){$('withdrawBtn')?.addEventListener('click',async()=>{try{state=await api('/withdraw',{method:'POST',body:JSON.stringify({initData:tg?.initData||'',details:$('withdrawAddress').value})});toast('Withdrawal request submitted');render()}catch(e){toast(e.message)}})}
document.querySelectorAll('.nav,.quick').forEach(b=>b.addEventListener('click',()=>show(b.dataset.view)));
$('refreshBtn')?.addEventListener('click',load);$('spinBtn')?.addEventListener('click',()=>toast('Spin feature can be enabled after the core ad flow is live.'));
setInterval(async()=>{if(remaining()<=0)await load();else render()},1000);load();
