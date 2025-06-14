// État de l'application
const STATE = {
    currentData: [],
    filteredData: [],
    charts: {},
    period: 'week',
    startDate: null,
    endDate: null
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    fetchData();
});

// Initialisation de l'application
function initializeApp() {
    // Initialiser les dates par défaut
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 7); // Par défaut, afficher la dernière semaine
    
    STATE.startDate = startDate;
    STATE.endDate = today;
    
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
    
    // Initialiser les graphiques
    initializeCharts();
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Filtres de période
    document.getElementById('analysisPeriod').addEventListener('change', handlePeriodChange);
    document.getElementById('startDate').addEventListener('change', handleDateChange);
    document.getElementById('endDate').addEventListener('change', handleDateChange);
    document.getElementById('updateStats').addEventListener('click', fetchData);
}

// Initialisation des graphiques
function initializeCharts() {
    // Graphique de tendance de consommation
    const consumptionCtx = document.getElementById('consumptionTrendChart').getContext('2d');
    STATE.charts.consumptionTrend = new Chart(consumptionCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Consommation (kWh)',
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
                    text: 'Tendance de consommation'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Consommation (kWh)'
                    }
                }
            }
        }
    });

    // Graphique de tendance des coûts
    const costCtx = document.getElementById('costTrendChart').getContext('2d');
    STATE.charts.costTrend = new Chart(costCtx, {
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
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Tendance des coûts'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Coût (FCFA)'
                    }
                }
            }
        }
    });

    // Graphique de motif horaire
    const hourlyCtx = document.getElementById('hourlyPatternChart').getContext('2d');
    STATE.charts.hourlyPattern = new Chart(hourlyCtx, {
        type: 'bar',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            datasets: [{
                label: 'Consommation moyenne (kWh)',
                data: [],
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
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
                    text: 'Motif horaire de consommation'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Consommation moyenne (kWh)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Heure'
                    }
                }
            }
        }
    });

    // Graphique de répartition par appareil
    const deviceCtx = document.getElementById('deviceDistributionChart').getContext('2d');
    STATE.charts.deviceDistribution = new Chart(deviceCtx, {
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
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                title: {
                    display: true,
                    text: 'Répartition par appareil'
                }
            }
        }
    });

    // Graphique de comparaison
    const comparisonCtx = document.getElementById('comparisonChart').getContext('2d');
    STATE.charts.comparison = new Chart(comparisonCtx, {
        type: 'bar',
        data: {
            labels: ['Période actuelle', 'Période précédente'],
            datasets: [{
                label: 'Consommation (kWh)',
                data: [],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
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
                    text: 'Comparaison des périodes'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Consommation (kWh)'
                    }
                }
            }
        }
    });
}

// Récupération des données
async function fetchData() {
    try {
        const response = await fetch('/api/energy-data');
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des données');
        }
        const data = await response.json();
        
        // Filtrer les données selon la période sélectionnée
        const filteredData = filterDataByPeriod(data);
        STATE.currentData = filteredData;
        
        // Mettre à jour l'interface
        updateStatistics(filteredData);
        updateCharts(filteredData);
        updateAnalysisTable(filteredData);
        updateRecommendations(filteredData);
        
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        showAlert('Erreur lors de la récupération des données', 'danger');
    }
}

// Filtrage des données par période
function filterDataByPeriod(data) {
    return data.filter(item => {
        const date = new Date(item.timestamp);
        return date >= STATE.startDate && date <= STATE.endDate;
    });
}

// Mise à jour des statistiques
function updateStatistics(data) {
    // Calculer les statistiques
    const totalConsumption = calculateTotalConsumption(data);
    const totalCost = calculateTotalCost(data);
    const avgConsumption = calculateAverageConsumption(data);
    const peakConsumption = calculatePeakConsumption(data);
    
    // Mettre à jour l'interface
    document.getElementById('totalConsumption').textContent = `${totalConsumption.toFixed(2)} kWh`;
    document.getElementById('totalCost').textContent = `${totalCost.toFixed(0)} FCFA`;
    document.getElementById('avgConsumption').textContent = `${avgConsumption.toFixed(2)} kWh`;
    document.getElementById('peakConsumption').textContent = `${peakConsumption.toFixed(2)} kW`;
    
    // Mettre à jour les tendances
    updateTrends(data);
}

// Calcul de la consommation totale
function calculateTotalConsumption(data) {
    return data.reduce((total, item) => total + (parseFloat(item.power) * 24 / 1000), 0);
}

// Calcul du coût total
function calculateTotalCost(data) {
    return data.reduce((total, item) => total + parseFloat(item.cost), 0);
}

// Calcul de la consommation moyenne
function calculateAverageConsumption(data) {
    const days = (STATE.endDate - STATE.startDate) / (1000 * 60 * 60 * 24);
    return calculateTotalConsumption(data) / days;
}

// Calcul du pic de consommation
function calculatePeakConsumption(data) {
    return Math.max(...data.map(item => parseFloat(item.power))) / 1000;
}

// Mise à jour des tendances
function updateTrends(data) {
    // TODO: Implémenter la comparaison avec la période précédente
    const consumptionTrend = '+5%';
    const costTrend = '-2%';
    const avgConsumptionTrend = 'Stable';
    
    document.getElementById('consumptionTrend').innerHTML = `
        <i class="bi bi-arrow-up-right"></i> ${consumptionTrend} vs période précédente
    `;
    document.getElementById('costTrend').innerHTML = `
        <i class="bi bi-arrow-down-right"></i> ${costTrend} vs période précédente
    `;
    document.getElementById('avgConsumptionTrend').innerHTML = `
        <i class="bi bi-dash"></i> ${avgConsumptionTrend}
    `;
}

// Mise à jour des graphiques
function updateCharts(data) {
    // Mise à jour du graphique de tendance de consommation
    updateConsumptionTrendChart(data);
    
    // Mise à jour du graphique de tendance des coûts
    updateCostTrendChart(data);
    
    // Mise à jour du graphique de motif horaire
    updateHourlyPatternChart(data);
    
    // Mise à jour du graphique de répartition par appareil
    updateDeviceDistributionChart(data);
    
    // Mise à jour du graphique de comparaison
    updateComparisonChart(data);
}

// Mise à jour du graphique de tendance de consommation
function updateConsumptionTrendChart(data) {
    const dailyConsumption = calculateDailyConsumption(data);
    
    STATE.charts.consumptionTrend.data.labels = Object.keys(dailyConsumption);
    STATE.charts.consumptionTrend.data.datasets[0].data = Object.values(dailyConsumption);
    STATE.charts.consumptionTrend.update();
}

// Mise à jour du graphique de tendance des coûts
function updateCostTrendChart(data) {
    const dailyCosts = calculateDailyCosts(data);
    
    STATE.charts.costTrend.data.labels = Object.keys(dailyCosts);
    STATE.charts.costTrend.data.datasets[0].data = Object.values(dailyCosts);
    STATE.charts.costTrend.update();
}

// Mise à jour du graphique de motif horaire
function updateHourlyPatternChart(data) {
    const hourlyPattern = calculateHourlyPattern(data);
    
    STATE.charts.hourlyPattern.data.datasets[0].data = hourlyPattern;
    STATE.charts.hourlyPattern.update();
}

// Mise à jour du graphique de répartition par appareil
function updateDeviceDistributionChart(data) {
    const deviceDistribution = calculateDeviceDistribution(data);
    
    STATE.charts.deviceDistribution.data.labels = Object.keys(deviceDistribution);
    STATE.charts.deviceDistribution.data.datasets[0].data = Object.values(deviceDistribution);
    STATE.charts.deviceDistribution.update();
}

// Mise à jour du graphique de comparaison
function updateComparisonChart(data) {
    const comparison = calculatePeriodComparison(data);
    
    STATE.charts.comparison.data.datasets[0].data = [
        comparison.currentPeriod,
        comparison.previousPeriod
    ];
    STATE.charts.comparison.update();
}

// Calcul de la consommation quotidienne
function calculateDailyConsumption(data) {
    const dailyConsumption = {};
    
    data.forEach(item => {
        const date = new Date(item.timestamp).toLocaleDateString();
        const consumption = parseFloat(item.power) * 24 / 1000; // kWh
        
        if (!dailyConsumption[date]) {
            dailyConsumption[date] = 0;
        }
        dailyConsumption[date] += consumption;
    });
    
    return dailyConsumption;
}

// Calcul des coûts quotidiens
function calculateDailyCosts(data) {
    const dailyCosts = {};
    
    data.forEach(item => {
        const date = new Date(item.timestamp).toLocaleDateString();
        const cost = parseFloat(item.cost);
        
        if (!dailyCosts[date]) {
            dailyCosts[date] = 0;
        }
        dailyCosts[date] += cost;
    });
    
    return dailyCosts;
}

// Calcul du motif horaire
function calculateHourlyPattern(data) {
    const hourlyPattern = Array(24).fill(0);
    const hourlyCount = Array(24).fill(0);
    
    data.forEach(item => {
        const hour = new Date(item.timestamp).getHours();
        const consumption = parseFloat(item.power) / 1000; // kW
        
        hourlyPattern[hour] += consumption;
        hourlyCount[hour]++;
    });
    
    return hourlyPattern.map((total, hour) => 
        hourlyCount[hour] ? total / hourlyCount[hour] : 0
    );
}

// Calcul de la répartition par appareil
function calculateDeviceDistribution(data) {
    const deviceDistribution = {};
    
    data.forEach(item => {
        const device = item.device;
        const consumption = parseFloat(item.power) * 24 / 1000; // kWh
        
        if (!deviceDistribution[device]) {
            deviceDistribution[device] = 0;
        }
        deviceDistribution[device] += consumption;
    });
    
    return deviceDistribution;
}

// Calcul de la comparaison des périodes
function calculatePeriodComparison(data) {
    // TODO: Implémenter la comparaison avec la période précédente
    return {
        currentPeriod: calculateTotalConsumption(data),
        previousPeriod: calculateTotalConsumption(data) * 0.95 // Simulation
    };
}

// Mise à jour du tableau d'analyse
function updateAnalysisTable(data) {
    const deviceStats = calculateDeviceStats(data);
    const tbody = document.getElementById('analysisTableBody');
    
    tbody.innerHTML = Object.entries(deviceStats).map(([device, stats]) => `
        <tr>
            <td>${device}</td>
            <td>${stats.consumption.toFixed(2)} kWh</td>
            <td>${stats.percentage.toFixed(1)}%</td>
            <td>${stats.cost.toFixed(0)} FCFA</td>
            <td>${stats.usageTime.toFixed(1)} h</td>
            <td>
                <div class="progress">
                    <div class="progress-bar ${getEfficiencyClass(stats.efficiency)}" 
                         role="progressbar" 
                         style="width: ${stats.efficiency}%">
                        ${stats.efficiency}%
                    </div>
                </div>
            </td>
        </tr>
    `).join('');
}

// Calcul des statistiques par appareil
function calculateDeviceStats(data) {
    const deviceStats = {};
    const totalConsumption = calculateTotalConsumption(data);
    
    // Regrouper les données par appareil
    data.forEach(item => {
        const device = item.device;
        const power = parseFloat(item.power);
        const cost = parseFloat(item.cost);
        
        if (!deviceStats[device]) {
            deviceStats[device] = {
                consumption: 0,
                cost: 0,
                usageTime: 0,
                efficiency: 0
            };
        }
        
        deviceStats[device].consumption += power * 24 / 1000; // kWh
        deviceStats[device].cost += cost;
        deviceStats[device].usageTime += 1; // Heure
    });
    
    // Calculer les pourcentages et l'efficacité
    Object.values(deviceStats).forEach(stats => {
        stats.percentage = (stats.consumption / totalConsumption) * 100;
        stats.efficiency = calculateDeviceEfficiency(stats);
    });
    
    return deviceStats;
}

// Calcul de l'efficacité d'un appareil
function calculateDeviceEfficiency(stats) {
    // TODO: Implémenter un calcul d'efficacité plus sophistiqué
    return Math.min(100, Math.max(0, 100 - (stats.consumption / stats.usageTime) * 10));
}

// Obtention de la classe d'efficacité
function getEfficiencyClass(efficiency) {
    if (efficiency >= 80) return 'bg-success';
    if (efficiency >= 50) return 'bg-warning';
    return 'bg-danger';
}

// Mise à jour des recommandations
function updateRecommendations(data) {
    const recommendations = generateRecommendations(data);
    const container = document.getElementById('recommendationsList');
    
    container.innerHTML = recommendations.map(rec => `
        <div class="alert alert-info">
            <i class="bi bi-lightbulb me-2"></i>
            ${rec.message}
            ${rec.savings ? `<br><small>Économies potentielles : ${rec.savings}</small>` : ''}
        </div>
    `).join('');
}

// Génération des recommandations
function generateRecommendations(data) {
    const recommendations = [];
    const deviceStats = calculateDeviceStats(data);
    
    // Analyser chaque appareil
    Object.entries(deviceStats).forEach(([device, stats]) => {
        if (stats.efficiency < 50) {
            recommendations.push({
                message: `L'appareil "${device}" consomme beaucoup d'énergie. Pensez à l'éteindre quand il n'est pas utilisé.`,
                savings: `Économies potentielles : ${(stats.consumption * 0.2).toFixed(2)} kWh/jour`
            });
        }
        
        if (stats.usageTime > 20) {
            recommendations.push({
                message: `L'appareil "${device}" est utilisé ${stats.usageTime.toFixed(1)} heures par jour. Vérifiez s'il est bien nécessaire de le laisser allumé aussi longtemps.`,
                savings: `Économies potentielles : ${(stats.consumption * 0.1).toFixed(2)} kWh/jour`
            });
        }
    });
    
    // Recommandations générales
    const totalConsumption = calculateTotalConsumption(data);
    if (totalConsumption > 20) {
        recommendations.push({
            message: 'Votre consommation totale est élevée. Pensez à éteindre les appareils en veille et à optimiser l\'utilisation de vos équipements.',
            savings: 'Économies potentielles : 15-20% de votre consommation actuelle'
        });
    }
    
    return recommendations;
}

// Gestion du changement de période
function handlePeriodChange(event) {
    const period = event.target.value;
    const today = new Date();
    const startDate = new Date(today);
    
    switch (period) {
        case 'week':
            startDate.setDate(today.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(today.getMonth() - 1);
            break;
        case 'quarter':
            startDate.setMonth(today.getMonth() - 3);
            break;
        case 'year':
            startDate.setFullYear(today.getFullYear() - 1);
            break;
        case 'custom':
            return; // Ne rien faire pour la période personnalisée
    }
    
    STATE.period = period;
    STATE.startDate = startDate;
    STATE.endDate = today;
    
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
    
    fetchData();
}

// Gestion du changement de date
function handleDateChange(event) {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    
    if (startDate > endDate) {
        showAlert('La date de début doit être antérieure à la date de fin', 'warning');
        return;
    }
    
    STATE.startDate = startDate;
    STATE.endDate = endDate;
    STATE.period = 'custom';
    
    document.getElementById('analysisPeriod').value = 'custom';
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