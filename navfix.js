(() => {
  function vegasDateLabel() {
    try {
      const ds = typeof vegasToday === 'function'
        ? vegasToday()
        : new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Los_Angeles',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(new Date());
      const d = new Date(ds + 'T12:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  }

  function refreshHeaderDate() {
    const el = document.getElementById('headerDate');
    if (el) el.textContent = vegasDateLabel();
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('.primary-nav button[data-view]');
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    try {
      view = button.dataset.view;
      render();
      refreshHeaderDate();
    } catch (err) {
      console.error('Family Hub navigation:', err);
    }
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refreshHeaderDate, { once: true });
  } else {
    refreshHeaderDate();
  }

  setInterval(refreshHeaderDate, 60000);
})();
