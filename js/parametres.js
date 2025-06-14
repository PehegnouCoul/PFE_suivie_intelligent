// État de l'application
const STATE = {
    settings: {
        general: {
            kwhPrice: 114.29,
            consumptionGoal: 10,
            timezone: 'Africa/Dakar',
            darkMode: false
        },
        devices: [],
        alerts: {
            powerThreshold: 500,
            consumptionThreshold: 20,
            costThreshold: 2000,
            enablePowerAlerts: true,
            enableConsumptionAlerts: true,
            enableCostAlerts: true
        },
        notifications: {
            enabled: true,
            email: '',
            notifyAlerts: true,
            notifyReports: true,
            notifyAchievements: true
        },
        account: {
            username: '',
            email: '',
            password: ''
        }
    }
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadSettings();
});

// Initialisation de l'application
function initializeApp() {
    // Initialiser le menu des paramètres
    const menuItems = document.querySelectorAll('#settingsMenu a');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('href').substring(1);
            showSettingsSection(target);
        });
    });
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Formulaires
    document.getElementById('generalSettingsForm').addEventListener('submit', saveGeneralSettings);
    document.getElementById('alertsSettingsForm').addEventListener('submit', saveAlertsSettings);
    document.getElementById('notificationsSettingsForm').addEventListener('submit', saveNotificationsSettings);
    document.getElementById('accountSettingsForm').addEventListener('submit', saveAccountSettings);
    
    // Gestion des appareils
    document.getElementById('addDeviceForm').addEventListener('submit', saveDevice);
    
    // Mode sombre
    document.getElementById('darkMode').addEventListener('change', toggleDarkMode);
}

// Affichage d'une section de paramètres
function showSettingsSection(section) {
    // Mettre à jour le menu
    document.querySelectorAll('#settingsMenu a').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${section}`) {
            item.classList.add('active');
        }
    });
    
    // Afficher la section correspondante
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('show', 'active');
        if (pane.id === section) {
            pane.classList.add('show', 'active');
        }
    });
}

// Chargement des paramètres
async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des paramètres');
        }
        
        const settings = await response.json();
        STATE.settings = settings;
        
        // Mettre à jour l'interface
        updateGeneralSettings();
        updateDevicesList();
        updateAlertsSettings();
        updateNotificationsSettings();
        updateAccountSettings();
        
    } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
        showAlert('Erreur lors du chargement des paramètres', 'danger');
    }
}

// Mise à jour des paramètres généraux
function updateGeneralSettings() {
    const { general } = STATE.settings;
    
    document.getElementById('kwhPrice').value = general.kwhPrice;
    document.getElementById('consumptionGoal').value = general.consumptionGoal;
    document.getElementById('timezone').value = general.timezone;
    document.getElementById('darkMode').checked = general.darkMode;
}

// Mise à jour de la liste des appareils
function updateDevicesList() {
    const tbody = document.getElementById('devicesList');
    const { devices } = STATE.settings;
    
    tbody.innerHTML = devices.map(device => `
        <tr>
            <td>${device.name}</td>
            <td>${device.type}</td>
            <td>${device.power} W</td>
            <td>
                <span class="badge ${device.active ? 'bg-success' : 'bg-danger'}">
                    ${device.active ? 'Actif' : 'Inactif'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-info me-1" onclick="editDevice('${device.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteDevice('${device.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Mise à jour des paramètres d'alertes
function updateAlertsSettings() {
    const { alerts } = STATE.settings;
    
    document.getElementById('powerThreshold').value = alerts.powerThreshold;
    document.getElementById('consumptionThreshold').value = alerts.consumptionThreshold;
    document.getElementById('costThreshold').value = alerts.costThreshold;
    document.getElementById('enablePowerAlerts').checked = alerts.enablePowerAlerts;
    document.getElementById('enableConsumptionAlerts').checked = alerts.enableConsumptionAlerts;
    document.getElementById('enableCostAlerts').checked = alerts.enableCostAlerts;
}

// Mise à jour des paramètres de notifications
function updateNotificationsSettings() {
    const { notifications } = STATE.settings;
    
    document.getElementById('enableNotifications').checked = notifications.enabled;
    document.getElementById('notificationEmail').value = notifications.email;
    document.getElementById('notifyAlerts').checked = notifications.notifyAlerts;
    document.getElementById('notifyReports').checked = notifications.notifyReports;
    document.getElementById('notifyAchievements').checked = notifications.notifyAchievements;
}

// Mise à jour des paramètres du compte
function updateAccountSettings() {
    const { account } = STATE.settings;
    
    document.getElementById('username').value = account.username;
    document.getElementById('email').value = account.email;
}

// Sauvegarde des paramètres généraux
async function saveGeneralSettings(event) {
    event.preventDefault();
    
    const general = {
        kwhPrice: parseFloat(document.getElementById('kwhPrice').value),
        consumptionGoal: parseFloat(document.getElementById('consumptionGoal').value),
        timezone: document.getElementById('timezone').value,
        darkMode: document.getElementById('darkMode').checked
    };
    
    try {
        const response = await fetch('/api/settings/general', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(general)
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde des paramètres généraux');
        }
        
        STATE.settings.general = general;
        showAlert('Paramètres généraux sauvegardés avec succès', 'success');
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des paramètres généraux:', error);
        showAlert('Erreur lors de la sauvegarde des paramètres généraux', 'danger');
    }
}

// Sauvegarde des paramètres d'alertes
async function saveAlertsSettings(event) {
    event.preventDefault();
    
    const alerts = {
        powerThreshold: parseFloat(document.getElementById('powerThreshold').value),
        consumptionThreshold: parseFloat(document.getElementById('consumptionThreshold').value),
        costThreshold: parseFloat(document.getElementById('costThreshold').value),
        enablePowerAlerts: document.getElementById('enablePowerAlerts').checked,
        enableConsumptionAlerts: document.getElementById('enableConsumptionAlerts').checked,
        enableCostAlerts: document.getElementById('enableCostAlerts').checked
    };
    
    try {
        const response = await fetch('/api/settings/alerts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(alerts)
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde des paramètres d\'alertes');
        }
        
        STATE.settings.alerts = alerts;
        showAlert('Paramètres d\'alertes sauvegardés avec succès', 'success');
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des paramètres d\'alertes:', error);
        showAlert('Erreur lors de la sauvegarde des paramètres d\'alertes', 'danger');
    }
}

// Sauvegarde des paramètres de notifications
async function saveNotificationsSettings(event) {
    event.preventDefault();
    
    const notifications = {
        enabled: document.getElementById('enableNotifications').checked,
        email: document.getElementById('notificationEmail').value,
        notifyAlerts: document.getElementById('notifyAlerts').checked,
        notifyReports: document.getElementById('notifyReports').checked,
        notifyAchievements: document.getElementById('notifyAchievements').checked
    };
    
    try {
        const response = await fetch('/api/settings/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(notifications)
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde des paramètres de notifications');
        }
        
        STATE.settings.notifications = notifications;
        showAlert('Paramètres de notifications sauvegardés avec succès', 'success');
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des paramètres de notifications:', error);
        showAlert('Erreur lors de la sauvegarde des paramètres de notifications', 'danger');
    }
}

// Sauvegarde des paramètres du compte
async function saveAccountSettings(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword && newPassword !== confirmPassword) {
        showAlert('Les mots de passe ne correspondent pas', 'warning');
        return;
    }
    
    const account = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        currentPassword,
        newPassword
    };
    
    try {
        const response = await fetch('/api/settings/account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(account)
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour du compte');
        }
        
        STATE.settings.account = {
            username: account.username,
            email: account.email
        };
        
        // Réinitialiser les champs de mot de passe
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
        showAlert('Compte mis à jour avec succès', 'success');
        
    } catch (error) {
        console.error('Erreur lors de la mise à jour du compte:', error);
        showAlert('Erreur lors de la mise à jour du compte', 'danger');
    }
}

// Sauvegarde d'un appareil
async function saveDevice(event) {
    event.preventDefault();
    
    const device = {
        name: document.getElementById('deviceName').value,
        type: document.getElementById('deviceType').value,
        power: parseFloat(document.getElementById('devicePower').value),
        location: document.getElementById('deviceLocation').value,
        active: document.getElementById('deviceActive').checked
    };
    
    try {
        const response = await fetch('/api/devices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(device)
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de l\'ajout de l\'appareil');
        }
        
        const savedDevice = await response.json();
        STATE.settings.devices.push(savedDevice);
        
        // Fermer le modal et réinitialiser le formulaire
        const modal = bootstrap.Modal.getInstance(document.getElementById('addDeviceModal'));
        modal.hide();
        event.target.reset();
        
        // Mettre à jour la liste des appareils
        updateDevicesList();
        
        showAlert('Appareil ajouté avec succès', 'success');
        
    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'appareil:', error);
        showAlert('Erreur lors de l\'ajout de l\'appareil', 'danger');
    }
}

// Modification d'un appareil
async function editDevice(deviceId) {
    const device = STATE.settings.devices.find(d => d.id === deviceId);
    if (!device) return;
    
    // Remplir le formulaire
    document.getElementById('deviceName').value = device.name;
    document.getElementById('deviceType').value = device.type;
    document.getElementById('devicePower').value = device.power;
    document.getElementById('deviceLocation').value = device.location;
    document.getElementById('deviceActive').checked = device.active;
    
    // Afficher le modal
    const modal = new bootstrap.Modal(document.getElementById('addDeviceModal'));
    modal.show();
    
    // Modifier le comportement du formulaire pour la mise à jour
    const form = document.getElementById('addDeviceForm');
    form.onsubmit = async (event) => {
        event.preventDefault();
        
        const updatedDevice = {
            ...device,
            name: document.getElementById('deviceName').value,
            type: document.getElementById('deviceType').value,
            power: parseFloat(document.getElementById('devicePower').value),
            location: document.getElementById('deviceLocation').value,
            active: document.getElementById('deviceActive').checked
        };
        
        try {
            const response = await fetch(`/api/devices/${deviceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedDevice)
            });
            
            if (!response.ok) {
                throw new Error('Erreur lors de la modification de l\'appareil');
            }
            
            // Mettre à jour l'état
            const index = STATE.settings.devices.findIndex(d => d.id === deviceId);
            STATE.settings.devices[index] = updatedDevice;
            
            // Fermer le modal et réinitialiser le formulaire
            modal.hide();
            form.reset();
            form.onsubmit = saveDevice;
            
            // Mettre à jour la liste des appareils
            updateDevicesList();
            
            showAlert('Appareil modifié avec succès', 'success');
            
        } catch (error) {
            console.error('Erreur lors de la modification de l\'appareil:', error);
            showAlert('Erreur lors de la modification de l\'appareil', 'danger');
        }
    };
}

// Suppression d'un appareil
async function deleteDevice(deviceId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet appareil ?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/devices/${deviceId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la suppression de l\'appareil');
        }
        
        // Mettre à jour l'état
        STATE.settings.devices = STATE.settings.devices.filter(d => d.id !== deviceId);
        
        // Mettre à jour la liste des appareils
        updateDevicesList();
        
        showAlert('Appareil supprimé avec succès', 'success');
        
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'appareil:', error);
        showAlert('Erreur lors de la suppression de l\'appareil', 'danger');
    }
}

// Basculement du mode sombre
function toggleDarkMode(event) {
    const darkMode = event.target.checked;
    document.body.classList.toggle('dark-mode', darkMode);
    
    // Sauvegarder le paramètre
    STATE.settings.general.darkMode = darkMode;
    saveGeneralSettings({ preventDefault: () => {} });
}

// Export des données
function exportData(format) {
    const data = {
        settings: STATE.settings,
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob(
        [format === 'csv' ? convertToCSV(data) : JSON.stringify(data, null, 2)],
        { type: format === 'csv' ? 'text/csv' : 'application/json' }
    );
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `parametres_${new Date().toISOString().split('T')[0]}.${format}`;
    link.click();
}

// Import des données
async function importData() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showAlert('Veuillez sélectionner un fichier', 'warning');
        return;
    }
    
    try {
        const text = await file.text();
        const data = file.name.endsWith('.json') ? JSON.parse(text) : parseCSV(text);
        
        // Valider les données
        if (!validateSettings(data)) {
            throw new Error('Format de données invalide');
        }
        
        // Demander confirmation
        if (!confirm('Voulez-vous vraiment importer ces paramètres ? Cela écrasera vos paramètres actuels.')) {
            return;
        }
        
        // Mettre à jour les paramètres
        STATE.settings = data.settings;
        
        // Sauvegarder sur le serveur
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data.settings)
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde des paramètres importés');
        }
        
        // Mettre à jour l'interface
        updateGeneralSettings();
        updateDevicesList();
        updateAlertsSettings();
        updateNotificationsSettings();
        updateAccountSettings();
        
        showAlert('Paramètres importés avec succès', 'success');
        
    } catch (error) {
        console.error('Erreur lors de l\'import des paramètres:', error);
        showAlert('Erreur lors de l\'import des paramètres', 'danger');
    }
}

// Sauvegarde des paramètres
function backupSettings() {
    const data = {
        settings: STATE.settings,
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_parametres_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Restauration des paramètres
async function restoreSettings() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Valider les données
            if (!validateSettings(data)) {
                throw new Error('Format de sauvegarde invalide');
            }
            
            // Demander confirmation
            if (!confirm('Voulez-vous vraiment restaurer cette sauvegarde ? Cela écrasera vos paramètres actuels.')) {
                return;
            }
            
            // Mettre à jour les paramètres
            STATE.settings = data.settings;
            
            // Sauvegarder sur le serveur
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data.settings)
            });
            
            if (!response.ok) {
                throw new Error('Erreur lors de la restauration des paramètres');
            }
            
            // Mettre à jour l'interface
            updateGeneralSettings();
            updateDevicesList();
            updateAlertsSettings();
            updateNotificationsSettings();
            updateAccountSettings();
            
            showAlert('Paramètres restaurés avec succès', 'success');
            
        } catch (error) {
            console.error('Erreur lors de la restauration des paramètres:', error);
            showAlert('Erreur lors de la restauration des paramètres', 'danger');
        }
    };
    
    fileInput.click();
}

// Conversion des données en CSV
function convertToCSV(data) {
    const settings = data.settings;
    const rows = [];
    
    // En-têtes
    rows.push(['Section', 'Paramètre', 'Valeur']);
    
    // Paramètres généraux
    Object.entries(settings.general).forEach(([key, value]) => {
        rows.push(['Général', key, value]);
    });
    
    // Appareils
    settings.devices.forEach(device => {
        Object.entries(device).forEach(([key, value]) => {
            rows.push(['Appareil', `${device.name}.${key}`, value]);
        });
    });
    
    // Alertes
    Object.entries(settings.alerts).forEach(([key, value]) => {
        rows.push(['Alertes', key, value]);
    });
    
    // Notifications
    Object.entries(settings.notifications).forEach(([key, value]) => {
        rows.push(['Notifications', key, value]);
    });
    
    // Compte
    Object.entries(settings.account).forEach(([key, value]) => {
        if (key !== 'password') {
            rows.push(['Compte', key, value]);
        }
    });
    
    return rows.map(row => row.join(',')).join('\n');
}

// Analyse du CSV
function parseCSV(text) {
    const rows = text.split('\n').map(row => row.split(','));
    const headers = rows[0];
    const data = { settings: {} };
    
    // Initialiser les sections
    data.settings.general = {};
    data.settings.devices = [];
    data.settings.alerts = {};
    data.settings.notifications = {};
    data.settings.account = {};
    
    // Parcourir les lignes
    for (let i = 1; i < rows.length; i++) {
        const [section, key, value] = rows[i];
        
        switch (section) {
            case 'Général':
                data.settings.general[key] = value;
                break;
            case 'Appareil':
                const [deviceName, deviceKey] = key.split('.');
                let device = data.settings.devices.find(d => d.name === deviceName);
                if (!device) {
                    device = { name: deviceName };
                    data.settings.devices.push(device);
                }
                device[deviceKey] = value;
                break;
            case 'Alertes':
                data.settings.alerts[key] = value;
                break;
            case 'Notifications':
                data.settings.notifications[key] = value;
                break;
            case 'Compte':
                data.settings.account[key] = value;
                break;
        }
    }
    
    return data;
}

// Validation des paramètres
function validateSettings(data) {
    return data &&
           data.settings &&
           data.settings.general &&
           data.settings.devices &&
           data.settings.alerts &&
           data.settings.notifications &&
           data.settings.account;
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