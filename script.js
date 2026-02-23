const FARMS_DATA = [
    {
        id: 1,
        nome: "PARAÍSO",
        tratores: [
            { id: 101, nome: "TR01 – MF 4275 PLATAFORMADO" },
            { id: 102, nome: "TR02 – NEW HOLLAND" },
            { id: 103, nome: "TR03 – MF 4275" },
            { id: 104, nome: "TR04 – MF 4275" },
            { id: 105, nome: "TR05 – YANMAR 1050" },
            { id: 106, nome: "TR06 – MF 4275 PLATAFORMADO" },
            { id: 107, nome: "TR07 – MF 290" },
            { id: 108, nome: "TR08 – MF 3307" },
            { id: 109, nome: "TR09 – JOHN DEERE 5425" },
            { id: 110, nome: "TR10 – MF 4275" },
            { id: 111, nome: "TR11 – MF 3307" },
            { id: 112, nome: "TR12 – NEW HOLLAND" },
            { id: 113, nome: "TR13 – NEW HOLLAND" },
            { id: 114, nome: "TR14 – JOHN DEERE 5080E" }
        ]
    },
    {
        id: 2,
        nome: "RANCHARIA",
        tratores: [
            { id: 201, nome: "TR01 – MF 265" },
            { id: 202, nome: "TR02 – MF 4275" },
            { id: 203, nome: "TR03 – MF 3307" },
            { id: 204, nome: "TR04 – MF 3307" },
            { id: 205, nome: "TR05 – NEW HOLLAND" },
            { id: 206, nome: "TR06 – JOHN DEERE 5080E" }
        ]
    },
    {
        id: 3,
        nome: "SÃO JOSÉ",
        tratores: [
            { id: 301, nome: "TR01 – YANMAR 1050" },
            { id: 302, nome: "TR02 – MF 4275" },
            { id: 303, nome: "TR03 – MF 4275" },
            { id: 304, nome: "TR04 – MF 3307" },
            { id: 305, nome: "TR05 – NEW HOLLAND" },
            { id: 306, nome: "TR06 – YANMAR SOLIS 75" }
        ]
    },
    {
        id: 4,
        nome: "MARIA TEREZA",
        tratores: [
            { id: 401, nome: "TR01 – MF 4275" },
            { id: 402, nome: "TR02 – MF 4275" },
            { id: 403, nome: "TR03 – NEW HOLLAND" }
        ]
    },
    {
        id: 5,
        nome: "C2",
        tratores: [
            { id: 501, nome: "TR01 – MF 4275 PLATAFORMADO" },
            { id: 502, nome: "TR02 – MF 4275" },
            { id: 503, nome: "TR03 – MF 4275" },
            { id: 504, nome: "TR04 – NEW HOLLAND" },
            { id: 505, nome: "TR05 – MF 3307" },
            { id: 506, nome: "TR06 – MF 265" },
            { id: 507, nome: "TR07 – MF 275" },
            { id: 508, nome: "TR08 – YANMAR 1050" },
            { id: 509, nome: "TR09 – NEW HOLLAND" },
            { id: 510, nome: "TR10 – YANMAR SOLIS" }
        ]
    },
    {
        id: 6,
        nome: "CURAÇÁ",
        tratores: [
            { id: 601, nome: "TR01 – MF 275" },
            { id: 602, nome: "TR02 – MF 290" },
            { id: 603, nome: "TR03 – MF 4275" },
            { id: 604, nome: "TR04 – MF 3307" },
            { id: 605, nome: "TR05 – YANMAR 1050" },
            { id: 606, nome: "TR06 – NEW HOLLAND" },
            { id: 607, nome: "TR07 – NEW HOLLAND" },
            { id: 608, nome: "TR08 – YANMAR SOLIS 75 (2025)" }
        ]
    },
    {
        id: 7,
        nome: "CASA NOVA",
        tratores: [
            { id: 701, nome: "TR01 – MF 4275" },
            { id: 702, nome: "TR02 – MF 4275" },
            { id: 703, nome: "TR03 – JOHN DEERE 5075E (2012)" }
        ]
    }
];

const CHECKLIST_ITEMS = [
    "Nível de Óleo Hidráulico",
    "Vazamento de Óleo",
    "Mangueiras em Geral",
    "Nível de Óleo da Transmissão",
    "Acionamento do Braço Oscilante",
    "Freio Estacionário",
    "Cinto de Segurança",
    "Proteção da TDP",
    "Possui Trincas",
    "Pontos de Lubrificação",
    "Calibração dos Pneus Dianteiros",
    "Conservação dos Pneus Dianteiros",
    "Calibração dos Pneus Traseiros",
    "Conservação dos Pneus Traseiros",
    "Nível de Óleo do Motor",
    "Vazamento no Motor",
    "Nível de Água do Radiador",
    "Correias do Motor",
    "Assento ou Poltrona",
    "Limpeza",
    "Limpador de Para-brisa",
    "Luzes do Painel",
    "Manômetro de Temperatura",
    "Manômetro do Óleo do Motor",
    "Retrovisores"
];

// State
let currentStep = 'HOME';
let selectedFarm = null;
let selectedTractor = null;
let responses = {};
let photo = null;
let allChecklists = JSON.parse(localStorage.getItem('all_checklists') || '[]');

// Initialize
function init() {
    lucide.createIcons();
    renderFarms();
    renderChecklistItems();
    renderReports();
}

// Navigation
function showStep(step) {
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');
    currentStep = step;

    // Header Home button visibility
    const btnHome = document.getElementById('btn-home');
    if (step === 'HOME' || step === 'SUCCESS') {
        btnHome.classList.add('hidden');
    } else {
        btnHome.classList.remove('hidden');
    }

    // Status bar visibility
    const statusBar = document.getElementById('status-bar');
    if (step === 'FORM') {
        statusBar.classList.remove('hidden');
    } else {
        statusBar.classList.add('hidden');
    }

    if (step === 'REPORTS') renderReports();
    
    window.scrollTo(0, 0);
    lucide.createIcons();
}

// Renderers
function renderFarms() {
    const container = document.getElementById('farm-list');
    container.innerHTML = FARMS_DATA.map(farm => `
        <button onclick="selectFarm(${farm.id})" class="p-6 bg-white rounded-2xl shadow-sm border border-stone-200 flex items-center justify-between hover:border-emerald-500 hover:bg-emerald-50 active:scale-95 transition-all">
            <div class="flex items-center gap-4">
                <div class="p-3 bg-emerald-100 rounded-xl text-emerald-700">
                    <i data-lucide="map-pin"></i>
                </div>
                <span class="text-xl font-semibold">${farm.nome}</span>
            </div>
            <i data-lucide="arrow-right" class="text-stone-400"></i>
        </button>
    `).join('');
    lucide.createIcons();
}

function selectFarm(farmId) {
    selectedFarm = FARMS_DATA.find(f => f.id === farmId);
    document.getElementById('selected-farm-name').textContent = selectedFarm.nome;
    
    const container = document.getElementById('tractor-list');
    container.innerHTML = selectedFarm.tratores.map(tractor => `
        <button onclick="selectTractor(${tractor.id})" class="p-6 bg-white rounded-2xl shadow-sm border border-stone-200 flex items-center justify-between hover:border-emerald-500 hover:bg-emerald-50 active:scale-95 transition-all">
            <div class="flex items-center gap-4">
                <div class="p-3 bg-emerald-100 rounded-xl text-emerald-700">
                    <i data-lucide="tractor"></i>
                </div>
                <span class="text-xl font-semibold">${tractor.nome}</span>
            </div>
            <i data-lucide="arrow-right" class="text-stone-400"></i>
        </button>
    `).join('');
    
    showStep('TRACTOR');
}

function selectTractor(tractorId) {
    selectedTractor = selectedFarm.tratores.find(t => t.id === tractorId);
    document.getElementById('selected-tractor-info').textContent = `${selectedTractor.nome} • ${selectedFarm.nome}`;
    
    // Reset responses
    responses = {};
    CHECKLIST_ITEMS.forEach(item => responses[item] = 'C');
    renderChecklistItems();
    updateStatusBar();
    
    showStep('FORM');
}

function renderChecklistItems() {
    const container = document.getElementById('checklist-items-container');
    // Keep the header
    const header = container.querySelector('h3');
    container.innerHTML = '';
    container.appendChild(header);

    CHECKLIST_ITEMS.forEach(item => {
        const div = document.createElement('div');
        const isNC = responses[item] === 'NC';
        div.className = `bg-white p-5 rounded-2xl shadow-sm transition-all border-2 ${isNC ? 'border-red-500 bg-red-50/30' : 'border-transparent'}`;
        div.id = `item-${item.replace(/\s+/g, '-')}`;
        
        div.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <p class="font-bold text-stone-800">${item}</p>
                ${isNC ? '<i data-lucide="alert-circle" class="w-5 h-5 text-red-600 animate-pulse"></i>' : ''}
            </div>
            <div class="grid grid-cols-3 gap-2">
                <button type="button" onclick="updateItemStatus('${item}', 'C')" class="py-3 rounded-xl font-bold transition-all ${responses[item] === 'C' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-stone-100 text-stone-500'}">C</button>
                <button type="button" onclick="updateItemStatus('${item}', 'NC')" class="py-3 rounded-xl font-bold transition-all ${responses[item] === 'NC' ? 'bg-red-600 text-white shadow-lg' : 'bg-stone-100 text-stone-500'}">NC</button>
                <button type="button" onclick="updateItemStatus('${item}', 'N/A')" class="py-3 rounded-xl font-bold transition-all ${responses[item] === 'N/A' ? 'bg-stone-500 text-white shadow-lg' : 'bg-stone-100 text-stone-500'}">N/A</button>
            </div>
        `;
        container.appendChild(div);
    });
    lucide.createIcons();
}

function updateItemStatus(item, status) {
    responses[item] = status;
    renderChecklistItems();
    updateStatusBar();
}

function updateStatusBar() {
    const isProblematic = Object.values(responses).some(s => s === 'NC');
    const statusBar = document.getElementById('status-bar');
    const statusText = document.getElementById('status-text');
    const photoLabel = document.getElementById('photo-required-label');
    const btnSubmit = document.getElementById('btn-submit');

    if (isProblematic) {
        statusBar.classList.replace('bg-emerald-600', 'bg-red-600');
        statusText.textContent = 'URGENTE';
        photoLabel.classList.remove('hidden');
        btnSubmit.classList.replace('bg-emerald-600', 'bg-red-600');
        btnSubmit.classList.replace('hover:bg-emerald-700', 'hover:bg-red-700');
    } else {
        statusBar.classList.replace('bg-red-600', 'bg-emerald-600');
        statusText.textContent = 'NORMAL';
        photoLabel.classList.add('hidden');
        btnSubmit.classList.replace('bg-red-600', 'bg-emerald-600');
        btnSubmit.classList.replace('hover:bg-red-700', 'hover:bg-emerald-700');
    }
}

// Camera
let stream = null;
async function startCamera() {
    const modal = document.getElementById('camera-modal');
    const video = document.getElementById('camera-video');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
    } catch (err) {
        console.error(err);
        alert("Erro ao acessar a câmera.");
        stopCamera();
    }
}

function stopCamera() {
    const modal = document.getElementById('camera-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
}

function capturePhoto() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    photo = canvas.toDataURL('image/jpeg', 0.7);
    
    document.getElementById('photo-preview').src = photo;
    document.getElementById('photo-preview-container').classList.remove('hidden');
    document.getElementById('btn-take-photo').classList.add('hidden');
    
    stopCamera();
    lucide.createIcons();
}

function removePhoto() {
    photo = null;
    document.getElementById('photo-preview-container').classList.add('hidden');
    document.getElementById('btn-take-photo').classList.remove('hidden');
}

// Form Submission
document.getElementById('checklist-form').onsubmit = function(e) {
    e.preventDefault();
    
    const operador = document.getElementById('input-operador').value;
    const horimetro = document.getElementById('input-horimetro').value;
    const observacoes = document.getElementById('input-observacoes').value;
    const isProblematic = Object.values(responses).some(s => s === 'NC');

    if (isProblematic && !photo) {
        alert("Uma foto é obrigatória quando há itens não conformes (NC).");
        return;
    }

    const report = {
        id: Date.now(),
        data: new Date().toLocaleString('pt-BR'),
        operador,
        horimetro,
        fazenda_nome: selectedFarm.nome,
        trator_nome: selectedTractor.nome,
        respostas: responses,
        observacoes,
        foto: photo,
        status_geral: isProblematic ? 'URGENTE' : 'NORMAL'
    };

    allChecklists.unshift(report);
    localStorage.setItem('all_checklists', JSON.stringify(allChecklists));
    
    showStep('SUCCESS');
};

function resetForm() {
    document.getElementById('checklist-form').reset();
    removePhoto();
    showStep('HOME');
}

// Reports
function renderReports() {
    const container = document.getElementById('reports-container');
    if (allChecklists.length === 0) {
        container.innerHTML = `
            <div class="bg-white p-12 rounded-3xl text-center shadow-sm">
                <i data-lucide="file-text" class="w-16 h-16 text-stone-300 mx-auto mb-4"></i>
                <p class="text-stone-500 text-lg">Nenhum checklist encontrado.</p>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="space-y-4">
                <!-- Mobile View -->
                <div class="md:hidden space-y-4">
                    ${allChecklists.map(c => `
                        <div class="bg-white p-5 rounded-2xl shadow-sm border-l-4 ${c.status_geral === 'URGENTE' ? 'border-red-500' : 'border-emerald-500'}">
                            <div class="flex justify-between items-start mb-2">
                                <span class="text-xs font-bold text-stone-400">${c.data}</span>
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${c.status_geral === 'URGENTE' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}">
                                    ${c.status_geral}
                                </span>
                            </div>
                            <h4 class="font-bold text-lg">${c.trator_nome}</h4>
                            <p class="text-sm text-stone-500 mb-3">${c.fazenda_nome} • ${c.operador}</p>
                            <div class="text-xs text-stone-600 line-clamp-2 italic">
                                ${c.observacoes || "Sem observações"}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Desktop View -->
                <div class="hidden md:block overflow-hidden bg-white rounded-2xl shadow-sm border border-stone-200">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-stone-50 border-b border-stone-200">
                                <th class="p-4 font-bold text-stone-600 text-sm">DATA</th>
                                <th class="p-4 font-bold text-stone-600 text-sm">OPERADOR</th>
                                <th class="p-4 font-bold text-stone-600 text-sm">FAZENDA</th>
                                <th class="p-4 font-bold text-stone-600 text-sm">TRATOR</th>
                                <th class="p-4 font-bold text-stone-600 text-sm">STATUS</th>
                                <th class="p-4 font-bold text-stone-600 text-sm">OBS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allChecklists.map(c => `
                                <tr class="border-t border-stone-100 hover:bg-stone-50 transition-colors">
                                    <td class="p-4 text-sm">${c.data}</td>
                                    <td class="p-4 text-sm font-medium">${c.operador}</td>
                                    <td class="p-4 text-sm">${c.fazenda_nome}</td>
                                    <td class="p-4 text-sm">${c.trator_nome}</td>
                                    <td class="p-4">
                                        <span class="px-2 py-1 rounded text-xs font-bold ${c.status_geral === 'URGENTE' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}">
                                            ${c.status_geral}
                                        </span>
                                    </td>
                                    <td class="p-4 text-sm text-stone-400 truncate max-w-[150px]">${c.observacoes || "-"}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    lucide.createIcons();
}

// Export
function exportToExcel() {
    if (allChecklists.length === 0) return alert("Nenhum dado para exportar.");
    
    const data = allChecklists.map(c => {
        const row = {
            'Data': c.data,
            'Operador': c.operador,
            'Fazenda': c.fazenda_nome,
            'Trator': c.trator_nome,
            'Horímetro': c.horimetro,
            'Status Geral': c.status_geral,
            'Observações': c.observacoes
        };
        Object.entries(c.respostas).forEach(([item, status]) => {
            row[item] = status;
        });
        return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Checklists");
    XLSX.writeFile(wb, `Relatorio_Checklist_${new Date().toISOString().split('T')[0]}.xlsx`);
}

function exportToPDF() {
    if (allChecklists.length === 0) return alert("Nenhum dado para exportar.");
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.text("Relatório de Checklists de Tratores", 14, 15);
    
    const tableData = allChecklists.map(c => [
        c.data,
        c.operador,
        c.fazenda_nome,
        c.trator_nome,
        c.status_geral,
        c.observacoes || '-'
    ]);

    doc.autoTable({
        head: [['Data', 'Operador', 'Fazenda', 'Trator', 'Status', 'Observações']],
        body: tableData,
        startY: 20,
        theme: 'grid',
        headStyles: { fillStyle: [5, 150, 105] }
    });

    doc.save(`Relatorio_Checklist_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Start
init();
