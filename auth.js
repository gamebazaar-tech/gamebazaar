// auth.js — регистрация, вход, шапка сайта для GameBazaar
const GB_OWNER_NICK = "Sergey_Sergeev";

function gbCurrentUser() {
  try { return JSON.parse(localStorage.getItem("gb_user") || "null"); }
  catch (e) { return null; }
}

function gbIsOwner() {
  const u = gbCurrentUser();
  return !!u && u.nick === GB_OWNER_NICK;
}

function gbHeaderHTML() {
  const u = gbCurrentUser();
  let right;
  if (u) {
    const crown = gbIsOwner() ? '<span class="crown" title="Владелец">&#128081;</span> ' : "";
    const adminLink = gbIsOwner() ? '<a href="admin.html" class="nav-link">&#128295; Админ-панель</a>' : "";
    right = adminLink +
      '<a href="chat.html" class="nav-link">&#128172; Сообщения</a>' +
      '<span class="user-badge">' + crown + gbEsc(u.nick) + '</span>' +
      '<button class="btn-logout" onclick="gbLogout()">Выйти</button>';
  } else {
    right = '<a href="login.html" class="nav-link">&#128172; Сообщения</a>' +
      '<a href="login.html" class="nav-link">Вход</a>' +
      '<a href="login.html#register" class="btn-primary">Регистрация</a>';
  }
  return '<header class="site-header"><div class="header-inner">' +
    '<a href="index.html" class="logo">Game<span>Bazaar</span></a>' +
    '<nav class="header-nav">' + right + '</nav></div></header>';
}

function gbUpdateHeader() {
  const el = document.getElementById("site-header");
  if (el) el.outerHTML = gbHeaderHTML().replace('<header', '<header id="site-header"');
}

function gbLogout() {
  localStorage.removeItem("gb_user");
  window.location.href = "index.html";
}

function gbRequireLogin() {
  if (!gbCurrentUser()) { window.location.href = "login.html"; return false; }
  return true;
}

function gbEsc(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function gbRegister(nick, pass, cb) {
  nick = nick.trim();
  if (nick.length < 3) return cb("Ник должен быть не короче 3 символов");
  if (pass.length < 4) return cb("Пароль должен быть не короче 4 символов");
  const ref = gbDB.ref("users/" + nick);
  ref.once("value").then(function(snap) {
    if (snap.exists()) return cb("Такой ник уже занят");
    ref.set({ nick: nick, password: pass, createdAt: Date.now() }).then(function() {
      localStorage.setItem("gb_user", JSON.stringify({ nick: nick }));
      cb(null);
    }).catch(function(e){ cb("Ошибка записи: " + e.message); });
  }).catch(function(e){ cb("Ошибка базы: " + e.message); });
}

function gbLogin(nick, pass, cb) {
  nick = nick.trim();
  gbDB.ref("users/" + nick).once("value").then(function(snap) {
    if (!snap.exists()) return cb("Пользователь не найден");
    const u = snap.val();
    if (u.password !== pass) return cb("Неверный пароль");
    localStorage.setItem("gb_user", JSON.stringify({ nick: nick }));
    cb(null);
  }).catch(function(e){ cb("Ошибка базы: " + e.message); });
}
