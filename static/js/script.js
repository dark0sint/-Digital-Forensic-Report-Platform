let cases = [];
let currentCase = null;
let timelineChart;
let map;

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    // Fetch cases from API
    const response = await fetch('/api/cases');
    cases = await response.json();

    // Populate sidebar
    const caseList = document.getElementById('case-list');
    cases.forEach(caseData => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = caseData.title;
        button.onclick = () => loadCase(caseData.id);
        li.appendChild(button);
        caseList.appendChild(li);
    });

    // Initialize map (empty at first)
    map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
});

// Load a specific case
async function loadCase(caseId) {
    const response = await fetch(`/api/case/${caseId}`);
    currentCase = await response.json();

    if (currentCase.error) {
        alert('Case not found');
        return;
    }

    // Update summary
    document.getElementById('case-title').textContent = currentCase.title;
    document.getElementById('case-summary').textContent = currentCase.summary;
    document.getElementById('case-details').textContent = currentCase.details;

    // Show/hide sections
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('hidden'));
    document.getElementById('summary').classList.remove('hidden');
    document.getElementById('details-section').classList.remove('hidden');

    // Update graph
    updateTimelineGraph();

    // Update map
    updateMap();
}

// Update timeline graph using Chart.js
function updateTimelineGraph() {
    const ctx = document.getElementById('timeline-chart').getContext('2d');
    if (timelineChart) {
        timelineChart.destroy();
    }

    const labels = currentCase.timeline.map(item => item.date);
    const data = currentCase.timeline.map(item => item.value);
    const events = currentCase.timeline.map(item => item.event);

    timelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Event Severity (Scale 0-10)',
                data: data,
                borderColor: '#ff4500',
                backgroundColor: 'rgba(255, 69, 0, 0.2)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            return events[context.dataIndex];
                        }
                    }
                }
            }
        }
    });
}

// Update map with locations
function updateMap() {
    // Clear existing markers
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    currentCase.locations.forEach(loc => {
        L.marker([loc.lat, loc.lng])
            .addTo(map)
            .bindPopup(`<b>${loc.desc}</b>`)
            .openPopup();
    });

    // Fit map to markers
    if (currentCase.locations.length > 0) {
        const group = new L.featureGroup(currentCase.locations.map(loc => L.marker([loc.lat, loc.lng])));
        map.fitBounds(group.getBounds());
    }
}
