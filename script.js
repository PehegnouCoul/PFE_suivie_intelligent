// Configuration globale
const CONFIG = {
  kwhPrice: 114.29, // Prix du kWh en FCFA (0.1740 EUR * 655.957)
  powerThreshold: 500, // Seuil d'alerte de puissance en watts
  consumptionGoal: 10, // Objectif de consommation en kWh/jour
  notificationsEnabled: true
};

// État de l'application
const STATE = {
  currentData: [],
  filteredData: [],
  notifications: [],
  achievements: [],
  currentPage: 1,
  itemsPerPage: 10,
  charts: {},
  settings: { ...CONFIG }
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupEventListeners();
  fetchData();
  loadSettings();
  checkAchievements();
});

// Initialisation de l'application
function initializeApp() {
  // Initialiser les graphiques
  initializeCharts();
  
  // Initialiser les tooltips Bootstrap
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
  // Filtres
  document.getElementById('periodFilter').addEventListener('change', applyFilters);
  document.getElementById('deviceFilter').addEventListener('change', applyFilters);
  document.getElementById('startDate').addEventListener('change', applyFilters);
  document.getElementById('endDate').addEventListener('change', applyFilters);
  
  // Recherche
  document.getElementById('searchInput').addEventListener('input', handleSearch);
  
  // Paramètres
  document.getElementById('settingsForm').addEventListener('submit', saveSettings);
}

// Fonction principale de récupération des données
async function fetchData() {
  try {
      // Simuler des données pour le moment
      const simulatedData = generateSimulatedData();
      
      // Mettre à jour l'état
      STATE.currentData = simulatedData;
      STATE.filteredData = [...simulatedData];
      
      // Mettre à jour l'interface
      updateDashboard(simulatedData);
      updateCharts(simulatedData);
      updateTable(simulatedData);
      checkAlerts(simulatedData);
      
      // Ajouter une notification de succès
      addNotification('Données actualisées avec succès', 'success');
      
  } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      addNotification('Erreur lors de la récupération des données', 'error');
  }
}

// Génération de données simulées
function generateSimulatedData() {
  const devices = ['Réfrigérateur', 'Climatiseur', 'Téléviseur', 'Lave-linge', 'Four'];
  const data = [];
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
      const time = new Date(now);
      time.setHours(now.getHours() - i);
      
      const device = devices[Math.floor(Math.random() * devices.length)];
      const voltage = 220 + (Math.random() * 10 - 5);
      const current = Math.random() * 3;
      const power = voltage * current;
      
      const cost = (power * CONFIG.kwhPrice / 1000).toFixed(0); // Coût en FCFA
      
      data.push({
          timestamp: time,
          time: time.toLocaleTimeString(),
          date: time.toLocaleDateString(),
          voltage: voltage.toFixed(1),
          current: current.toFixed(2),
          power: power.toFixed(2),
          device: device,
          cost: cost
      });
  }
  
  return data.reverse();
}

// Mise à jour du tableau de bord
function updateDashboard(data) {
  const latest = data[data.length - 1];
  
  // Mettre à jour les valeurs principales
  document.getElementById('voltage').textContent = `${latest.voltage} V`;
  document.getElementById('current').textContent = `${latest.current} A`;
  document.getElementById('power').textContent = `${latest.power} W`;
  document.getElementById('cost').textContent = `${latest.cost} FCFA`;
  
  // Calculer et afficher les tendances
  updateTrends(data);
  
  // Mettre à jour les recommandations
  updateRecommendations(latest);
}

// Mise à jour des tendances
function updateTrends(data) {
  const lastHour = data.slice(-2);
  if (lastHour.length < 2) return;
  
  const trends = {
      voltage: calculateTrend(lastHour[0].voltage, lastHour[1].voltage),
      current: calculateTrend(lastHour[0].current, lastHour[1].current),
      power: calculateTrend(lastHour[0].power, lastHour[1].power),
      cost: calculateTrend(lastHour[0].cost, lastHour[1].cost)
  };
  
  // Mettre à jour les indicateurs de tendance
  Object.entries(trends).forEach(([key, trend]) => {
      const element = document.getElementById(`${key}Trend`);
      if (element) {
          element.innerHTML = getTrendIcon(trend);
          element.className = `trend-indicator ${getTrendClass(trend)}`;
      }
  });
}

// Calcul de la tendance
function calculateTrend(previous, current) {
  const diff = ((current - previous) / previous) * 100;
  if (Math.abs(diff) < 1) return 'stable';
  return diff > 0 ? 'up' : 'down';
}

// Obtention de l'icône de tendance
function getTrendIcon(trend) {
  const icons = {
      up: '<i class="bi bi-arrow-up-right"></i> En hausse',
      down: '<i class="bi bi-arrow-down-right"></i> En baisse',
      stable: '<i class="bi bi-dash"></i> Stable'
  };
  return icons[trend] || icons.stable;
}

// Obtention de la classe de tendance
function getTrendClass(trend) {
  const classes = {
      up: 'trend-up',
      down: 'trend-down',
      stable: 'trend-stable'
  };
  return classes[trend] || classes.stable;
}

// Mise à jour des recommandations
function updateRecommendations(latest) {
  const power = parseFloat(latest.power);
  const device = latest.device;
  let recommendation = '';
  let alert = '';
  
  // Logique de recommandation basée sur l'appareil et la puissance
  if (device === 'Réfrigérateur') {
      if (power > 250) {
          alert = '⚠️ Votre réfrigérateur consomme beaucoup. Vérifiez la porte ou son contenu.';
          recommendation = 'Conseils : Évitez d\'ouvrir trop souvent. Débranchez-le la nuit si peu chargé.';
      } else {
          recommendation = 'Bonne utilisation actuelle du réfrigérateur.';
      }
  } else if (device === 'Climatiseur') {
      if (power > 500) {
          alert = '⚠️ Le climatiseur est très énergivore. Pensez à l\'éteindre si l\'air est déjà frais.';
          recommendation = 'Conseils : Utilisez-le avec minuterie. Fermez portes/fenêtres pour conserver le froid.';
      } else {
          recommendation = 'Utilisation raisonnable du climatiseur.';
      }
  }
  
  // Mettre à jour l'interface
  document.getElementById('recommendation').textContent = recommendation;
  const alertBox = document.getElementById('alert');
  if (alert) {
      alertBox.textContent = alert;
      alertBox.classList.remove('d-none');
      addNotification(alert, 'warning');
  } else {
      alertBox.classList.add('d-none');
  }
  
  // Mettre à jour le score énergétique
  updateEnergyScore(power);
}

// Mise à jour du score énergétique
function updateEnergyScore(power) {
  const maxPower = 1000; // Puissance maximale considérée
  const score = Math.max(0, 100 - (power / maxPower) * 100);
  const scoreElement = document.getElementById('energyScore');
  scoreElement.style.width = `${score}%`;
  scoreElement.textContent = `Score énergétique: ${Math.round(score)}%`;
  
  // Mettre à jour la couleur en fonction du score
  if (score >= 80) {
      scoreElement.className = 'progress-bar bg-success';
  } else if (score >= 50) {
      scoreElement.className = 'progress-bar bg-warning';
  } else {
      scoreElement.className = 'progress-bar bg-danger';
  }
}

// Initialisation des graphiques
function initializeCharts() {
  // Graphique de puissance
  const powerCtx = document.getElementById('powerChartCanvas').getContext('2d');
  STATE.charts.power = new Chart(powerCtx, {
      type: 'line',
      data: {
          labels: [],
          datasets: [{
              label: 'Puissance (W)',
              data: [],
              borderColor: 'rgba(75, 192, 192, 1)',
              tension: 0.4
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
              legend: {
                  position: 'top'
              }
          },
          scales: {
              y: {
                  beginAtZero: true
              }
          }
      }
  });
  
  // Graphique de consommation
  const consumptionCtx = document.getElementById('consumptionChartCanvas').getContext('2d');
  STATE.charts.consumption = new Chart(consumptionCtx, {
      type: 'bar',
      data: {
          labels: [],
          datasets: [{
              label: 'Consommation (kWh)',
              data: [],
              backgroundColor: 'rgba(54, 162, 235, 0.5)'
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
              legend: {
                  position: 'top'
              }
          }
      }
  });
  
  // Graphique de coûts
  const costCtx = document.getElementById('costChartCanvas').getContext('2d');
  STATE.charts.cost = new Chart(costCtx, {
      type: 'line',
      data: {
          labels: [],
          datasets: [{
              label: 'Coût (FCFA)',
              data: [],
              borderColor: 'rgba(255, 99, 132, 1)',
              tension: 0.4
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
              legend: {
                  position: 'top'
              }
          }
      }
  });
  
  // Graphique de répartition par appareil
  const deviceCtx = document.getElementById('deviceDistributionChart').getContext('2d');
  STATE.charts.device = new Chart(deviceCtx, {
      type: 'doughnut',
      data: {
          labels: [],
          datasets: [{
              data: [],
              backgroundColor: [
                  'rgba(255, 99, 132, 0.5)',
                  'rgba(54, 162, 235, 0.5)',
                  'rgba(255, 206, 86, 0.5)',
                  'rgba(75, 192, 192, 0.5)',
                  'rgba(153, 102, 255, 0.5)'
              ]
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
              legend: {
                  position: 'right'
              }
          }
      }
  });
}

// Mise à jour des graphiques
function updateCharts(data) {
  // Mise à jour du graphique de puissance
  STATE.charts.power.data.labels = data.map(d => d.time);
  STATE.charts.power.data.datasets[0].data = data.map(d => d.power);
  STATE.charts.power.update();
  
  // Mise à jour du graphique de consommation
  const consumptionByHour = calculateConsumptionByHour(data);
  STATE.charts.consumption.data.labels = Object.keys(consumptionByHour);
  STATE.charts.consumption.data.datasets[0].data = Object.values(consumptionByHour);
  STATE.charts.consumption.update();
  
  // Mise à jour du graphique de coûts
  STATE.charts.cost.data.labels = data.map(d => d.time);
  STATE.charts.cost.data.datasets[0].data = data.map(d => d.cost);
  STATE.charts.cost.update();
  
  // Mise à jour du graphique de répartition par appareil
  const deviceDistribution = calculateDeviceDistribution(data);
  STATE.charts.device.data.labels = Object.keys(deviceDistribution);
  STATE.charts.device.data.datasets[0].data = Object.values(deviceDistribution);
  STATE.charts.device.update();
}

// Calcul de la consommation par heure
function calculateConsumptionByHour(data) {
  const consumption = {};
  data.forEach(d => {
      const hour = d.time.split(':')[0];
      if (!consumption[hour]) {
          consumption[hour] = 0;
      }
      consumption[hour] += parseFloat(d.power) / 1000; // Conversion en kWh
  });
  return consumption;
}

// Calcul de la répartition par appareil
function calculateDeviceDistribution(data) {
  const distribution = {};
  data.forEach(d => {
      if (!distribution[d.device]) {
          distribution[d.device] = 0;
      }
      distribution[d.device] += parseFloat(d.power);
  });
  return distribution;
}

// Mise à jour du tableau
function updateTable(data) {
  const tbody = document.getElementById('data-table-body');
  tbody.innerHTML = '';
  
  // Calculer la pagination
  const startIndex = (STATE.currentPage - 1) * STATE.itemsPerPage;
  const endIndex = startIndex + STATE.itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);
  
  // Remplir le tableau
  paginatedData.forEach(entry => {
      const row = document.createElement('tr');
      row.innerHTML = `
          <td>${entry.date} ${entry.time}</td>
          <td>${entry.voltage} V</td>
          <td>${entry.current} A</td>
          <td>${entry.power} W</td>
          <td>${entry.device}</td>
          <td>${entry.cost} FCFA</td>
          <td>
              <button class="btn btn-sm btn-outline-primary" onclick="showDetails('${entry.timestamp}')">
                  <i class="bi bi-info-circle"></i>
              </button>
          </td>
      `;
      tbody.appendChild(row);
  });
  
  // Mettre à jour la pagination
  updatePagination(data.length);
}

// Mise à jour de la pagination
function updatePagination(totalItems) {
  const totalPages = Math.ceil(totalItems / STATE.itemsPerPage);
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';
  
  // Bouton précédent
  const prevLi = document.createElement('li');
  prevLi.className = `page-item ${STATE.currentPage === 1 ? 'disabled' : ''}`;
  prevLi.innerHTML = `
      <a class="page-link" href="#" onclick="changePage(${STATE.currentPage - 1})">
          <i class="bi bi-chevron-left"></i>
      </a>
  `;
  pagination.appendChild(prevLi);
  
  // Pages
  for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement('li');
      li.className = `page-item ${i === STATE.currentPage ? 'active' : ''}`;
      li.innerHTML = `
          <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
      `;
      pagination.appendChild(li);
  }
  
  // Bouton suivant
  const nextLi = document.createElement('li');
  nextLi.className = `page-item ${STATE.currentPage === totalPages ? 'disabled' : ''}`;
  nextLi.innerHTML = `
      <a class="page-link" href="#" onclick="changePage(${STATE.currentPage + 1})">
          <i class="bi bi-chevron-right"></i>
      </a>
  `;
  pagination.appendChild(nextLi);
}

// Changement de page
function changePage(page) {
  if (page < 1 || page > Math.ceil(STATE.filteredData.length / STATE.itemsPerPage)) return;
  STATE.currentPage = page;
  updateTable(STATE.filteredData);
}

// Application des filtres
function applyFilters() {
  const period = document.getElementById('periodFilter').value;
  const device = document.getElementById('deviceFilter').value;
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  
  let filtered = [...STATE.currentData];
  
  // Filtre par période
  if (period !== 'all') {
      const now = new Date();
      const start = new Date();
      switch (period) {
          case 'today':
              start.setHours(0, 0, 0, 0);
              break;
          case 'week':
              start.setDate(now.getDate() - 7);
              break;
          case 'month':
              start.setMonth(now.getMonth() - 1);
              break;
          case 'year':
              start.setFullYear(now.getFullYear() - 1);
              break;
      }
      filtered = filtered.filter(d => new Date(d.timestamp) >= start);
  }
  
  // Filtre par appareil
  if (device !== 'all') {
      filtered = filtered.filter(d => d.device === device);
  }
  
  // Filtre par date
  if (startDate) {
      filtered = filtered.filter(d => new Date(d.timestamp) >= new Date(startDate));
  }
  if (endDate) {
      filtered = filtered.filter(d => new Date(d.timestamp) <= new Date(endDate));
  }
  
  STATE.filteredData = filtered;
  STATE.currentPage = 1;
  updateTable(filtered);
  updateCharts(filtered);
}

// Gestion de la recherche
function handleSearch(event) {
  const searchTerm = event.target.value.toLowerCase();
  const filtered = STATE.currentData.filter(d => 
      d.device.toLowerCase().includes(searchTerm) ||
      d.time.toLowerCase().includes(searchTerm) ||
      d.power.includes(searchTerm)
  );
  
  STATE.filteredData = filtered;
  STATE.currentPage = 1;
  updateTable(filtered);
}

// Gestion des notifications
function addNotification(message, type = 'info') {
  if (!CONFIG.notificationsEnabled) return;
  
  const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
  };
  
  STATE.notifications.unshift(notification);
  updateNotificationBadge();
  updateNotificationList();
  
  // Notification système si supportée
  if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Suivi Énergétique', {
          body: message,
          icon: '/icon.png'
      });
  }
}

// Mise à jour du badge de notification
function updateNotificationBadge() {
  const badge = document.getElementById('notificationBadge');
  const unreadCount = STATE.notifications.filter(n => !n.read).length;
  badge.textContent = unreadCount;
  badge.style.display = unreadCount > 0 ? 'inline' : 'none';
}

// Mise à jour de la liste des notifications
function updateNotificationList() {
  const list = document.getElementById('notificationList');
  list.innerHTML = `
      <li><h6 class="dropdown-header">Notifications</h6></li>
      <li><hr class="dropdown-divider"></li>
  `;
  
  if (STATE.notifications.length === 0) {
      list.innerHTML += `
          <li><a class="dropdown-item" href="#">Aucune notification</a></li>
      `;
      return;
  }
  
  STATE.notifications.slice(0, 5).forEach(notification => {
      list.innerHTML += `
          <li>
              <a class="dropdown-item ${notification.read ? '' : 'unread'}" href="#" 
                 onclick="markNotificationAsRead(${notification.id})">
                  <div class="d-flex align-items-center">
                      <i class="bi bi-${getNotificationIcon(notification.type)} me-2"></i>
                      <div>
                          <div class="small text-muted">
                              ${notification.timestamp.toLocaleTimeString()}
                          </div>
                          ${notification.message}
                      </div>
                  </div>
              </a>
          </li>
      `;
  });
  
  if (STATE.notifications.length > 5) {
      list.innerHTML += `
          <li><hr class="dropdown-divider"></li>
          <li>
              <a class="dropdown-item text-center" href="#" onclick="showAllNotifications()">
                  Voir toutes les notifications
              </a>
          </li>
      `;
  }
}

// Obtention de l'icône de notification
function getNotificationIcon(type) {
  const icons = {
      success: 'check-circle-fill',
      error: 'exclamation-circle-fill',
      warning: 'exclamation-triangle-fill',
      info: 'info-circle-fill'
  };
  return icons[type] || icons.info;
}

// Marquage d'une notification comme lue
function markNotificationAsRead(id) {
  const notification = STATE.notifications.find(n => n.id === id);
  if (notification) {
      notification.read = true;
      updateNotificationBadge();
      updateNotificationList();
  }
}

// Affichage de toutes les notifications
function showAllNotifications() {
  // Implémenter une modale pour afficher toutes les notifications
  const modal = new bootstrap.Modal(document.getElementById('notificationsModal'));
  const modalBody = document.getElementById('notificationsModalBody');
  
  modalBody.innerHTML = STATE.notifications.map(notification => `
      <div class="notification-item ${notification.read ? '' : 'unread'}">
          <div class="d-flex align-items-center">
              <i class="bi bi-${getNotificationIcon(notification.type)} me-2"></i>
              <div>
                  <div class="small text-muted">
                      ${notification.timestamp.toLocaleString()}
                  </div>
                  ${notification.message}
              </div>
          </div>
      </div>
  `).join('');
  
  modal.show();
}

// Gestion des paramètres
function showSettings() {
  const modal = new bootstrap.Modal(document.getElementById('settingsModal'));
  
  // Remplir le formulaire avec les paramètres actuels
  document.getElementById('powerThreshold').value = CONFIG.powerThreshold;
  document.getElementById('consumptionGoal').value = CONFIG.consumptionGoal;
  document.getElementById('kwhPrice').value = CONFIG.kwhPrice;
  document.getElementById('notificationsEnabled').checked = CONFIG.notificationsEnabled;
  
  modal.show();
}

// Sauvegarde des paramètres
function saveSettings(event) {
  event.preventDefault();
  
  // Récupérer les valeurs du formulaire
  CONFIG.powerThreshold = parseFloat(document.getElementById('powerThreshold').value);
  CONFIG.consumptionGoal = parseFloat(document.getElementById('consumptionGoal').value);
  CONFIG.kwhPrice = parseFloat(document.getElementById('kwhPrice').value);
  CONFIG.notificationsEnabled = document.getElementById('notificationsEnabled').checked;
  
  // Sauvegarder dans le localStorage
  localStorage.setItem('settings', JSON.stringify(CONFIG));
  
  // Fermer la modale
  bootstrap.Modal.getInstance(document.getElementById('settingsModal')).hide();
  
  // Mettre à jour l'interface
  addNotification('Paramètres sauvegardés avec succès', 'success');
  fetchData(); // Recharger les données avec les nouveaux paramètres
}

// Chargement des paramètres
function loadSettings() {
  const savedSettings = localStorage.getItem('settings');
  if (savedSettings) {
      Object.assign(CONFIG, JSON.parse(savedSettings));
  }
}

// Vérification des réalisations
function checkAchievements() {
  const achievements = [
      {
          id: 'eco_warrior',
          title: 'Éco-guerrier',
          description: 'Réduction de la consommation de 20%',
          icon: 'bi-trophy',
          condition: () => calculateConsumptionReduction() >= 20
      },
      {
          id: 'power_saver',
          title: 'Économiseur d\'énergie',
          description: 'Maintien de la puissance sous 300W pendant 24h',
          icon: 'bi-lightning',
          condition: () => checkPowerThreshold(300, 24)
      },
      {
          id: 'smart_user',
          title: 'Utilisateur intelligent',
          description: 'Suivi des recommandations pendant 7 jours',
          icon: 'bi-star',
          condition: () => checkRecommendationFollowed(7)
      }
  ];
  
  achievements.forEach(achievement => {
      if (achievement.condition() && !STATE.achievements.includes(achievement.id)) {
          STATE.achievements.push(achievement.id);
          addNotification(`Nouvelle réalisation débloquée : ${achievement.title}`, 'success');
          updateAchievementBadges();
      }
  });
}

// Mise à jour des badges de réalisation
function updateAchievementBadges() {
  const badgesContainer = document.getElementById('badges');
  badgesContainer.innerHTML = STATE.achievements.map(id => {
      const achievement = ACHIEVEMENTS.find(a => a.id === id);
      return `
          <div class="achievement-badge" data-bs-toggle="tooltip" title="${achievement.description}">
              <i class="bi ${achievement.icon}"></i>
              ${achievement.title}
          </div>
      `;
  }).join('');
  
  // Réinitialiser les tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
}

// Exportation des données
function exportData() {
  const data = {
      currentData: STATE.currentData,
      settings: CONFIG,
      achievements: STATE.achievements,
      exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `suivi-energetique-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  addNotification('Données exportées avec succès', 'success');
}

// Affichage des détails
function showDetails(timestamp) {
  const entry = STATE.currentData.find(d => d.timestamp === timestamp);
  if (!entry) return;
  
  const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
  const modalBody = document.getElementById('detailsModalBody');
  
  modalBody.innerHTML = `
      <div class="card">
          <div class="card-body">
              <h5 class="card-title">Détails de la mesure</h5>
              <dl class="row">
                  <dt class="col-sm-4">Date et heure</dt>
                  <dd class="col-sm-8">${entry.date} ${entry.time}</dd>
                  
                  <dt class="col-sm-4">Appareil</dt>
                  <dd class="col-sm-8">${entry.device}</dd>
                  
                  <dt class="col-sm-4">Tension</dt>
                  <dd class="col-sm-8">${entry.voltage} V</dd>
                  
                  <dt class="col-sm-4">Courant</dt>
                  <dd class="col-sm-8">${entry.current} A</dd>
                  
                  <dt class="col-sm-4">Puissance</dt>
                  <dd class="col-sm-8">${entry.power} W</dd>
                  
                  <dt class="col-sm-4">Coût estimé</dt>
                  <dd class="col-sm-8">${entry.cost} FCFA</dd>
              </dl>
          </div>
      </div>
  `;
  
  modal.show();
}

// Fonctions utilitaires
function calculateConsumptionReduction() {
  // Implémenter le calcul de réduction de consommation
  return 0;
}

function checkPowerThreshold(threshold, hours) {
  // Implémenter la vérification du seuil de puissance
  return false;
}

function checkRecommendationFollowed(days) {
  // Implémenter la vérification du suivi des recommandations
  return false;
}

// Constantes
const ACHIEVEMENTS = [
  {
      id: 'eco_warrior',
      title: 'Éco-guerrier',
      description: 'Réduction de la consommation de 20%',
      icon: 'bi-trophy'
  },
  {
      id: 'power_saver',
      title: 'Économiseur d\'énergie',
      description: 'Maintien de la puissance sous 300W pendant 24h',
      icon: 'bi-lightning'
  },
  {
      id: 'smart_user',
      title: 'Utilisateur intelligent',
      description: 'Suivi des recommandations pendant 7 jours',
      icon: 'bi-star'
  }
];