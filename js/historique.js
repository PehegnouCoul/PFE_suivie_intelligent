// État de l'application
const STATE = {
    currentData: [],
    filteredData: [],
    currentPage: 1,
    itemsPerPage: 10,
    filters: {
        period: 'day',
        device: 'all',
        startDate: null,
        endDate: null,
        minVoltage: null,
        maxVoltage: null,
        minPower: null,
        maxPower: null
    }
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    fetchData();
});

// Initialisation de l'application
function initializeApp() {
    // Initialiser le graphique
    initializeHistoryChart();
    
    // Initialiser les dates par défaut
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 7); // Par défaut, afficher la dernière semaine
    
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Filtres
    document.getElementById('periodFilter').addEventListener('change', handlePeriodChange);
    document.getElementById('deviceFilter').addEventListener('change', applyFilters);
    document.getElementById('startDate').addEventListener('change', applyFilters);
    document.getElementById('endDate').addEventListener('change', applyFilters);
    document.getElementById('minVoltage').addEventListener('change', applyFilters);
    document.getElementById('maxVoltage').addEventListener('change', applyFilters);
    document.getElementById('minPower').addEventListener('change', applyFilters);
    document.getElementById('maxPower').addEventListener('change', applyFilters);
    
    // Boutons
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    
    // Recherche
    document.getElementById('searchInput').addEventListener('input', handleSearch);
}

// Récupération des données
async function fetchData() {
    try {
        const response = await fetch('/api/energy-data');
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des données');
        }
        const data = await response.json();
        
        // Mettre à jour l'état
        STATE.currentData = data;
        STATE.filteredData = [...data];
        
        // Mettre à jour l'interface
        updateTable(data);
        updateHistoryChart(data);
        updatePagination(data.length);
        
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        showAlert('Erreur lors de la récupération des données', 'danger');
    }
}

// Initialisation du graphique d'historique
function initializeHistoryChart() {
    const ctx = document.getElementById('historyChart').getContext('2d');
    STATE.historyChart = new Chart(ctx, {
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
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Évolution de la consommation'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Puissance (W)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date/Heure'
                    }
                }
            }
        }
    });
}

// Mise à jour du graphique d'historique
function updateHistoryChart(data) {
    const labels = data.map(item => new Date(item.timestamp).toLocaleString());
    const powerData = data.map(item => parseFloat(item.power));
    
    STATE.historyChart.data.labels = labels;
    STATE.historyChart.data.datasets[0].data = powerData;
    STATE.historyChart.update();
}

// Mise à jour du tableau
function updateTable(data) {
    const tbody = document.getElementById('data-table-body');
    const start = (STATE.currentPage - 1) * STATE.itemsPerPage;
    const end = start + STATE.itemsPerPage;
    const pageData = data.slice(start, end);
    
    tbody.innerHTML = pageData.map(item => `
        <tr>
            <td>${new Date(item.timestamp).toLocaleString()}</td>
            <td>${item.voltage} V</td>
            <td>${item.current} A</td>
            <td>${item.power} W</td>
            <td>${item.device}</td>
            <td>${item.cost} FCFA</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="showDetails('${item.timestamp}')">
                    <i class="bi bi-info-circle"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Mise à jour de la pagination
function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / STATE.itemsPerPage);
    const pagination = document.getElementById('pagination');
    
    let html = '';
    
    // Bouton précédent
    html += `
        <li class="page-item ${STATE.currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${STATE.currentPage - 1})">Précédent</a>
        </li>
    `;
    
    // Pages
    for (let i = 1; i <= totalPages; i++) {
        html += `
            <li class="page-item ${STATE.currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }
    
    // Bouton suivant
    html += `
        <li class="page-item ${STATE.currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${STATE.currentPage + 1})">Suivant</a>
        </li>
    `;
    
    pagination.innerHTML = html;
}

// Changement de page
function changePage(page) {
    if (page < 1 || page > Math.ceil(STATE.filteredData.length / STATE.itemsPerPage)) return;
    STATE.currentPage = page;
    updateTable(STATE.filteredData);
    updatePagination(STATE.filteredData.length);
}

// Gestion du changement de période
function handlePeriodChange(event) {
    const period = event.target.value;
    const today = new Date();
    const startDate = new Date(today);
    
    switch (period) {
        case 'day':
            startDate.setDate(today.getDate() - 1);
            break;
        case 'week':
            startDate.setDate(today.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(today.getMonth() - 1);
            break;
        case 'year':
            startDate.setFullYear(today.getFullYear() - 1);
            break;
        case 'custom':
            return; // Ne rien faire pour la période personnalisée
    }
    
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
    
    applyFilters();
}

// Application des filtres
function applyFilters() {
    const filters = {
        period: document.getElementById('periodFilter').value,
        device: document.getElementById('deviceFilter').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        minVoltage: document.getElementById('minVoltage').value,
        maxVoltage: document.getElementById('maxVoltage').value,
        minPower: document.getElementById('minPower').value,
        maxPower: document.getElementById('maxPower').value
    };
    
    STATE.filters = filters;
    
    // Filtrer les données
    let filtered = [...STATE.currentData];
    
    // Filtre par date
    if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filtered = filtered.filter(item => new Date(item.timestamp) >= startDate);
    }
    if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(item => new Date(item.timestamp) <= endDate);
    }
    
    // Filtre par appareil
    if (filters.device !== 'all') {
        filtered = filtered.filter(item => item.device === filters.device);
    }
    
    // Filtres numériques
    if (filters.minVoltage) {
        filtered = filtered.filter(item => parseFloat(item.voltage) >= parseFloat(filters.minVoltage));
    }
    if (filters.maxVoltage) {
        filtered = filtered.filter(item => parseFloat(item.voltage) <= parseFloat(filters.maxVoltage));
    }
    if (filters.minPower) {
        filtered = filtered.filter(item => parseFloat(item.power) >= parseFloat(filters.minPower));
    }
    if (filters.maxPower) {
        filtered = filtered.filter(item => parseFloat(item.power) <= parseFloat(filters.maxPower));
    }
    
    STATE.filteredData = filtered;
    STATE.currentPage = 1;
    
    updateTable(filtered);
    updateHistoryChart(filtered);
    updatePagination(filtered.length);
}

// Réinitialisation des filtres
function resetFilters() {
    document.getElementById('periodFilter').value = 'day';
    document.getElementById('deviceFilter').value = 'all';
    document.getElementById('minVoltage').value = '';
    document.getElementById('maxVoltage').value = '';
    document.getElementById('minPower').value = '';
    document.getElementById('maxPower').value = '';
    
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 7);
    
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
    
    applyFilters();
}

// Gestion de la recherche
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    const filtered = STATE.currentData.filter(item => 
        item.device.toLowerCase().includes(searchTerm) ||
        item.timestamp.toLowerCase().includes(searchTerm) ||
        item.voltage.toString().includes(searchTerm) ||
        item.current.toString().includes(searchTerm) ||
        item.power.toString().includes(searchTerm) ||
        item.cost.toString().includes(searchTerm)
    );
    
    STATE.filteredData = filtered;
    STATE.currentPage = 1;
    
    updateTable(filtered);
    updateHistoryChart(filtered);
    updatePagination(filtered.length);
}

// Affichage des détails d'une mesure
function showDetails(timestamp) {
    const measure = STATE.currentData.find(item => item.timestamp === timestamp);
    if (!measure) return;
    
    const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
    const details = document.getElementById('measurementDetails');
    
    details.innerHTML = `
        <div class="table-responsive">
            <table class="table">
                <tr>
                    <th>Date/Heure</th>
                    <td>${new Date(measure.timestamp).toLocaleString()}</td>
                </tr>
                <tr>
                    <th>Tension</th>
                    <td>${measure.voltage} V</td>
                </tr>
                <tr>
                    <th>Courant</th>
                    <td>${measure.current} A</td>
                </tr>
                <tr>
                    <th>Puissance</th>
                    <td>${measure.power} W</td>
                </tr>
                <tr>
                    <th>Appareil</th>
                    <td>${measure.device}</td>
                </tr>
                <tr>
                    <th>Coût estimé</th>
                    <td>${measure.cost} FCFA</td>
                </tr>
            </table>
        </div>
    `;
    
    modal.show();
}

// Export des données
function exportData() {
    const data = STATE.filteredData;
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `historique_consommation_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Conversion des données en CSV
function convertToCSV(data) {
    const headers = ['Date/Heure', 'Tension (V)', 'Courant (A)', 'Puissance (W)', 'Appareil', 'Coût (FCFA)'];
    const rows = data.map(item => [
        new Date(item.timestamp).toLocaleString(),
        item.voltage,
        item.current,
        item.power,
        item.device,
        item.cost
    ]);
    
    return [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
}

// Affichage d'une alerte
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.querySelector('.container').insertBefore(alertDiv, document.querySelector('.card'));
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
} 