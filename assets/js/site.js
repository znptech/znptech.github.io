    // ============================
    // 1) Scroll → nav state
    // ============================
    (function(){
      const nav = document.getElementById('nav');
      let ticking = false;
      window.addEventListener('scroll', () => {
        if(!ticking){
          requestAnimationFrame(() => {
            nav.classList.toggle('scrolled', window.scrollY > 30);
            ticking = false;
          });
          ticking = true;
        }
      }, {passive:true});
    })();

    // ============================
    // 2) Reveal-on-scroll observer
    // ============================
    if('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if(e.isIntersecting){
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    } else {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    }

    // ============================
    // 3) Service-card tag stagger (separate observer for each service)
    // ============================
    if('IntersectionObserver' in window){
      const sIo = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if(e.isIntersecting){
            e.target.classList.add('in-view');
            sIo.unobserve(e.target);
          }
        });
      }, { threshold: 0.3 });
      document.querySelectorAll('.service').forEach(el => sIo.observe(el));
    }

    // ============================
    // 4) Click ripple effect on buttons
    // ============================
    const rippleTargets = document.querySelectorAll('.btn, .store-btn:not(.store-btn-coming), .contact-cta');
    rippleTargets.forEach(btn => {
      btn.addEventListener('click', function(e){
        if(this.classList.contains('store-btn-coming')) return;
        const rect = this.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height);
        ripple.className = 'ripple-fx';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
        ripple.style.top  = (e.clientY - rect.top - size/2) + 'px';
        // ensure parent is positioned
        const cs = getComputedStyle(this);
        if(cs.position === 'static') this.style.position = 'relative';
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });

    // ============================
    // 5) Stat number scramble on first scroll into view
    // ============================
    function scrambleNumber(el){
      const target = el.dataset.value || el.textContent.trim();
      const isPercent = target.includes('%');
      const isInfinite = target === '∞';
      const isRatio = target.includes(':');
      // Don't scramble pure symbols
      if(isInfinite || isRatio){
        // Just do a quick fade in; symbol stays
        el.style.opacity = '0';
        el.animate([{opacity:0,transform:'scale(.6)'},{opacity:1,transform:'scale(1)'}],
          {duration:600, easing:'cubic-bezier(.4,2,.5,1)', fill:'forwards'});
        return;
      }
      // For numeric: count up
      const numMatch = target.match(/(\d+)/);
      if(!numMatch) return;
      const finalNum = parseInt(numMatch[1], 10);
      const suffix = target.replace(/\d+/, '');
      const duration = 1100;
      const start = performance.now();
      function tick(now){
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const cur = Math.round(eased * finalNum);
        el.textContent = cur + suffix;
        if(t < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      }
      requestAnimationFrame(tick);
    }
    if('IntersectionObserver' in window){
      const nIo = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if(e.isIntersecting){
            // Save original and scramble
            const el = e.target;
            if(!el.dataset.value) el.dataset.value = el.textContent.trim();
            scrambleNumber(el);
            nIo.unobserve(el);
          }
        });
      }, { threshold: 0.5 });
      document.querySelectorAll('.stat-grid .num').forEach(el => nIo.observe(el));
    }

    // ============================
    // 6) Pause hero animations when hero is off-screen (battery saver)
    // ============================
    if('IntersectionObserver' in window){
      const hero = document.querySelector('.hero');
      if(hero){
        const hIo = new IntersectionObserver((entries) => {
          entries.forEach(e => {
            hero.classList.toggle('anim-paused', !e.isIntersecting);
          });
        }, { threshold: 0 });
        hIo.observe(hero);
      }
    }

    // ============================
    // 7) Magnetic hover on primary CTAs (desktop only — disabled if touch)
    // ============================
    const isTouch = matchMedia('(hover: none)').matches;
    if(!isTouch){
      document.querySelectorAll('.btn-primary, nav.topbar .cta').forEach(el => {
        el.addEventListener('mousemove', (e) => {
          const r = el.getBoundingClientRect();
          const x = e.clientX - r.left - r.width/2;
          const y = e.clientY - r.top - r.height/2;
          el.style.transform = `translate(${x*.15}px, ${y*.2}px)`;
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = '';
        });
      });
    }

    // ============================
    // 8) Mobile menu toggle (added Oct 2026)
    // ============================
    (function(){
      const toggle = document.querySelector('.menu-toggle');
      const menu = document.querySelector('nav.topbar .menu');
      if(!toggle || !menu) return;
      toggle.addEventListener('click', () => {
        const open = menu.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.textContent = open ? 'CLOSE ✕' : 'MENU ☰';
      });
      menu.addEventListener('click', (e) => {
        if(e.target.tagName === 'A'){ menu.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); toggle.textContent = 'MENU ☰'; }
      });
    })();

    // ============================
    // 9) Package pre-select: ?package=NAME in the URL, or any [data-package] button
    // ============================
    (function(){
      const select = document.getElementById('package');
      function pick(val){
        if(!select || !val) return;
        for(let i = 0; i < select.options.length; i++){
          if(select.options[i].value === val){ select.selectedIndex = i; return; }
        }
      }
      pick(new URLSearchParams(location.search).get('package'));
      document.querySelectorAll('[data-package]').forEach(btn => {
        btn.addEventListener('click', () => pick(btn.getAttribute('data-package')));
      });
    })();

    // ============================
    // 10) Quote form → Formspree (AJAX, on-page success). Plain POST still works without JS.
    // ============================
    (function(){
      const form = document.getElementById('quote-form');
      if(!form || !window.fetch) return;
      const status = document.getElementById('form-status');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const label = btn ? btn.textContent : '';
        if(status){ status.className = 'form-status'; status.textContent = ''; }
        if(btn){ btn.disabled = true; btn.textContent = 'SENDING…'; }
        fetch(form.action, { method:'POST', body:new FormData(form), headers:{ Accept:'application/json' } })
          .then(res => {
            if(res.ok){
              form.reset();
              if(status){ status.className = 'form-status ok'; status.textContent = '✓ RECEIVED — we\'ll reply with a clear quote within 24 hours.'; }
            } else {
              return res.json().then(d => {
                const msg = (d && d.errors) ? d.errors.map(x => x.message).join(', ') : 'Something went wrong — please email business@znptech.com.';
                if(status){ status.className = 'form-status err'; status.textContent = msg; }
              });
            }
          })
          .catch(() => { if(status){ status.className = 'form-status err'; status.textContent = 'Network error — please email business@znptech.com directly.'; } })
          .finally(() => { if(btn){ btn.disabled = false; btn.textContent = label; } });
      });
    })();
