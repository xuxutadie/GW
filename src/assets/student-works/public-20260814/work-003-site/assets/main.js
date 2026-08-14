(function() {
  'use strict';

  // ===== CONFIG =====
  var SECTIONS = [
    { id: 'about',       label: '关于', color: '#7888c8', rgb: [120,136,200], pos: { x: 28, y: 30 }, flipDir: 'left' },
    { id: 'works',       label: '作品', color: '#d87040', rgb: [216,112, 64], pos: { x: 72, y: 30 }, flipDir: 'right' },
    { id: 'literature',  label: '文学', color: '#38a8d0', rgb: [ 56,168,208], pos: { x: 50, y: 55 }, flipDir: 'bottom' },
    { id: 'games',       label: '游戏', color: '#68b838', rgb: [104,184, 56], pos: { x: 25, y: 78 }, flipDir: 'top' },
    { id: 'personality', label: '个性', color: '#e07068', rgb: [224,112,104], pos: { x: 75, y: 78 }, flipDir: 'right' },
    { id: 'interaction', label: '互动', color: '#a060d8', rgb: [160, 96,216], pos: { x: 50, y: 92 }, flipDir: 'left' }
  ];

  var QUOTES = [
    '不是天才，但从不停止创造。',
    '每个人心里都有一首没写完的歌。',
    '平凡的日子里，藏着不平凡的瞬间。',
    '创作不是为了证明什么，而是为了成为什么。',
    '安静的人，往往有着最喧嚣的内心世界。',
    '世界那么大，我只想把自己表达完整。',
    '琴键上的手指，比语言更诚实。',
    '每幅画都是一次和自己的对话。',
    '代码是21世纪的诗歌。',
    '在人群中沉默，在创作中呐喊。'
  ];

  var used = [];

  // ===== DOM =====
  var act0     = document.getElementById('act0');
  var theDot   = document.getElementById('theDot');
  var act1     = document.getElementById('act1');
  var vid      = document.getElementById('vid');
  var vidFade  = document.getElementById('vidFade');
  var titleEl  = document.getElementById('title');
  var act2     = document.getElementById('act2');
  var stains   = document.getElementById('stains');
  var dotsEl   = document.getElementById('dots');
  var dyeLayer = document.getElementById('dyeLayer');
  var flowStage = document.getElementById('flowStage');
  var whiteOut = document.getElementById('whiteOut');
  var flipWrap = document.getElementById('flipWrap');
  var flipPage = document.getElementById('flipPage');
  var panelIn  = document.getElementById('panelInner');
  var fullSite = document.getElementById('fullSite');

  // ===== ACT 0 → 1: DOT EXPANDS INTO VIDEO =====
  act0.addEventListener('click', function() {
    theDot.classList.add('expand');
    setTimeout(function() {
      act0.classList.add('gone');
      act1.classList.add('active');
      vid.currentTime = 0;
      vid.play().catch(function() { goAct2(); });
    }, 600);
  });

  // Title fades in near end of video
  vid.addEventListener('timeupdate', function() {
    if (vid.currentTime >= 3.8 && !titleEl.classList.contains('show')) {
      vidFade.classList.add('show');
      titleEl.classList.add('show');
    }
  });

  // Video ends → Act 2
  vid.addEventListener('ended', function() {
    setTimeout(function() {
      act1.classList.remove('active');
      vidFade.classList.remove('show');
      goAct2();
    }, 1500);
  });

  vid.addEventListener('error', function() {
    act1.classList.remove('active');
    titleEl.classList.add('show');
    setTimeout(goAct2, 3000);
  });

  // ===== ACT 2: FULLSCREEN POSTER + DOTS =====
  function goAct2() {
    act2.classList.add('active');
    setTimeout(function() {
      titleEl.classList.add('hide');
      buildDots();
    }, 1200);
  }

  function buildDots() {
    dotsEl.innerHTML = '';
    var remaining = SECTIONS.filter(function(s) { return used.indexOf(s.id) < 0; });
    if (remaining.length === 0) { unlockFull(); return; }

    remaining.forEach(function(sec, i) {
      var d = document.createElement('div');
      d.className = 'cdot';
      d.innerHTML = '<div class="cdot-circle" style="background:' + sec.color + '"></div>' +
                     '<span class="cdot-label">' + sec.label + '</span>';
      d.addEventListener('click', function() { pickColor(sec); });
      dotsEl.appendChild(d);
      setTimeout(function() { d.classList.add('in'); }, 100 + i * 100);
    });
    dotsEl.classList.add('active');
  }

  // ===== PICK COLOR → DYE TRANSITION → SECTION =====
  function pickColor(sec) {
    dotsEl.classList.remove('active');
    used.push(sec.id);

    // Add persistent stain at the section's designated position (spread out)
    var s = document.createElement('div');
    s.className = 'stain';
    var sx = sec.pos.x, sy = sec.pos.y;
    // Size covers ~45% of the paper, centered on the position
    s.style.left = (sx - 22) + '%';
    s.style.top  = (sy - 22) + '%';
    s.style.width  = '44%';
    s.style.height = '44%';
    s.style.background = 'radial-gradient(ellipse at 50% 50%, ' +
      sec.color + ' 0%, ' + sec.color + 'aa 25%, ' + sec.color + '55 50%, transparent 72%)';
    stains.appendChild(s);
    setTimeout(function() { s.classList.add('show'); }, 60);

    // Flowing dye blobs (multiple, drifting) instead of single static gradient
    dyeLayer.innerHTML = '';
    dyeLayer.style.opacity = '1';
    dyeLayer.classList.add('active');

    var blobs = [
      { x: 50, y: 50, size: 70, delay: 0 },
      { x: 35, y: 45, size: 55, delay: 80 },
      { x: 65, y: 55, size: 60, delay: 160 },
      { x: 45, y: 38, size: 45, delay: 240 },
      { x: 55, y: 62, size: 50, delay: 320 }
    ];
    blobs.forEach(function(b) {
      var el = document.createElement('div');
      el.className = 'dye-blob';
      el.style.left = (b.x - b.size/2) + '%';
      el.style.top  = (b.y - b.size/2) + '%';
      el.style.width  = b.size + '%';
      el.style.height = b.size + '%';
      el.style.background = 'radial-gradient(circle, ' + sec.color + ' 0%, ' + sec.color + '88 40%, transparent 70%)';
      dyeLayer.appendChild(el);
      setTimeout(function() { el.classList.add('go'); }, b.delay);
    });

    // After dye expands, white out, then show section
    setTimeout(function() {
      whiteOut.classList.add('active');
    }, 1500);

    setTimeout(function() {
      dyeLayer.classList.remove('active');
      dyeLayer.style.opacity = '0';
      dyeLayer.innerHTML = '';
      act2.classList.remove('active');
      showSection(sec);
    }, 2100);
  }

  // ===== SHOW SECTION — FLIP PAGE TRANSITION =====
  var currentFlipDir = '';
  var isFlipping = false;

  function showSection(sec) {
    var dir = sec.flipDir || 'right';
    currentFlipDir = dir;

    panelIn.innerHTML = getContent(sec.id);
    panelIn.scrollTop = 0;

    // Color the section divider
    var sn = panelIn.querySelector('.sn');
    if (sn) sn.style.background = sec.color;

    // Reset flip page
    flipPage.className = 'flip-page';
    flipWrap.classList.add('active');
    isFlipping = false;

    // Trigger flip in
    setTimeout(function() {
      flipPage.classList.add('flip-' + dir);
    }, 50);

    initPanelStuff();

    // Add a subtle "click to flip back" hint at bottom
    var hint = document.createElement('div');
    hint.style.cssText = 'text-align:center;padding:3rem 0 2rem;font-size:0.6rem;color:#ccc;letter-spacing:0.15em;pointer-events:none;';
    hint.textContent = '轻触任意处翻回';
    panelIn.appendChild(hint);

    if (used.length >= SECTIONS.length) {
      var h = document.createElement('div');
      h.style.cssText = 'text-align:center;padding:1rem 0 2rem;font-size:0.7rem;color:#999;letter-spacing:0.15em;';
      h.textContent = '所有色彩已染上这张纸';
      panelIn.appendChild(h);
    }
  }

  // Click anywhere on flip page to flip back
  flipPage.addEventListener('click', function(e) {
    // Don't flip back if clicking on interactive elements (inputs, buttons, quiz options, etc.)
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.classList.contains('qop') || e.target.classList.contains('qb')) return;
    if (isFlipping) return;
    isFlipping = true;

    flipPage.classList.remove('flip-' + currentFlipDir);
    flipPage.classList.add('flip-' + currentFlipDir + '-out');

    setTimeout(function() {
      flipWrap.classList.remove('active');
      flipPage.className = 'flip-page';
      whiteOut.classList.remove('active');
      dyeLayer.style.opacity = '';
      dyeLayer.innerHTML = '';
      flowStage.style.display = 'none';
      flowStage.innerHTML = '';
      act2.classList.add('active');

      if (used.length >= SECTIONS.length) {
        setTimeout(unlockFull, 800);
      } else {
        setTimeout(buildDots, 600);
      }
    }, 600);
  });

  // ===== UNLOCK FULL SITE — flowing liquid color animation =====
  function unlockFull() {
    act2.classList.remove('active');
    dotsEl.classList.remove('active');
    titleEl.style.display = 'none';

    // Hide act2 background, show flow stage with dark bg for vivid colors
    flowStage.style.display = 'block';
    flowStage.innerHTML = '';

    // Create 6 large flowing color blobs, one per section
    var flowAnims = ['flowA', 'flowB', 'flowC', 'flowD', 'flowE', 'flowF'];
    SECTIONS.forEach(function(sec, i) {
      var b = document.createElement('div');
      b.className = 'flow-blob';
      // Large size for full coverage
      var size = 55 + Math.random() * 15;
      b.style.width  = size + 'vmax';
      b.style.height = size + 'vmax';
      b.style.left = (50 - size/2) + 'vw';
      b.style.top  = (50 - size/2) + 'vh';
      b.style.background = 'radial-gradient(circle, ' + sec.color + ' 0%, ' + sec.color + 'cc 30%, ' + sec.color + '44 60%, transparent 75%)';
      b.style.animation = flowAnims[i] + ' ' + (7 + Math.random() * 3) + 's ease-in-out infinite';
      b.style.animationDelay = (i * 0.4) + 's';
      b.style.opacity = '0';
      b.style.transition = 'opacity 1s ease';
      flowStage.appendChild(b);
      setTimeout(function() { b.style.opacity = '0.85'; }, 100 + i * 80);
    });

    // Let it flow for ~3 seconds, then fade to white → full site
    setTimeout(function() { whiteOut.classList.add('active'); }, 3000);
    setTimeout(function() {
      flowStage.innerHTML = '';
      flowStage.style.display = 'none';
      whiteOut.classList.remove('active');
      act0.style.display = 'none';
      document.body.style.overflow = 'auto';
      fullSite.classList.add('active');
      initFullStuff();
    }, 3700);
  }

  // ===== SECTION CONTENT =====
  function getContent(id) {
    switch(id) {
      case 'about': return '<div class="sh"><div class="sl">关于</div><h2 class="st">平凡而不凡</h2><div class="sn"></div></div>' +
        '<div style="text-align:center;padding-top:1.5rem;"><img class="avatar" src="assets/avatar_flower_1024x1024.jpg" alt="">' +
        '<p class="atxt">一个在音乐、绘画、文学与代码之间游走的人。<br>相信每一种表达都值得被看见，<br>每一个平凡的灵魂都有不平凡的故事。</p>' +
        '<p class="atag">"不是天才，但从不停止创造。"</p></div>';

      case 'works': return '<div class="sh"><div class="sl">作品</div><h2 class="st">五大领域</h2><div class="sn"></div></div>' +
        '<div class="wgrid">' +
        '<div class="wc"><div class="wci">🎤</div><div class="wct">声乐</div><div class="wcs">即将上传</div></div>' +
        '<div class="wc painting-trigger" style="cursor:pointer"><div class="wci">🎨</div><div class="wct">绘画</div><div class="wcs rdy">点击查看</div></div>' +
        '<div class="wc"><div class="wci">✍️</div><div class="wct">文学</div><div class="wcs">详见文学板块</div></div>' +
        '<div class="wc"><div class="wci">💻</div><div class="wct">科技</div><div class="wcs rdy">已上线</div></div>' +
        '<div class="wc"><div class="wci">🏆</div><div class="wct">获奖</div><div class="wcs">即将上传</div></div>' +
        '</div>' +
        '<div id="paintingGalleryPanel" style="display:none;margin-top:2.5rem;">' +
        '<div style="text-align:center;margin-bottom:1.5rem;"><span style="font-size:0.65rem;color:var(--muted);letter-spacing:0.15em;cursor:pointer;" id="backToCards">← 返回五大领域</span></div>' +
        '<div class="gallery">' +
        '<div class="gitem"><img src="assets/paintings/painting1_profile.jpg" alt="画作"><div class="ginfo"><span class="gname">侧脸线稿</span><span class="gyear">《长夜寻梦》人物设定</span></div></div>' +
        '<div class="gitem"><img src="assets/paintings/painting2_sunset_couple.jpg" alt="画作"><div class="ginfo"><span class="gname">晓·日出</span><span class="gyear">第三册封面</span></div></div>' +
        '<div class="gitem wide"><img src="assets/paintings/painting5_long_night_dream.jpg" alt="画作"><div class="ginfo"><span class="gname">日落时分的重逢</span><span class="gyear">《长夜寻梦》插画</span></div></div>' +
        '<div class="gitem"><img src="assets/paintings/painting3_cyberpunk_city.jpg" alt="画作"><div class="ginfo"><span class="gname">晨·暗流</span><span class="gyear">第二册封面</span></div></div>' +
        '<div class="gitem"><img src="assets/paintings/painting4_night_city.jpg" alt="画作"><div class="ginfo"><span class="gname">梦的彼岸</span><span class="gyear">《长夜寻梦》插画</span></div></div>' +
        '<div class="gitem wide"><img src="assets/paintings/painting6_stargazing_girl.jpg" alt="画作"><div class="ginfo"><span class="gname">仰望星空</span><span class="gyear">2019</span></div></div>' +
        '</div></div>' +
        '<div style="text-align:center;margin-top:2rem;font-size:0.68rem;color:var(--muted);letter-spacing:0.12em;">点击「绘画」卡片查看画作</div>';

      case 'literature':
        var tpl = document.getElementById('tplLiterature');
        return tpl ? tpl.innerHTML : '<p>文学内容加载中...</p>';

      case 'games': return '<div class="sh"><div class="sl">游戏</div><h2 class="st">游戏库</h2><div class="sn"></div></div>' +
        '<div class="ggrid">' +
        '<div class="gc"><span>🎮</span><span>待添加</span></div>' +
        '<div class="gc"><span>🎮</span><span>待添加</span></div>' +
        '<div class="gc"><span>🎮</span><span>待添加</span></div>' +
        '<div class="gc"><span>🎮</span><span>待添加</span></div>' +
        '<div class="gc"><span>🎮</span><span>待添加</span></div>' +
        '</div>';

      case 'personality': return '<div class="sh"><div class="sl">个性</div><h2 class="st">关于我的一切</h2><div class="sn"></div></div>' +
        '<div class="pg">' +
        '<div class="pc"><h3>现在在听</h3><ul class="npl">' +
        '<li class="npi"><span class="npn">01</span><span>Clair de Lune</span><span class="npa">Debussy</span></li>' +
        '<li class="npi"><span class="npn">02</span><span>夜曲 Op.9 No.2</span><span class="npa">Chopin</span></li>' +
        '<li class="npi"><span class="npn">03</span><span>月光奏鸣曲</span><span class="npa">Beethoven</span></li>' +
        '<li class="npi"><span class="npn">04</span><span>River Flows in You</span><span class="npa">Yiruma</span></li>' +
        '</ul></div>' +
        '<div class="pc"><h3>灵感来源</h3><div class="iw"><img src="assets/inspiration_wall_1280x720.jpg" alt=""><div class="ov">那些影响我的人与作品<br>即将揭晓</div></div></div>' +
        '<div class="pc fw"><h3>创作工具</h3><div class="tgrid">' +
        '<div class="ti"><div class="tic">🖌️</div><div class="tin">画笔</div><div class="tid">色彩的语言</div></div>' +
        '<div class="ti"><div class="tic">🤖</div><div class="tin">AI</div><div class="tid">帮我实现想法的伙伴</div></div>' +
        '<div class="ti"><div class="tic">📝</div><div class="tin">笔记本</div><div class="tid">记录每一个灵感</div></div>' +
        '<div class="ti"><div class="tic">🎧</div><div class="tin">耳机</div><div class="tid">与世界的接口</div></div>' +
        '</div></div>' +
        '<div class="pc fw"><h3>一句话日记</h3>' +
        '<div class="de"><div class="dd">2026.07.17</div><div class="dt">"今天把网站做出来了，算是给\'科技\'领域交了第一份作业。"</div></div>' +
        '<div class="de"><div class="dd">2026.07.16</div><div class="dt">"在琴房待了三个小时，弹到手指发麻才停下来。"</div></div>' +
        '<div class="de"><div class="dd">2026.07.15</div><div class="dt">"窗外的云很好看，想画下来，但手里只有手机。"</div></div>' +
        '</div></div>';

      case 'interaction': return '<div class="sh"><div class="sl">互动</div><h2 class="st">留下你的痕迹</h2><div class="sn"></div></div>' +
        '<div class="ig">' +
        '<div class="ic"><h3>留言墙</h3><div class="mw"><div class="ms" id="mwP"><div class="mi"><div class="ma">访客</div><div>这个人有点意思。</div></div></div>' +
        '<div class="mf"><input id="miP" placeholder="说点什么..." maxlength="100"><button id="msP">留</button></div></div></div>' +
        '<div class="ic"><h3>测测你像哪个领域</h3><div class="qc" id="qzP"></div></div>' +
        '<div class="ic"><h3>随机金句</h3><div class="qd"><div class="qt" id="qtP"></div><button class="qb" id="qrP">换一句</button></div></div>' +
        '</div>';
    }
    return '';
  }

  // ===== INTERACTION HELPERS =====
  function wireMsg(wallId, inputId, sendId) {
    var w = document.getElementById(wallId), inp = document.getElementById(inputId), btn = document.getElementById(sendId);
    if (!w || !inp || !btn) return;
    function add() {
      var t = inp.value.trim(); if (!t) return;
      var d = document.createElement('div'); d.className = 'mi';
      d.innerHTML = '<div class="ma">访客</div><div>' + t.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div>';
      w.appendChild(d); w.scrollTop = w.scrollHeight; inp.value = '';
    }
    btn.addEventListener('click', add);
    inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') add(); });
  }

  var quizData = [
    { q: '周末的早上，你最想做什么？', o: [{t:'练一会儿琴',d:'乐器'},{t:'哼一首歌',d:'声乐'},{t:'画点什么',d:'绘画'},{t:'折腾点代码',d:'科技'}] },
    { q: '如果只能保留一种感官，你选？', o: [{t:'听觉',d:'乐器'},{t:'声带',d:'声乐'},{t:'视觉',d:'绘画'},{t:'触觉',d:'科技'}] },
    { q: '你最欣赏的品质是？', o: [{t:'专注',d:'乐器'},{t:'表达',d:'声乐'},{t:'想象',d:'绘画'},{t:'逻辑',d:'科技'}] }
  ];
  var dDesc = { '乐器':'你有着乐者的灵魂，善于倾听世界的细节。', '声乐':'你是天生的表达者，声音就是你的武器。', '绘画':'你的眼睛能看到别人看不到的色彩。', '科技':'你用逻辑构建世界，代码是你的诗篇。', '文学':'文字是你和世界对话的方式，安静却有力量。' };

  function wireQuiz(elId) {
    var el = document.getElementById(elId); if (!el) return;
    var qi = 0, sc = {};
    function render() {
      if (qi >= quizData.length) {
        var m = Object.keys(sc).reduce(function(a,b){return sc[a]>=sc[b]?a:b;});
        el.innerHTML = '你属于 <strong>'+m+'</strong> 领域<br><span style="font-size:0.68rem;color:#999;margin-top:0.4rem;display:block;">'+(dDesc[m]||'')+'</span><button class="qb" style="margin-top:0.8rem;" id="qrR">再测一次</button>';
        var r = document.getElementById('qrR'); if(r) r.addEventListener('click', function(){ qi=0;sc={};render(); });
        return;
      }
      var q = quizData[qi], h = '<div class="qq">'+q.q+'</div><div class="qo">';
      q.o.forEach(function(o){ h += '<div class="qop" data-d="'+o.d+'">'+o.t+'</div>'; });
      h += '</div>'; el.innerHTML = h;
      el.querySelectorAll('.qop').forEach(function(e){
        e.addEventListener('click', function(){ sc[e.getAttribute('data-d')] = (sc[e.getAttribute('data-d')]||0)+1; qi++; render(); });
      });
    }
    render();
  }

  var lastQI = -1;
  function wireQuote(tId, bId) {
    var t = document.getElementById(tId), b = document.getElementById(bId); if(!t||!b) return;
    function show() {
      var i; do { i = Math.floor(Math.random()*QUOTES.length); } while(i===lastQI&&QUOTES.length>1); lastQI=i;
      t.style.opacity='0'; setTimeout(function(){ t.textContent='"'+QUOTES[i]+'"'; t.style.opacity='1'; },300);
    }
    show(); b.addEventListener('click', show);
  }

  function wirePaintingGallery(cardsSelector, galleryId, backId) {
    var trigger = document.querySelector(cardsSelector);
    var gallery = document.getElementById(galleryId);
    var cards = trigger ? trigger.closest('.wgrid') : null;
    var back = document.getElementById(backId);
    if (trigger && gallery) {
      trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        if (cards) cards.style.display = 'none';
        gallery.style.display = 'block';
        wireLightbox();
      });
    }
    if (back && gallery && cards) {
      back.addEventListener('click', function(e) {
        e.stopPropagation();
        gallery.style.display = 'none';
        cards.style.display = '';
      });
    }
  }

  function initPanelStuff() { wireMsg('mwP','miP','msP'); wireQuiz('qzP'); wireQuote('qtP','qrP'); wirePaintingGallery('.painting-trigger', 'paintingGalleryPanel', 'backToCards'); wireLightbox(); }
  function initFullStuff()  { wireMsg('mw2','mi2','ms2'); wireQuiz('qz2'); wireQuote('qt2','qr2'); wirePaintingGallery('.painting-trigger', 'paintingGallery', 'backToFullCards'); wireLightbox(); initHeroFlow(); }

  // ===== LIGHTBOX =====
  var lightbox = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');

  function wireLightbox() {
    if (!lightbox || !lbImg) return;
    document.querySelectorAll('.gitem img').forEach(function(img) {
      img.addEventListener('click', function(e) {
        e.stopPropagation(); // prevent flip-back
        lbImg.src = img.src;
        lightbox.classList.add('active');
      });
    });
  }
  if (lightbox) {
    lightbox.addEventListener('click', function() {
      lightbox.classList.remove('active');
    });
  }

  // ===== HERO FLOWING COLORS (full site) =====
  var heroFlowColors = [
    { color: '#7888c8', size: 45, anim: 'flowA', dur: 12 },
    { color: '#d87040', size: 40, anim: 'flowB', dur: 14 },
    { color: '#38a8d0', size: 50, anim: 'flowC', dur: 11 },
    { color: '#68b838', size: 38, anim: 'flowD', dur: 13 },
    { color: '#e07068', size: 42, anim: 'flowE', dur: 15 },
    { color: '#a060d8', size: 48, anim: 'flowF', dur: 10 }
  ];
  function initHeroFlow() {
    var container = document.getElementById('fsHeroFlow');
    if (!container) return;
    heroFlowColors.forEach(function(c, i) {
      var b = document.createElement('div');
      b.className = 'fs-hero-blob';
      b.style.width  = c.size + 'vmin';
      b.style.height = c.size + 'vmin';
      b.style.left = (50 - c.size/2) + '%';
      b.style.top  = (50 - c.size/2) + '%';
      b.style.background = 'radial-gradient(circle, ' + c.color + ' 0%, ' + c.color + 'aa 35%, transparent 70%)';
      b.style.animation = c.anim + ' ' + c.dur + 's ease-in-out infinite';
      b.style.animationDelay = (i * 0.6) + 's';
      container.appendChild(b);
    });
  }

})();