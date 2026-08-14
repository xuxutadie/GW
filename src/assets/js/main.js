/* ============================================
   新起点青少年人工智能官网 - 主脚本
   ============================================ */

(function() {
  'use strict';

  // 当前年份
  function setCurrentYear() {
    const yearEl = document.getElementById('currentYear');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  // 移动端菜单
  function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navMobile = document.getElementById('navMobile');
    if (!menuToggle || !navMobile) return;

    let isOpen = false;

    function toggleMenu(open) {
      isOpen = open !== undefined ? open : !isOpen;
      navMobile.classList.toggle('open', isOpen);
      menuToggle.setAttribute('aria-expanded', isOpen);
      menuToggle.setAttribute('aria-label', isOpen ? '关闭菜单' : '打开菜单');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    menuToggle.addEventListener('click', function() {
      toggleMenu();
    });

    // 点击导航链接后关闭菜单
    const navLinks = navMobile.querySelectorAll('.nav-link, .btn');
    navLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        toggleMenu(false);
      });
    });

    // 点击外部关闭
    document.addEventListener('click', function(e) {
      if (isOpen && !navMobile.contains(e.target) && !menuToggle.contains(e.target)) {
        toggleMenu(false);
      }
    });

    // Escape键关闭
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) {
        toggleMenu(false);
        menuToggle.focus();
      }
    });
  }

  // FAQ 折叠展开
  function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(function(item, index) {
      const question = item.querySelector('.faq-question');
      if (!question) return;

      // 默认展开第一个
      if (index === 0) {
        item.classList.add('open');
        question.setAttribute('aria-expanded', 'true');
      } else {
        question.setAttribute('aria-expanded', 'false');
      }

      question.addEventListener('click', function() {
        const isOpen = item.classList.contains('open');
        item.classList.toggle('open');
        question.setAttribute('aria-expanded', !isOpen);
      });

    });
  }

  // 追问折叠
  function initFollowup() {
    const followupItems = document.querySelectorAll('.followup-item');
    followupItems.forEach(function(item) {
      const question = item.querySelector('.followup-question');
      if (!question) return;

      question.setAttribute('aria-expanded', 'false');

      question.addEventListener('click', function() {
        const isOpen = item.classList.toggle('open');
        question.setAttribute('aria-expanded', String(isOpen));
      });
    });
  }

  // 微信咨询弹窗
  function initWechatPopup() {
    const wechatBtn = document.getElementById('wechatBtn');
    const wechatPopup = document.getElementById('wechatPopup');
    const wechatBtnMobile = document.getElementById('wechatBtnMobile');
    if (!wechatBtn || !wechatPopup) return;

    let popupOpen = false;

    function togglePopup(open) {
      popupOpen = open !== undefined ? open : !popupOpen;
      wechatPopup.classList.toggle('show', popupOpen);
    }

    wechatBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      togglePopup();
    });

    if (wechatBtnMobile) {
      wechatBtnMobile.addEventListener('click', function(e) {
        e.stopPropagation();
        togglePopup();
      });
    }

    // 点击外部关闭
    document.addEventListener('click', function(e) {
      if (popupOpen && !wechatPopup.contains(e.target) && e.target !== wechatBtn && e.target !== wechatBtnMobile) {
        togglePopup(false);
      }
    });
  }

  // 复制微信号
  function initCopyWechat() {
    const copyBtn = document.getElementById('copyWechatBtn');
    const wechatIdDisplay = document.getElementById('wechatIdDisplay');
    const copyToast = document.getElementById('copyToast');
    if (!copyBtn || !wechatIdDisplay) return;

    copyBtn.addEventListener('click', function() {
      const wechatId = wechatIdDisplay.textContent.trim();
      if (!wechatId || wechatId === '微信号') return;

      navigator.clipboard.writeText(wechatId).then(function() {
        showCopyToast(true);
      }).catch(function() {
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = wechatId;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          showCopyToast(true);
        } catch (err) {
          showCopyToast(false);
        }
        document.body.removeChild(textarea);
      });
    });

    function showCopyToast(success) {
      if (!copyToast) return;
      copyToast.textContent = success ? '已复制' : '请手动复制';
      copyToast.classList.add('show');
      setTimeout(function() {
        copyToast.classList.remove('show');
      }, 2000);
    }
  }

  // 通用复制按钮，用于复制当前有效的联系账号。
  function initCopyButtons() {
    const buttons = document.querySelectorAll('[data-copy]');
    buttons.forEach(function(button) {
      const originalText = button.textContent;
      button.addEventListener('click', function() {
        const value = button.getAttribute('data-copy');
        const successText = button.getAttribute('data-copy-label') || '已复制';
        if (!value) return;

        function showResult(text) {
          button.textContent = text;
          setTimeout(function() { button.textContent = originalText; }, 1800);
        }

        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(value).then(function() {
            showResult(successText);
          }).catch(function() {
            showResult('请手动复制：' + value);
          });
          return;
        }

        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          showResult(successText);
        } catch (err) {
          showResult('请手动复制：' + value);
        }
        document.body.removeChild(textarea);
      });
    });
  }

  // 筛选功能（案例、作品）
  function initFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const filterItems = document.querySelectorAll('[data-category]');
    if (!filterBtns.length || !filterItems.length) return;

    filterBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        const category = btn.getAttribute('data-filter');

        // 更新按钮状态
        filterBtns.forEach(function(b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');

        // 筛选项目
        filterItems.forEach(function(item) {
          const categories = (item.getAttribute('data-category') || '').split(/\s+/);
          if (category === 'all' || categories.includes(category)) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  // 荣誉证书墙：从本地数据文件渲染全部证书，避免页面只展示少量写死卡片。
  function initCertificates() {
    const grid = document.getElementById('certificateGrid');
    if (!grid) return Promise.resolve();

    const source = grid.getAttribute('data-certificates-source');
    if (!source || !window.fetch) return Promise.resolve();

    function setMessage(text) {
      grid.classList.add('is-loading');
      grid.innerHTML = '<div class="certificate-loading" role="status">' + text + '</div>';
    }

    function createText(tagName, className, text) {
      const el = document.createElement(tagName);
      if (className) el.className = className;
      el.textContent = text || '';
      return el;
    }

    function formatRecordDate(value) {
      if (!value) return '未公开';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '未公开';
      return date.toISOString().slice(0, 10);
    }

    function renderCard(item, index) {
      const title = item.title || '荣誉证书';
      const studentName = item.studentName || '学生作品';
      const tag = item.tag || '荣誉证书';
      const category = item.category || 'award';
      const image = item.image || item.thumb || '';
      const thumb = item.thumb || item.image || '';
      const recordDate = formatRecordDate(item.createdAt);
      const issuer = item.issuer || '以证书原图为准';
      const projectName = item.projectName || item.workTitle || (studentName === '学生作品' ? '学生作品' : studentName);

      const article = document.createElement('article');
      article.className = 'certificate-card';
      if (item.orientation === 'landscape') {
        article.classList.add('certificate-card-landscape');
      }
      article.setAttribute('data-category', category);

      const link = document.createElement('a');
      link.className = 'certificate-card-link';
      link.href = image;
      link.setAttribute('data-lightbox', 'certificates');
      link.setAttribute('aria-label', '查看' + studentName + title + '证书大图');

      const frame = document.createElement('div');
      frame.className = 'certificate-frame';

      const ribbon = createText('span', 'certificate-ribbon', item.ribbon || 'Honor');
      const img = document.createElement('img');
      img.src = thumb;
      img.alt = studentName + title + '证书';
      img.loading = index < 8 ? 'eager' : 'lazy';
      img.decoding = 'async';

      frame.appendChild(ribbon);
      frame.appendChild(img);

      const info = document.createElement('div');
      info.className = 'certificate-info';
      info.appendChild(createText('span', 'certificate-tag', tag));
      info.appendChild(createText('h3', '', title));
      info.appendChild(createText('p', 'certificate-summary', projectName + ' · 证书展示'));

      const meta = document.createElement('dl');
      meta.className = 'certificate-meta-list';
      [
        ['证书名称', title],
        ['对应学生或项目', projectName],
        ['公开整理时间', recordDate],
        ['颁发单位', issuer]
      ].forEach(function(row) {
        const wrap = document.createElement('div');
        wrap.appendChild(createText('dt', '', row[0]));
        wrap.appendChild(createText('dd', '', row[1]));
        meta.appendChild(wrap);
      });
      info.appendChild(meta);

      link.appendChild(frame);
      link.appendChild(info);
      article.appendChild(link);
      return article;
    }

    setMessage('证书正在加载...');

    return fetch(source, { cache: 'no-store' })
      .then(function(response) {
        if (!response.ok) throw new Error('证书数据加载失败');
        return response.json();
      })
      .then(function(items) {
        if (!Array.isArray(items) || !items.length) {
          setMessage('暂无可展示证书');
          return;
        }

        const fragment = document.createDocumentFragment();
        items.forEach(function(item, index) {
          fragment.appendChild(renderCard(item, index));
        });

        grid.classList.remove('is-loading');
        grid.innerHTML = '';
        grid.appendChild(fragment);
      })
      .catch(function() {
        setMessage('证书暂时无法加载，请稍后刷新页面');
      });
  }

  // 图片查看器（Lightbox）
  function initLightbox() {
    const workItems = document.querySelectorAll('.work-item');
    const lightboxLinks = document.querySelectorAll('[data-lightbox]');
    if (!workItems.length && !lightboxLinks.length) return;

    // 创建lightbox元素
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="关闭">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <button class="lightbox-nav lightbox-prev" aria-label="上一张">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <img class="lightbox-image" src="" alt="">
        <button class="lightbox-nav lightbox-next" aria-label="下一张">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        <div class="lightbox-caption"></div>
      </div>
    `;
    document.body.appendChild(lightbox);

    const lightboxImg = lightbox.querySelector('.lightbox-image');
    const lightboxCaption = lightbox.querySelector('.lightbox-caption');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');

    let currentIndex = 0;
    let items = Array.from(workItems).concat(Array.from(lightboxLinks));

    function getVisibleItems() {
      return items.filter(function(item) {
        return item.style.display !== 'none' && item.offsetParent !== null;
      });
    }

    function openLightbox(item) {
      const visibleItems = getVisibleItems();
      if (!visibleItems.length) return;
      currentIndex = visibleItems.indexOf(item);
      if (currentIndex < 0) currentIndex = 0;
      updateLightbox(visibleItems);
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      const visibleItems = getVisibleItems();
      if (visibleItems[currentIndex]) {
        visibleItems[currentIndex].focus();
      }
    }

    function updateLightbox(visibleItems) {
      const item = visibleItems[currentIndex];
      if (!item) return;
      const img = item.querySelector('img');
      const title = item.querySelector('h4, h3');
      const explicitSrc = item.getAttribute('href');
      if (explicitSrc) {
        lightboxImg.src = explicitSrc;
        lightboxImg.alt = img ? (img.alt || '') : (item.getAttribute('aria-label') || '');
      } else if (img) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || '';
      }
      lightboxCaption.textContent = title ? title.textContent : (item.getAttribute('aria-label') || '');
    }

    function navigate(direction) {
      const visibleItems = getVisibleItems();
      currentIndex = (currentIndex + direction + visibleItems.length) % visibleItems.length;
      updateLightbox(visibleItems);
    }

    items.forEach(function(item) {
      if (!item.matches('a')) {
        item.setAttribute('tabindex', '0');
      }
      item.addEventListener('click', function(e) {
        if (item.getAttribute('data-lightbox')) {
          e.preventDefault();
        }
        openLightbox(item);
      });
      item.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(item);
        }
      });
    });

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', function() { navigate(-1); });
    nextBtn.addEventListener('click', function() { navigate(1); });

    lightbox.addEventListener('click', function(e) {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', function(e) {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    });
  }

  // 导航高亮
  function highlightNav() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link[data-nav]');

    navLinks.forEach(function(link) {
      const navKey = link.getAttribute('data-nav');
      let isActive = false;

      if (navKey === 'home') {
        isActive = currentPath === '/' || currentPath === '/index.html';
      } else {
        isActive = currentPath.startsWith('/' + navKey);
      }

      link.classList.toggle('active', isActive);
    });
  }

  // 滚动 reveal 动画
  function initReveal() {
    // 检查是否开启了减少动效模式
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealElements = document.querySelectorAll('.reveal');

    if (!revealElements.length) return;

    // 如果减少动效或不支持 IntersectionObserver，直接显示所有元素
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealElements.forEach(function(el) {
        el.classList.add('visible');
      });
      return;
    }

    // 使用 IntersectionObserver 检测元素进入视口
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // 只触发一次
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(function(el) {
      observer.observe(el);
    });

    // 首屏元素立即显示（无延迟）
    setTimeout(function() {
      revealElements.forEach(function(el) {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.8) {
          el.classList.add('visible');
        }
      });
    }, 100);
  }

  // 首页首屏轻量 Ballpit 动效：不依赖第三方库，保持背景层级轻盈
  function initHeroBallpit() {
    const canvas = document.getElementById('heroBallpit');
    const hero = document.querySelector('.home-hero-national');
    if (!canvas || !hero) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const colors = [
      'rgba(231, 176, 86, 0.48)',
      'rgba(255, 132, 101, 0.42)',
      'rgba(59, 179, 156, 0.34)',
      'rgba(255, 226, 170, 0.52)'
    ];
    const pointer = { x: -9999, y: -9999, active: false };
    const particles = [];
    let width = 0;
    let height = 0;
    let ratio = 1;
    let animationId = 0;

    function createParticle(index, total) {
      const sideBias = index / total;
      const x = sideBias < 0.48
        ? Math.random() * width * 0.42
        : width * 0.58 + Math.random() * width * 0.38;
      const y = height * 0.2 + Math.random() * height * 0.72;
      const radius = 3.5 + Math.random() * 7.5;

      return {
        x: x,
        y: y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.48,
        vy: (Math.random() - 0.5) * 0.48,
        radius: radius,
        color: colors[index % colors.length],
        phase: Math.random() * Math.PI * 2,
        depth: 0.45 + Math.random() * 0.9
      };
    }

    function resize() {
      const rect = hero.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const targetCount = width < 768 ? 30 : 52;
      particles.length = 0;
      for (let i = 0; i < targetCount; i += 1) {
        particles.push(createParticle(i, targetCount));
      }
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 170) {
            const alpha = (1 - distance / 170) * 0.16;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = 'rgba(190, 143, 72, ' + alpha.toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    function withAlpha(color, alpha) {
      return color.replace(/[\d.]+\)$/u, alpha + ')');
    }

    function drawParticle(particle, time) {
      const glow = particle.radius * 2.8;
      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        glow
      );

      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(0.48, withAlpha(particle.color, 0.16));
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(particle.x, particle.y, glow, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = particle.color;
      ctx.arc(
        particle.x,
        particle.y + Math.sin(time * 0.0024 + particle.phase) * 2.4,
        particle.radius,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    function updateParticle(particle, time) {
      const floatX = Math.cos(time * 0.0008 * particle.depth + particle.phase) * 0.42;
      const floatY = Math.sin(time * 0.001 * particle.depth + particle.phase) * 0.5;

      particle.vx += (particle.baseX - particle.x) * 0.0007 + floatX * 0.028;
      particle.vy += (particle.baseY - particle.y) * 0.0007 + floatY * 0.028;

      if (pointer.active) {
        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const influence = width < 768 ? 140 : 210;

        if (distance > 0 && distance < influence) {
          const force = (1 - distance / influence) * 1.45;
          particle.vx += (dx / distance) * force;
          particle.vy += (dy / distance) * force;
        }
      }

      particle.vx *= 0.955;
      particle.vy *= 0.955;
      particle.x += particle.vx;
      particle.y += particle.vy;
    }

    function render(time) {
      ctx.clearRect(0, 0, width, height);
      drawConnections();

      particles.forEach(function(particle) {
        updateParticle(particle, time);
        drawParticle(particle, time);
      });

      animationId = window.requestAnimationFrame(render);
    }

    function updatePointer(event) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    }

    function clearPointer() {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    }

    resize();

    if (prefersReducedMotion) {
      ctx.clearRect(0, 0, width, height);
      drawConnections();
      particles.forEach(function(particle) {
        drawParticle(particle, 0);
      });
      return;
    }

    canvas.addEventListener('pointermove', updatePointer, { passive: true });
    canvas.addEventListener('pointerleave', clearPointer);
    window.addEventListener('resize', function() {
      window.cancelAnimationFrame(animationId);
      resize();
      animationId = window.requestAnimationFrame(render);
    }, { passive: true });

    animationId = window.requestAnimationFrame(render);
  }

  // 导航栏滚动效果
  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    function handleScroll() {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // 初始化
  }

  // 初始化
  document.addEventListener('DOMContentLoaded', function() {
    setCurrentYear();
    initMobileMenu();
    initFAQ();
    initFollowup();
    initWechatPopup();
    initCopyWechat();
    initCopyButtons();
    initCertificates().then(function() {
      initFilter();
      initLightbox();
    });
    highlightNav();
    initReveal();
    initHeroBallpit();
    initHeaderScroll();
  });

})();
