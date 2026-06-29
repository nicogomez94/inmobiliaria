(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const form = $('#property-form');
  const toast = $('.toast');
  let selectedImage = '';
  let toastTimer;

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  };

  const sidebar = $('#admin-sidebar');
  $('.admin-menu-toggle')?.addEventListener('click', () => sidebar.classList.toggle('open'));
  $$('.admin-nav a, .back-to-site').forEach((link) => link.addEventListener('click', () => sidebar.classList.remove('open')));
  $('[data-scroll-form]')?.addEventListener('click', () => $('#nueva').scrollIntoView({ behavior: 'smooth' }));

  const formatNumber = (value) => {
    if (!value) return '—';
    return Number(value).toLocaleString('es-AR');
  };

  const syncPreview = () => {
    $('#preview-title').textContent = $('#property-title').value || 'Título de la propiedad';
    $('#preview-location').textContent = $('#property-location').value || 'Ubicación';
    $('#preview-price').textContent = `USD ${formatNumber($('#property-price').value)}`;
    $('#preview-bedrooms').textContent = $('#property-bedrooms').value || '—';
    $('#preview-bathrooms').textContent = $('#property-bathrooms').value || '—';
    $('#preview-area').textContent = $('#property-area').value || '—';
  };

  ['#property-title', '#property-location', '#property-price', '#property-bedrooms', '#property-bathrooms', '#property-area']
    .forEach((selector) => $(selector)?.addEventListener('input', syncPreview));

  const fileInput = $('#property-images');
  const uploadZone = $('#upload-zone');
  const uploadPreview = $('#upload-preview');

  const processFiles = (files) => {
    const imageFiles = [...files].filter((file) => file.type.startsWith('image/')).slice(0, 6);
    if (!imageFiles.length) return;
    uploadPreview.innerHTML = '';
    imageFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const image = document.createElement('img');
        image.src = reader.result;
        image.alt = `Vista previa ${index + 1}`;
        uploadPreview.appendChild(image);
        if (index === 0) {
          selectedImage = reader.result;
          const preview = $('#preview-image');
          preview.style.backgroundImage = `url("${reader.result}")`;
          preview.classList.add('has-image');
        }
      });
      reader.readAsDataURL(file);
    });
  };

  fileInput?.addEventListener('change', () => processFiles(fileInput.files));
  ['dragenter', 'dragover'].forEach((eventName) => uploadZone?.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadZone.classList.add('dragging');
  }));
  ['dragleave', 'drop'].forEach((eventName) => uploadZone?.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadZone.classList.remove('dragging');
  }));
  uploadZone?.addEventListener('drop', (event) => processFiles(event.dataTransfer.files));

  const readProperties = () => {
    try { return JSON.parse(localStorage.getItem('inmobiliaria-properties') || '[]'); }
    catch (error) { return []; }
  };

  const saveProperty = (status) => {
    if (status === 'published' && !form.checkValidity()) {
      form.reportValidity();
      showToast('Completá los campos obligatorios antes de publicar.');
      return false;
    }

    const data = new FormData(form);
    const property = {
      id: Date.now(),
      title: data.get('title') || 'Propiedad sin título',
      type: data.get('type') || 'Casa',
      operation: data.get('operation') || 'Venta',
      currency: data.get('currency') || 'USD',
      price: data.get('price') || '—',
      location: data.get('location') || 'Buenos Aires',
      bedrooms: data.get('bedrooms') || '—',
      bathrooms: data.get('bathrooms') || '—',
      area: data.get('area') || '—',
      status,
      image: selectedImage,
      createdAt: new Date().toISOString()
    };

    const properties = readProperties();
    properties.unshift(property);
    try {
      localStorage.setItem('inmobiliaria-properties', JSON.stringify(properties.slice(0, 10)));
    } catch (error) {
      property.image = '';
      localStorage.setItem('inmobiliaria-properties', JSON.stringify([property, ...properties].slice(0, 10)));
      showToast('La propiedad se guardó sin la foto por su tamaño.');
    }
    return property;
  };

  const addTableRow = (property) => {
    const row = document.createElement('tr');
    const fallback = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=180&q=80';
    row.innerHTML = `
      <td><div class="table-property"><img src="${property.image || fallback}" alt="${property.title}"><span><strong>${property.title}</strong><small>${property.location}</small></span></div></td>
      <td>${property.operation}</td><td>${property.currency} ${formatNumber(property.price)}</td>
      <td><span class="status-pill status-pill--live">Publicada</span></td><td>0</td>
      <td><button aria-label="Más opciones"><i class="fa-solid fa-ellipsis"></i></button></td>`;
    $('#properties-table').prepend(row);
  };

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const property = saveProperty('published');
    if (!property) return;
    addTableRow(property);
    $('#published-count').textContent = String(Number($('#published-count').textContent) + 1);
    $('#publish-status').textContent = 'Publicada';
    $('#success-modal').hidden = false;
  });

  $('#save-draft')?.addEventListener('click', () => {
    const property = saveProperty('draft');
    if (!property) return;
    $('#publish-status').textContent = 'Borrador guardado';
    showToast('Borrador guardado en este navegador.');
  });

  $('[data-close-modal]')?.addEventListener('click', () => {
    $('#success-modal').hidden = true;
    form.reset();
    uploadPreview.innerHTML = '';
    selectedImage = '';
    $('#preview-image').style.backgroundImage = '';
    $('#preview-image').classList.remove('has-image');
    $('#publish-status').textContent = 'Borrador';
    syncPreview();
    $('#nueva').scrollIntoView({ behavior: 'smooth' });
  });

  $('#success-modal')?.addEventListener('click', (event) => {
    if (event.target === $('#success-modal')) $('#success-modal').hidden = true;
  });
})();
