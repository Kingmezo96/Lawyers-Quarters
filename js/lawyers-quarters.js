(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const storage = {
    get(key, fallback = []) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage may be unavailable */ }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch { /* storage may be unavailable */ }
    }
  };

  const analytics = (name, detail = {}) => {
    const events = storage.get('lq-analytics', []);
    events.push({ name, detail, time: new Date().toISOString() });
    storage.set('lq-analytics', events.slice(-100));
  };

  let toastTimer;
  const toast = (message) => {
    const node = $('#toast');
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('show'), 2600);
  };

  const dateNode = $('#today');
  if (dateNode) {
    dateNode.textContent = new Intl.DateTimeFormat('en-NG', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date());
  }

  const menuButton = $('.menu-toggle');
  const menu = $('#primary-menu');
  menuButton?.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    analytics('menu_toggle', { open });
  });
  $$('#primary-menu a').forEach(link => link.addEventListener('click', () => {
    menu?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }));

  const searchOverlay = $('#search-overlay');
  const searchInput = $('#site-search');
  const searchResults = $('#search-results');
  const searchStatus = $('#search-status');
  const stories = $$('[data-story]');

  const openSearch = () => {
    searchOverlay.hidden = false;
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => searchInput.focus());
    analytics('search_open');
  };
  const closeSearch = () => {
    searchOverlay.hidden = true;
    document.body.classList.remove('modal-open');
    $('.js-search-open')?.focus();
  };
  $$('.js-search-open').forEach(button => button.addEventListener('click', openSearch));
  $$('.js-search-close').forEach(button => button.addEventListener('click', closeSearch));
  searchOverlay?.addEventListener('click', event => { if (event.target === searchOverlay) closeSearch(); });

  const searchableStories = stories.map(story => ({
    title: story.dataset.title || $('h1, h2, h3, a', story)?.textContent.trim() || 'Story',
    category: story.dataset.category || 'news',
    target: $('a', story)?.getAttribute('href') || '#latest'
  })).filter((item, index, all) => all.findIndex(other => other.title === item.title) === index);

  searchInput?.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    searchResults.replaceChildren();
    if (query.length < 2) {
      searchStatus.textContent = 'Type at least two letters to search.';
      return;
    }
    const matches = searchableStories.filter(item => `${item.title} ${item.category}`.toLowerCase().includes(query)).slice(0, 7);
    searchStatus.textContent = matches.length ? `${matches.length} result${matches.length === 1 ? '' : 's'} found` : 'No matching stories. Try another topic.';
    matches.forEach(item => {
      const link = document.createElement('a');
      link.href = item.target;
      link.innerHTML = `<span>${item.category.split(' ')[0]}</span>${item.title}<b aria-hidden="true">→</b>`;
      link.addEventListener('click', () => { analytics('search_result_click', { query, title: item.title }); closeSearch(); });
      searchResults.append(link);
    });
  });

  const authDialog = $('#auth-dialog');
  const authInput = $('#auth-email');
  const openAuth = () => {
    if (typeof authDialog.showModal === 'function') authDialog.showModal();
    else authDialog.setAttribute('open', '');
    requestAnimationFrame(() => authInput.focus());
    analytics('auth_open');
  };
  const closeAuth = () => {
    if (typeof authDialog.close === 'function') authDialog.close();
    else authDialog.removeAttribute('open');
  };
  $$('.js-auth-open').forEach(button => button.addEventListener('click', openAuth));
  $$('.js-auth-close').forEach(button => button.addEventListener('click', closeAuth));

  const syncAccount = () => {
    const account = storage.get('lq-account', null);
    const signoutButton = $('#signout-button');
    if (!account?.email) {
      $$('.js-account-label').forEach(node => { node.textContent = 'My account'; });
      $('.account-button')?.setAttribute('aria-label', 'Open account sign in');
      if (signoutButton) signoutButton.hidden = true;
      return;
    }
    const name = account.email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    $$('.js-account-label').forEach(node => { node.textContent = name; });
    $('.account-button')?.setAttribute('aria-label', `Account for ${name}`);
    if (signoutButton) signoutButton.hidden = false;
  };
  $('#auth-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const email = authInput.value.trim();
    if (!email) return;
    storage.set('lq-account', { email });
    syncAccount();
    closeAuth();
    toast('Welcome — your personalised briefing is ready.');
    analytics('login', { method: 'email' });
  });
  $('#signout-button')?.addEventListener('click', () => {
    storage.remove('lq-account');
    syncAccount();
    closeAuth();
    toast('You have been signed out on this device.');
    analytics('logout');
  });
  syncAccount();

  const savedStories = new Set(storage.get('lq-bookmarks', []));
  const syncBookmarks = () => {
    $$('.js-bookmark').forEach(button => {
      const isSaved = savedStories.has(button.dataset.id);
      button.setAttribute('aria-pressed', String(isSaved));
      if (button.classList.contains('action-link')) button.textContent = isSaved ? 'Saved' : 'Save';
    });
  };
  $$('.js-bookmark').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.id;
    const saving = !savedStories.has(id);
    if (saving) savedStories.add(id); else savedStories.delete(id);
    storage.set('lq-bookmarks', [...savedStories]);
    syncBookmarks();
    toast(saving ? 'Story saved to your reading list.' : 'Story removed from your reading list.');
    analytics('bookmark', { id, saved: saving });
  }));
  syncBookmarks();

  const reactions = new Set(storage.get('lq-reactions', []));
  const syncReactions = () => {
    $$('.js-react').forEach(button => {
      const active = reactions.has(button.dataset.id);
      button.setAttribute('aria-pressed', String(active));
      $('span', button).textContent = active ? '♥' : '♡';
      const base = Number(button.dataset.base || $('b', button).textContent);
      button.dataset.base = String(base);
      $('b', button).textContent = String(base + (active ? 1 : 0));
    });
  };
  $$('.js-react').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.id;
    if (reactions.has(id)) reactions.delete(id); else reactions.add(id);
    storage.set('lq-reactions', [...reactions]);
    syncReactions();
    analytics('reaction', { id, active: reactions.has(id) });
  }));
  syncReactions();

  $$('.js-share').forEach(button => button.addEventListener('click', async () => {
    const title = button.dataset.title;
    const shareData = { title, text: title, url: location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else if (navigator.clipboard) { await navigator.clipboard.writeText(location.href); toast('Link copied to your clipboard.'); }
      else toast('Copy the page address to share this story.');
      analytics('share', { title });
    } catch (error) {
      if (error.name !== 'AbortError') toast('Sharing is not available in this browser.');
    }
  }));

  const briefings = {
    Politics: ['The five decisions shaping Abuja this week', 'A concise guide to the votes, appointments and policy signals worth watching.'],
    Business: ['The market signals behind today’s headlines', 'Rates, prices and company news explained for readers who need the practical takeaway.'],
    Technology: ['The products and policies moving African tech', 'A quick read on startups, infrastructure, AI and the people building what comes next.'],
    World: ['The global stories with consequences at home', 'Diplomacy, markets and major events abroad—filtered for their relevance to Nigeria.']
  };
  $$('.topic-pills button').forEach(button => button.addEventListener('click', () => {
    $$('.topic-pills button').forEach(item => item.classList.toggle('active', item === button));
    const topic = button.dataset.topic;
    $('#briefing-topic').textContent = topic;
    $('#briefing-title').textContent = briefings[topic][0];
    $('#briefing-summary').textContent = briefings[topic][1];
    storage.set('lq-topic', topic);
    analytics('briefing_topic', { topic });
  }));
  const savedTopic = storage.get('lq-topic', 'Politics');
  $(`.topic-pills button[data-topic="${savedTopic}"]`)?.click();

  $('#newsletter-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const email = $('#newsletter-email').value.trim();
    storage.set('lq-newsletter', { email, subscribedAt: new Date().toISOString() });
    event.currentTarget.reset();
    toast('You’re on the list. Your first briefing arrives tomorrow.');
    analytics('newsletter_signup');
  });

  const backToTop = $('#back-to-top');
  backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  const depths = new Set(storage.get('lq-scroll-depths', []));
  window.addEventListener('scroll', () => {
    backToTop?.classList.toggle('show', window.scrollY > 700);
    const available = document.documentElement.scrollHeight - innerHeight;
    if (available <= 0) return;
    const percent = Math.round((scrollY / available) * 100);
    [25, 50, 75, 100].forEach(mark => {
      if (percent >= mark && !depths.has(mark)) {
        depths.add(mark);
        storage.set('lq-scroll-depths', [...depths]);
        analytics('scroll_depth', { percent: mark });
      }
    });
  }, { passive: true });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !searchOverlay.hidden) closeSearch();
    if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      event.preventDefault();
      openSearch();
    }
  });

  analytics('page_view', { path: location.pathname });
})();
