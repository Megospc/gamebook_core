const devices = new RegExp('Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini', "i");
const mobile = devices.test(navigator.userAgent);
const textlen = 50, optlen = 50, fpsTime = 10;
var gamesrc = "";
var sounds = [], images = [];
var cw, ch, cc, cx, cy;
var lastTime = 0;
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var frame = 0, loading = 0, needload = 3, started = false;
var options = obj.options, rooms = obj.rooms, assets = obj.assets ?? [], style = obj.style ?? { background: "#803000", first: "#ffc070", second: "#ff8050", third: "#502000", backgroundbody: "#502000" };
var text = [new Array(textlen).fill('')], opts = [], printing = [], cursor = { x: 0, y: 0 }, gamebook = {};
var cameraY = 0, maxY = 450, clickType = "";
document.getElementById('title').innerHTML = `GAMEBOOK - ${obj.name ?? "без имени"}`;
for (let i = location.href.length-1, b = false; i >= 0; i--) {
  if (!b && location.href[i] == "/") b = true;
  if (b) gamesrc = location.href[i] + gamesrc;
}
function resize() {
  w = window.innerWidth;
  h = window.innerHeight;
  let c = w/h;
  const needc = 2;
  let W, H, X, Y;
  if (c == needc) {
    W = w;
    H = h;
    X = 0;
    Y = 0;
  }
  if (c < needc) {
    W = w;
    H = w/needc;
    X = 0;
    Y = (h-(w/needc))/2;
  }
  if (c > needc) {
    W = h*needc;
    H = h;
    X = (w-(h*needc))/2;
    Y = 0;
  }
  let res = 1800;
  canvas.width = Math.floor(res);
  canvas.height = Math.floor(res/2);
  canvas.style.width = `${Math.floor(W)}px`;
  canvas.style.height = `${Math.floor(H)}px`;
  cc = res/900;
  canvas.style.top = `${Math.floor(Y)}px`;
  canvas.style.left = `${Math.floor(X)}px`;
  cx = Math.floor(X);
  cy = Math.floor(Y);
  cw = W;
  ch = H;
  if (!started) {
    if (loading == needload) startrender();
    else loadrender();
  }
}
resize();
addEventListener('resize', resize);
function clear() {
  ctx.fillStyle = style.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
function load() {
  if (options.music && !options.nosounds) {
    gamebook.music = new Audio(options.music);
    gamebook.music.addEventListener('loadeddata', loaded);
  } else needload--;
  for (let i = 0; i < assets.length; i++) {
    if (assets[i].type == "sound") {
      sounds.push({ sound: new Audio(gamesrc+assets[i].src), id: assets[i].id });
      sounds[sounds.length-1].sound.addEventListener('loadeddata', loaded);
      needload++;
    }
    if (assets[i].type == "image") {
      needload++;
      images.push({ img: new Image(), id: assets[i].id });
      images[images.length-1].img.src = assets[i].src;
      images[images.length-1].img.obj = images[images.length-1];
      images[images.length-1].img.onload = loaded;
    }
  }
  gamebook.logo = new Image();
  gamebook.logo.src = 'https://megospc.github.io/gamebook_core/assets/logo.svg';
  gamebook.logo.onload = loaded;
  gamebook.style = style;
  let font = new FontFace('font', 'url(https://megospc.github.io/gamebook_core/assets/font.ttf)');
  font.load().then((font) => {
    document.fonts.add(font);
    loaded();
  });
}
function sound(id) {
  if (!options.nosounds) {
    for (let i = 0; i < sounds.length; i++) {
      if (sounds[i].id == id) {
        sounds[i].sound.play();
        return;
      }
    }
  }
}
function loadrender() {
  clear();
  ctx.fillStyle = style.first;
  ctx.fillRect(X(400), Y(200), X(100), Y(30));
  ctx.fillStyle = style.background;
  ctx.fillRect(X(402), Y(202), X(96), Y(26));
  ctx.fillStyle = style.first;
  ctx.fillRect(X(404), Y(204), X(loading/needload*92), Y(22));
}
function startrender() {
  clear();
  ctx.fillStyle = style.first;
  ctx.font = `${X(24)}px font`;
  ctx.fillText("Загрузка завершена...", X(350), Y(400));
  ctx.fillText("от megospace", X(370), Y(270));
  ctx.font = `${X(36)}px font`;
  ctx.fillText("Кликните чтобы продолжить", X(240), Y(360));
  ctx.drawImage(gamebook.logo, X(280), Y(50), X(300), Y(180))
}
function X(x) {
  return Math.floor(x*cc);
}
function Y(y) {
  return Math.floor(y*cc);
}
function loaded() {
  loading++;
  loadrender();
  if (loading == needload) allload();
}
function touchend() {
  clickType = "";
}
function touch() {
  touchstart();
  touchmove();
}
function touchmove(e) {
  let c = cw/900;
  let x = ((mobile ? e.touches[0].pageX:e.pageX)-cx)/c;
  let y = ((mobile ? e.touches[0].pageY:e.pageY)-cy)/c;
  if (clickType == "camera" && y > 30 && y < 420) {
    cameraY = (y-30)/390*maxY;
  }
}
function touchstart(e) {
  let c = cw/900;
  let x = ((mobile ? e.touches[0].pageX:e.pageX)-cx)/c;
  let y = ((mobile ? e.touches[0].pageY:e.pageY)-cy)/c;
  if (x > 850 && x < 870 && y > 30 && y < 420 && maxY > 450) {
    clickType = "camera";
    return;
  }
  if (!printing[0] && x < 790) {
    for (let i = 0, sy = (text.length*30)+20-cameraY; i < opts.length; i++) {
      if (y > sy && y < sy+(opts[i].text.length*30)) {
        opts[i].f();
        return;
      }
      sy += opts[i].text.length*30;
    }
  }
  if (x < 790 && printing[0]) {
    while (printing[0]) {
      let s = printing.splice(0, 1);
      if (cursor.x == textlen-1) {
        cursor = { x: 0, y: cursor.y+1 };
        text[cursor.y] = new Array(textlen).fill('');
        maxY = Math.max(text.length*30+50, 450);
      }
      if (s == '\n') {
        cursor = { x: 0, y: cursor.y+1 };
        text[cursor.y] = new Array(textlen).fill('');
        maxY = Math.max(text.length*30+50, 450);
      } else {
        text[cursor.y][cursor.x] = s;
        cursor.x++;
      }
    }
    return;
  }
  if (x > 790 && y < 20) fullScreen(document.documentElement);
}
function wheel(e) {
  if (maxY > 450) {
    e = e ?? window.event;
    let del = e.deltaY || e.detail || e.wheelDelta;
    if (del < 0 && cameraY > 0) cameraY = Math.max(cameraY-10, 0);
    if (del > 0 && cameraY < maxY) cameraY = Math.min(cameraY+10, maxY);
  }
}
function allload() {
  startrender();
  addEventListener('click', () => {
    if (options.music && !options.nosounds) {
      gamebook.music.loop = true;
      gamebook.music.play();
    }
    interval = setInterval(() => { if (performance.now() >= lastTime+fpsTime) render(); }, 1);
    if (mobile) {
      if ('ontouchstart' in document) {
        eventListener('touchend', touchend);
        eventListener('touchmove', touchmove);
        eventListener('touchstart', touchstart);
      } else close();
    } else {
      eventListener('mouseup', touchend);
      eventListener('mousemove', touchmove);
      eventListener('mousedown', touchstart);
      if (document.addEventListener) {
        if ('onwheel' in document) document.addEventListener('wheel', wheel);
        else {
          if ('onmousewheel' in document) document.addEventListener('mousewheel', wheel);
          else document.addEventListener('MozMousePixelScroll', wheel);
        }
      } else document.attachEvent('onmousewheel', wheel);
    }
    started = true;
    start();
  }, { once: true });
}
function eventListener(e, f) {
  if (document.addEventListener) document.addEventListener(e, f);
  else document.attachEvent(e, f);
}
function start() {
  options.onstart();
}
function room(id, ...args) {
  text = [new Array(textlen).fill('')];
  opts = [];
  cursor = { x: 0, y: 0 };
  printing = [];
  cameraY = 0;
  let i;
  for (i = 0; i < rooms.length; i++) {
    if (rooms[i].id == id) {
      rooms[i].f(...args);
      return;
    }
  }
}
function println(txt) {
  for (let i = 0; i < txt.length; i++) {
    printing.push(txt[i]);
  }
}
function opt(txt, fun) {
  let t = [];
  txt = (opts.length+1)+"."+txt;
  for (let i = 0; i < txt.length; i++) {
    t.push(txt[i]);
  }
  opts.push({ text: [new Array(optlen).fill('')], printing: t, cursor: { x: 0, y: 0 }, f: fun });
}
function vibrate(len) {
  if (navigator.vibrate) navigator.vibrate(len);
}
function fullScreen(e) {
  if(e.requestFullscreen) {
    e.requestFullscreen();
  } else if(e.webkitrequestFullscreen) {
    e.webkitRequestFullscreen();
  } else if(e.mozRequestFullscreen) {
    e.mozRequestFullScreen();
  }
}
function var_(name, value) {
  window[name] = value ?? null;
}
function img(id) {
  for (let i = 0; i < images.length; i++) {
    if (images[i].id == id) return images[i].img;
  }
}
function render() {
  clear();
  document.body.style.backgroundColor = style.backgroundbody;
  if (options.fullscreen) {
    ctx.font = `${X(18)}px font`;
    ctx.fillStyle = style.first;
    ctx.fillText("полный экран", X(790), Y(20));
  }
  let ostr = 0;
  if (printing[0]) {
    let s = printing.splice(0, 1);
    if (cursor.x == textlen-1) {
      cursor = { x: 0, y: cursor.y+1 };
      text[cursor.y] = new Array(textlen).fill('');
    }
    if (s == '\n') {
      cursor = { x: 0, y: cursor.y+1 };
      text[cursor.y] = new Array(textlen).fill('');
    } else {
      text[cursor.y][cursor.x] = s;
      cursor.x++;
    }
  } else {
    for (let i = 0; i < opts.length; i++) {
      let opt = opts[i];
      ostr += opt.text.length;
      if (opt.printing[0]) {
        let s = opt.printing.splice(0, 1);
        if (opt.cursor.x == optlen-1) {
          opt.cursor = { x: 0, y: opt.cursor.y+1 };
          opt.text[opt.cursor.y] = new Array(optlen).fill('');
        }
        if (s == '\n') {
          opt.cursor = { x: 0, y: opt.cursor.y+1 };
          opt.text[opt.cursor.y] = new Array(optlen).fill('');
        } else {
          opt.text[opt.cursor.y][opt.cursor.x] = s;
          opt.cursor.x++;
        }
      }
    }
  }
  maxY = Math.max((text.length*30)+50+(ostr*30), 450);
  if (maxY > 450) {
    ctx.fillStyle = style.third;
    ctx.fillRect(X(848), Y(28), X(20), Y(390));
    ctx.fillStyle = style.background;
    ctx.fillRect(X(852), Y(32), X(12), Y(382));
    ctx.fillStyle = style.first;
    ctx.fillRect(X(854), Y(cameraY/maxY*360+34), X(8), Y(18));
  }
  ctx.fillStyle = style.first;
  ctx.font = `${X(24)}px font`;
  for (let y = Math.max(Math.floor(cameraY/30)-1, 0); y < Math.min(text.length, Math.ceil((cameraY+450)/30)); y++) {
    for (let x = 0; x < text[y].length; x++) {
      ctx.fillText(text[y][x], X(20+(x*16)), Y(50+(y*30)-cameraY));
    }
  }
  ctx.fillStyle = style.second;
  for (let i = 0, y = 0; i < opts.length; i++) {
    let opt = opts[i];
    for (let j = 0; j < opt.text.length; j++) {
      for (let x = 0; x < opt.text[j].length; x++) {
        ctx.fillText(opt.text[j][x], X(20+(x*16)), Y(50+(text.length*30)+y+(j*30)-cameraY));
      }
    }
    y += opt.text.length*30;
  }
  if (options.render) options.render();
  lastTime = performance.now();
}
window.onload = load;
document.body.style.backgroundColor = style.backgroundbody;
