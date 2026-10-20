/* ================= Pengaturan & helper ================= */
const KATEGORI = ["Bahan Makanan", "Minuman", "Kebersihan", "Perlengkapan Mandi", "Lainnya"];
const KEY = { b: "stocklyBarang", k: "stocklyKebutuhan", r: "stocklyRiwayat", u: "stocklyUser" };
const JUDUL = { beranda: "Beranda", stok: "Daftar Stok", kebutuhan: "Kebutuhan", riwayat: "Riwayat" };
const URUT_STATUS = { Habis: 0, Menipis: 1, Aman: 2 };

const $ = (s) => document.querySelector(s);
const baca = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? d : v; } catch (e) { return d; } };
const simpan = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ================= Sesi pengguna ================= */
const user = baca(KEY.u, null);
if (!user) location.href = "Login.html";   // hapus baris ini jika ingin membuka Beranda tanpa login
const namaUser = (user && user.name) || "Pengguna";

/* ================= Data ================= */
const contohBarang = () => [
    { id: uid(), nama: "Beras", kategori: "Bahan Makanan", jumlah: 8, satuan: "kg", min: 3 },
    { id: uid(), nama: "Minyak Goreng", kategori: "Bahan Makanan", jumlah: 2, satuan: "liter", min: 2 },
    { id: uid(), nama: "Gula", kategori: "Bahan Makanan", jumlah: 0, satuan: "kg", min: 2 },
    { id: uid(), nama: "Sabun Cuci Piring", kategori: "Kebersihan", jumlah: 5, satuan: "botol", min: 2 },
    { id: uid(), nama: "Teh Celup", kategori: "Minuman", jumlah: 1, satuan: "kotak", min: 2 },
    { id: uid(), nama: "Pasta Gigi", kategori: "Perlengkapan Mandi", jumlah: 4, satuan: "buah", min: 2 }
];

let barang = baca(KEY.b, null) || contohBarang();
let riwayat = baca(KEY.r, []);
let kebutuhan = baca(KEY.k, null) ||
    barang.filter((b) => status(b) !== "Aman").map((b) => ({ id: uid(), nama: b.nama, done: false }));
const filter = { q: "", kat: "", st: "", urut: "nama" };

function status(b) {
    if (b.jumlah <= 0) return "Habis";
    return b.jumlah <= b.min ? "Menipis" : "Aman";
}

function catat(teks) {
    riwayat.unshift({ t: Date.now(), teks: teks });
    riwayat = riwayat.slice(0, 100);
}

function waktu(t) {
    return new Date(t).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function toast(pesan, tipe) {
    const el = document.createElement("div");
    el.className = "toast " + (tipe || "");
    el.textContent = pesan;
    $("#toasts").append(el);
    setTimeout(() => el.remove(), 2800);
}

/* ================= Navigasi ================= */
function tampil(nama) {
    document.querySelectorAll(".view").forEach((v) => (v.hidden = v.id !== "view-" + nama));
    document.querySelectorAll(".menu[data-view]").forEach((m) =>
        m.classList.toggle("active", m.dataset.view === nama));
    $("#judulHeader").textContent = JUDUL[nama];
    $("#sidebar").classList.remove("buka");
    window.scrollTo(0, 0);
}

/* ================= Render ================= */
function render() {
    simpan(KEY.b, barang);
    simpan(KEY.k, kebutuhan);
    simpan(KEY.r, riwayat);

    const menipis = barang.filter((b) => status(b) === "Menipis").length;
    const habis = barang.filter((b) => status(b) === "Habis").length;
    const belumBeli = kebutuhan.filter((k) => !k.done).length;

    $("#jumlahBarang").textContent = barang.length;
    $("#jumlahMenipis").textContent = menipis;
    $("#jumlahHabis").textContent = habis;
    $("#jumlahKebutuhan").textContent = belumBeli;
    $("#pillKebutuhan").textContent = belumBeli;

    renderPerhatian();
    renderAktivitas();
    renderKategori();
    renderStok();
    renderKebutuhan();
    renderRiwayat();
}

function renderPerhatian() {
    const d = barang.filter((b) => status(b) !== "Aman")
        .sort((a, b) => URUT_STATUS[status(a)] - URUT_STATUS[status(b)]).slice(0, 5);
    $("#listPerhatian").innerHTML = d.length ? d.map((b) => `
        <li>
            <div><strong>${esc(b.nama)}</strong>
                <small>Sisa ${b.jumlah} ${esc(b.satuan)} (minimum ${b.min})</small></div>
            <div class="aksi-item">
                <span class="badge s-${status(b)}">${status(b)}</span>
                <button class="mini teks" data-act="keKebutuhan" data-id="${b.id}">+ Kebutuhan</button>
                <button class="mini" data-act="plus" data-id="${b.id}" aria-label="Tambah stok">+</button>
            </div>
        </li>`).join("") : `<li class="kosong">Semua stok aman.</li>`;
}

function renderAktivitas() {
    $("#listAktivitas").innerHTML = riwayat.length
        ? riwayat.slice(0, 5).map((r) => `<li><div>${esc(r.teks)}<small>${waktu(r.t)}</small></div></li>`).join("")
        : `<li class="kosong">Belum ada aktivitas.</li>`;
}

function renderKategori() {
    const maks = Math.max(1, ...KATEGORI.map((k) => barang.filter((b) => b.kategori === k).length));
    $("#kategoriBar").innerHTML = KATEGORI.map((k) => {
        const n = barang.filter((b) => b.kategori === k).length;
        return `<div class="bar-baris"><span>${esc(k)}</span>
            <div class="bar"><i style="width:${(n / maks) * 100}%"></i></div><span>${n}</span></div>`;
    }).join("");
}

function barangTerfilter() {
    const d = barang.filter((b) =>
        (!filter.q || b.nama.toLowerCase().includes(filter.q)) &&
        (!filter.kat || b.kategori === filter.kat) &&
        (!filter.st || status(b) === filter.st));
    d.sort(filter.urut === "jumlah" ? (a, b) => a.jumlah - b.jumlah
        : filter.urut === "status" ? (a, b) => URUT_STATUS[status(a)] - URUT_STATUS[status(b)]
        : (a, b) => a.nama.localeCompare(b.nama));
    return d;
}

function renderStok() {
    const d = barangTerfilter();
    $("#daftarBarang").innerHTML = d.length ? d.map((b) => `
        <tr>
            <td><strong>${esc(b.nama)}</strong></td>
            <td>${esc(b.kategori)}</td>
            <td><div class="qty">
                <button class="mini" data-act="min" data-id="${b.id}" aria-label="Kurangi">−</button>
                <b>${b.jumlah} ${esc(b.satuan)}</b>
                <button class="mini" data-act="plus" data-id="${b.id}" aria-label="Tambah">+</button>
            </div></td>
            <td>${b.min}</td>
            <td><span class="badge s-${status(b)}">${status(b)}</span></td>
            <td><div class="aksi-item">
                <button class="mini teks" data-act="edit" data-id="${b.id}">Ubah</button>
                <button class="mini bahaya" data-act="hapus" data-id="${b.id}" aria-label="Hapus">✕</button>
            </div></td>
        </tr>`).join("")
        : `<tr><td colspan="6" class="kosong-tabel">${barang.length ? "Tidak ada barang yang cocok dengan filter." : "Belum ada barang. Klik Tambah untuk memulai."}</td></tr>`;
}

function renderKebutuhan() {
    $("#listKebutuhan").innerHTML = kebutuhan.length ? kebutuhan.map((k) => `
        <li class="${k.done ? "selesai" : ""}">
            <label><input type="checkbox" data-act="cek" data-id="${k.id}" ${k.done ? "checked" : ""}>
                <span class="nama-item">${esc(k.nama)}</span></label>
            <button class="mini bahaya" data-act="hapusK" data-id="${k.id}" aria-label="Hapus">✕</button>
        </li>`).join("") : `<li class="kosong">Daftar kebutuhan kosong.</li>`;
}

function renderRiwayat() {
    $("#listRiwayat").innerHTML = riwayat.length
        ? riwayat.map((r) => `<li><div>${esc(r.teks)}<small>${waktu(r.t)}</small></div></li>`).join("")
        : `<li class="kosong">Belum ada riwayat.</li>`;
}

/* ================= Aksi stok ================= */
function ubahJumlah(id, delta) {
    const b = barang.find((x) => x.id === id);
    if (!b) return;
    const lama = status(b);
    b.jumlah = Math.max(0, b.jumlah + delta);
    catat(`${b.nama}: stok ${delta > 0 ? "ditambah" : "dikurangi"} menjadi ${b.jumlah} ${b.satuan}`);
    const baru = status(b);
    if (baru !== lama && baru === "Habis") toast(`${b.nama} habis`, "bahaya");
    else if (baru !== lama && baru === "Menipis") toast(`${b.nama} menipis`, "peringatan");
    render();
}

function tambahKebutuhan(nama) {
    if (kebutuhan.some((k) => !k.done && k.nama.toLowerCase() === nama.toLowerCase())) return false;
    kebutuhan.unshift({ id: uid(), nama: nama, done: false });
    return true;
}

/* ================= Form tambah / ubah ================= */
function bukaForm(id) {
    const b = barang.find((x) => x.id === id);
    $("#judulForm").textContent = b ? "Ubah Barang" : "Tambah Barang";
    $("#idBarang").value = b ? b.id : "";
    $("#nama").value = b ? b.nama : "";
    $("#kategori").value = b ? b.kategori : KATEGORI[0];
    $("#jumlah").value = b ? b.jumlah : "";
    $("#satuan").value = b ? b.satuan : "buah";
    $("#min").value = b ? b.min : 2;
    $("#overlay").classList.add("show");
    $("#nama").focus();
}

function tutupForm() {
    $("#overlay").classList.remove("show");
    $("#formBarang").reset();
}

$("#formBarang").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = $("#idBarang").value;
    const data = {
        nama: $("#nama").value.trim(),
        kategori: $("#kategori").value,
        jumlah: Math.max(0, parseInt($("#jumlah").value, 10) || 0),
        satuan: $("#satuan").value,
        min: Math.max(0, parseInt($("#min").value, 10) || 0)
    };
    if (!data.nama) return;

    if (barang.some((b) => b.id !== id && b.nama.toLowerCase() === data.nama.toLowerCase())) {
        toast("Barang dengan nama itu sudah ada", "peringatan");
        return;
    }
    if (id) {
        Object.assign(barang.find((b) => b.id === id), data);
        catat(`${data.nama} diperbarui`);
        toast("Perubahan disimpan");
    } else {
        barang.unshift(Object.assign({ id: uid() }, data));
        catat(`${data.nama} ditambahkan (${data.jumlah} ${data.satuan})`);
        toast("Barang ditambahkan");
    }
    tutupForm();
    render();
});

/* ================= Klik (delegasi) ================= */
document.addEventListener("click", (e) => {
    const menu = e.target.closest(".menu[data-view]");
    if (menu) return tampil(menu.dataset.view);

    const el = e.target.closest("[data-act]");
    if (!el) return;
    const id = el.dataset.id;

    switch (el.dataset.act) {
        case "tambah": bukaForm(); break;
        case "batal": tutupForm(); break;
        case "edit": bukaForm(id); break;
        case "plus": ubahJumlah(id, 1); break;
        case "min": ubahJumlah(id, -1); break;
        case "hapus": {
            const b = barang.find((x) => x.id === id);
            if (b && confirm(`Hapus "${b.nama}" dari daftar stok?`)) {
                barang = barang.filter((x) => x.id !== id);
                catat(`${b.nama} dihapus`);
                toast("Barang dihapus", "bahaya");
                render();
            }
            break;
        }
        case "goto":
            filter.st = el.dataset.st || "";
            $("#fStatus").value = filter.st;
            renderStok();
            tampil(el.dataset.view);
            break;
        case "keKebutuhan": {
            const b = barang.find((x) => x.id === id);
            if (b) {
                toast(tambahKebutuhan(b.nama) ? `${b.nama} masuk daftar kebutuhan` : `${b.nama} sudah ada di kebutuhan`);
                render();
            }
            break;
        }
        case "cek": {
            const k = kebutuhan.find((x) => x.id === id);
            if (k) { k.done = !k.done; catat(`${k.nama} ${k.done ? "sudah dibeli" : "belum dibeli"}`); render(); }
            break;
        }
        case "hapusK":
            kebutuhan = kebutuhan.filter((x) => x.id !== id);
            render();
            break;
        case "isiOtomatis": {
            const tambah = barang.filter((b) => status(b) !== "Aman").filter((b) => tambahKebutuhan(b.nama)).length;
            toast(tambah ? `${tambah} barang ditambahkan` : "Tidak ada barang baru untuk ditambahkan");
            render();
            break;
        }
        case "hapusSelesai":
            kebutuhan = kebutuhan.filter((k) => !k.done);
            render();
            break;
        case "hapusRiwayat":
            if (riwayat.length && confirm("Hapus semua riwayat?")) { riwayat = []; render(); }
            break;
        case "reset":
            if (confirm("Kembalikan semua data ke contoh awal? Data saat ini akan hilang.")) {
                barang = contohBarang();
                kebutuhan = barang.filter((b) => status(b) !== "Aman").map((b) => ({ id: uid(), nama: b.nama, done: false }));
                riwayat = [];
                catat("Data dikembalikan ke contoh awal");
                render();
                toast("Data contoh dipulihkan");
            }
            break;
        case "ekspor": eksporCSV(); break;
    }
});

/* ================= Form kebutuhan, filter, lain-lain ================= */
$("#formKebutuhan").addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = $("#namaKebutuhan").value.trim();
    if (!nama) return;
    toast(tambahKebutuhan(nama) ? "Ditambahkan ke kebutuhan" : "Barang itu sudah ada di daftar", "");
    $("#namaKebutuhan").value = "";
    render();
});

$("#cari").addEventListener("input", (e) => { filter.q = e.target.value.trim().toLowerCase(); renderStok(); });
$("#fKategori").addEventListener("change", (e) => { filter.kat = e.target.value; renderStok(); });
$("#fStatus").addEventListener("change", (e) => { filter.st = e.target.value; renderStok(); });
$("#fUrut").addEventListener("change", (e) => { filter.urut = e.target.value; renderStok(); });

$("#btnToggle").addEventListener("click", () => {
    $("#sidebar").classList.toggle(window.innerWidth <= 800 ? "buka" : "tutup");
});

$("#btnKeluar").addEventListener("click", () => {
    if (confirm("Keluar dari Stockly?")) {
        localStorage.removeItem(KEY.u);
        location.href = "Login.html";
    }
});

document.addEventListener("keydown", (e) => { if (e.key === "Escape") tutupForm(); });
$("#overlay").addEventListener("click", (e) => { if (e.target.id === "overlay") tutupForm(); });

function eksporCSV() {
    const baris = [["Nama", "Kategori", "Jumlah", "Satuan", "Minimum", "Status"]]
        .concat(barang.map((b) => [b.nama, b.kategori, b.jumlah, b.satuan, b.min, status(b)]));
    const csv = baris.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv" }));
    a.download = "stok-stockly.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Data stok diekspor");
}

/* ================= Inisialisasi ================= */
(function mulai() {
    const jam = new Date().getHours();
    const waktuHari = jam < 11 ? "pagi" : jam < 15 ? "siang" : jam < 18 ? "sore" : "malam";
    $("#sapaan").textContent = `Selamat ${waktuHari}, ${namaUser.split(" ")[0]}`;
    $("#tanggal").textContent = new Date().toLocaleDateString("id-ID",
        { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + ". Berikut ringkasan persediaan Anda.";
    $("#namaUser").textContent = namaUser;
    $("#avatar").textContent = namaUser.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

    $("#kategori").innerHTML = KATEGORI.map((k) => `<option>${esc(k)}</option>`).join("");
    $("#fKategori").innerHTML = `<option value="">Semua kategori</option>` +
        KATEGORI.map((k) => `<option>${esc(k)}</option>`).join("");

    render();
})();
