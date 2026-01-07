// --- DATA MANAGEMENT ---
// Ambil data dari LocalStorage atau buat array kosong
let reminders = JSON.parse(localStorage.getItem('reminders')) || [];
let chores = JSON.parse(localStorage.getItem('chores')) || [];
let titipan = JSON.parse(localStorage.getItem('titipan')) || [];
const userName = localStorage.getItem('userName') || "Kamu";

// --- INIT APP ---
document.addEventListener('DOMContentLoaded', () => {
    updateGreeting();
    renderAll();
    
    // Set default view
    switchTab('home');
});

function saveData() {
    localStorage.setItem('reminders', JSON.stringify(reminders));
    localStorage.setItem('chores', JSON.stringify(chores));
    localStorage.setItem('titipan', JSON.stringify(titipan));
    renderAll(); // Refresh tampilan setiap kali simpan
}

// --- RENDERING FUNCTIONS ---

function renderAll() {
    renderHomeStats();
    renderReminders();
    renderChores();
    renderTitipan();
}

function updateGreeting() {
    const hour = new Date().getHours();
    let text = "Halo,";
    if (hour < 11) text = "Selamat Pagi,";
    else if (hour < 15) text = "Selamat Siang,";
    else if (hour < 18) text = "Selamat Sore,";
    else text = "Selamat Malam,";
    
    document.getElementById('greeting-text').innerText = `${text} ${userName}`;
    
    // Update Tanggal
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    document.getElementById('date-text').innerText = new Date().toLocaleDateString('id-ID', options);
}

function renderHomeStats() {
    // Hitung item yang BELUM selesai
    const activeReminders = reminders.filter(i => !i.done).length;
    const activeChores = chores.filter(i => !i.done).length;
    const activeTitipan = titipan.filter(i => !i.done).length;

    document.getElementById('count-reminder').innerText = activeReminders;
    document.getElementById('count-chores').innerText = activeChores;
    document.getElementById('count-titipan').innerText = activeTitipan;
}

// 1. RENDER REMINDER
function renderReminders() {
    const container = document.getElementById('list-reminder');
    container.innerHTML = '';
    
    // Sort: yang belum selesai di atas
    reminders.sort((a, b) => a.done - b.done);

    reminders.forEach(item => {
        const timeStr = new Date(item.waktu).toLocaleString('id-ID', {weekday:'short', hour:'2-digit', minute:'2-digit'});
        
        container.innerHTML += `
        <div class="card-item type-reminder ${item.done ? 'done' : ''}">
            <div class="card-header">
                <span class="card-tag">${item.kategori}</span>
                <div class="card-time"><i class="fa-regular fa-clock"></i> ${timeStr}</div>
            </div>
            <div class="card-title">${item.judul}</div>
            <div class="card-desc">${item.catatan}</div>
            <div class="card-actions">
                <button class="btn-icon btn-check" onclick="toggleStatus('reminders', ${item.id})">
                    <i class="fa-solid fa-circle-check"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteItem('reminders', ${item.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>`;
    });
}

// 2. RENDER CHORES
function renderChores() {
    const container = document.getElementById('list-chores');
    container.innerHTML = '';

    chores.forEach(item => {
        container.innerHTML += `
        <div class="card-item type-chore ${item.done ? 'done' : ''}" style="display:flex; align-items:center; justify-content:space-between;">
            <div onclick="toggleStatus('chores', ${item.id})" style="flex:1; cursor:pointer;">
                <div class="card-title" style="margin:0;">
                    <i class="fa-solid ${item.done ? 'fa-square-check' : 'fa-square'}" style="color:var(--primary); margin-right:10px;"></i>
                    ${item.judul}
                </div>
            </div>
            <button class="btn-icon btn-delete" onclick="deleteItem('chores', ${item.id})">×</button>
        </div>`;
    });
}

// 3. RENDER TITIPAN
function renderTitipan() {
    const container = document.getElementById('list-titipan');
    const keyword = document.getElementById('search-titipan').value.toLowerCase();
    container.innerHTML = '';

    titipan.forEach(item => {
        // Filter Pencarian
        if(keyword && !item.nama.toLowerCase().includes(keyword) && !item.dari.toLowerCase().includes(keyword)) return;

        let badgeStatus = item.done ? '<span class="badge bg-green">Selesai</span>' : '<span class="badge bg-yellow">Pending</span>';
        let urgentClass = (item.urgent && !item.done) ? 'urgent' : '';
        let urgentBadge = (item.urgent && !item.done) ? '<span class="badge bg-red">URGENT</span>' : '';

        container.innerHTML += `
        <div class="card-item type-titipan ${urgentClass} ${item.done ? 'done' : ''}">
            <div class="card-header">
                <span class="card-tag">${item.jenis}</span>
                <div>${urgentBadge} ${badgeStatus}</div>
            </div>
            <div class="card-title">${item.nama}</div>
            <div class="card-desc">
                <strong>Dari:</strong> ${item.dari}<br>
                <strong>Aksi:</strong> ${item.aksi}<br>
                <em>"${item.keterangan}"</em>
            </div>
            <div class="card-actions">
                 <button class="btn-icon btn-check" onclick="toggleStatus('titipan', ${item.id})">
                    ${item.done ? 'Batal' : 'Tandai Selesai'}
                </button>
                <button class="btn-icon btn-delete" onclick="deleteItem('titipan', ${item.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>`;
    });
}

// --- ADD ITEM FUNCTIONS ---

function addReminder() {
   const judul = document.getElementById('rem-judul').value;
    const kategori = document.getElementById('rem-kategori').value;
    const waktu = document.getElementById('rem-waktu').value;
    const catatan = document.getElementById('rem-catatan').value;

    if(!judul || !waktu) return alert("Judul dan Waktu wajib diisi!");

    // TAMBAHKAN properti 'notified: false' di sini
    reminders.push({ 
        id: Date.now(), 
        judul, 
        kategori, 
        waktu, 
        catatan, 
        done: false, 
        notified: false // <-- Penting untuk logika notifikasi
    });
    
    saveData();
    closeModal('modal-reminder');
    document.getElementById('rem-judul').value = '';
    
    // Minta izin notifikasi lagi (jaga-jaga kalau user tadi menolak/lupa)
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
}

function addChore() {
    const judul = document.getElementById('chore-judul').value;
    if(!judul) return;

    chores.push({ id: Date.now(), judul, done: false });
    saveData();
    closeModal('modal-chores');
    document.getElementById('chore-judul').value = '';
}

function addTitipan() {
    const nama = document.getElementById('titip-barang').value;
    const dari = document.getElementById('titip-dari').value;
    const jenis = document.getElementById('titip-jenis').value;
    const aksi = document.getElementById('titip-aksi').value;
    const keterangan = document.getElementById('titip-ket').value;
    const urgent = document.getElementById('titip-urgent').checked;

    if(!nama) return alert("Nama barang wajib diisi!");

    titipan.push({ id: Date.now(), nama, dari, jenis, aksi, keterangan, urgent, done: false });
    saveData();
    closeModal('modal-titipan');
    // Reset
    document.getElementById('titip-barang').value = '';
}

// --- UTILITIES ---

function toggleStatus(type, id) {
    if(type === 'reminders') {
        const item = reminders.find(i => i.id === id);
        item.done = !item.done;
    } else if (type === 'chores') {
        const item = chores.find(i => i.id === id);
        item.done = !item.done;
    } else if (type === 'titipan') {
        const item = titipan.find(i => i.id === id);
        item.done = !item.done;
    }
    saveData();
}

function deleteItem(type, id) {
    if(!confirm("Hapus item ini?")) return;

    if(type === 'reminders') reminders = reminders.filter(i => i.id !== id);
    else if(type === 'chores') chores = chores.filter(i => i.id !== id);
    else if(type === 'titipan') titipan = titipan.filter(i => i.id !== id);
    
    saveData();
}

function switchTab(tabName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    // Show selected view
    document.getElementById(`view-${tabName}`).classList.add('active');
    
    // Update active nav icon
    // (Simplifikasi: cari link yang onclick-nya mengandung nama tab)
    const navs = document.querySelectorAll('.nav-item');
    if(tabName === 'home') navs[0].classList.add('active');
    else if(tabName === 'reminder') navs[1].classList.add('active');
    else if(tabName === 'chores') navs[2].classList.add('active');
    else if(tabName === 'titipan') navs[3].classList.add('active');
}

function openModal(id) {
    document.getElementById(id).classList.add('open');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

function openSettings() {
    const newName = prompt("Siapa nama panggilanmu?", userName);
    if(newName) {
        localStorage.setItem('userName', newName);
        location.reload();
    }
}

/* --- FITUR NOTIFIKASI OTOMATIS (AUTO REMINDER) --- */

// 1. Minta Izin Notifikasi saat Aplikasi Dibuka
if ("Notification" in window) {
    // Jika user belum pernah ditanya, minta izin
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("Notifikasi diizinkan!");
            }
        });
    }
}

// 2. Fungsi Cek Jadwal (Jalan setiap 1 menit)
setInterval(() => {
    checkReminders();
}, 60000); // 60000 ms = 1 menit

function checkReminders() {
    // Ambil waktu sekarang format: YYYY-MM-DDTHH:MM
    const now = new Date();
    // Trik konversi waktu lokal Indonesia ke format input datetime-local
    // (Menggeser waktu sesuai zona waktu user agar pas)
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - offset)).toISOString().slice(0, 16);

    // Cek semua reminder
    reminders.forEach(item => {
        // Jika waktu sama persis DAN belum selesai DAN belum dinotifikasi
        if (item.waktu === localISOTime && !item.done && !item.notified) {
            
            // A. Tampilkan Notifikasi Browser (Pop-up System)
            if (Notification.permission === "granted") {
                new Notification(`🔔 Waktunya: ${item.judul}`, {
                    body: item.catatan || `Kategori: ${item.kategori}`,
                    icon: "https://cdn-icons-png.flaticon.com/512/3239/3239952.png" // Ikon Lonceng
                });
            }

            // B. Tampilkan Alert di dalam Aplikasi (Backup)
            alert(`🔔 REMINDER!\n\nWaktunya: ${item.judul}\n(${item.kategori})`);

            // Tandai sudah dinotifikasi agar tidak spam alert berkali-kali
            item.notified = true;
            saveData();
        }
    });
}