(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const toast = $('.toast');
  let toastTimer;

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  };

  const menuButton = $('.menu-toggle');
  const nav = $('.main-nav');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      document.body.classList.toggle('menu-open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.innerHTML = `<i class="fa-solid fa-${open ? 'xmark' : 'bars'}"></i>`;
    });

    $$('.main-nav a').forEach((link) => link.addEventListener('click', () => {
      nav.classList.remove('open');
      document.body.classList.remove('menu-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.innerHTML = '<i class="fa-solid fa-bars"></i>';
    }));
  }

  const header = $('.site-header');
  if (header) {
    const setHeader = () => header.classList.toggle('scrolled', window.scrollY > 60);
    setHeader();
    window.addEventListener('scroll', setHeader, { passive: true });
  }

  const fadeItems = $$('.fade-in');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    fadeItems.forEach((item) => observer.observe(item));
  } else {
    fadeItems.forEach((item) => item.classList.add('visible'));
  }

  $$('[data-current-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  $$('.favorite').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const active = button.classList.toggle('active');
      button.innerHTML = `<i class="fa-${active ? 'solid' : 'regular'} fa-heart"></i>`;
      button.setAttribute('aria-label', active ? 'Quitar de guardadas' : 'Guardar propiedad');
      showToast(active ? 'Propiedad guardada en favoritos' : 'Propiedad eliminada de favoritos');
    });
  });

  const typeSelect = $('#type');
  $$('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      $$('.chip').forEach((item) => item.classList.remove('active'));
      chip.classList.add('active');
      if (typeSelect) typeSelect.value = chip.dataset.type;
    });
  });

  const formatPrice = (currency, price) => {
    const value = Number(price);
    return `${currency || 'USD'} ${Number.isFinite(value) ? value.toLocaleString('es-AR') : price}`;
  };

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const renderSavedProperties = () => {
    const grid = $('#property-grid');
    if (!grid) return;
    let properties = [];
    try {
      properties = JSON.parse(localStorage.getItem('lumen-properties') || '[]');
    } catch (error) {
      properties = [];
    }

    properties.filter((property) => property.status === 'published').forEach((property) => {
      const card = document.createElement('article');
      card.className = 'property-card fade-in visible';
      card.dataset.type = property.type || '';
      card.dataset.location = property.location || '';
      const image = property.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=86';
      card.innerHTML = `
        <div class="property-image">
          <a href="propiedad.html" aria-label="Ver ${escapeHtml(property.title)}"><img src="${escapeHtml(image)}" alt="${escapeHtml(property.title)}" loading="lazy"><span class="property-status property-status--new">Recién publicada</span></a>
          <button class="favorite" type="button" aria-label="Guardar propiedad"><i class="fa-regular fa-heart"></i></button>
        </div>
        <div class="property-info">
          <div><p>${escapeHtml(property.location || 'Buenos Aires')}</p><h3><a href="propiedad.html">${escapeHtml(property.title)}</a></h3></div>
          <strong>${escapeHtml(formatPrice(property.currency, property.price))}</strong>
        </div>
        <div class="property-meta">
          <span><i class="fa-solid fa-bed"></i> ${escapeHtml(property.bedrooms || '—')} dorm.</span>
          <span><i class="fa-solid fa-bath"></i> ${escapeHtml(property.bathrooms || '—')} baños</span>
          <span><i class="fa-solid fa-ruler-combined"></i> ${escapeHtml(property.area || '—')} m²</span>
        </div>`;
      grid.prepend(card);
      const favorite = $('.favorite', card);
      favorite.addEventListener('click', (event) => {
        event.preventDefault();
        favorite.classList.toggle('active');
        showToast('Propiedad guardada en favoritos');
      });
    });
  };
  renderSavedProperties();

  const searchForm = $('#property-search');
  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const selectedType = $('#type')?.value || '';
      const selectedLocation = $('#location')?.value || '';
      const cards = $$('.property-card', $('#property-grid'));
      let visibleCount = 0;
      cards.forEach((card) => {
        const matchesType = !selectedType || card.dataset.type === selectedType;
        const matchesLocation = selectedLocation === 'Todas las zonas' || !selectedLocation || card.dataset.location?.includes(selectedLocation);
        const visible = matchesType && matchesLocation;
        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      let empty = $('.empty-state', $('#property-grid'));
      if (!visibleCount) {
        if (!empty) {
          empty = document.createElement('div');
          empty.className = 'empty-state';
          empty.innerHTML = '<strong>No encontramos una coincidencia exacta.</strong><br>Probá ampliando la zona o el tipo de propiedad.';
          $('#property-grid').appendChild(empty);
        }
      } else if (empty) {
        empty.remove();
      }

      $('#propiedades')?.scrollIntoView({ behavior: 'smooth' });
      showToast(visibleCount ? `${visibleCount} ${visibleCount === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}` : 'Probá con otros filtros');
    });
  }

  $$('.gallery-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const mainImage = $('#main-property-image');
      if (!mainImage) return;
      const previousSrc = mainImage.src;
      const previousAlt = mainImage.alt;
      mainImage.src = thumb.dataset.galleryImage;
      mainImage.alt = thumb.dataset.alt;
      const thumbImage = $('img', thumb);
      thumb.dataset.galleryImage = previousSrc;
      thumb.dataset.alt = previousAlt;
      thumbImage.src = previousSrc;
      thumbImage.alt = previousAlt;
    });
  });

  const galleryMain = $('.gallery-main');
  if (galleryMain) {
    galleryMain.addEventListener('click', () => {
      const image = $('#main-property-image');
      if (!image) return;
      if (document.fullscreenElement) document.exitFullscreen();
      else image.requestFullscreen?.();
    });
  }

  const inquiryForm = $('#inquiry-form');
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!inquiryForm.checkValidity()) {
        inquiryForm.reportValidity();
        return;
      }
      showToast('¡Consulta enviada! Lucía te contactará a la brevedad.');
      inquiryForm.reset();
    });
  }
})();
