const state = {
  data: null,
  loading: true,
  currentRoute: 'dashboard',
  notificationsOpen: false,
  theme: localStorage.getItem('iy-theme') || 'dark',
  notificationTimer: null,
  fabOpen: false
};

const navigation = [
  { id: 'dashboard', label: 'Dashboard IA', icon: 'neurology', description: 'Resumen inteligente' },
  { id: 'classrooms', label: 'Aulas', icon: 'groups', description: 'Gestión integral' },
  { id: 'reports', label: 'Reportes IA', icon: 'description', description: 'Análisis profundos' },
  { id: 'settings', label: 'Configuración', icon: 'tune', description: 'Preferencias' }
];

const fabActions = [
  { id: 'classroom', icon: 'school', label: 'Crear aula' },
  { id: 'student', icon: 'person_add', label: 'Registrar alumno' },
  { id: 'report', icon: 'auto_graph', label: 'Reporte IA' }
];

const routeViews = {
  dashboard: renderDashboard,
  classrooms: renderClassrooms,
  reports: renderReports,
  settings: renderSettings
};

init();

async function init() {
  applyTheme(state.theme);
  hydrateRouteFromHash();
  renderApp();
  await loadData();
  renderApp();
  simulateNotifications();
}

function hydrateRouteFromHash() {
  const hashRoute = window.location.hash.replace('#', '');
  if (hashRoute && routeViews[hashRoute]) {
    state.currentRoute = hashRoute;
  } else {
    state.currentRoute = 'dashboard';
  }

  window.addEventListener('hashchange', () => {
    const target = window.location.hash.replace('#', '');
    navigate(target || 'dashboard');
  });
}

async function loadData() {
  try {
    const response = await fetch('./data/demo.json');
    if (!response.ok) {
      throw new Error('No se pudo cargar la data de demostración');
    }
    const data = await response.json();
    state.data = data;
    state.loading = false;
  } catch (error) {
    console.error(error);
    pushToast({
      icon: 'error',
      title: 'Error de carga',
      description: 'No se pudo cargar la demo. Reintente en unos segundos.'
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
  localStorage.setItem('iy-theme', theme);
}

function toggleTheme() {
  const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  renderApp();
}

function navigate(route) {
  if (!routeViews[route]) {
    route = 'dashboard';
  }
  state.currentRoute = route;
  if (window.location.hash.replace('#', '') !== route) {
    window.location.hash = `#${route}`;
  }
  renderApp();
}

function renderApp() {
  const container = document.getElementById('app');
  if (!container) return;

  state.fabOpen = false;

  const layout = `
    <div class="layout">
      ${renderSidebar()}
      <main>
        ${renderTopBar()}
        <div class="content" id="content" role="main" tabindex="-1">
          ${renderContent()}
        </div>
      </main>
      ${renderNotificationPanel()}
    </div>
    ${renderFab()}
  `;

  container.innerHTML = layout;
  attachEventListeners();
}

function renderSidebar() {
  return `
    <aside class="sidebar" aria-label="Menu lateral">
      <div class="brand">
        <div class="brand-badge">
          <span class="material-symbols-outlined">neurology</span>
        </div>
        <div>
          <h1 data-i18n="brand.name">IYChay</h1>
          <p data-i18n="brand.tagline">IA para colegios con visión</p>
        </div>
      </div>
      <nav class="nav-section">
        <h2 data-i18n="sidebar.title">Panel principal</h2>
        <ul class="nav-list">
          ${navigation
            .map(
              (item) => `
                <li class="nav-item">
                  <a href="#${item.id}" class="${state.currentRoute === item.id ? 'active' : ''}" data-route="${item.id}">
                    <span class="material-symbols-outlined">${item.icon}</span>
                    <div>
                      <strong>${item.label}</strong>
                      <p>${item.description}</p>
                    </div>
                  </a>
                </li>
              `
            )
            .join('')}
        </ul>
      </nav>
      <div class="sidebar-footer">
        <div class="insight-card" data-i18n="sidebar.insight">
          <span class="material-symbols-outlined">lightbulb</span>
          <strong>Insights IA diarios</strong>
          <p>Reciba cada mañana prioridades accionables para su equipo.</p>
        </div>
        <p data-i18n="sidebar.help">¿Necesita ayuda? Contacte a su asesor de éxito educativo.</p>
      </div>
    </aside>
  `;
}

function renderTopBar() {
  const notificationCount = state.data
    ? Object.values(state.data.notifications).reduce((acc, arr) => acc + arr.length, 0)
    : 0;
  return `
    <header class="top-bar">
      <div class="search-wrapper" role="search">
        <span class="material-symbols-outlined" aria-hidden="true">search</span>
        <input type="search" placeholder="Buscar alumno, aula o reporte" data-i18n="search.placeholder" />
      </div>
      <div class="top-actions">
        <button class="icon-button" id="notification-trigger" aria-haspopup="true" aria-expanded="${state.notificationsOpen}" aria-controls="notification-panel">
          <span class="material-symbols-outlined">notifications</span>
          ${notificationCount ? `<span class="notification-badge" aria-hidden="true">${notificationCount}</span>` : ''}
        </button>
        <button class="icon-button" id="theme-toggle" aria-label="Cambiar tema">
          <span class="material-symbols-outlined">${state.theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>
        <button class="button button-primary" id="demo-button">
          <span class="material-symbols-outlined">rocket_launch</span>
          <span data-i18n="cta.demo">Solicitar demo completa</span>
        </button>
      </div>
    </header>
  `;
}

function renderContent() {
  const view = routeViews[state.currentRoute];
  if (!view) return '';
  return view();
}

function renderDashboard() {
  if (state.loading || !state.data) {
    return `
      <section class="content-header">
        <div>
          <h1 class="skeleton skeleton-text" style="width: 220px; height: 28px;"></h1>
          <p class="skeleton skeleton-text" style="width: 320px; height: 18px;"></p>
        </div>
      </section>
      <section class="dashboard-grid">
        ${Array.from({ length: 4 })
          .map(() => '<article class="card skeleton skeleton-card"></article>')
          .join('')}
      </section>
      <section>
        ${Array.from({ length: 3 })
          .map(() => '<div class="skeleton skeleton-row"></div>')
          .join('')}
      </section>
    `;
  }

  const {
    dashboard: { metrics, insights, grades, classrooms }
  } = state.data;

  return `
    <section class="content-header">
      <div>
        <h1 data-i18n="dashboard.heading">Dashboard IA</h1>
        <p data-i18n="dashboard.subheading">Su copiloto predictivo para decisiones directivas.</p>
      </div>
      <div class="insight-badges">
        <span class="badge badge-warning" data-i18n="dashboard.badges.alerts">3 alertas priorizadas</span>
        <span class="badge badge-positive" data-i18n="dashboard.badges.opportunities">6 oportunidades activas</span>
      </div>
    </section>
    <section class="dashboard-grid" aria-label="Indicadores clave">
      ${metrics
        .map(
          (metric) => `
            <article class="card" data-i18n="dashboard.metric.${metric.id}">
              <div class="card-header">
                <div>
                  <h3>${metric.title}</h3>
                  <p class="metric-meta">
                    <span class="material-symbols-outlined">trending_${metric.trend === 'negative' ? 'down' : 'up'}</span>
                    <span class="metric-chip ${metric.trend === 'negative' ? 'negative' : ''}">${metric.change}</span>
                  </p>
                </div>
                <span class="material-symbols-outlined">analytics</span>
              </div>
              <p class="metric-value">${metric.value}</p>
              ${renderSparkline(metric.series)}
            </article>
          `
        )
        .join('')}
      <article class="card span-2" aria-live="polite" data-i18n="dashboard.ai-insights">
        <div class="card-header">
          <div>
            <h3>Panel de insights IA</h3>
            <p class="metric-meta">Actualizado hace 2 minutos</p>
          </div>
          <span class="material-symbols-outlined">robot</span>
        </div>
        <ul class="insight-list">
          ${insights
            .map(
              (insight) => `
                <li class="insight-item ${insight.type}">
                  <span class="material-symbols-outlined">
                    ${insight.type === 'alert' ? 'warning' : insight.type === 'success' ? 'verified' : 'info'}
                  </span>
                  <span>${insight.message}</span>
                </li>
              `
            )
            .join('')}
        </ul>
      </article>
    </section>
    <section class="dashboard-grid" aria-label="Comparativos institucionales">
      <article class="card span-2">
        <div class="card-header">
          <div>
            <h3 data-i18n="dashboard.chart.title">Promedio general por grado</h3>
            <p class="metric-meta" data-i18n="dashboard.chart.subtitle">Comparativo con benchmarks IYChay</p>
          </div>
          <span class="material-symbols-outlined">bar_chart_4_bars</span>
        </div>
        ${renderPerformanceChart(grades)}
      </article>
      <article class="card">
        <div class="card-header">
          <div>
            <h3 data-i18n="dashboard.alerts.title">Alertas rápidas</h3>
            <p class="metric-meta" data-i18n="dashboard.alerts.subtitle">Simulación de monitoreo continuo</p>
          </div>
          <span class="material-symbols-outlined">notifications_active</span>
        </div>
        <ul class="insight-list">
          ${state.data.notifications.ia
            .map(
              (notification) => `
                <li class="insight-item">
                  <span class="material-symbols-outlined">auto_awesome</span>
                  <div>
                    <strong>${notification.title}</strong>
                    <p>${notification.description}</p>
                  </div>
                </li>
              `
            )
            .join('')}
        </ul>
      </article>
    </section>
    <section class="card" aria-label="Estado por aula">
      <h3 data-i18n="dashboard.classrooms.title">Estado de pagos y asistencia por aula</h3>
      <div class="classroom-grid">
        ${classrooms
          .map(
            (room) => `
              <article class="classroom-card">
                <div class="classroom-meta">
                  <strong>${room.name}</strong>
                  <span>${room.students} alumnos · ${room.tutors} tutores</span>
                </div>
                <div class="progress-stack">
                  <div>
                    <div class="progress-label">
                      <span data-i18n="dashboard.classrooms.payment">Pagos al día</span>
                      <strong>${Math.round(room.paymentStatus * 100)}%</strong>
                    </div>
                    <div class="progress">
                      <div class="progress-bar progress-payment" style="width: ${room.paymentStatus * 100}%"></div>
                    </div>
                  </div>
                  <div>
                    <div class="progress-label">
                      <span data-i18n="dashboard.classrooms.attendance">Asistencia</span>
                      <strong>${Math.round(room.attendance * 100)}%</strong>
                    </div>
                    <div class="progress">
                      <div class="progress-bar progress-attendance" style="width: ${room.attendance * 100}%"></div>
                    </div>
                  </div>
                </div>
              </article>
            `
          )
          .join('')}
      </div>
    </section>
  `;
}

function renderClassrooms() {
  if (state.loading || !state.data) {
    return `
      <section class="content-header">
        <div>
          <h1 class="skeleton skeleton-text" style="width: 200px; height: 28px;"></h1>
          <p class="skeleton skeleton-text" style="width: 260px; height: 18px;"></p>
        </div>
      </section>
      <section>
        ${Array.from({ length: 5 })
          .map(() => '<div class="skeleton skeleton-row"></div>')
          .join('')}
      </section>
    `;
  }

  const rows = state.data.dashboard.classrooms
    .map(
      (room) => `
        <tr>
          <td>${room.name}</td>
          <td>${room.students}</td>
          <td>${room.tutors}</td>
          <td>${Math.round(room.paymentStatus * 100)}%</td>
          <td>${Math.round(room.attendance * 100)}%</td>
          <td>
            <div class="table-actions">
              <button type="button" aria-label="Ver detalles">
                <span class="material-symbols-outlined">search</span>
              </button>
              <button type="button" aria-label="Editar aula">
                <span class="material-symbols-outlined">edit</span>
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');

  return `
    <section class="content-header">
      <div>
        <h1 data-i18n="classrooms.heading">Gestión de aulas</h1>
        <p data-i18n="classrooms.subheading">Visualice el estado consolidado de cada cohorte.</p>
      </div>
    </section>
    <section>
      <table class="table" aria-label="Listado de aulas">
        <thead>
          <tr>
            <th data-i18n="classrooms.table.name">Aula</th>
            <th data-i18n="classrooms.table.students">Alumnos</th>
            <th data-i18n="classrooms.table.tutors">Tutores</th>
            <th data-i18n="classrooms.table.payment">Pagos</th>
            <th data-i18n="classrooms.table.attendance">Asistencia</th>
            <th data-i18n="classrooms.table.actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  `;
}

function renderReports() {
  if (state.loading || !state.data) {
    return `
      <section class="content-header">
        <div>
          <h1 class="skeleton skeleton-text" style="width: 220px; height: 28px;"></h1>
          <p class="skeleton skeleton-text" style="width: 280px; height: 18px;"></p>
        </div>
      </section>
      <section>
        ${Array.from({ length: 3 })
          .map(() => '<div class="skeleton skeleton-row"></div>')
          .join('')}
      </section>
    `;
  }

  const rows = state.data.reports
    .map(
      (report) => `
        <tr>
          <td>
            <div>
              <strong>${report.title}</strong>
              <p class="metric-meta">${report.trend}</p>
            </div>
          </td>
          <td>${report.owner}</td>
          <td>${report.updatedAt}</td>
          <td>
            <div class="table-actions">
              <button type="button" aria-label="Ver reporte">
                <span class="material-symbols-outlined">search</span>
              </button>
              <button type="button" aria-label="Descargar reporte">
                <span class="material-symbols-outlined">description</span>
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');

  return `
    <section class="content-header">
      <div>
        <h1 data-i18n="reports.heading">Reportes IA</h1>
        <p data-i18n="reports.subheading">Descargas rápidas y recomendaciones predictivas.</p>
      </div>
    </section>
    <section>
      <table class="table" aria-label="Reportes generados por IA">
        <thead>
          <tr>
            <th data-i18n="reports.table.report">Reporte</th>
            <th data-i18n="reports.table.owner">Responsable</th>
            <th data-i18n="reports.table.updated">Actualización</th>
            <th data-i18n="reports.table.actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  `;
}

function renderSettings() {
  return `
    <section class="content-header">
      <div>
        <h1 data-i18n="settings.heading">Configuración</h1>
        <p data-i18n="settings.subheading">Personalice la experiencia de su colegio.</p>
      </div>
    </section>
    <section class="card">
      <h3 data-i18n="settings.beta">Pronto podrá conectar su SIS o ERP directamente a IYChay.</h3>
      <p data-i18n="settings.description">Este módulo incluye integración con backend Spring Boot en el roadmap del sprint 3.</p>
    </section>
  `;
}

function renderNotificationPanel() {
  if (state.loading || !state.data) {
    return `
      <aside class="notification-panel" id="notification-panel" aria-label="Notificaciones">
        <div class="notification-header">
          <h2 class="skeleton skeleton-text" style="width: 160px; height: 24px;"></h2>
        </div>
        <div class="notification-list">
          ${Array.from({ length: 4 })
            .map(() => '<div class="skeleton skeleton-card"></div>')
            .join('')}
        </div>
      </aside>
    `;
  }

  const categories = [
    { id: 'ia', label: 'IA Predictiva', icon: 'auto_awesome' },
    { id: 'tasks', label: 'Tareas', icon: 'checklist' },
    { id: 'messages', label: 'Mensajes', icon: 'chat' }
  ];

  return `
    <aside class="notification-panel ${state.notificationsOpen ? 'open' : ''}" id="notification-panel" aria-label="Notificaciones">
      <div class="notification-header">
        <div>
          <h2 data-i18n="notifications.title">Bandeja unificada</h2>
          <p class="metric-meta" data-i18n="notifications.subtitle">Actualizaciones IA, tareas y mensajes en un mismo lugar</p>
        </div>
        <button class="icon-button" id="notification-close" aria-label="Cerrar panel">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="notification-list">
        ${categories
          .map((category) => renderNotificationCategory(category))
          .join('')}
      </div>
    </aside>
  `;
}

function renderNotificationCategory(category) {
  const items = state.data.notifications[category.id];
  return `
    <section>
      <div class="card-header" style="margin-bottom: 0.75rem;">
        <div>
          <h3>${category.label}</h3>
        </div>
        <span class="material-symbols-outlined">${category.icon}</span>
      </div>
      ${items
        .map(
          (item) => `
            <article class="notification-card" data-category="${category.id}">
              <div>
                <strong>${item.title}</strong>
                <p>${item.description}</p>
              </div>
              <div class="notification-meta">
                <span>${item.time}</span>
                <span class="material-symbols-outlined">chevron_right</span>
              </div>
            </article>
          `
        )
        .join('')}
    </section>
  `;
}

function renderFab() {
  return `
    <div>
      <button class="fab" id="fab" aria-label="Acciones rápidas">
        <span class="material-symbols-outlined">add</span>
      </button>
      <div class="fab-menu" id="fab-menu" aria-hidden="${!state.fabOpen}">
        ${fabActions
          .map(
            (action) => `
              <button type="button" data-action="${action.id}">
                <span class="material-symbols-outlined">${action.icon}</span>
                <span>${action.label}</span>
              </button>
            `
          )
          .join('')}
      </div>
    </div>
  `;
}

function attachEventListeners() {
  const navLinks = document.querySelectorAll('.nav-item a');
  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const targetRoute = link.dataset.route;
      navigate(targetRoute);
    });
  });

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  const notificationTrigger = document.getElementById('notification-trigger');
  if (notificationTrigger) {
    notificationTrigger.addEventListener('click', () => {
      state.notificationsOpen = !state.notificationsOpen;
      renderApp();
    });
  }

  const notificationClose = document.getElementById('notification-close');
  if (notificationClose) {
    notificationClose.addEventListener('click', () => {
      state.notificationsOpen = false;
      renderApp();
    });
  }

  const demoButton = document.getElementById('demo-button');
  if (demoButton) {
    demoButton.addEventListener('click', (event) => {
      event.preventDefault();
      openModal('demo');
    });
  }

  const fabButton = document.getElementById('fab');
  const fabMenu = document.getElementById('fab-menu');
  if (fabButton && fabMenu) {
    fabButton.addEventListener('click', () => {
      state.fabOpen = !state.fabOpen;
      fabMenu.classList.toggle('open', state.fabOpen);
      fabMenu.setAttribute('aria-hidden', String(!state.fabOpen));
    });

    fabMenu.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => {
        openModal(button.dataset.action);
        state.fabOpen = false;
        fabMenu.classList.remove('open');
        fabMenu.setAttribute('aria-hidden', 'true');
      });
    });
  }
}

function renderSparkline(values = []) {
  if (!values.length) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1 || 1)) * 100;
      const normalised = max === min ? 50 : 100 - ((value - min) / (max - min)) * 100;
      const y = Math.min(100, Math.max(0, normalised));
      return `${x},${y}`;
    })
    .join(' ');

  return `
    <svg class="sparkline" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Tendencia">
      <polyline points="${points}" />
    </svg>
  `;
}

function renderPerformanceChart(grades) {
  const max = Math.max(...grades.map((grade) => grade.average));
  return `
    <div class="bar-chart">
      ${grades
        .map((grade) => {
          const height = (grade.average / max) * 100;
          return `
            <div class="bar-group">
              <div class="bar" style="height: ${height}%" data-value="${grade.average.toFixed(1)}"></div>
              <span class="bar-label">${grade.grade}</span>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

function openModal(type) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  modalRoot.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <div class="modal">
        ${renderModalContent(type)}
      </div>
    </div>
  `;

  const closeButton = modalRoot.querySelector('[data-close]');
  closeButton?.addEventListener('click', closeModal);

  const form = modalRoot.querySelector('form');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    closeModal();
    pushToast({
      icon: 'task_alt',
      title: 'Acción registrada',
      description: 'Simularemos este flujo en la demo en vivo.'
    });
  });
}

function renderModalContent(type) {
  const titles = {
    classroom: 'Crear aula',
    student: 'Registrar alumno',
    report: 'Solicitar reporte IA',
    demo: 'Solicitar demo completa'
  };

  const descriptions = {
    classroom: 'Configure rápidamente una nueva cohorte con metas personalizadas.',
    student: 'Agregue un alumno y asigne tutores y alertas iniciales.',
    report: 'Indique el foco de análisis para generar insights predictivos.',
    demo: 'Comparta sus datos de contacto y agenda una sesión con nuestro equipo.'
  };

  const formBody = {
    classroom: `
      <div class="form-grid">
        <div class="form-control">
          <label>
            Nombre del aula
            <span class="badge badge-required">Campo requerido</span>
          </label>
          <input type="text" required placeholder="Ej. Primaria 4B" />
          <p class="form-helper">Visible para docentes y familias.</p>
        </div>
        <div class="form-control">
          <label>
            Tutor asignado
            <span class="badge badge-valid">Validado</span>
          </label>
          <select>
            <option>Seleccionar tutor</option>
            <option>Laura Herrera</option>
            <option>César Quispe</option>
          </select>
        </div>
      </div>
    `,
    student: `
      <div class="form-grid">
        <div class="form-control">
          <label>
            Nombre y apellido
            <span class="badge badge-required">Campo requerido</span>
          </label>
          <input type="text" required placeholder="Ej. Ana Valdivia" />
        </div>
        <div class="form-control">
          <label>
            Aula
            <span class="badge badge-required">Campo requerido</span>
          </label>
          <select required>
            <option>Seleccionar aula</option>
            <option>Primaria 1A</option>
            <option>Primaria 3B</option>
            <option>Secundaria 2C</option>
          </select>
        </div>
        <div class="form-control">
          <label>
            Observaciones iniciales
            <span class="badge badge-valid">Recomendado</span>
          </label>
          <textarea rows="3" placeholder="Prioridades de acompañamiento"></textarea>
        </div>
      </div>
    `,
    report: `
      <div class="form-grid">
        <div class="form-control">
          <label>
            Foco del reporte
            <span class="badge badge-required">Campo requerido</span>
          </label>
          <select required>
            <option>Seleccionar foco</option>
            <option>Rendimiento académico</option>
            <option>Asistencia y bienestar</option>
            <option>Gestión de pagos</option>
          </select>
        </div>
        <div class="form-control">
          <label>
            Periodo a analizar
            <span class="badge badge-valid">Recomendado</span>
          </label>
          <input type="month" />
        </div>
        <div class="form-control">
          <label>
            Comentarios
            <span class="badge badge-valid">Contexto</span>
          </label>
          <textarea rows="3" placeholder="¿Qué desea monitorear?"></textarea>
        </div>
      </div>
    `,
    demo: `
      <div class="form-grid">
        <div class="form-control">
          <label>
            Nombre completo
            <span class="badge badge-required">Campo requerido</span>
          </label>
          <input type="text" required placeholder="Ej. María Gonzales" />
        </div>
        <div class="form-control">
          <label>
            Correo institucional
            <span class="badge badge-required">Campo requerido</span>
          </label>
          <input type="email" required placeholder="contacto@colegio.edu" />
        </div>
        <div class="form-control">
          <label>
            Comentarios
            <span class="badge badge-valid">Opcional</span>
          </label>
          <textarea rows="3" placeholder="Agenda preferida o necesidades"></textarea>
        </div>
      </div>
    `
  };

  return `
    <header>
      <div>
        <h2>${titles[type]}</h2>
        <p>${descriptions[type]}</p>
      </div>
      <button type="button" data-close aria-label="Cerrar modal">
        <span class="material-symbols-outlined">close</span>
      </button>
    </header>
    <form>
      ${formBody[type]}
      <div class="form-actions" style="display: flex; justify-content: flex-end; gap: 0.75rem;">
        <button type="button" class="button button-ghost" data-close>Cancelar</button>
        <button type="submit" class="button button-primary">
          <span class="material-symbols-outlined">send</span>
          Confirmar
        </button>
      </div>
    </form>
  `;
}

function closeModal() {
  const modalRoot = document.getElementById('modal-root');
  if (modalRoot) {
    modalRoot.innerHTML = '';
  }
}

function pushToast({ icon = 'info', title, description }) {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="material-symbols-outlined">${icon}</span>
    <div>
      <strong>${title}</strong>
      <p>${description}</p>
    </div>
  `;

  toastContainer.appendChild(toast);

  if (toastContainer.children.length > 3) {
    toastContainer.removeChild(toastContainer.firstChild);
  }

  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 4500);
}

function simulateNotifications() {
  if (!state.data) return;

  if (state.notificationTimer) {
    clearInterval(state.notificationTimer);
  }

  const queue = [
    ...state.data.notifications.ia.map((item) => ({ ...item, icon: 'auto_awesome' })),
    ...state.data.notifications.tasks.map((item) => ({ ...item, icon: 'check_circle' })),
    ...state.data.notifications.messages.map((item) => ({ ...item, icon: 'chat' }))
  ];

  if (!queue.length) return;

  let index = 0;
  pushToast({
    icon: queue[0].icon,
    title: queue[0].title,
    description: queue[0].description
  });

  state.notificationTimer = setInterval(() => {
    index = (index + 1) % queue.length;
    const next = queue[index];
    pushToast({ icon: next.icon, title: next.title, description: next.description });
  }, 8000);
}
