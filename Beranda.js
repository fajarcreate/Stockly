// ============================================================
// STOCKLY - Beranda.js
// Data disimpan di localStorage browser (belum memakai server).
// Pola yang dipakai di mana-mana:
//   ambil data -> ubah array -> simpan -> tampilkan ulang (tampilSemua)
// ============================================================


// ============================================================
// 1. FUNGSI BANTU
// ============================================================

// Mengambil data dari localStorage. Kalau belum ada, pakai nilai cadangan.
function ambilData(kunci, cadangan) {
    var teks = localStorage.getItem(kunci);
    if (teks == null) {
        return cadangan;
    }
    return JSON.parse(teks);
}

// Menyimpan data ke localStorage (diubah dulu menjadi teks JSON).
function simpanData(kunci, isi) {
    localStorage.setItem(kunci, JSON.stringify(isi));
}

// Membuat nomor id yang selalu berbeda untuk setiap data.
var nomorId = Date.now();
function idBaru() {
    nomorId = nomorId + 1;
    return nomorId;
}

// Supaya teks yang diketik pengguna aman ditampilkan di halaman.
function aman(teks) {
    var div = document.createElement("div");
    div.textContent = teks;
    return div.innerHTML;
}

// Mengubah angka waktu menjadi tulisan tanggal dan jam.
function waktu(angka) {
    return new Date(angka).toLocaleString("id-ID");
}


// ============================================================
// 2. CEK LOGIN
// ============================================================
var user = ambilData("stocklyUser", null);
if (user == null) {
    window.location.href = "Login.html";   // belum login -> kembali ke halaman login
}


// ============================================================
// 3. DATA APLIKASI
// ============================================================

// Satu barang berisi: nama, kategori, lokasi, stok saat ini (jumlah),
// satuan, stok minimum (min), dan penanda perlu dibeli.
function buatBarang(nama, kategori, lokasi, jumlah, satuan, min) {
    return {
        id: idBaru(),
        nama: nama,
        kategori: kategori,
        lokasi: lokasi,
        jumlah: jumlah,
        satuan: satuan,
        min: min,
        perluBeli: false
    };
}

// Daftar kategori. Kalau belum pernah disimpan, dibuat lima kategori awal.
var daftarKategori = ambilData("stocklyKategori", null);
if (daftarKategori == null) {
    daftarKategori = [
        { id: idBaru(), nama: "Bahan Makanan" },
        { id: idBaru(), nama: "Minuman" },
        { id: idBaru(), nama: "Kebersihan" },
        { id: idBaru(), nama: "Perlengkapan Mandi" },
        { id: idBaru(), nama: "Lainnya" }
    ];
}

// Daftar barang. Kalau belum pernah disimpan, dibuat enam barang contoh.
var barang = ambilData("stocklyBarang", null);
if (barang == null) {
    barang = [
        buatBarang("Beras", "Bahan Makanan", "Dapur, lemari bawah", 8, "kg", 3),
        buatBarang("Minyak Goreng", "Bahan Makanan", "Dapur, rak atas", 2, "liter", 2),
        buatBarang("Gula", "Bahan Makanan", "Dapur, rak atas", 0, "kg", 2),
        buatBarang("Sabun Cuci Piring", "Kebersihan", "Dapur, bawah wastafel", 5, "botol", 2),
        buatBarang("Teh Celup", "Minuman", "Dapur, laci", 1, "kotak", 2),
        buatBarang("Pasta Gigi", "Perlengkapan Mandi", "Kamar mandi", 4, "buah", 2)
    ];
}

// Riwayat perubahan. Jenisnya: "Masuk", "Keluar", atau "Info".
var riwayat = ambilData("stocklyRiwayat", []);


// ============================================================
// 4. FUNGSI PENGECEKAN
// ============================================================

// Status stok: Habis (0), Menipis (sama atau di bawah minimum), atau Aman.
function status(b) {
    if (b.jumlah <= 0) {
        return "Habis";
    }
    if (b.jumlah <= b.min) {
        return "Menipis";
    }
    return "Aman";
}

// FR-04 dan FR-06: perlu dibeli kalau stok <= minimum ATAU ditandai manual.
function perluDibeli(b) {
    return b.jumlah <= b.min || b.perluBeli == true;
}

// Mencari barang berdasarkan id. Hasilnya null kalau tidak ketemu.
function cariBarang(id) {
    for (var i = 0; i < barang.length; i++) {
        if (barang[i].id == id) {
            return barang[i];
        }
    }
    return null;
}

// Mencari kategori berdasarkan id.
function cariKategori(id) {
    for (var i = 0; i < daftarKategori.length; i++) {
        if (daftarKategori[i].id == id) {
            return daftarKategori[i];
        }
    }
    return null;
}

// Membuat daftar baru tanpa item yang id-nya dihapus.
function buangDariDaftar(daftar, id) {
    var baru = [];
    for (var i = 0; i < daftar.length; i++) {
        if (daftar[i].id != id) {
            baru.push(daftar[i]);
        }
    }
    return baru;
}

// Menambah satu catatan ke riwayat (paling baru ada di paling atas).
function catatRiwayat(nama, jenis, jumlah, stokAkhir, ket) {
    riwayat.unshift({
        t: Date.now(),
        nama: nama,
        jenis: jenis,
        jumlah: jumlah,
        stokAkhir: stokAkhir,
        ket: ket
    });
}


// ============================================================
// 5. MENAMPILKAN DATA KE HALAMAN
// ============================================================

// Menyimpan semua data, menghitung ringkasan, lalu menampilkan ulang semuanya.
function tampilSemua() {
    simpanData("stocklyBarang", barang);
    simpanData("stocklyKategori", daftarKategori);
    simpanData("stocklyRiwayat", riwayat);

    var menipis = 0;
    var habis = 0;
    var belanja = 0;
    for (var i = 0; i < barang.length; i++) {
        if (status(barang[i]) == "Menipis") {
            menipis = menipis + 1;
        }
        if (status(barang[i]) == "Habis") {
            habis = habis + 1;
        }
        if (perluDibeli(barang[i])) {
            belanja = belanja + 1;
        }
    }

    document.getElementById("jumlahBarang").textContent = barang.length;
    document.getElementById("jumlahMenipis").textContent = menipis;
    document.getElementById("jumlahHabis").textContent = habis;
    document.getElementById("jumlahKebutuhan").textContent = belanja;
    document.getElementById("pillKebutuhan").textContent = belanja;

    tampilPerhatian();
    tampilAktivitas();
    tampilRekap();
    isiFilterKategori();
    tampilStok();
    tampilKategori();
    tampilBelanja();
    tampilRiwayat();
}

// FR-07: daftar barang hampir habis (stok habis atau menipis).
function tampilPerhatian() {
    var html = "";
    for (var i = 0; i < barang.length; i++) {
        var b = barang[i];
        if (status(b) != "Aman") {
            html = html + "<li><div><strong>" + aman(b.nama) + "</strong>" +
                "<small>Sisa " + b.jumlah + " " + aman(b.satuan) + " (minimum " + b.min + ") - " + aman(b.lokasi) + "</small></div>" +
                "<span class='badge s-" + status(b) + "'>" + status(b) + "</span></li>";
        }
    }
    if (html == "") {
        html = "<li class='kosong'>Semua stok aman.</li>";
    }
    document.getElementById("listPerhatian").innerHTML = html;
}

// Lima aktivitas terbaru dari riwayat.
function tampilAktivitas() {
    var html = "";
    for (var i = 0; i < riwayat.length && i < 5; i++) {
        var r = riwayat[i];
        var teks = r.nama + " - " + r.ket;
        if (r.jenis != "Info") {
            teks = r.nama + ": stok " + r.jenis.toLowerCase() + " " + r.jumlah + " (stok akhir " + r.stokAkhir + ")";
        }
        html = html + "<li><div>" + aman(teks) + "<small>" + waktu(r.t) + "</small></div></li>";
    }
    if (html == "") {
        html = "<li class='kosong'>Belum ada aktivitas.</li>";
    }
    document.getElementById("listAktivitas").innerHTML = html;
}

// FR-07: rekap stok per kategori, ditambah total stok masuk dan keluar.
function tampilRekap() {
    var html = "";
    for (var k = 0; k < daftarKategori.length; k++) {
        var banyak = 0;
        var totalStok = 0;
        var hampir = 0;
        for (var i = 0; i < barang.length; i++) {
            if (barang[i].kategori == daftarKategori[k].nama) {
                banyak = banyak + 1;
                totalStok = totalStok + barang[i].jumlah;
                if (status(barang[i]) != "Aman") {
                    hampir = hampir + 1;
                }
            }
        }
        html = html + "<tr><td>" + aman(daftarKategori[k].nama) + "</td><td>" + banyak +
            "</td><td>" + totalStok + "</td><td>" + hampir + "</td></tr>";
    }
    document.getElementById("tabelRekap").innerHTML = html;

    var masuk = 0;
    var keluar = 0;
    for (var r = 0; r < riwayat.length; r++) {
        if (riwayat[r].jenis == "Masuk") {
            masuk = masuk + Number(riwayat[r].jumlah);
        }
        if (riwayat[r].jenis == "Keluar") {
            keluar = keluar + Number(riwayat[r].jumlah);
        }
    }
    document.getElementById("rekapMasukKeluar").textContent =
        "Total stok masuk: " + masuk + " | Total stok keluar: " + keluar;
}

// Mengisi pilihan kategori pada filter Daftar Stok.
function isiFilterKategori() {
    var pilih = document.getElementById("fKategori");
    var lama = pilih.value;   // ingat pilihan sebelumnya
    var html = "<option value=''>Semua kategori</option>";
    for (var i = 0; i < daftarKategori.length; i++) {
        html = html + "<option>" + aman(daftarKategori[i].nama) + "</option>";
    }
    pilih.innerHTML = html;
    pilih.value = lama;
}

// FR-02 dan FR-05: tabel barang dengan pencarian (nama/kategori/lokasi) dan filter.
function tampilStok() {
    var kata = document.getElementById("cari").value.toLowerCase();
    var kat = document.getElementById("fKategori").value;
    var st = document.getElementById("fStatus").value;

    var html = "";
    for (var i = 0; i < barang.length; i++) {
        var b = barang[i];

        // 1) pencarian: kata dicari di gabungan nama + kategori + lokasi
        var gabungan = (b.nama + " " + b.kategori + " " + b.lokasi).toLowerCase();
        var cocokKata = gabungan.indexOf(kata) != -1;

        // 2) filter kategori
        var cocokKat = (kat == "" || b.kategori == kat);

        // 3) filter status
        var cocokSt = true;
        if (st == "Dibeli") {
            cocokSt = perluDibeli(b);
        } else if (st != "") {
            cocokSt = (status(b) == st);
        }

        // kalau ketiganya cocok, barang ditampilkan
        if (cocokKata && cocokKat && cocokSt) {
            var teksTandai = "Tandai Beli";
            var badgeBeli = "";
            if (b.perluBeli) {
                teksTandai = "Batal Tandai";
                badgeBeli = "<span class='badge s-Beli'>Perlu dibeli</span>";
            }
            html = html + "<tr>" +
                "<td><strong>" + aman(b.nama) + "</strong></td>" +
                "<td>" + aman(b.kategori) + "</td>" +
                "<td>" + aman(b.lokasi) + "</td>" +
                "<td><div class='qty'>" +
                "<button class='mini' onclick='ubahStok(" + b.id + ", \"Keluar\", 1, \"Kurangi cepat\")'>−</button>" +
                "<b>" + b.jumlah + " " + aman(b.satuan) + "</b>" +
                "<button class='mini' onclick='ubahStok(" + b.id + ", \"Masuk\", 1, \"Tambah cepat\")'>+</button>" +
                "</div></td>" +
                "<td>" + b.min + "</td>" +
                "<td><span class='badge s-" + status(b) + "'>" + status(b) + "</span>" + badgeBeli + "</td>" +
                "<td><div class='aksi-item'>" +
                "<button class='mini teks' onclick='bukaFormStok(" + b.id + ")'>Catat</button>" +
                "<button class='mini teks' onclick='tandaiBeli(" + b.id + ")'>" + teksTandai + "</button>" +
                "<button class='mini teks' onclick='bukaFormBarang(" + b.id + ")'>Ubah</button>" +
                "<button class='mini bahaya' onclick='hapusBarang(" + b.id + ")'>✕</button>" +
                "</div></td></tr>";
        }
    }
    if (html == "") {
        html = "<tr><td colspan='7' class='kosong-tabel'>Tidak ada barang yang cocok.</td></tr>";
    }
    document.getElementById("daftarBarang").innerHTML = html;
}

// FR-01: tabel kategori beserta jumlah barang di dalamnya.
function tampilKategori() {
    var html = "";
    for (var i = 0; i < daftarKategori.length; i++) {
        var k = daftarKategori[i];
        var banyak = 0;
        for (var j = 0; j < barang.length; j++) {
            if (barang[j].kategori == k.nama) {
                banyak = banyak + 1;
            }
        }
        html = html + "<tr><td><strong>" + aman(k.nama) + "</strong></td><td>" + banyak + "</td>" +
            "<td><div class='aksi-item'>" +
            "<button class='mini teks' onclick='bukaFormKategori(" + k.id + ")'>Ubah</button>" +
            "<button class='mini bahaya' onclick='hapusKategori(" + k.id + ")'>✕</button>" +
            "</div></td></tr>";
    }
    if (html == "") {
        html = "<tr><td colspan='3' class='kosong-tabel'>Belum ada kategori.</td></tr>";
    }
    document.getElementById("daftarKategori").innerHTML = html;
}

// FR-04: daftar belanja otomatis (stok <= minimum, atau ditandai perlu dibeli).
function tampilBelanja() {
    var html = "";
    for (var i = 0; i < barang.length; i++) {
        var b = barang[i];
        if (perluDibeli(b)) {
            var alasan = "Stok sama dengan atau di bawah minimum";
            if (b.jumlah > b.min) {
                alasan = "Ditandai perlu dibeli";
            }
            html = html + "<tr><td><strong>" + aman(b.nama) + "</strong></td>" +
                "<td>" + aman(b.lokasi) + "</td>" +
                "<td>" + b.jumlah + " " + aman(b.satuan) + "</td>" +
                "<td>" + b.min + "</td>" +
                "<td>" + alasan + "</td>" +
                "<td><button class='mini teks hijau' onclick='bukaFormStok(" + b.id + ")'>Stok Masuk</button></td></tr>";
        }
    }
    if (html == "") {
        html = "<tr><td colspan='6' class='kosong-tabel'>Tidak ada barang yang perlu dibeli.</td></tr>";
    }
    document.getElementById("tabelBelanja").innerHTML = html;
}

// FR-03 dan FR-07: tabel riwayat perubahan stok, bisa difilter menurut jenis.
function tampilRiwayat() {
    var filterJenis = document.getElementById("fJenis").value;
    var html = "";
    for (var i = 0; i < riwayat.length; i++) {
        var r = riwayat[i];
        if (filterJenis == "" || r.jenis == filterJenis) {
            var jenis = r.jenis;
            var jumlah = r.jumlah;
            var stokAkhir = r.stokAkhir;
            if (r.jenis == "Info") {
                jenis = "Perubahan data";
                jumlah = "-";
                stokAkhir = "-";
            }
            html = html + "<tr><td>" + waktu(r.t) + "</td><td>" + aman(r.nama) + "</td>" +
                "<td><span class='jenis-" + r.jenis + "'>" + jenis + "</span></td>" +
                "<td>" + jumlah + "</td><td>" + stokAkhir + "</td><td>" + aman(r.ket) + "</td></tr>";
        }
    }
    if (html == "") {
        html = "<tr><td colspan='6' class='kosong-tabel'>Belum ada riwayat.</td></tr>";
    }
    document.getElementById("tabelRiwayat").innerHTML = html;
}


// ============================================================
// 6. NAVIGASI
// ============================================================
var judulHalaman = {
    beranda: "Beranda",
    stok: "Daftar Stok",
    kategori: "Kategori",
    kebutuhan: "Kebutuhan",
    riwayat: "Riwayat"
};

// Menampilkan satu halaman dan menyembunyikan yang lain.
function bukaHalaman(nama) {
    var halaman = document.getElementsByClassName("view");
    for (var i = 0; i < halaman.length; i++) {
        halaman[i].hidden = (halaman[i].id != "view-" + nama);
    }
    var menu = document.getElementsByClassName("menu");
    for (var j = 0; j < menu.length; j++) {
        if (menu[j].getAttribute("data-view") == nama) {
            menu[j].classList.add("active");
        } else {
            menu[j].classList.remove("active");
        }
    }
    document.getElementById("judulHeader").textContent = judulHalaman[nama];
    document.getElementById("sidebar").classList.remove("buka");
}

// Membuka / menutup sidebar.
function toggleSidebar() {
    var sidebar = document.getElementById("sidebar");
    if (window.innerWidth <= 800) {
        sidebar.classList.toggle("buka");
    } else {
        sidebar.classList.toggle("tutup");
    }
}

function keluar() {
    if (confirm("Keluar dari Stockly?")) {
        localStorage.removeItem("stocklyUser");
        window.location.href = "Login.html";
    }
}

// Menutup pop-up berdasarkan id-nya.
function tutupForm(idOverlay) {
    document.getElementById(idOverlay).classList.remove("show");
}


// ============================================================
// 7. FR-02: TAMBAH, UBAH, HAPUS BARANG
// ============================================================

// Mengisi pilihan kategori di form barang.
function isiPilihanKategori() {
    var html = "";
    for (var i = 0; i < daftarKategori.length; i++) {
        html = html + "<option>" + aman(daftarKategori[i].nama) + "</option>";
    }
    document.getElementById("kategori").innerHTML = html;
}

// id = 0 berarti tambah barang baru, selain itu berarti ubah barang.
function bukaFormBarang(id) {
    if (daftarKategori.length == 0) {
        alert("Buat kategori dulu sebelum menambah barang.");
        bukaHalaman("kategori");
        return;
    }
    isiPilihanKategori();
    var b = cariBarang(id);
    if (b != null) {
        document.getElementById("judulForm").textContent = "Ubah Barang";
        document.getElementById("idBarang").value = b.id;
        document.getElementById("nama").value = b.nama;
        document.getElementById("kategori").value = b.kategori;
        document.getElementById("lokasi").value = b.lokasi;
        document.getElementById("jumlah").value = b.jumlah;
        document.getElementById("satuan").value = b.satuan;
        document.getElementById("min").value = b.min;
    } else {
        document.getElementById("judulForm").textContent = "Tambah Barang";
        document.getElementById("idBarang").value = "";
        document.getElementById("nama").value = "";
        document.getElementById("lokasi").value = "";
        document.getElementById("jumlah").value = "";
        document.getElementById("min").value = 2;
    }
    document.getElementById("overlayBarang").classList.add("show");
}

function simpanBarang(event) {
    event.preventDefault();   // supaya halaman tidak dimuat ulang

    // ambil isi form
    var id = Number(document.getElementById("idBarang").value);
    var nama = document.getElementById("nama").value.trim();
    var kategori = document.getElementById("kategori").value;
    var lokasi = document.getElementById("lokasi").value.trim();
    var jumlah = Number(document.getElementById("jumlah").value);
    var satuan = document.getElementById("satuan").value;
    var min = Number(document.getElementById("min").value);

    // cek nama kembar
    for (var i = 0; i < barang.length; i++) {
        if (barang[i].id != id && barang[i].nama.toLowerCase() == nama.toLowerCase()) {
            alert("Barang dengan nama itu sudah ada.");
            return;
        }
    }

    if (id == 0) {
        // barang baru
        barang.unshift(buatBarang(nama, kategori, lokasi, jumlah, satuan, min));
        catatRiwayat(nama, "Masuk", jumlah, jumlah, "Stok awal barang baru");
    } else {
        // ubah barang yang sudah ada
        var b = cariBarang(id);
        var stokLama = b.jumlah;
        b.nama = nama;
        b.kategori = kategori;
        b.lokasi = lokasi;
        b.jumlah = jumlah;
        b.satuan = satuan;
        b.min = min;
        if (jumlah > stokLama) {
            catatRiwayat(nama, "Masuk", jumlah - stokLama, jumlah, "Koreksi lewat ubah barang");
        } else if (jumlah < stokLama) {
            catatRiwayat(nama, "Keluar", stokLama - jumlah, jumlah, "Koreksi lewat ubah barang");
        } else {
            catatRiwayat(nama, "Info", "", "", "Data barang diubah");
        }
    }
    tutupForm("overlayBarang");
    tampilSemua();
}

function hapusBarang(id) {
    var b = cariBarang(id);
    if (confirm("Hapus " + b.nama + " dari daftar stok?")) {
        barang = buangDariDaftar(barang, id);
        catatRiwayat(b.nama, "Info", "", "", "Barang dihapus");
        tampilSemua();
    }
}


// ============================================================
// 8. FR-03: STOK MASUK DAN KELUAR
// ============================================================
function bukaFormStok(id) {
    var b = cariBarang(id);
    document.getElementById("idStok").value = b.id;
    document.getElementById("infoStok").textContent = b.nama + " - stok saat ini " + b.jumlah + " " + b.satuan;
    document.getElementById("jenisStok").value = "Masuk";
    document.getElementById("jumlahStok").value = "";
    document.getElementById("ketStok").value = "";
    document.getElementById("overlayStok").classList.add("show");
}

function simpanStok(event) {
    event.preventDefault();
    var id = Number(document.getElementById("idStok").value);
    var jenis = document.getElementById("jenisStok").value;
    var jumlah = Number(document.getElementById("jumlahStok").value);
    var ket = document.getElementById("ketStok").value.trim();
    if (ket == "") {
        ket = "Stok " + jenis.toLowerCase();
    }
    if (ubahStok(id, jenis, jumlah, ket)) {
        tutupForm("overlayStok");
    }
}

// Mengubah stok dan mencatatnya ke riwayat. Hasilnya true kalau berhasil.
function ubahStok(id, jenis, jumlah, ket) {
    var b = cariBarang(id);
    if (jenis == "Keluar") {
        if (jumlah > b.jumlah) {
            alert("Stok keluar tidak boleh lebih besar dari stok saat ini (" + b.jumlah + ").");
            return false;
        }
        b.jumlah = b.jumlah - jumlah;
    } else {
        b.jumlah = b.jumlah + jumlah;
        b.perluBeli = false;   // barang sudah masuk, tanda perlu dibeli dihapus
    }
    catatRiwayat(b.nama, jenis, jumlah, b.jumlah, ket);
    tampilSemua();
    return true;
}


// ============================================================
// 9. FR-06: TANDAI PERLU DIBELI
// ============================================================
function tandaiBeli(id) {
    var b = cariBarang(id);
    b.perluBeli = !b.perluBeli;   // kebalikan dari nilai sekarang
    if (b.perluBeli) {
        catatRiwayat(b.nama, "Info", "", "", "Ditandai perlu dibeli");
    } else {
        catatRiwayat(b.nama, "Info", "", "", "Tanda perlu dibeli dibatalkan");
    }
    tampilSemua();
}


// ============================================================
// 10. FR-01: TAMBAH, UBAH, HAPUS KATEGORI
// ============================================================
function bukaFormKategori(id) {
    var k = cariKategori(id);
    if (k != null) {
        document.getElementById("judulKategori").textContent = "Ubah Kategori";
        document.getElementById("idKategori").value = k.id;
        document.getElementById("namaKategori").value = k.nama;
    } else {
        document.getElementById("judulKategori").textContent = "Tambah Kategori";
        document.getElementById("idKategori").value = "";
        document.getElementById("namaKategori").value = "";
    }
    document.getElementById("overlayKategori").classList.add("show");
}

function simpanKategori(event) {
    event.preventDefault();
    var id = Number(document.getElementById("idKategori").value);
    var nama = document.getElementById("namaKategori").value.trim();

    // cek nama kembar
    for (var i = 0; i < daftarKategori.length; i++) {
        if (daftarKategori[i].id != id && daftarKategori[i].nama.toLowerCase() == nama.toLowerCase()) {
            alert("Kategori itu sudah ada.");
            return;
        }
    }

    if (id == 0) {
        daftarKategori.push({ id: idBaru(), nama: nama });
        catatRiwayat("-", "Info", "", "", "Kategori " + nama + " ditambahkan");
    } else {
        var k = cariKategori(id);
        var namaLama = k.nama;
        k.nama = nama;
        // barang yang memakai kategori ini ikut berganti nama kategori
        for (var j = 0; j < barang.length; j++) {
            if (barang[j].kategori == namaLama) {
                barang[j].kategori = nama;
            }
        }
        catatRiwayat("-", "Info", "", "", "Kategori " + namaLama + " diubah menjadi " + nama);
    }
    tutupForm("overlayKategori");
    tampilSemua();
}

function hapusKategori(id) {
    var k = cariKategori(id);

    // kategori yang masih dipakai barang tidak boleh dihapus
    var dipakai = 0;
    for (var i = 0; i < barang.length; i++) {
        if (barang[i].kategori == k.nama) {
            dipakai = dipakai + 1;
        }
    }
    if (dipakai > 0) {
        alert("Kategori " + k.nama + " masih dipakai " + dipakai + " barang. Pindahkan atau hapus barangnya dulu.");
        return;
    }
    if (confirm("Hapus kategori " + k.nama + "?")) {
        daftarKategori = buangDariDaftar(daftarKategori, id);
        catatRiwayat("-", "Info", "", "", "Kategori " + k.nama + " dihapus");
        tampilSemua();
    }
}


// ============================================================
// 11. RIWAYAT
// ============================================================
function hapusRiwayat() {
    if (confirm("Hapus semua riwayat?")) {
        riwayat = [];
        tampilSemua();
    }
}


// ============================================================
// 12. DIJALANKAN SAAT HALAMAN DIBUKA
// ============================================================
document.getElementById("sapaan").textContent = "Selamat datang, " + user.name.split(" ")[0];
document.getElementById("namaUser").textContent = user.name;
document.getElementById("avatar").textContent = user.name.charAt(0).toUpperCase();
tampilSemua();
