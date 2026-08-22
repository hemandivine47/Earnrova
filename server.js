import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename=fileURLToPath(import.meta.url),__dirname=path.dirname(__filename);
const app=express();
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));

const PORT=process.env.PORT||3000,BOT_TOKEN=process.env.BOT_TOKEN||'';
const APP_URL=process.env.APP_URL||'';
const REWARD=.10,AD_LIMIT=50,AD_WINDOW_MS=2*60*60*1000,MIN_WITHDRAWAL=20;
const DB=path.join(__dirname,'data.json');
let db={users:{},withdrawals:[]};
if(fs.existsSync(DB)){try{db=JSON.parse(fs.readFileSync(DB,'utf8'))}catch{}}
function save(){fs.writeFileSync(DB,JSON.stringify(db,null,2))}
function validateInitData(initData){
  if(!BOT_TOKEN)throw new Error('BOT_TOKEN is not configured');
  const p=new URLSearchParams(initData),hash=p.get('hash');if(!hash)throw new Error('Missing Telegram initData');
  const pairs=[];for(const [k,v] of p.entries())if(k!=='hash')pairs.push(`${k}=${v}`);pairs.sort();
  const secret=crypto.createHash('sha256').update(BOT_TOKEN).digest();
  const calc=crypto.createHmac('sha256',secret).update(pairs.join('\n')).digest('hex');
  if(!crypto.timingSafeEqual(Buffer.from(calc),Buffer.from(hash)))throw new Error('Invalid Telegram session');
  const user=JSON.parse(p.get('user')||'{}');if(!user.id)throw new Error('Missing Telegram user');return user;
}
function getUser(initData){
  const u=validateInitData(initData);let x=db.users[u.id];const now=Date.now();
  if(!x){
    x={id:u.id,username:u.username||'',firstName:u.first_name||'',balance:0,totalEarned:0,
      adsInWindow:0,adsWindowStart:now,referrals:0,streak:1,lastCheckin:new Date().toISOString().slice(0,10)};
    db.users[u.id]=x;save();
  }
  if(!Number.isFinite(x.adsWindowStart)||!Number.isFinite(x.adsInWindow)||now-x.adsWindowStart>=AD_WINDOW_MS){
    x.adsWindowStart=now;x.adsInWindow=0;save();
  }
  return x;
}
function publicUser(x){
  return {...x,adLimit:AD_LIMIT,adWindowMs:AD_WINDOW_MS,
    remainingMs:Math.max(0,AD_WINDOW_MS-(Date.now()-x.adsWindowStart))};
}

app.post('/webhook',async(req,res)=>{
  res.sendStatus(200);
  const msg=req.body?.message;
  if(!msg||!BOT_TOKEN)return;
  const chatId=msg.chat.id;
  const text=msg.text||'';
  if(text.startsWith('/start')){
    const firstName=msg.from?.first_name||'there';
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        chat_id:chatId,
        text:`👋 Welcome to Earnrova, ${firstName}!\n\n💰 Watch ads, earn rewards, and cash out.\n\nTap the button below to open the app:`,
        reply_markup:{
          inline_keyboard:[[{
            text:'🚀 Open Earnrova',
            web_app:{url:APP_URL}
          }]]
        }
      })
    });
  }
});

app.post('/api/me',(req,res)=>{try{res.json(publicUser(getUser(req.body.initData||'')))}catch(e){res.status(401).json({error:e.message})}});
app.post('/api/ads/complete',(req,res)=>{
  try{
    const u=getUser(req.body.initData||'');
    if(u.adsInWindow>=AD_LIMIT){
      return res.status(429).json({error:'You have reached the 50-ad limit. Please wait for the 2-hour reset.',
        remainingMs:Math.max(0,AD_WINDOW_MS-(Date.now()-u.adsWindowStart))});
    }
    u.adsInWindow++;u.balance=+(u.balance+REWARD).toFixed(2);u.totalEarned=+(u.totalEarned+REWARD).toFixed(2);
    save();res.json(publicUser(u));
  }catch(e){res.status(400).json({error:e.message})}
});
app.post('/api/withdraw',(req,res)=>{
  try{
    const u=getUser(req.body.initData||'');
    if(u.balance<MIN_WITHDRAWAL)return res.status(400).json({error:`Minimum withdrawal is $${MIN_WITHDRAWAL.toFixed(2)}`});
    if(!req.body.details)return res.status(400).json({error:'Withdrawal details are required'});
    db.withdrawals.push({id:crypto.randomUUID(),userId:u.id,amount:u.balance,details:req.body.details,status:'pending',createdAt:new Date().toISOString()});
    u.balance=0;save();res.json(publicUser(u));
  }catch(e){res.status(400).json({error:e.message})}
});
app.use((req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`Earnrova running on port ${PORT}`));
