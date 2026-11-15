const DB_KEY='gb_db_v3', SES_KEY='gb_session_v3';
const OWNER_NICK='Sergey_Sergeev';

function normalizeDB(d){
  if(!d||typeof d!=='object') d={};
  if(!Array.isArray(d.users)) d.users=[];
  if(!Array.isArray(d.tickets)) d.tickets=[];
  if(!Array.isArray(d.transactions)) d.transactions=[];
  d.users=d.users.filter(function(u){return u&&typeof u==='object'&&typeof u.username==='string'&&u.username;});
  d.users.forEach(function(u){
    if(u.role!=='owner'&&u.role!=='helper') u.role='user';
    if(typeof u.banned!=='boolean') u.banned=false;
    if(u.username.toLowerCase()===OWNER_NICK.toLowerCase()) u.role='owner';
  });
  if(!d.transactions.length){
    d.transactions=[
      {id:'TX-1001',user:'test_user_1',item:'Аккаунт Steam (тест)',amount:'1 500 ₽',status:'На рассмотрении'},
      {id:'TX-1002',user:'test_user_2',item:'Ключ игры (тест)',amount:'890 ₽',status:'Одобрено'},
      {id:'TX-1003',user:'test_user_1',item:'Валюта, 10 000 (тест)',amount:'750 ₽',status:'Отмена'}
    ];
  }
  return d;
}
function loadDB(){ var d=null; try{ d=JSON.parse(localStorage.getItem(DB_KEY)); }catch(e){ d=null; } return normalizeDB(d); }
function saveDB(d){ localStorage.setItem(DB_KEY, JSON.stringify(d)); }
function getSession(){ try{ return JSON.parse(localStorage.getItem(SES_KEY)); }catch(e){ return null; } }
function setSession(s){ if(s) localStorage.setItem(SES_KEY, JSON.stringify(s)); else localStorage.removeItem(SES_KEY); }
function currentUser(){ var s=getSession(); if(!s) return null; var d=loadDB(); return d.users.find(function(u){return u.username===s.username;})||null; }
function isOwner(){ var u=currentUser(); return !!u&&u.role==='owner'; }
function isHelper(){ var u=currentUser(); return !!u&&u.role==='helper'; }
function isAdminUser(){ var u=currentUser(); return !!u&&(u.role==='owner'||u.role==='helper'); }

function registerUser(username,email,pass,pass2){
  var d=loadDB();
  username=(username||'').trim();
  if(!/^[A-Za-z0-9_]{3,20}$/.test(username)) return {ok:false,error:'Ник: от 3 до 20 символов, только латиница, цифры и знак _'};
  if(!/^\S+@\S+\.\S+$/.test(email||'')) return {ok:false,error:'Введите корректный email'};
  if((pass||'').length<6) return {ok:false,error:'Пароль — минимум 6 символов'};
  if(pass!==pass2) return {ok:false,error:'Пароли не совпадают'};
  var busy=d.users.some(function(u){return (u.username||'').toLowerCase()===username.toLowerCase();});
  if(busy) return {ok:false,error:'Такой ник уже занят'};
  var mailbusy=d.users.some(function(u){return (u.email||'').toLowerCase()===(email||'').toLowerCase();});
  if(mailbusy) return {ok:false,error:'Этот email уже зарегистрирован'};
  var role = username.toLowerCase()===OWNER_NICK.toLowerCase() ? 'owner' : 'user';
  d.users.push({username:username,email:email,pass:pass,role:role,banned:false,created:Date.now()});
  saveDB(d);
  setSession({username:username});
  return {ok:true};
}
function loginUser(username,pass){
  var d=loadDB();
  username=(username||'').trim();
  var u=d.users.find(function(x){return (x.username||'').toLowerCase()===username.toLowerCase();});
  if(!u||u.pass!==pass) return {ok:false,error:'Неверный ник или пароль'};
  if(u.banned) return {ok:false,error:'Ваш аккаунт заблокирован. Обратитесь в поддержку.'};
  setSession({username:u.username});
  return {ok:true};
}
function logout(){ setSession(null); location.href='index.html'; }

function renderHeader(){
  var nav=document.getElementById('topnav'); if(!nav) return;
  var u=currentUser();
  var html='<a class="nav-link" href="chat.html">💬 Сообщения</a>';
  if(u){
    if(u.role==='owner') html+='<a class="nav-link" href="admin.html">🛠️ Админ-панель</a>';
    var tag = u.role==='owner' ? '👑 ' : (u.role==='helper' ? '🎧 ' : '');
    html+='<span class="user-chip">'+tag+u.username+'</span>';
    html+='<button class="btn btn-outline" onclick="logout()">Выйти</button>';
  } else {
    html+='<a class="btn btn-outline" href="login.html">Вход</a>';
    html+='<a class="btn btn-primary" href="login.html?tab=register">Регистрация</a>';
  }
  nav.innerHTML=html;
}
document.addEventListener('DOMContentLoaded', renderHeader);

function addTicketMessage(username, from, text){
  var d=loadDB();
  var t=d.tickets.filter(function(x){return x.username===username;}).pop();
  if(!t){ t={id:'t'+Date.now(), username:username, status:'На рассмотрении', messages:[], created:Date.now()}; d.tickets.push(t); }
  t.messages.push({from:from, text:text, time:Date.now()});
  saveDB(d);
  return t;
}
function autoReply(username){
  var d=loadDB();
  var t=d.tickets.filter(function(x){return x.username===username;}).pop();
  if(t){ t.messages.push({from:'support', auto:true, text:'Обращение принято. Ваш вопрос передан живому помощнику — скоро он свяжется с вами.', time:Date.now()}); saveDB(d); }
}
function supportReply(ticketId, text){
  var d=loadDB();
  var t=d.tickets.find(function(x){return x.id===ticketId;});
  if(t){ t.messages.push({from:'support', text:text, time:Date.now()}); saveDB(d); }
}
function setTicketStatus(ticketId, status){
  var d=loadDB();
  var t=d.tickets.find(function(x){return x.id===ticketId;});
  if(t){ t.status=status; saveDB(d); }
}
function setTransactionStatus(id, status){
  var d=loadDB();
  var t=d.transactions.find(function(x){return x.id===id;});
  if(t){ t.status=status; saveDB(d); }
}
function fmtTime(ts){
  var dt=new Date(ts);
  function p(n){return (n<10?'0':'')+n;}
  return p(dt.getDate())+'.'+p(dt.getMonth()+1)+' '+p(dt.getHours())+':'+p(dt.getMinutes());
}
