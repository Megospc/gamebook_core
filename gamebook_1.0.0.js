var gamebook = {
  restore: false,
  started: false,
  version: "1.0.1",
  canvas: document.getElementById('canvas'),
  base: 'https://megospc.github.io/gamebook_core/assets/',
  load: {
    needload: 3,
    loading: 0
  },
  room: {
    id: null,
    i: null,
    args: []
  },
  res: {
    sounds: [],
    images: [],
    variables: []
  },
  mobtest: {
    devices: new RegExp('Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEgamebook.mobtest.mobile|Windows Phone|Kindle|Silk|Opera Mini', "i"),
  },
  screenprops: {
    textlen: 50,
    optlen: 50,
    fpstime: 10,
    src: "",
    resolution: 1800,
    canvas: {
      w: null,
      h: null, 
      c: null,
      x: null,
      y: null
    }
  },
  special: {
    lasttime: 0,
    cy: 0
  },
  mouse: {
    type: null
  },
  opts: [],
  printing: [],
  cursor: { x: 0, y: 0 }
};
if (gamebook.canvas.getContext) gamebook.ctx = gamebook.canvas.getContext('2d');
else window.close();
obj.version = obj.version ?? "0.0.0";
obj.style = obj.style ?? { background: "#803000", first: "#ffc070", second: "#ff8050", third: "#502000", backgroundbody: "#502000" };
gamebook.text = [new Array(gamebook.screenprops.textlen).fill('')];
gamebook.mobtest.mobile = gamebook.mobtest.devices.test(navigator.userAgent);
document.getElementById('title').innerHTML = `GAMEBOOK — ${obj.name ?? "без имени"}`;
for (let i = location.href.length-1, b = false; i >= 0; i--) {
  if (!b && location.href[i] == "/") b = true;
  if (b) gamebook.screenprops.src = location.href[i] + gamebook.screenprops.src;
}
if (localStorage) {
  let json = localStorage.getItem(`gamebook_save_${location.href}`);
  if (json) {
    try {
      let o = JSON.parse(json);
      if (o.room && o.date && o.variables && o.args && o.style && o.corever && o.version) {
        if (o.corever == gamebook.version) {
          if (o.version == obj.version) gamebook.restore = o;
          else console.warn(`GamebookCore: 'gamebook.restore' has wrong version of gamebook ('${o.version}')`);
        } else console.warn(`GamebookCore: 'gamebook.restore' has wrong version of gamebook-core ('${o.corever}')`);
      } else throw '';
    } catch {
      console.error(`GamebookCore: 'gamebook.restore' returned invalid JSON`);
    }
  }
}
gamebook.clearrender = function() {
  gamebook.ctx.fillStyle = obj.style.background;
  gamebook.ctx.fillRect(0, 0, gamebook.canvas.width, gamebook.canvas.height);
}
gamebook.special.loadrender = function() {
  gamebook.clearrender();
  gamebook.ctx.fillStyle = obj.style.first;
  gamebook.ctx.fillRect(X(400), Y(200), X(100), Y(30));
  gamebook.ctx.fillStyle = obj.style.background;
  gamebook.ctx.fillRect(X(402), Y(202), X(96), Y(26));
  gamebook.ctx.fillStyle = obj.style.first;
  gamebook.ctx.fillRect(X(404), Y(204), X(gamebook.load.loading/gamebook.load.needload*92), Y(22));
}
gamebook.special.startrender = function() {
  gamebook.clearrender();
  gamebook.ctx.fillStyle = obj.style.first;
  gamebook.ctx.font = `${X(24)}px font`;
  gamebook.ctx.fillText("Загрузка завершена...", X(350), Y(400));
  gamebook.ctx.fillText("от megospace", X(370), Y(270));
  gamebook.ctx.font = `${X(36)}px font`;
  gamebook.ctx.fillText("Кликните чтобы продолжить", X(240), Y(360));
  gamebook.ctx.drawImage(gamebook.logo, X(280), Y(50), X(300), Y(180))
}
gamebook.load.load = function() {
  if (obj.options.music && !obj.options.nosounds) {
    gamebook.music = new Audio(obj.options.music);
    gamebook.music.addEventListener('loadeddata', gamebook.special.loaded);
  } else gamebook.load.needload--;
  for (let i = 0; i < obj.assets.length; i++) {
    switch(obj.assets[i].type) {
      case "sound":
        gamebook.res.sounds.push({ sound: new Audio(gamebook.screenprops.src+obj.assets[i].src), id: obj.assets[i].id });
        gamebook.res.sounds[gamebook.res.sounds.length-1].sound.addEventListener('loadeddata', gamebook.special.loaded);
        gamebook.load.needload++;
        break;
      case "image":
        gamebook.load.needload++;
        gamebook.res.images.push({ img: new Image(), id: obj.assets[i].id });
        gamebook.res.images[gamebook.res.images.length-1].img.src = obj.assets[i].src;
        gamebook.res.images[gamebook.res.images.length-1].img.obj = gamebook.res.images[gamebook.res.images.length-1];
        gamebook.res.images[gamebook.res.images.length-1].img.onload = gamebook.special.loaded;
        break;
      default:
        console.warn(`GamebookCore: asset with index ${i} has invalid type ('${obj.assets[i].type}')`);
        break;
    }
  }
  gamebook.logo = new Image();
  gamebook.logo.src = gamebook.base+'logo.svg';
  gamebook.logo.onload = gamebook.special.loaded;
  gamebook.style = obj.style;
  let font = new FontFace('font', `url(${obj.options.font ? gamebook.screenprops.src+obj.options.font:gamebook.base+'font.ttf'})`);
  font.load().then((font) => {
    document.fonts.add(font);
    gamebook.special.loaded();
  });
}
gamebook.special.clearvariables = function() {
  for (let i = 0; i < gamebook.res.variables.length; i++) delete window[gamebook.res.variables[i]];
    gamebook.res.variables = [];
  },
gamebook.screenprops.resize = function() {
  let w = window.innerWidth;
  let h = window.innerHeight;
  let c = w/h;
  let needc = 2;
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
  let res = gamebook.screenprops.resolution ?? 1800;
  gamebook.canvas.width = Math.floor(res);
  gamebook.canvas.height = Math.floor(res/2);
  gamebook.canvas.style.width = `${Math.floor(W)}px`;
  gamebook.canvas.style.height = `${Math.floor(H)}px`;
  gamebook.screenprops.canvas.c = res/900;
  gamebook.canvas.style.top = `${Math.floor(Y)}px`;
  gamebook.canvas.style.left = `${Math.floor(X)}px`;
  gamebook.screenprops.canvas.x = Math.floor(X);
  gamebook.screenprops.canvas.y = Math.floor(Y);
  gamebook.screenprops.canvas.w = W;
  gamebook.screenprops.canvas.h = H;
  if (!gamebook.started) {
    if (gamebook.load.loading == gamebook.load.needload) gamebook.special.startrender();
    else gamebook.special.loadrender();
  }
}
gamebook.screenprops.resize();
document.addEventListener('resize', gamebook.screenprops.resize);
function sound(id) {
  if (!obj.options.nosounds) {
    for (let i = 0; i < gamebook.res.sounds.length; i++) {
      if (gamebook.res.sounds[i].id == id) {
        gamebook.res.sounds[i].sound.play();
        return;
      }
    }
    console.warn(`GamebookCore: Sound with id '${id}' is not declared in 'assets' `);
  }
}
function X(x) {
  return Math.floor(x*gamebook.screenprops.canvas.c);
}
function Y(y) {
  return Math.floor(y*gamebook.screenprops.canvas.c);
}
gamebook.special.loaded = function() {
  gamebook.load.loading++;
  gamebook.special.loadrender();
  if (gamebook.load.loading == gamebook.load.needload) gamebook.special.allload();
}
gamebook.mouse.touchend = function() {
  gamebook.mouse.type = null;
  if (obj.options.touchend) obj.options.touchend(x, y);
}
gamebook.mouse.touchmove = function(e) {
  let c = gamebook.screenprops.canvas.w/900;
  let x = ((gamebook.mobtest.mobile ? e.touches[0].pageX:e.pageX)-gamebook.screenprops.canvas.x)/c;
  let y = ((gamebook.mobtest.mobile ? e.touches[0].pageY:e.pageY)-gamebook.screenprops.canvas.y)/c;
  if (gamebook.mouse.type == "camera" && y > 30 && y < 420) {
    gamebook.special.cy = (y-30)/390*gamebook.special.my;
  }
  if (obj.options.touchmove) obj.options.touchmove(x, y);
}
gamebook.mouse.touchstart = function(e) {
  let c = gamebook.screenprops.canvas.w/900;
  let x = ((gamebook.mobtest.mobile ? e.touches[0].pageX:e.pageX)-gamebook.screenprops.canvas.x)/c;
  let y = ((gamebook.mobtest.mobile ? e.touches[0].pageY:e.pageY)-gamebook.screenprops.canvas.y)/c;
  if (x > 850 && x < 870 && y > 30 && y < 420 && gamebook.special.my > 450) {
    gamebook.mouse.type = "camera";
    return;
  }
  if (!gamebook.printing[0] && x < 790) {
    for (let i = 0, sy = (gamebook.text.length*30)+20-gamebook.special.cy; i < gamebook.opts.length; i++) {
      if (y > sy && y < sy+(gamebook.opts[i].text.length*30)) {
        gamebook.opts[i].f();
        return;
      }
      sy += gamebook.opts[i].text.length*30;
    }
  }
  if (x < 790 && gamebook.printing[0]) {
    while (gamebook.printing[0]) {
      let s = gamebook.printing.splice(0, 1);
      if (gamebook.cursor.x == gamebook.screenprops.textlen-1) {
        gamebook.cursor = { x: 0, y: gamebook.cursor.y+1 };
        gamebook.text[gamebook.cursor.y] = new Array(gamebook.screenprops.textlen).fill('');
        gamebook.special.my = Math.max(gamebook.text.length*30+50, 450);
      }
      if (s == '\n') {
        gamebook.cursor = { x: 0, y: gamebook.cursor.y+1 };
        gamebook.text[gamebook.cursor.y] = new Array(gamebook.screenprops.textlen).fill('');
        gamebook.special.my = Math.max(gamebook.text.length*30+50, 450);
      } else {
        gamebook.text[gamebook.cursor.y][gamebook.cursor.x] = s;
        gamebook.cursor.x++;
      }
    }
    return;
  }
  if (x > 790 && y < 20) fullscreen(document.documentElement);
  if (obj.options.touchstart) obj.options.touchstart(x, y);
}
gamebook.mouse.wheel = function(e) {
  if (gamebook.special.my > 450) {
    e = e ?? window.event;
    let del = e.deltaY || e.detail || e.gamebook.mouse.wheelDelta;
    if (del < 0 && gamebook.special.cy > 0) gamebook.special.cy = Math.max(gamebook.special.cy-20, 0);
    if (del > 0 && gamebook.special.cy < gamebook.special.my) gamebook.special.cy = Math.min(gamebook.special.cy+20, gamebook.special.my);
  }
}
gamebook.special.allload = function() {
  gamebook.special.startrender();
  document.addEventListener('click', () => {
    if (obj.options.music && !obj.options.nosounds) {
      gamebook.music.loop = true;
      gamebook.music.play();
    }
    if (gamebook.mobtest.mobile) {
      if ('ontouchstart' in document) {
        document.addEventListener('touchend', gamebook.mouse.touchend);
        document.addEventListener('touchmove', gamebook.mouse.touchmove);
        document.addEventListener('touchstart', gamebook.mouse.touchstart);
      } else close();
    } else {
      document.addEventListener('mouseup', gamebook.mouse.touchend);
      document.addEventListener('mousemove', gamebook.mouse.touchmove);
      document.addEventListener('mousedown', gamebook.mouse.touchstart);
      if (document.addEventListener) {
        if ('onwheel' in document) document.addEventListener('wheel', gamebook.mouse.wheel);
        else {
          if ('onmousewheel' in document) document.addEventListener('mousewheel', gamebook.mouse.wheel);
          else document.addEventListener('MozMousePixelScroll', gamebook.mouse.wheel);
        }
      } else document.attachEvent('onmousewheel', gamebook.mouse.wheel);
    }
    gamebook.special.start();
  }, { once: true });
}
gamebook.special.start = function() {
  gamebook.special.interval = setInterval(() => { if (performance.now() >= gamebook.special.lasttime+gamebook.screenprops.fpstime) gamebook.render(); }, 1);
  gamebook.started = true;
  obj.options.onstart();
}
function clear() {
  gamebook.text = [new Array(gamebook.screenprops.textlen).fill('')];
  gamebook.opts = [];
  gamebook.cursor = { x: 0, y: 0 };
  gamebook.printing = [];
  gamebook.special.cy = 0;
}
function save() {
  if (localStorage) {
    let o = {
      room: gamebook.room.id,
      args: gamebook.room.args,
      date: Date.now(),
      variables: [],
      style: gamebook.style,
      corever: gamebook.version,
      version: obj.version
    };
    for (let i = 0; i < gamebook.res.variables.length; i++) o.variables.push({ name: gamebook.res.variables[i], value: window[gamebook.res.variables[i]] });
    localStorage.setItem(`gamebook_save_${location.href}`, JSON.stringify(o));
  } else console.warn(`GamebookCore: Can't to save progress`);
}
function restore() {
  if (gamebook.restore) {
    gamebook.special.clearvariables();
    for (let i = 0; i < gamebook.restore.variables.length; i++) {
      variable(gamebook.restore.variables[i].name, gamebook.restore.variables[i].value);
    }
    obj.style = gamebook.restore.style;
    room(gamebook.restore.room, ...gamebook.restore.args);
  } else console.warn(`GamebookCore: Can't to restore progress`);
}
function room(id, ...args) {
  for (let i = 0; i < obj.rooms.length; i++) {
    if (obj.rooms[i].id == id) {
      clear();
      obj.rooms[i].f(...args);
      gamebook.room.id = id;
      gamebook.room.i = i;
      gamebook.room.args = args;
      if (obj.options.room) obj.options.room();
      return;
    }
  }
  console.error(`GamebookCore: Room with id '${id}' is not declared in 'rooms'`);
}
function println(a) {
  let txt = `${a}`;
  for (let i = 0; i < txt.length; i++) {
    gamebook.printing.push(txt[i]);
  }
}
function opt(txt, fun) {
  let t = [];
  txt = (gamebook.opts.length+1)+"."+txt;
  for (let i = 0; i < txt.length; i++) {
    t.push(txt[i]);
  }
  gamebook.opts.push({ text: [new Array(gamebook.screenprops.optlen).fill('')], printing: t, cursor: { x: 0, y: 0 }, f: fun });
}
gamebook.vibrate = function(len) {
  if (navigator.vibrate) navigator.vibrate(len);
  else console.warn(`GamebookCore: Can't to vibrate`);
}
gamebook.fullscreen = function(e) {
  if(e.requestfullscreen) {
    e.requestfullscreen();
  } else if(e.webkitrequestfullscreen) {
    e.webkitRequestfullscreen();
  } else if(e.mozRequestfullscreen) {
    e.mozRequestfullscreen();
  }
}
function variable(name, value) {
  if (!gamebook.res.variables.includes(name) && !window[name]) {
    window[name] = value ?? null;
    gamebook.res.variables.push(name);
  } else console.error(`GamebookCore: variable with name '${name}' has already declared`);
}
function img(id) {
  for (let i = 0; i < gamebook.res.images.length; i++) {
    if (gamebook.res.images[i].id == id) return gamebook.res.images[i].img;
  }
  console.error(`GamebookCore: image with id '${id}' is not declared in 'assets'`);
}
gamebook.render = function() {
  gamebook.clearrender();
  document.body.style.backgroundColor = obj.style.backgroundbody;
  if (obj.options.fullscreen) {
    gamebook.ctx.font = `${X(18)}px font`;
    gamebook.ctx.fillStyle = obj.style.first;
    gamebook.ctx.fillText("полный экран", X(790), Y(20));
  }
  let ostr = 0;
  if (gamebook.printing[0]) {
    let s = gamebook.printing.splice(0, 1);
    if (gamebook.cursor.x == gamebook.screenprops.textlen-1) {
      gamebook.cursor = { x: 0, y: gamebook.cursor.y+1 };
      gamebook.text[gamebook.cursor.y] = new Array(gamebook.screenprops.textlen).fill('');
    }
    if (s == '\n') {
      gamebook.cursor = { x: 0, y: gamebook.cursor.y+1 };
      gamebook.text[gamebook.cursor.y] = new Array(gamebook.screenprops.textlen).fill('');
    } else {
      gamebook.text[gamebook.cursor.y][gamebook.cursor.x] = s;
      gamebook.cursor.x++;
    }
  } else {
    for (let i = 0; i < gamebook.opts.length; i++) {
      let opt = gamebook.opts[i];
      ostr += opt.text.length;
      if (opt.printing[0]) {
        let s = opt.printing.splice(0, 1);
        if (opt.cursor.x == gamebook.screenprops.optlen-1) {
          opt.cursor = { x: 0, y: opt.cursor.y+1 };
          opt.text[opt.cursor.y] = new Array(gamebook.screenprops.optlen).fill('');
        }
        if (s == '\n') {
          opt.cursor = { x: 0, y: opt.cursor.y+1 };
          opt.text[opt.cursor.y] = new Array(gamebook.screenprops.optlen).fill('');
        } else {
          opt.text[opt.cursor.y][opt.cursor.x] = s;
          opt.cursor.x++;
        }
      }
    }
  }
  gamebook.special.my = Math.max((gamebook.text.length*30)+50+(ostr*30), 450);
  if (gamebook.special.my > 450) {
    gamebook.ctx.fillStyle = obj.style.third;
    gamebook.ctx.fillRect(X(848), Y(28), X(20), Y(390));
    gamebook.ctx.fillStyle = obj.style.background;
    gamebook.ctx.fillRect(X(852), Y(32), X(12), Y(382));
    gamebook.ctx.fillStyle = obj.style.first;
    gamebook.ctx.fillRect(X(854), Y(gamebook.special.cy/gamebook.special.my*360+34), X(8), Y(18));
  }
  gamebook.ctx.fillStyle = obj.style.first;
  gamebook.ctx.font = `${X(24)}px font`;
  for (let y = Math.max(Math.floor(gamebook.special.cy/30)-1, 0); y < Math.min(gamebook.text.length, Math.ceil((gamebook.special.cy+450)/30)); y++) {
    for (let x = 0; x < gamebook.text[y].length; x++) {
      gamebook.ctx.fillText(gamebook.text[y][x], X(20+(x*16)), Y(50+(y*30)-gamebook.special.cy));
    }
  }
  gamebook.ctx.fillStyle = obj.style.second;
  for (let i = 0, y = 0; i < gamebook.opts.length; i++) {
    let opt = gamebook.opts[i];
    for (let j = 0; j < opt.text.length; j++) {
      for (let x = 0; x < opt.text[j].length; x++) {
        gamebook.ctx.fillText(opt.text[j][x], X(20+(x*16)), Y(50+(gamebook.text.length*30)+y+(j*30)-gamebook.special.cy));
      }
    }
    y += opt.text.length*30;
  }
  if (obj.options.render) obj.options.render();
  gamebook.special.lasttime = performance.now();
}
window.onload = gamebook.load.load;
document.body.style.backgroundColor = obj.style.backgroundbody;
