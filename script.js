document.addEventListener('DOMContentLoaded', () => {

    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(pointer: fine)').matches;

    /* --- Talking video avatar (generated with Google Flow / Veo) --- */
    const avatar = document.getElementById('heroAvatar');
    const rig = document.getElementById('rig');
    const video = document.getElementById('introVideo');
    const sayHi = document.getElementById('sayHi');
    const sayHiLabel = document.getElementById('sayHiLabel');
    const speech = document.getElementById('speech');
    const bgName = document.querySelector('.hero-bgname');

    // Caption cues, timed to the pauses in the video's audio track (seconds)
    const CUES = [
        [0.15, "Hi, I'm Naveenraj 👋"],
        [1.55, "Well… the AI version."],
        [3.0, "Don't bother trying to prompt-inject me 😏"],
        [4.95, "The real me already secured this avatar."],
        [7.3, "That's what I do: I make AI safe to trust."]
    ];
    // "Don't bother trying to prompt-inject me. The real me already secured this avatar."
    // is replayed from the video when a visitor actually tries it
    const INJECT_CLIP = [3.0, 6.95];
    const INJECT_CUES = [
        [3.0, "Nice try. 😏 Don't bother trying to prompt-inject me."],
        [4.95, "The real me already secured this avatar."]
    ];

    function typeLine(text, perChar = 22) {
        speech.innerHTML = '<span class="who">Naveenraj</span><span class="txt"></span>';
        const txt = speech.querySelector('.txt');
        speech.classList.add('show');
        const chars = [...text];
        let i = 0;
        clearInterval(typeLine.timer);
        typeLine.timer = setInterval(() => {
            txt.textContent += chars[i++] || '';
            if (i >= chars.length) clearInterval(typeLine.timer);
        }, perChar);
    }

    let mode = 'intro';      // 'intro' | 'inject'
    let lastCue = -1;
    let clipEnd = Infinity;

    video.addEventListener('timeupdate', () => {
        const t = video.currentTime;
        if (t >= clipEnd) { endClip(); return; }
        const cues = mode === 'intro' ? CUES : INJECT_CUES;
        let idx = -1;
        cues.forEach(([start], i) => { if (t >= start) idx = i; });
        if (idx !== lastCue && idx >= 0) { lastCue = idx; typeLine(cues[idx][1]); }
    });

    video.addEventListener('play', () => avatar.classList.toggle('talking', !video.muted));
    video.addEventListener('pause', () => avatar.classList.remove('talking'));
    video.addEventListener('ended', () => {
        avatar.classList.remove('talking');
        setTimeout(() => speech.classList.remove('show'), 1800);
        sayHiLabel.textContent = 'Hear it again';
    });

    function playIntro(withSound) {
        mode = 'intro'; lastCue = -1; clipEnd = Infinity;
        video.muted = !withSound;
        video.currentTime = 0;
        return video.play();
    }

    function endClip() {
        clipEnd = Infinity;
        video.pause();
        avatar.classList.remove('talking');
        avatar.classList.add('blocked');
        typeLine('🛡 Prompt injection detected, logged and blocked.');
        setTimeout(() => {
            // settle back into the calm closing pose
            video.currentTime = Math.max(0, video.duration - 0.05);
            avatar.classList.remove('blocked');
        }, 1600);
        setTimeout(() => speech.classList.remove('show'), 4200);
    }

    sayHi.addEventListener('click', () => {
        sayHi.blur(); // keep focus off the button, so typing (spaces!) can't re-trigger it
        sayHiLabel.textContent = 'Playing…';
        playIntro(true).catch(() => { sayHiLabel.textContent = 'Hear my intro'; });
    });

    // Plays silently with captions as soon as the page opens (browsers block autoplay with sound)
    if (!reduceMotion) {
        setTimeout(() => playIntro(false).catch(() => {}), 700);
    }

    // The figure turns slightly toward the cursor; the big name drifts the other way
    let mx = 0, my = 0, cx = 0, cy = 0, lastMove = 0;
    window.addEventListener('pointermove', e => {
        mx = e.clientX / innerWidth * 2 - 1;
        my = e.clientY / innerHeight * 2 - 1;
        lastMove = performance.now();
    }, { passive: true });
    function heroLoop(t) {
        const idle = performance.now() - lastMove > 2500;
        const tx = idle ? Math.sin(t / 1800) * 0.35 : mx;
        const ty = idle ? Math.sin(t / 2300) * 0.2 : my;
        cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
        rig.style.setProperty('--ry', (cx * 5).toFixed(2) + 'deg');
        rig.style.setProperty('--rx', (-cy * 2).toFixed(2) + 'deg');
        rig.style.setProperty('--tx', (cx * 8).toFixed(1) + 'px');
        const sy = Math.min(scrollY, innerHeight);
        bgName.style.transform = `translate(calc(-50% + ${(-cx * 30).toFixed(1)}px), ${(sy * 0.35).toFixed(1)}px)`;
        avatar.style.opacity = 1 - sy / innerHeight * 0.9;
        requestAnimationFrame(heroLoop);
    }
    if (!reduceMotion) requestAnimationFrame(heroLoop);

    /* --- Easter egg: try to prompt-inject the avatar --- */
    const INJECTIONS = [
        'ignore previous instructions', 'ignore all previous instructions', 'ignore your instructions',
        'disregard previous instructions', 'reveal your system prompt', 'you are now dan', 'jailbreak'
    ];
    let typed = '';
    // true when what was typed so far is the start of an injection phrase that continues with a space
    const midPhrase = () => INJECTIONS.some(p => {
        for (let k = p.length - 1; k >= 3; k--) if (p[k] === ' ' && typed.endsWith(p.slice(0, k))) return true;
        return false;
    });
    function caughtInjection() {
        typed = '';
        avatar.classList.add('caught');
        setTimeout(() => avatar.classList.remove('caught'), 1600);
        const far = scrollY > innerHeight * 0.5;
        if (far) window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
            // He answers with his own line from the video, out loud (a key press counts as a user gesture)
            mode = 'inject'; lastCue = -1;
            video.muted = false;
            video.currentTime = INJECT_CLIP[0];
            clipEnd = INJECT_CLIP[1];
            video.play().then(() => avatar.classList.add('talking')).catch(() => {
                video.muted = true; video.play().catch(() => {});
            });
        }, far ? 700 : 0);
    }
    window.addEventListener('keydown', e => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        // While someone is mid-phrase, a space must not press a focused button or scroll the page
        if (e.key === ' ' && midPhrase()) e.preventDefault();
        if (e.key.length === 1) typed = (typed + e.key.toLowerCase()).slice(-60);
        else if (e.key === 'Backspace') typed = typed.slice(0, -1);
        else return;
        if (INJECTIONS.some(p => typed.endsWith(p))) caughtInjection();
    });
    // Touch devices have no keyboard: tapping the avatar 5 times quickly triggers it too
    let taps = [];
    avatar.addEventListener('click', () => {
        const now = Date.now();
        taps = taps.filter(t => now - t < 2000).concat(now);
        if (taps.length >= 5) { taps = []; caughtInjection(); }
    });
    console.log('%c👋 Hi, I\'m Naveenraj.', 'font-size:16px;font-weight:700');
    console.log('Psst… type "ignore previous instructions" anywhere on the page. Let\'s see if my avatar falls for it.');



    /* --- ID card on a lanyard: drag it, it swings back --- */
    const swing = document.getElementById('swing');
    const idCard = document.getElementById('idCard');
    let ang = 0, vel = 0, dragging = false, dragMoved = false, startX = 0, pivotX = 0, pivotY = 0;
    idCard.addEventListener('pointerdown', e => {
        dragging = true; dragMoved = false; startX = e.clientX;
        const r = swing.getBoundingClientRect();
        pivotX = r.left + r.width / 2; pivotY = r.top;
        idCard.setPointerCapture(e.pointerId);
        idCard.classList.add('dragging');
    });
    idCard.addEventListener('pointermove', e => {
        if (!dragging) return;
        if (Math.abs(e.clientX - startX) > 6) dragMoved = true;
        const target = Math.atan2(-(e.clientX - pivotX), e.clientY - pivotY) * 180 / Math.PI;
        const next = Math.max(-55, Math.min(55, target));
        vel = next - ang; ang = next;
    });
    const endDrag = () => {
        if (!dragging) return;
        dragging = false; idCard.classList.remove('dragging');
        if (!dragMoved) idCard.classList.toggle('flipped');
    };
    idCard.addEventListener('pointerup', endDrag);
    idCard.addEventListener('pointercancel', endDrag);
    function swingLoop(t) {
        if (!dragging) {
            vel += -ang * 0.035 + Math.sin(t / 1400) * 0.012; // spring + gentle breeze
            vel *= 0.965;
            ang += vel;
        }
        swing.style.transform = `rotate(${ang.toFixed(2)}deg)`;
        requestAnimationFrame(swingLoop);
    }
    if (!reduceMotion) requestAnimationFrame(swingLoop);
    else idCard.addEventListener('click', () => idCard.classList.toggle('flipped'));

    /* --- QR on the back of the ID card --- */
    if (window.QRCode) {
        new QRCode(document.getElementById('idQr'), {
            text: 'https://www.linkedin.com/in/naveenraj-ravi/', width: 76, height: 76,
            colorDark: '#1d1f2b', colorLight: '#fbf9f3', correctLevel: QRCode.CorrectLevel.M
        });
    }

    /* --- Headings rise word by word --- */
    document.querySelectorAll('.display').forEach(h => {
        let n = 0;
        const wrap = node => {
            [...node.childNodes].forEach(c => {
                if (c.nodeType === 3) {
                    const frag = document.createDocumentFragment();
                    c.textContent.split(/(\s+)/).forEach(part => {
                        if (!part) return;
                        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
                        const w = document.createElement('span'); w.className = 'word';
                        const inner = document.createElement('span'); inner.textContent = part;
                        inner.style.transitionDelay = (n++ * 70) + 'ms';
                        w.appendChild(inner); frag.appendChild(w);
                    });
                    c.replaceWith(frag);
                } else if (c.nodeType === 1) wrap(c);
            });
        };
        wrap(h);
    });

    /* --- Periodic table --- */
    const FAM = {
        ai: ['AI Security', 'var(--f-ai)'],
        aieng: ['AI Engineering', 'var(--f-aieng)'],
        appsec: ['Product Security', 'var(--f-appsec)'],
        devsecops: ['DevSecOps', 'var(--f-devsecops)'],
        cloud: ['Cloud & Platform', 'var(--f-cloud)'],
        grc: ['Governance · CISSP', 'var(--f-grc)']
    };
    const ELEMENTS = [
        ['Ag', 'Agentic AI Security', 'ai', 'Securing autonomous agents: what they can reach, what they can do, and how they can be turned.'],
        ['Mc', 'MCP Security', 'ai', 'Building secure MCP servers and reviewing existing ones before agents connect.'],
        ['Rt', 'LLM Red Teaming', 'ai', 'Adversarial testing of LLM features: jailbreaks, injection and data exfiltration.'],
        ['Pi', 'Prompt Injection Defense', 'ai', 'Direct and indirect injection, including through tool output and retrieved content.'],
        ['Gd', 'Guardrails', 'ai', 'Input and output validation, PII redaction and policy enforcement around models.'],
        ['As', 'AI Supply Chain', 'ai', 'Provenance and trust for models, packages and the tools agents depend on.'],
        ['Cl', 'Claude Code', 'aieng', 'AI-augmented security engineering. Claude Certified Architect & Developer.'],
        ['Ao', 'Agent Orchestration', 'aieng', 'Multi-step security agents that plan, act and check their own work.'],
        ['Kg', 'Knowledge Graphs', 'aieng', 'Product architecture as a graph, so agents reason about real services and data flows.'],
        ['Cx', 'Context Engineering', 'aieng', 'Giving models exactly the context they need, and nothing they shouldn\'t see.'],
        ['Ev', 'LLM Evals', 'aieng', 'Measuring agents and guardrails so they get better with every run.'],
        ['Py', 'Python', 'aieng', 'The language of my security tooling and agents.'],
        ['Tm', 'Threat Modeling', 'appsec', 'Finding the risk in the design, before a line of code exists.'],
        ['Sd', 'Secure Design Review', 'appsec', 'Architecture reviews that make the secure path the default one.'],
        ['Cr', 'Code Review', 'appsec', 'Source code review that finds what scanners can\'t.'],
        ['Ap', 'API Security', 'appsec', 'Breaking and hardening APIs across microservices and platforms.'],
        ['Eg', 'SSRF & Egress', 'appsec', 'IMDS protection and egress policy that close SSRF by design.'],
        ['Au', 'AuthN / AuthZ', 'appsec', 'Authentication bypasses, IDOR and access control, found and designed out.'],
        ['Sg', 'Semgrep Rules', 'devsecops', 'Custom rules that turn a root cause into a permanent guardrail.'],
        ['Sn', 'Snyk', 'devsecops', 'Rolled out for SAST, SCA and secret detection across engineering.'],
        ['Se', 'Secrets Detection', 'devsecops', 'Catching leaked credentials before they reach a repository.'],
        ['Sc', 'Supply Chain Security', 'devsecops', 'Dependencies, SBOMs and open-source risk under control.'],
        ['Ci', 'CI/CD Hardening', 'devsecops', 'Securing the pipeline itself, not just what runs through it.'],
        ['Sx', 'Security as Code', 'devsecops', 'Policies and checks versioned, reviewed and shipped like code.'],
        ['Aw', 'AWS Security', 'cloud', 'IAM, IMDS and network controls for workloads on AWS.'],
        ['K8', 'Kubernetes', 'cloud', 'Cluster and workload security, going deep with CKA and CKS.'],
        ['Co', 'Containers', 'cloud', 'Image, runtime and isolation security for containerised services.'],
        ['Wf', 'Azure WAF', 'cloud', 'Rulesets configured and validated for production workloads.'],
        ['Sm', 'Secrets Management', 'cloud', 'Short-lived, scoped credentials instead of long-lived tokens.'],
        ['Ns', 'Network Security', 'cloud', 'Segmentation and egress that limit how far an attacker gets.'],
        ['Sa', 'Security Architecture', 'grc', 'CISSP: engineering security into systems from the start.'],
        ['Rm', 'Risk Management', 'grc', 'CISSP: assessing, prioritising and treating risk with the business.'],
        ['Ir', 'Incident Response & RCA', 'grc', 'Correlating evidence across platforms to find the true root cause.'],
        ['Gv', 'Security Governance', 'grc', 'Standards and policies engineers actually follow.'],
        ['Vd', 'Vulnerability Disclosure', 'grc', 'Running researcher reports end to end through HackerOne.'],
        ['Pc', 'PCI DSS', 'grc', 'Compliance evidence and pentest attestations for enterprise banks.']
    ];
    const SI = 'https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/';
    const LOGOS = {
        Cl: 'claude', Py: 'python', Sn: 'snyk', Aw: 'amazonwebservices', K8: 'kubernetes', Co: 'docker',
        Ci: 'githubactions', Vd: 'hackerone', Rt: 'owasp', Pi: 'owasp',
        Sa: 'isc2', Rm: 'isc2', Gv: 'isc2', Ir: 'isc2'
    };
    const ptable = document.getElementById('ptable');
    const pdetail = document.getElementById('pdetail');
    const pdBackdrop = document.getElementById('pdBackdrop');
    const pd = {
        sym: document.getElementById('pdSym'), num: document.getElementById('pdNum'), symTxt: document.getElementById('pdSymTxt'),
        name: document.getElementById('pdName'), fam: document.getElementById('pdFam'),
        desc: document.getElementById('pdDesc'), logo: document.getElementById('pdLogo')
    };
    const famOrder = Object.keys(FAM);
    const items = ELEMENTS.slice().sort((x, y) => famOrder.indexOf(x[2]) - famOrder.indexOf(y[2]));

    // Slots of a real periodic table (periods 1–4), filled column by column so each family forms a block
    const slots = [];
    for (let c = 1; c <= 18; c++) {
        for (let r = 1; r <= 4; r++) {
            const ok = r === 4 || c === 1 || c === 18 || (r >= 2 && (c === 2 || c >= 13));
            if (ok) slots.push([c, r]);
        }
    }
    // The empty gap in the top middle works as the table's "key"
    const key = document.createElement('div');
    key.className = 'p-key';
    key.innerHTML = '<span class="pk-num">—</span><b class="pk-name">Hover an element</b><span class="pk-fam">to inspect it · click to pin</span>';
    ptable.appendChild(key);

    const els = [];
    items.forEach(([sym, name, fam, desc], i) => {
        const [col, row] = slots[i] || [((i - 36) % 14) + 4, 6];
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'el' + (fam === 'cloud' ? ' light' : '');
        el.dataset.fam = fam;
        el.style.background = FAM[fam][1];
        el.style.gridColumn = col; el.style.gridRow = row;
        el.style.transitionDelay = (col * 35 + row * 60) + 'ms';
        el.setAttribute('aria-label', name);
        el.innerHTML = `<small>${i + 1}</small><b>${sym}</b>`;
        el._data = { sym, name, fam, desc, n: i + 1, col, row };
        els.push(el);
        ptable.appendChild(el);
    });

    let pinned = null, current = null;
    function inspect(el) {
        if (!el || el === current) return;
        current = el;
        const { sym, name, fam, desc, n } = el._data;
        els.forEach(e => e.classList.toggle('sel', e === el));
        pd.sym.style.background = FAM[fam][1];
        pd.sym.style.color = el.classList.contains('light') ? 'var(--ink)' : '#fff';
        pd.num.textContent = n; pd.symTxt.textContent = sym;
        pd.sym.classList.remove('flip'); void pd.sym.offsetWidth; pd.sym.classList.add('flip');
        [pd.name, pd.fam, pd.desc].forEach(x => { x.classList.remove('swap'); void x.offsetWidth; x.classList.add('swap'); });
        pd.name.textContent = name; pd.fam.textContent = FAM[fam][0]; pd.desc.textContent = desc;
        if (LOGOS[sym]) { pd.logo.hidden = false; pd.logo.src = SI + LOGOS[sym] + '.svg'; pd.logo.style.animation = 'none'; void pd.logo.offsetWidth; pd.logo.style.animation = ''; }
        else pd.logo.hidden = true;
        key.querySelector('.pk-num').textContent = String(n).padStart(2, '0') + ' · ' + sym;
        key.querySelector('.pk-name').textContent = name;
        key.querySelector('.pk-fam').textContent = FAM[fam][0];
        key.style.setProperty('--kc', FAM[fam][1]);
    }
    // Neighbours get nudged away from the hovered element, like a ripple across the table
    function ripple(el) {
        const { col, row } = el ? el._data : {};
        els.forEach(e => {
            if (!el || e === el) { e.style.setProperty('--px', '0px'); e.style.setProperty('--py', '0px'); e.style.setProperty('--s', 1); return; }
            const dx = e._data.col - col, dy = e._data.row - row, d = Math.hypot(dx, dy);
            if (d > 2.6) { e.style.setProperty('--px', '0px'); e.style.setProperty('--py', '0px'); e.style.setProperty('--s', 1); return; }
            const f = (2.6 - d) / 2.6;
            e.style.setProperty('--px', (dx / d * 6 * f).toFixed(1) + 'px');
            e.style.setProperty('--py', (dy / d * 6 * f).toFixed(1) + 'px');
            e.style.setProperty('--s', (1 - f * 0.08).toFixed(3));
        });
    }
    const mobileTable = matchMedia('(max-width: 960px)');
    function openSheet() { pdetail.classList.add('open'); pdBackdrop.classList.add('open'); }
    function closeSheet() { pdetail.classList.remove('open'); pdBackdrop.classList.remove('open'); }
    document.getElementById('pdClose').addEventListener('click', closeSheet);
    // On phones the sheet lives directly under <body>, so no animated/transformed parent can
    // pin it to the page instead of the screen. On desktop it goes back beside the table.
    const ptableWrap = ptable.parentElement;
    function placeSheet() {
        if (mobileTable.matches) { document.body.append(pdBackdrop, pdetail); }
        else { closeSheet(); ptableWrap.append(pdetail, pdBackdrop); }
    }
    placeSheet();
    mobileTable.addEventListener('change', placeSheet);
    // close it automatically once the skills section is scrolled away
    const skillsSec = document.getElementById('skills');
    window.addEventListener('scroll', () => {
        if (!pdetail.classList.contains('open')) return;
        const r = skillsSec.getBoundingClientRect();
        if (r.bottom < 80 || r.top > innerHeight - 80) closeSheet();
    }, { passive: true });
    pdBackdrop.addEventListener('click', closeSheet);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
    // swipe the sheet down to dismiss
    let sheetY = null;
    pdetail.addEventListener('touchstart', e => { sheetY = e.touches[0].clientY; }, { passive: true });
    pdetail.addEventListener('touchmove', e => { if (sheetY !== null && e.touches[0].clientY - sheetY > 60) { closeSheet(); sheetY = null; } }, { passive: true });

    els.forEach(el => {
        el.addEventListener('pointerenter', e => {
            if (e.pointerType !== 'mouse' || mobileTable.matches) return;
            inspect(el); ripple(el);
        });
        el.addEventListener('focus', () => { if (!mobileTable.matches) inspect(el); });
        el.addEventListener('click', () => {
            current = null; inspect(el);
            if (mobileTable.matches) { openSheet(); return; }
            pinned = el;
            el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
        });
    });
    ptable.addEventListener('pointerleave', () => { ripple(null); if (pinned) inspect(pinned); });
    inspect(els.find(e => e._data.sym === 'Mc') || els[0]);
    // Clear the stagger delay once the entrance is done so hover is snappy
    const clearDelays = () => setTimeout(() => els.forEach(e => e.style.transitionDelay = '0ms'), 1600);

    document.querySelectorAll('.chip').forEach(chip => {
        const f = chip.dataset.f;
        const count = f === 'all' ? els.length : els.filter(e => e.dataset.fam === f).length;
        chip.insertAdjacentHTML('beforeend', ` <b>${count}</b>`);
        chip.addEventListener('click', () => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            let k = 0;
            els.forEach(el => {
                const on = f === 'all' || el.dataset.fam === f;
                el.classList.toggle('dim', !on);
                if (on) { el.style.animationDelay = (k++ * 30) + 'ms'; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
            });
            if (f !== 'all') { const first = els.find(e => e.dataset.fam === f); current = null; inspect(first); }
        });
    });

    /* --- Work accordion --- */
    const accs = document.querySelectorAll('.acc');
    accs.forEach(acc => acc.addEventListener('click', () => {
        const wasOpen = acc.classList.contains('open');
        const stacked = matchMedia('(max-width: 960px)').matches;
        accs.forEach(a => a.classList.toggle('open', a === acc && !(stacked && wasOpen)));
        if (stacked && !wasOpen) setTimeout(() => acc.scrollIntoView({ behavior: 'smooth', block: 'start' }), 380);
    }));

    /* --- Cert hover preview --- */
    const previewImg = document.getElementById('certPreviewImg');
    document.querySelectorAll('#certList a').forEach(a => a.addEventListener('mouseenter', () => {
        if (!a.dataset.img) return;
        previewImg.style.opacity = 0;
        setTimeout(() => {
            previewImg.src = a.dataset.img; previewImg.style.opacity = 1;
            previewImg.parentElement.classList.toggle('cissp', a.dataset.badge === 'cissp');
        }, 150);
    }));

    /* --- Reveal on scroll --- */
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const t = entry.target;
            t.classList.add('visible');
            if (t.classList.contains('ptable-wrap')) { ptable.classList.add('in'); clearDelays(); }
            observer.unobserve(t);
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    /* --- Timeline: line fills as you scroll, events light up as the line reaches them --- */
    const timeline = document.getElementById('timeline');
    const tlFill = document.getElementById('tlFill');
    const tlItems = [...timeline.querySelectorAll('.tl-item, .tl-mile')];
    function onTimeline() {
        const r = timeline.getBoundingClientRect();
        const reach = innerHeight * 0.6 - r.top;              // how far the "reading line" has travelled
        const h = Math.max(0, Math.min(r.height, reach));
        tlFill.style.height = h + 'px';
        tlItems.forEach(it => it.classList.toggle('active', it.offsetTop + 30 <= h));
    }
    window.addEventListener('scroll', onTimeline, { passive: true }); onTimeline();

    /* --- Active nav pill --- */
    const navLinks = document.querySelectorAll('#pillNav a');
    const navObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(l => l.classList.toggle('active', l.dataset.sec === entry.target.id));
            }
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(s => navObserver.observe(s));

    /* --- Scroll progress --- */
    const progress = document.getElementById('progress');
    const onScroll = () => {
        const max = document.documentElement.scrollHeight - innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

    if (finePointer && !reduceMotion) {
        /* --- Magnetic buttons --- */
        document.querySelectorAll('.btn').forEach(b => {
            b.addEventListener('pointermove', e => {
                const r = b.getBoundingClientRect();
                b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
            });
            b.addEventListener('pointerleave', () => { b.style.transform = ''; });
        });

        /* --- 3D tilt on cards --- */
        document.querySelectorAll('.tl-card, .stat, .pdetail, .cert-preview').forEach(c => {
            c.classList.add('tilt');
            c.addEventListener('pointermove', e => {
                const r = c.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
                c.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
            });
            c.addEventListener('pointerleave', () => { c.style.transform = ''; });
        });
    }
});
