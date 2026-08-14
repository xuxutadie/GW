(function() {
  const IS_TOUCH = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const IS_MOBILE = window.matchMedia('(max-width: 768px)').matches;

  let sharedMouseX = -1000, sharedMouseY = -1000;
  let mouseListeners = [];
  let isPageVisible = true;

  document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initNavHighlight();
    initScrollEffects();
    initRevealAnimations();
    initTerminal();
    initVideoBackgrounds();
    initPageTransitions();
    initHeroAnimation();

    if (!IS_TOUCH && !IS_MOBILE) {
      initParticles();
      initCustomCursor();
      init3DTilt();
      initSharedMouse();
    }

    initVisibilityHandler();
  });

  function initVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      isPageVisible = !document.hidden;
    });
  }

  function initSharedMouse() {
    document.addEventListener('mousemove', (e) => {
      sharedMouseX = e.clientX;
      sharedMouseY = e.clientY;
      for (let i = 0; i < mouseListeners.length; i++) {
        mouseListeners[i](sharedMouseX, sharedMouseY);
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      sharedMouseX = -1000;
      sharedMouseY = -1000;
    });
  }

  function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        hamburger.classList.toggle('active');
      });

      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('open');
          hamburger.classList.remove('active');
        });
      });
    }
  }

  function initNavHighlight() {
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        if (item.getAttribute('href') && item.getAttribute('href').startsWith('#')) {
          e.preventDefault();
        }
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  }

  function initScrollEffects() {
    const navbar = document.querySelector('.navbar');
    const scrollProgress = document.getElementById('scrollProgress');
    let ticking = false;

    const handleScroll = () => {
      if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 10);
      }

      if (scrollProgress) {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
        scrollProgress.style.width = `${progress}%`;
      }
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(handleScroll);
        ticking = true;
      }
    }, { passive: true });
    handleScroll();
  }

  function initRevealAnimations() {
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length === 0) return;

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function initTerminal() {
    const terminalInput = document.getElementById('terminalInput');
    const terminalResponses = document.getElementById('terminalResponses');

    if (!terminalInput || !terminalResponses) return;

    const commands = {
      help: {
        response: () => [
          '<span style="color:var(--accent-teal,#5B8A72)">可用命令:</span>',
          '<span style="color:var(--accent-indigo,#5B6B8A)">whoami</span>  - 查看身份信息',
          '<span style="color:var(--accent-indigo,#5B6B8A)">about</span>   - 关于墨韵轩',
          '<span style="color:var(--accent-indigo,#5B6B8A)">life</span>    - 生活分享',
          '<span style="color:var(--accent-indigo,#5B6B8A)">contact</span> - 联系方式',
          '<span style="color:var(--accent-indigo,#5B6B8A)">ls</span>      - 列出目录',
          '<span style="color:var(--accent-indigo,#5B6B8A)">cat</span>     - 查看文件',
          '<span style="color:var(--accent-indigo,#5B6B8A)">date</span>    - 当前时间',
          '<span style="color:var(--accent-indigo,#5B6B8A)">echo</span>    - 输出文本',
          '<span style="color:var(--accent-indigo,#5B6B8A)">clear</span>   - 清空终端',
          '<span style="color:var(--accent-indigo,#5B6B8A)">sudo</span>    - 管理员模式'
        ]
      },
      whoami: {
        response: () => ['一盏清茶 · 半卷旧书 · 一方数字雅舍', '<span style="color:var(--accent-gold,#C9A961)">以墨为引，以韵为魂</span>']
      },
      about: {
        response: () => ['<span style="color:var(--accent-teal,#5B8A72)">墨韵轩</span> — 一方属于个人的数字雅舍', '有茶、有书、有旅途中的光影', '愿以宋人留白的意境，在喧嚣中辟出静心之地'],
        action: () => { if (typeof showPage === 'function') showPage('about'); }
      },
      life: {
        response: () => ['<span style="color:var(--accent-teal,#5B8A72)">闲时四事:</span>', '  - 品茗 · 阅读 · 摄影 · 练字', '  - 偶尔用代码模拟水墨与粒子的流动'],
        action: () => { if (typeof showPage === 'function') showPage('life'); }
      },
      contact: {
        response: () => ['<span style="color:var(--accent-teal,#5B8A72)">联系方式:</span>', '  email: hello@moyunxuan.com', '  wechat: moyunxuan_design', '  location: 浙江杭州'],
        action: () => { if (typeof showPage === 'function') showPage('contact'); }
      },
      ls: {
        response: () => ['<span style="color:var(--accent-indigo,#5B6B8A)">about/</span>  <span style="color:var(--accent-indigo,#5B6B8A)">life/</span>  <span style="color:var(--accent-indigo,#5B6B8A)">contact/</span>  <span style="color:var(--accent-tea,#8B7355)">mood.txt</span>']
      },
      'cat profile.json': {
        response: () => ['{', '  "name": "墨韵轩",', '  "mood": "闲静少言，不慕荣利",', '  "likes": "品茗、阅读、书法、摄影",', '  "location": "浙江杭州",', '  "motto": "以墨为引，以韵为魂"', '}']
      },
      'cat mood.txt': {
        response: () => ['今日宜：慢下来。', '泡一壶茶，翻几页书，', '让光标在屏幕上轻轻游走。']
      },
      date: {
        response: () => [new Date().toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })]
      },
      clear: {
        response: () => null,
        action: () => { terminalResponses.innerHTML = ''; return true; }
      },
      sudo: {
        response: () => ['<span style="color:var(--accent-vermilion,#B83B2A)">错误:</span> 拒绝访问 - 此系统无需 sudo', '<span style="color:var(--accent-bamboo,#6B8E6B)">提示:</span> 墨韵轩始终保持开放与透明']
      }
    };

    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const input = terminalInput.value.trim();
        if (!input) return;

        terminalInput.value = '';

        const commandLine = document.createElement('div');
        commandLine.className = 't-line terminal-line';
        commandLine.innerHTML = `<span style="color:var(--accent-vermilion,#B83B2A)">$</span> <span style="color:var(--accent-tea,#8B7355)">~/</span><span class="output">${escapeHtml(input)}</span>`;
        terminalResponses.appendChild(commandLine);

        let matched = false;
        for (const [cmd, handler] of Object.entries(commands)) {
          if (input === cmd || (cmd.includes(' ') && input.startsWith(cmd.split(' ')[0]))) {
            const responseLines = handler.response();
            if (responseLines) {
              responseLines.forEach(line => {
                const responseDiv = document.createElement('div');
                responseDiv.className = 'terminal-response';
                responseDiv.innerHTML = line;
                terminalResponses.appendChild(responseDiv);
              });
            }
            if (handler.action) {
              const shouldSkip = handler.action();
              if (shouldSkip) return;
            }
            matched = true;
            break;
          }
        }

        if (!matched) {
          const unknown = document.createElement('div');
          unknown.className = 'terminal-response';
          unknown.innerHTML = `<span style="color:var(--accent-vermilion,#B83B2A)">bash:</span> ${escapeHtml(input)}: 命令未找到`;
          terminalResponses.appendChild(unknown);
        }

        setTimeout(() => {
          terminalResponses.scrollTop = terminalResponses.scrollHeight;
        }, 50);
      }
    });
  }

  function initVideoBackgrounds() {
    const heroVideo = document.getElementById('heroVideo');
    if (!heroVideo) return;

    heroVideo.addEventListener('loadeddata', () => {
      heroVideo.classList.add('loaded');
    });
    heroVideo.addEventListener('error', () => {
      heroVideo.style.display = 'none';
    });

    if (window.location.protocol === 'file:') {
      heroVideo.style.display = 'none';
    }
  }

  function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let trailParticles = [];
    let mouseX = null, mouseY = null;
    let lastMouseX = null, lastMouseY = null;
    let mouseSpeed = 0;
    let animFrameId = null;

    const INK = { r: 44, g: 42, b: 40 };
    const TEA = { r: 139, g: 115, b: 85 };
    const GOLD = { r: 201, g: 169, b: 97 };
    const BAMBOO = { r: 107, g: 142, b: 107 };

    function inkColor(alpha) {
      return `rgba(${INK.r}, ${INK.g}, ${INK.b}, ${alpha})`;
    }

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        this.size = Math.random() * 1.8 + 0.3;
        this.opacity = Math.random() * 0.15 + 0.03;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (mouseX !== null && mouseY !== null) {
          const dx = mouseX - this.x;
          const dy = mouseY - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const force = (100 - dist) / 100;
            this.vx -= dx * force * 0.01;
            this.vy -= dy * force * 0.01;
          }
        }

        this.vx *= 0.98;
        this.vy *= 0.98;

        if (this.x < 0) { this.x = 0; this.vx *= -0.5; }
        if (this.x > canvas.width) { this.x = canvas.width; this.vx *= -0.5; }
        if (this.y < 0) { this.y = 0; this.vy *= -0.5; }
        if (this.y > canvas.height) { this.y = canvas.height; this.vy *= -0.5; }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = inkColor(this.opacity);
        ctx.fill();
      }
    }

    class TrailParticle {
      constructor(x, y, speed) {
        this.x = x + (Math.random() - 0.5) * 10;
        this.y = y + (Math.random() - 0.5) * 10;
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 1 + speed * 0.03;
        this.vx = Math.cos(angle) * velocity;
        this.vy = Math.sin(angle) * velocity;
        this.size = Math.random() * 2 + 0.5;
        this.life = 1;
        this.decay = Math.random() * 0.02 + 0.015;
        this.color = Math.random() > 0.7 ? TEA : (Math.random() > 0.5 ? GOLD : INK);
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.life -= this.decay;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.life * 0.3})`;
        ctx.fill();
      }
    }

    function spawnParticles() {
      particles = [];
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 25000), 30);
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    }

    function spawnTrail(x, y, speed) {
      const count = Math.min(Math.floor(speed * 0.2) + 1, 3);
      for (let i = 0; i < count; i++) {
        trailParticles.push(new TrailParticle(x, y, speed));
      }
    }

    function drawConnections() {
      const allParticles = particles.concat(trailParticles.filter(p => p.life > 0.3));
      const maxDist = 80;
      for (let i = 0; i < allParticles.length; i++) {
        for (let j = i + 1; j < allParticles.length; j++) {
          const p1 = allParticles[i];
          const p2 = allParticles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            const opacity = 0.04 * (1 - dist / maxDist);
            ctx.strokeStyle = inkColor(opacity);
            ctx.lineWidth = 0.3;
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      if (!isPageVisible) {
        animFrameId = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => { p.update(); p.draw(); });

      trailParticles = trailParticles.filter(p => p.life > 0);
      trailParticles.forEach(p => { p.update(); p.draw(); });

      drawConnections();

      animFrameId = requestAnimationFrame(animate);
    }

    resizeCanvas();
    spawnParticles();
    animate();

    window.addEventListener('resize', () => {
      resizeCanvas();
      spawnParticles();
    });

    mouseListeners.push((x, y) => {
      if (lastMouseX !== null && lastMouseY !== null) {
        const dx = x - lastMouseX;
        const dy = y - lastMouseY;
        mouseSpeed = Math.sqrt(dx * dx + dy * dy);

        const steps = Math.min(Math.floor(mouseSpeed / 5), 6);
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          spawnTrail(lastMouseX + dx * t, lastMouseY + dy * t, mouseSpeed);
        }
      }

      mouseX = x;
      mouseY = y;
      lastMouseX = x;
      lastMouseY = y;
    });

    document.addEventListener('click', (e) => {
      for (let i = 0; i < 8; i++) {
        trailParticles.push(new TrailParticle(e.clientX, e.clientY, 10));
      }
    });
  }

  function initCustomCursor() {
    const cursorOuter = document.getElementById('cursorOuter');
    const cursorInner = document.getElementById('cursorInner');

    if (!cursorOuter || !cursorInner) return;

    let isHovering = false;
    let rafPending = false;
    let targetX = -100, targetY = -100;

    function updateCursor() {
      cursorInner.style.left = `${targetX}px`;
      cursorInner.style.top = `${targetY}px`;
      cursorOuter.style.left = `${targetX}px`;
      cursorOuter.style.top = `${targetY}px`;
      rafPending = false;
    }

    mouseListeners.push((x, y) => {
      targetX = x;
      targetY = y;
      if (!rafPending) {
        requestAnimationFrame(updateCursor);
        rafPending = true;
      }
    });

    document.addEventListener('mousedown', () => {
      cursorOuter.classList.add('click');
    });

    document.addEventListener('mouseup', () => {
      cursorOuter.classList.remove('click');
    });

    const hoverElements = document.querySelectorAll('a, button, .quick-card, .latest-card, .work-card, .article-card, .hobby-card, .travel-item, .collection-item, .social-link, .filter-btn, .page-btn, .terminal-input, .card, .life-item');

    hoverElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        isHovering = true;
        cursorOuter.classList.add('hover');
      });

      el.addEventListener('mouseleave', () => {
        isHovering = false;
        cursorOuter.classList.remove('hover');
      });
    });
  }

  function initPageTransitions() {
    window.showPage = function(pageId) {
      const sections = document.querySelectorAll('.page-section');
      sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
      });

      const target = document.getElementById(`page-${pageId}`);
      if (target) {
        target.style.display = 'block';
        requestAnimationFrame(() => {
          target.classList.add('active');
        });
      }

      if (pageId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }

      const navItems = document.querySelectorAll('.nav-links a');
      navItems.forEach(item => {
        item.classList.remove('active');
        const onclick = item.getAttribute('onclick') || '';
        if (onclick.includes(`'${pageId}'`)) {
          item.classList.add('active');
        }
      });
    };
  }

  function init3DTilt() {
    const tiltCards = document.querySelectorAll('.liquid-glass, .card-tilt');

    tiltCards.forEach(card => {
      let rafId = null;

      card.addEventListener('mousemove', (e) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;

          const rotateX = ((y - centerY) / centerY) * -6;
          const rotateY = ((x - centerX) / centerX) * 6;

          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`;
          card.style.transition = 'transform 0.1s ease-out';
        });
      });

      card.addEventListener('mouseleave', () => {
        if (rafId) cancelAnimationFrame(rafId);
        card.style.transition = 'transform 0.4s var(--ease-out,cubic-bezier(0.22,1,0.36,1))';
        card.style.transform = '';
      });
    });
  }

  function initHeroAnimation() {
    const chars = document.querySelectorAll('.hero-title .char');
    chars.forEach((char, index) => {
      char.style.animationDelay = `${0.2 + index * 0.12}s`;
    });
  }
})();
