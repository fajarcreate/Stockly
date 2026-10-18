
let barang = [
    { nama: "Beras", kategori: "Bahan Makanan", jumlah: 5, satuan: "kg" },
    { nama: "Minyak Goreng", kategori: "Bahan Makanan", jumlah: 1, satuan: "liter" },
    { nama: "Sabun Mandi", kategori: "Perlengkapan Mandi", jumlah: 0, satuan: "buah" },
    { nama: "Gula Pasir", kategori: "Bahan Makanan", jumlah: 3, satuan: "kg" },
    { nama: "Detergen", kategori: "Kebersihan", jumlah: 1, satuan: "bungkus" },
    { nama: "Air Mineral", kategori: "Minuman", jumlah: 0, satuan: "botol" }
];

let kebutuhan = ["Sabun Mandi", "Detergen", "Air Mineral"];
let riwayat = ["Data stok awal dibuat"];

const isiHalaman = document.getElementById("isiHalaman");
const halamanBeranda = isiHalaman.innerHTML;
let halamanAktif = "Beranda";

// Menentukan status stok
function statusBarang(jumlah) {
    if (jumlah === 0) {
        return '<span class="status habis">Stok Habis</span>';
    }

    if (jumlah <= 1) {
        return '<span class="status menipis">Menipis</span>';
    }

    return '<span class="status tersedia">Tersedia</span>';
}

// Menampilkan daftar barang
function tampilkanBarang() {
    const tabel = document.getElementById("daftarBarang");

    if (!tabel) return;

    tabel.innerHTML = barang.map(item => `
        <tr>
            <td>${aman(item.nama)}</td>
            <td>${aman(item.kategori)}</td>
            <td>${item.jumlah} ${aman(item.satuan)}</td>
            <td>${statusBarang(item.jumlah)}</td>
        </tr>
    `).join("");
}

// Menghindari teks input dianggap sebagai kode HTML
function aman(teks) {
    return String(teks).replace(/[&<>"']/g, karakter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[karakter]);
}

// Memperbarui angka ringkasan
function perbaruiRingkasan() {
    const total = document.getElementById("jumlahBarang");
    const menipis = document.getElementById("jumlahMenipis");
    const habis = document.getElementById("jumlahHabis");
    const totalKebutuhan = document.getElementById("jumlahKebutuhan");

    if (total) total.textContent = barang.length;
    if (menipis) {
        menipis.textContent = barang.filter(
            item => item.jumlah > 0 && item.jumlah <= 1
        ).length;
    }
    if (habis) {
        habis.textContent = barang.filter(
            item => item.jumlah === 0
        ).length;
    }
    if (totalKebutuhan) {
        totalKebutuhan.textContent = kebutuhan.length;
    }
}

// Berpindah menu tanpa menghilangkan sidebar
function bukaHalaman(nama, tombol) {
    halamanAktif = nama;

    document.querySelectorAll(".menu").forEach(menu => {
        menu.classList.remove("active");
    });

    tombol.classList.add("active");
    document.getElementById("judulHeader").textContent = nama;

    if (nama === "Beranda") {
        isiHalaman.innerHTML = halamanBeranda;
        tampilkanBarang();
        perbaruiRingkasan();
        return;
    }

    let konten = "";

    if (nama === "Daftar Stok") {
        konten = `
            <div class="welcome">
                <div>
                    <h1>Daftar Stok</h1>
                    <p>Daftar persediaan barang rumah tangga.</p>
                </div>
                <button class="tombol" onclick="bukaForm()">
                    + Tambah Barang
                </button>
            </div>
            ${templateTabel()}
        `;
    }

    else if (nama === "Kebutuhan") {
        konten = `
            <div class="welcome">
                <div>
                    <h1>Daftar Kebutuhan</h1>
                    <p>Barang yang perlu dibeli atau diisi ulang.</p>
                </div>
            </div>
            <div class="panel">
                <div class="panel-header">
                    <h3>Barang yang Dibutuhkan</h3>
                </div>
                <ul>
                    ${kebutuhan.map(item =>
                        `<li>${aman(item)}</li>`
                    ).join("")}
                </ul>
            </div>
        `;
    }

    else if (nama === "Riwayat") {
        konten = `
            <div class="welcome">
                <div>
                    <h1>Riwayat</h1>
                    <p>Catatan aktivitas sederhana Stocly.</p>
                </div>
            </div>
            <div class="panel">
                <h3>Aktivitas Terakhir</h3>
                <ul>
                    ${riwayat.map(item =>
                        `<li>${aman(item)}</li>`
                    ).join("")}
                </ul>
            </div>
        `;
    }

    isiHalaman.innerHTML = konten;
    tampilkanBarang();
    perbaruiRingkasan();
}

// Membuat tabel untuk menu Daftar Stok
function templateTabel() {
    return `
        <div class="panel">
            <div class="panel-header">
                <h3>Persediaan Barang</h3>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nama Barang</th>
                            <th>Kategori</th>
                            <th>Jumlah</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="daftarBarang"></tbody>
                </table>
            </div>
        </div>
    `;
}

// Menyembunyikan atau menampilkan sidebar
function toggleSidebar() {
    document.getElementById("sidebar")
        .classList.toggle("sembunyi");
}

// Membuka pop-up
function bukaForm() {
    document.getElementById("overlay").classList.add("tampil");
}

// Menutup pop-up
function tutupForm() {
    document.getElementById("overlay").classList.remove("tampil");
}

// Menambahkan barang dari formulir
document.getElementById("formBarang").addEventListener(
    "submit", function(event) {
        event.preventDefault();

        const nama = document.getElementById("nama").value.trim();
        const kategori = document.getElementById("kategori").value;
        const jumlah = Number(document.getElementById("jumlah").value);
        const satuan = document.getElementById("satuan").value;

        if (nama === "" || jumlah < 0 || !Number.isFinite(jumlah)) {
            return;
        }

        barang.push({
            nama: nama,
            kategori: kategori,
            jumlah: jumlah,
            satuan: satuan
        });

        riwayat.unshift("Barang ditambahkan: " + nama);

        tutupForm();
        this.reset();

        bukaHalaman(
            halamanAktif,
            document.querySelector(".menu.active")
        );
    }
);

// Menutup pop-up jika area luar formulir diklik
document.getElementById("overlay").addEventListener(
    "click", function(event) {
        if (event.target === this) {
            tutupForm();
        }
    }
);

// Menampilkan data saat halaman pertama kali dibuka
tampilkanBarang();
perbaruiRingkasan();
