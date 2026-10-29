// ============================================================
// STOCKLY - Beranda.js
// Semua data disimpan di localStorage browser (belum pakai server).
// ============================================================

// ---------- Fungsi bantu dasar ----------

// Mengambil data dari localStorage. Kalau kosong, pakai nilai cadangan.
function ambilData(kunci, cadangan) {
    var teks = localStorage.getItem(kunci);
    if (teks == null) {
        return cadangan;
    }
    try {
        return JSON.parse(teks);
    } catch (e) {
        return cadangan;
    }
}

// Menyimpan data ke localStorage.
function simpanData(kunci, isi) {
    localStorage.setItem(kunci, JSON.stringify(isi));
}

// Membuat nomor id yang selalu baru.
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

// Mengubah angka waktu menjadi tulisan tanggal.
function waktu(t) {
    var tgl = new Date(t);
    return tgl.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Pesan kecil yang muncul sebentar di pojok layar.
function toast(pesan, tipe) {
    var kotak = document.createElement("div");
    kotak.className = "toast " + (tipe || "");
    kotak.textContent = pesan;
    document.getElementById("toasts").appendChild(kotak);
    setTimeout(function () {
        kotak.remove();
    }, 2800);
}

// ---------- Cek login ----------
var user = ambilData("stocklyUser", null);
if (user == null) {
    // hapus 3 baris ini kalau mau membuka Beranda tanpa login
    window.location.href = "Login.html";
}
var namaUser = "Pengguna";
if (user != null && user.name) {
    namaUser = user.name;
}

// ---------- Data aplikasi ----------

// Membuat satu objek barang.
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

function buatBarangContoh() {
    return [
        buatBarang("Beras", "Bahan Makanan", "Dapur, lemari bawah", 8, "kg", 3),
        buatBarang("Minyak Goreng", "Bahan Makanan", "Dapur, rak atas", 2, "liter", 2),
        buatBarang("Gula", "Bahan Makanan", "Dapur, rak atas", 0, "kg", 2),
        buatBarang("Sabun Cuci Piring", "Kebersihan", "Dapur, bawah wastafel", 5, "botol", 2),
        buatBarang("Teh Celup", "Minuman", "Dapur, laci", 1, "kotak", 2),
        buatBarang("Pasta Gigi", "Perlengkapan Mandi", "Kamar mandi", 4, "buah", 2)
    ];
}

// Data kategori (FR-01)
var daftarKategori = ambilData("stocklyKategori", null);
if (daftarKategori == null) {
    daftarKategori = [];
    var namaAwal = ["Bahan Makanan", "Minuman", "Kebersihan", "Perlengkapan Mandi", "Lainnya"];
    for (var n = 0; n < namaAwal.length; n++) {
        daftarKategori.push({ id: idBaru(), nama: namaAwal[n] });
    }
}

var barang = ambilData("stocklyBarang", null);
if (barang == null) {
    barang = buatBarangContoh();
}

var catatan = ambilData("stocklyKebutuhan", []);   // catatan kebutuhan lain
var riwayat = ambilData("stocklyRiwayat", []);

// Merapikan data lama supaya tidak error (data versi sebelumnya belum punya lokasi, dll).
function rapikanData() {
    for (var i = 0; i < barang.length; i++) {
        if (typeof barang[i].id != "number") {
            barang[i].id = idBaru();
        }
        if (barang[i].lokasi == undefined) {
            barang[i].lokasi = "-";
        }
        if (barang[i].perluBeli == undefined) {
            barang[i].perluBeli = false;
        }
    }
    for (var j = 0; j < catatan.length; j++) {
        if (typeof catatan[j].id != "number") {
            catatan[j].id = idBaru();
        }
    }
    for (var k = 0; k < riwayat.length; k++) {
        if (riwayat[k].jenis == undefined) {
            riwayat[k].jenis = "Info";
            riwayat[k].nama = "-";
            riwayat[k].jumlah = "";
            riwayat[k].stokAkhir = "";
            riwayat[k].ket = riwayat[k].teks;
        }
    }
}
rapikanData();

// ---------- Fungsi hitung status ----------

// Status stok: Habis, Menipis, atau Aman
function status(b) {
    if (b.jumlah <= 0) {
        return "Habis";
    }
    if (b.jumlah <= b.min) {
        return "Menipis";
    }
    return "Aman";
}

// FR-04 dan FR-06: barang perlu dibeli kalau stok <= minimum ATAU ditandai manual
function perluDibeli(b) {
    return b.jumlah <= b.min || b.perluBeli == true;
}

function cariBarang(id) {
    for (var i = 0; i < barang.length; i++) {
        if (barang[i].id == id) {
            return barang[i];
        }
    }
    return null;
}

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

// ---------- Riwayat (FR-03 dan FR-07) ----------

function catatRiwayat(nama, jenis, jumlah, stokAkhir, ket) {
    riwayat.unshift({
        t: Date.now(),
        nama: nama,
        jenis: jenis,        // Masuk, Keluar, atau Info
        jumlah: jumlah,
        stokAkhir: stokAkhir,
        ket: ket
    });
    if (riwayat.length > 200) {
        riwayat = riwayat.slice(0, 200);
    }
}

function teksRiwayat(r) {
    if (r.jenis == "Info") {
        if (r.nama == "-") {
            return r.ket;
        }
        return r.nama + " - " + r.ket;
    }
    return r.nama + ": stok " + r.jenis.toLowerCase() + " " + r.jumlah + " (stok akhir " + r.stokAkhir + ")";
}

// ============================================================
// MENAMPILKAN DATA KE HALAMAN
// ============================================================

// Menyimpan semua data lalu menampilkan ulang semua bagian halaman.
function tampilSemua() {
    simpanData("stocklyBarang", barang);
    simpanData("stocklyKategori", daftarKategori);
    simpanData("stocklyKebutuhan", catatan);
    simpanData("stocklyRiwayat", riwayat);

    var menipis = 0;
    var habis = 0;
    var jumlahBelanja = 0;
    for (var i = 0; i < barang.length; i++) {
        if (status(barang[i]) == "Menipis") {
            menipis = menipis + 1;
        }
        if (status(barang[i]) == "Habis") {
            habis = habis + 1;
        }
        if (perluDibeli(barang[i])) {
            jumlahBelanja = jumlahBelanja + 1;
        }
    }
    for (var j = 0; j < catatan.length; j++) {
        if (catatan[j].done == false) {
            jumlahBelanja = jumlahBelanja + 1;
        }
    }

    document.getElementById("jumlahBarang").textContent = barang.length;
    document.getElementById("jumlahMenipis").textContent = menipis;
    document.getElementById("jumlahHabis").textContent = habis;
    document.getElementById("jumlahKebutuhan").textContent = jumlahBelanja;
    document.getElementById("pillKebutuhan").textContent = jumlahBelanja;

    tampilPerhatian();
    tampilAktivitas();
    tampilRekap();
    tampilKategoriBar();
    isiFilterKategori();
    tampilStok();
    tampilKategori();
    tampilBelanja();
    tampilCatatan();
    tampilRiwayat();
}

// Barang hampir habis (FR-07)
function tampilPerhatian() {
    var html = "";
    var urutan = ["Habis", "Menipis"];
    for (var u = 0; u < urutan.length; u++) {
        for (var i = 0; i < barang.length; i++) {
            var b = barang[i];
            if (status(b) == urutan[u]) {
                html = html + "<li><div><strong>" + aman(b.nama) + "</strong>" +
                    "<small>Sisa " + b.jumlah + " " + aman(b.satuan) + " (minimum " + b.min + ") - " + aman(b.lokasi) + "</small></div>" +
                    "<div class='aksi-item'><span class='badge s-" + status(b) + "'>" + status(b) + "</span>" +
                    "<button class='mini teks' onclick='bukaFormStok(" + b.id + ", \"Masuk\")'>Catat Stok</button></div></li>";
            }
        }
    }
    if (html == "") {
        html = "<li class='kosong'>Semua stok aman.</li>";
    }
    document.getElementById("listPerhatian").innerHTML = html;
}

function tampilAktivitas() {
    var html = "";
    for (var i = 0; i < riwayat.length && i < 5; i++) {
        html = html + "<li><div>" + aman(teksRiwayat(riwayat[i])) + "<small>" + waktu(riwayat[i].t) + "</small></div></li>";
    }
    if (html == "") {
        html = "<li class='kosong'>Belum ada aktivitas.</li>";
    }
    document.getElementById("listAktivitas").innerHTML = html;
}

// Rekap stok per kategori (FR-07)
function tampilRekap() {
    var html = "";
    var totalBarang = 0;
    var totalStok = 0;
    var totalHampir = 0;

    for (var k = 0; k < daftarKategori.length; k++) {
        var banyak = 0;
        var stok = 0;
        var hampir = 0;
        for (var i = 0; i < barang.length; i++) {
            if (barang[i].kategori == daftarKategori[k].nama) {
                banyak = banyak + 1;
                stok = stok + barang[i].jumlah;
                if (status(barang[i]) != "Aman") {
                    hampir = hampir + 1;
                }
            }
        }
        totalBarang = totalBarang + banyak;
        totalStok = totalStok + stok;
        totalHampir = totalHampir + hampir;
        html = html + "<tr><td>" + aman(daftarKategori[k].nama) + "</td><td>" + banyak + "</td><td>" + stok + "</td><td>" + hampir + "</td></tr>";
    }
    html = html + "<tr><td><strong>Total</strong></td><td><strong>" + totalBarang + "</strong></td><td><strong>" + totalStok + "</strong></td><td><strong>" + totalHampir + "</strong></td></tr>";
    document.getElementById("tabelRekap").innerHTML = html;

    // jumlah seluruh stok masuk dan keluar dari riwayat
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
        "Total stok masuk: " + masuk + " | Total stok keluar: " + keluar + " (dari data riwayat)";
}

function tampilKategoriBar() {
    var terbanyak = 1;
    var jumlahPerKategori = [];
    for (var k = 0; k < daftarKategori.length; k++) {
        var banyak = 0;
        for (var i = 0; i < barang.length; i++) {
            if (barang[i].kategori == daftarKategori[k].nama) {
                banyak = banyak + 1;
            }
        }
        jumlahPerKategori.push(banyak);
        if (banyak > terbanyak) {
            terbanyak = banyak;
        }
    }
    var html = "";
    for (var j = 0; j < daftarKategori.length; j++) {
        var lebar = (jumlahPerKategori[j] / terbanyak) * 100;
        html = html + "<div class='bar-baris'><span>" + aman(daftarKategori[j].nama) + "</span>" +
            "<div class='bar'><i style='width:" + lebar + "%'></i></div><span>" + jumlahPerKategori[j] + "</span></div>";
    }
    document.getElementById("kategoriBar").innerHTML = html;
}

// Mengisi pilihan kategori di filter Daftar Stok
function isiFilterKategori() {
    var pilih = document.getElementById("fKategori");
    var lama = pilih.value;
    var html = "<option value=''>Semua kategori</option>";
    for (var i = 0; i < daftarKategori.length; i++) {
        html = html + "<option>" + aman(daftarKategori[i].nama) + "</option>";
    }
    pilih.innerHTML = html;
    pilih.value = lama;
    if (pilih.value != lama) {
        pilih.value = "";
    }
}

// ---------- Daftar stok: pencarian, filter, urutan (FR-05) ----------
function tampilStok() {
    var kata = document.getElementById("cari").value.toLowerCase();
    var kat = document.getElementById("fKategori").value;
    var st = document.getElementById("fStatus").value;
    var urut = document.getElementById("fUrut").value;

    var hasil = [];
    for (var i = 0; i < barang.length; i++) {
        var b = barang[i];

        // cari berdasarkan nama, kategori, atau lokasi
        var cocokKata = true;
        if (kata != "") {
            var gabungan = (b.nama + " " + b.kategori + " " + b.lokasi).toLowerCase();
            cocokKata = gabungan.indexOf(kata) != -1;
        }
        var cocokKat = (kat == "" || b.kategori == kat);
        var cocokSt = true;
        if (st == "Dibeli") {
            cocokSt = perluDibeli(b);
        } else if (st != "") {
            cocokSt = (status(b) == st);
        }

        if (cocokKata && cocokKat && cocokSt) {
            hasil.push(b);
        }
    }

    if (urut == "jumlah") {
        hasil.sort(function (a, b) {
            return a.jumlah - b.jumlah;
        });
    } else if (urut == "status") {
        hasil.sort(function (a, b) {
            return nilaiStatus(a) - nilaiStatus(b);
        });
    } else {
        hasil.sort(function (a, b) {
            return a.nama.localeCompare(b.nama);
        });
    }

    var html = "";
    for (var j = 0; j < hasil.length; j++) {
        var x = hasil[j];
        var teksTandai = "Tandai Beli";
        if (x.perluBeli) {
            teksTandai = "Batal Tandai";
        }
        var badgeBeli = "";
        if (x.perluBeli) {
            badgeBeli = "<span class='badge s-Beli'>Perlu dibeli</span>";
        }
        html = html + "<tr>" +
            "<td><strong>" + aman(x.nama) + "</strong></td>" +
            "<td>" + aman(x.kategori) + "</td>" +
            "<td>" + aman(x.lokasi) + "</td>" +
            "<td><div class='qty'>" +
            "<button class='mini' onclick='ubahStok(" + x.id + ", \"Keluar\", 1, \"Kurangi cepat\")'>−</button>" +
            "<b>" + x.jumlah + " " + aman(x.satuan) + "</b>" +
            "<button class='mini' onclick='ubahStok(" + x.id + ", \"Masuk\", 1, \"Tambah cepat\")'>+</button>" +
            "</div></td>" +
            "<td>" + x.min + "</td>" +
            "<td><span class='badge s-" + status(x) + "'>" + status(x) + "</span>" + badgeBeli + "</td>" +
            "<td><div class='aksi-item'>" +
            "<button class='mini teks' onclick='bukaFormStok(" + x.id + ", \"Masuk\")'>Catat</button>" +
            "<button class='mini teks' onclick='tandaiBeli(" + x.id + ")'>" + teksTandai + "</button>" +
            "<button class='mini teks' onclick='bukaFormBarang(" + x.id + ")'>Ubah</button>" +
            "<button class='mini bahaya' onclick='hapusBarang(" + x.id + ")'>✕</button>" +
            "</div></td></tr>";
    }
    if (html == "") {
        if (barang.length == 0) {
            html = "<tr><td colspan='7' class='kosong-tabel'>Belum ada barang. Klik Tambah untuk memulai.</td></tr>";
        } else {
            html = "<tr><td colspan='7' class='kosong-tabel'>Tidak ada barang yang cocok.</td></tr>";
        }
    }
    document.getElementById("daftarBarang").innerHTML = html;
}

// Angka untuk mengurutkan status (kecil = lebih parah)
function nilaiStatus(b) {
    if (status(b) == "Habis") {
        return 0;
    }
    if (status(b) == "Menipis") {
        return 1;
    }
    return 2;
}

// ---------- Kategori (FR-01) ----------
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

// ---------- Daftar belanja otomatis (FR-04 dan FR-06) ----------
function tampilBelanja() {
    var html = "";
    for (var i = 0; i < barang.length; i++) {
        var b = barang[i];
        if (perluDibeli(b)) {
            var alasan = "Stok sama dengan atau di bawah minimum";
            var tombolTandai = "";
            if (b.jumlah > b.min) {
                alasan = "Ditandai perlu dibeli";
                tombolTandai = "<button class='mini teks' onclick='tandaiBeli(" + b.id + ")'>Batal Tandai</button>";
            }
            html = html + "<tr><td><strong>" + aman(b.nama) + "</strong></td>" +
                "<td>" + aman(b.lokasi) + "</td>" +
                "<td>" + b.jumlah + " " + aman(b.satuan) + "</td>" +
                "<td>" + b.min + "</td>" +
                "<td>" + alasan + "</td>" +
                "<td><div class='aksi-item'>" +
                "<button class='mini teks hijau' onclick='bukaFormStok(" + b.id + ", \"Masuk\")'>Stok Masuk</button>" +
                tombolTandai + "</div></td></tr>";
        }
    }
    if (html == "") {
        html = "<tr><td colspan='6' class='kosong-tabel'>Tidak ada barang yang perlu dibeli. Semua stok aman.</td></tr>";
    }
    document.getElementById("tabelBelanja").innerHTML = html;
}

// ---------- Catatan kebutuhan lain ----------
function tampilCatatan() {
    var html = "";
    for (var i = 0; i < catatan.length; i++) {
        var c = catatan[i];
        var kelas = "";
        var centang = "";
        if (c.done) {
            kelas = "selesai";
            centang = "checked";
        }
        html = html + "<li class='" + kelas + "'><label>" +
            "<input type='checkbox' " + centang + " onclick='centangCatatan(" + c.id + ")'> " +
            "<span class='nama-item'>" + aman(c.nama) + "</span></label>" +
            "<button class='mini bahaya' onclick='hapusCatatan(" + c.id + ")'>✕</button></li>";
    }
    if (html == "") {
        html = "<li class='kosong'>Belum ada catatan.</li>";
    }
    document.getElementById("listKebutuhan").innerHTML = html;
}

// ---------- Riwayat perubahan stok (FR-03 dan FR-07) ----------
function tampilRiwayat() {
    var filterJenis = document.getElementById("fJenis").value;
    var html = "";
    for (var i = 0; i < riwayat.length; i++) {
        var r = riwayat[i];
        if (filterJenis == "" || r.jenis == filterJenis) {
            var namaJenis = r.jenis;
            if (r.jenis == "Info") {
                namaJenis = "Perubahan data";
            }
            var jumlahTampil = r.jumlah;
            if (r.jenis == "Masuk") {
                jumlahTampil = "+" + r.jumlah;
            }
            if (r.jenis == "Keluar") {
                jumlahTampil = "-" + r.jumlah;
            }
            if (r.jumlah === "") {
                jumlahTampil = "-";
            }
            var stokAkhir = r.stokAkhir;
            if (stokAkhir === "") {
                stokAkhir = "-";
            }
            html = html + "<tr><td>" + waktu(r.t) + "</td>" +
                "<td>" + aman(r.nama) + "</td>" +
                "<td><span class='jenis-" + r.jenis + "'>" + namaJenis + "</span></td>" +
                "<td>" + jumlahTampil + "</td>" +
                "<td>" + stokAkhir + "</td>" +
                "<td>" + aman(r.ket) + "</td></tr>";
        }
    }
    if (html == "") {
        html = "<tr><td colspan='6' class='kosong-tabel'>Belum ada riwayat.</td></tr>";
    }
    document.getElementById("tabelRiwayat").innerHTML = html;
}

// ============================================================
// NAVIGASI
// ============================================================
var judulHalaman = {
    beranda: "Beranda",
    stok: "Daftar Stok",
    kategori: "Kategori",
    kebutuhan: "Kebutuhan",
    riwayat: "Riwayat"
};

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
    window.scrollTo(0, 0);
}

// Dipakai kartu ringkasan: buka Daftar Stok dengan filter status
function lihatStok(st) {
    document.getElementById("fStatus").value = st;
    tampilStok();
    bukaHalaman("stok");
}

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

// ============================================================
// FORM POP-UP
// ============================================================
function tutupForm(idOverlay) {
    document.getElementById(idOverlay).classList.remove("show");
}

// ---------- Form barang (FR-02) ----------
function isiPilihanKategori() {
    var html = "";
    for (var i = 0; i < daftarKategori.length; i++) {
        html = html + "<option>" + aman(daftarKategori[i].nama) + "</option>";
    }
    document.getElementById("kategori").innerHTML = html;
}

// id = 0 artinya tambah barang baru, selain itu artinya ubah barang
function bukaFormBarang(id) {
    if (daftarKategori.length == 0) {
        alert("Buat kategori dulu sebelum menambah barang.");
        bukaHalaman("kategori");
        return;
    }
    isiPilihanKategori();
    var b = null;
    if (id != 0) {
        b = cariBarang(id);
    }
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
        document.getElementById("satuan").value = "buah";
        document.getElementById("min").value = 2;
    }
    document.getElementById("overlayBarang").classList.add("show");
    document.getElementById("nama").focus();
}

function simpanBarang(event) {
    event.preventDefault();

    var id = Number(document.getElementById("idBarang").value);
    var nama = document.getElementById("nama").value.trim();
    var kategori = document.getElementById("kategori").value;
    var lokasi = document.getElementById("lokasi").value.trim();
    var jumlah = parseInt(document.getElementById("jumlah").value, 10);
    var satuan = document.getElementById("satuan").value;
    var min = parseInt(document.getElementById("min").value, 10);

    if (nama == "" || lokasi == "") {
        alert("Nama barang dan lokasi tidak boleh kosong.");
        return;
    }
    if (isNaN(jumlah) || jumlah < 0) {
        jumlah = 0;
    }
    if (isNaN(min) || min < 0) {
        min = 0;
    }

    // cek nama kembar
    for (var i = 0; i < barang.length; i++) {
        if (barang[i].id != id && barang[i].nama.toLowerCase() == nama.toLowerCase()) {
            toast("Barang dengan nama itu sudah ada", "peringatan");
            return;
        }
    }

    if (id == 0) {
        // tambah barang baru
        var baru = buatBarang(nama, kategori, lokasi, jumlah, satuan, min);
        barang.unshift(baru);
        if (jumlah > 0) {
            catatRiwayat(nama, "Masuk", jumlah, jumlah, "Stok awal barang baru");
        } else {
            catatRiwayat(nama, "Info", "", "", "Barang ditambahkan");
        }
        toast("Barang ditambahkan");
    } else {
        // ubah barang
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
        toast("Perubahan disimpan");
    }
    tutupForm("overlayBarang");
    tampilSemua();
}

function hapusBarang(id) {
    var b = cariBarang(id);
    if (b == null) {
        return;
    }
    if (confirm("Hapus \"" + b.nama + "\" dari daftar stok?")) {
        barang = buangDariDaftar(barang, id);
        catatRiwayat(b.nama, "Info", "", "", "Barang dihapus");
        toast("Barang dihapus", "bahaya");
        tampilSemua();
    }
}

// ---------- Stok masuk / keluar (FR-03) ----------
function bukaFormStok(id, jenis) {
    var b = cariBarang(id);
    if (b == null) {
        return;
    }
    document.getElementById("idStok").value = b.id;
    document.getElementById("infoStok").textContent = b.nama + " - stok saat ini " + b.jumlah + " " + b.satuan;
    document.getElementById("jenisStok").value = jenis;
    document.getElementById("jumlahStok").value = "";
    document.getElementById("ketStok").value = "";
    document.getElementById("overlayStok").classList.add("show");
    document.getElementById("jumlahStok").focus();
}

function simpanStok(event) {
    event.preventDefault();
    var id = Number(document.getElementById("idStok").value);
    var jenis = document.getElementById("jenisStok").value;
    var jumlah = parseInt(document.getElementById("jumlahStok").value, 10);
    var ket = document.getElementById("ketStok").value.trim();

    if (isNaN(jumlah) || jumlah < 1) {
        alert("Jumlah minimal 1.");
        return;
    }
    if (ket == "") {
        ket = "Stok " + jenis.toLowerCase();
    }
    if (ubahStok(id, jenis, jumlah, ket)) {
        tutupForm("overlayStok");
        toast("Stok " + jenis.toLowerCase() + " dicatat");
    }
}

// Mengubah stok barang dan mencatatnya ke riwayat. Hasilnya true kalau berhasil.
function ubahStok(id, jenis, jumlah, ket) {
    var b = cariBarang(id);
    if (b == null) {
        return false;
    }
    var statusLama = status(b);

    if (jenis == "Keluar") {
        if (jumlah > b.jumlah) {
            alert("Stok keluar tidak boleh lebih besar dari stok saat ini (" + b.jumlah + " " + b.satuan + ").");
            return false;
        }
        b.jumlah = b.jumlah - jumlah;
    } else {
        b.jumlah = b.jumlah + jumlah;
        b.perluBeli = false;   // barang sudah masuk, tanda perlu dibeli dihapus
    }
    catatRiwayat(b.nama, jenis, jumlah, b.jumlah, ket);

    var statusBaru = status(b);
    if (statusBaru != statusLama && statusBaru == "Habis") {
        toast(b.nama + " habis", "bahaya");
    } else if (statusBaru != statusLama && statusBaru == "Menipis") {
        toast(b.nama + " menipis", "peringatan");
    }
    tampilSemua();
    return true;
}

// ---------- Penandaan perlu dibeli (FR-06) ----------
function tandaiBeli(id) {
    var b = cariBarang(id);
    if (b == null) {
        return;
    }
    b.perluBeli = !b.perluBeli;
    if (b.perluBeli) {
        catatRiwayat(b.nama, "Info", "", "", "Ditandai perlu dibeli");
        toast(b.nama + " ditandai perlu dibeli");
    } else {
        catatRiwayat(b.nama, "Info", "", "", "Tanda perlu dibeli dibatalkan");
        toast("Tanda dibatalkan");
    }
    tampilSemua();
}

// ---------- Kategori (FR-01) ----------
function bukaFormKategori(id) {
    var k = null;
    if (id != 0) {
        k = cariKategori(id);
    }
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
    document.getElementById("namaKategori").focus();
}

function simpanKategori(event) {
    event.preventDefault();
    var id = Number(document.getElementById("idKategori").value);
    var nama = document.getElementById("namaKategori").value.trim();

    if (nama == "") {
        alert("Nama kategori tidak boleh kosong.");
        return;
    }
    for (var i = 0; i < daftarKategori.length; i++) {
        if (daftarKategori[i].id != id && daftarKategori[i].nama.toLowerCase() == nama.toLowerCase()) {
            toast("Kategori itu sudah ada", "peringatan");
            return;
        }
    }

    if (id == 0) {
        daftarKategori.push({ id: idBaru(), nama: nama });
        catatRiwayat("-", "Info", "", "", "Kategori " + nama + " ditambahkan");
        toast("Kategori ditambahkan");
    } else {
        var k = cariKategori(id);
        var namaLama = k.nama;
        k.nama = nama;
        // barang yang memakai kategori ini ikut berganti nama
        for (var j = 0; j < barang.length; j++) {
            if (barang[j].kategori == namaLama) {
                barang[j].kategori = nama;
            }
        }
        catatRiwayat("-", "Info", "", "", "Kategori " + namaLama + " diubah menjadi " + nama);
        toast("Kategori diperbarui");
    }
    tutupForm("overlayKategori");
    tampilSemua();
}

function hapusKategori(id) {
    var k = cariKategori(id);
    if (k == null) {
        return;
    }
    var dipakai = 0;
    for (var i = 0; i < barang.length; i++) {
        if (barang[i].kategori == k.nama) {
            dipakai = dipakai + 1;
        }
    }
    if (dipakai > 0) {
        alert("Kategori \"" + k.nama + "\" masih dipakai " + dipakai + " barang. Pindahkan atau hapus barangnya dulu.");
        return;
    }
    if (confirm("Hapus kategori \"" + k.nama + "\"?")) {
        daftarKategori = buangDariDaftar(daftarKategori, id);
        catatRiwayat("-", "Info", "", "", "Kategori " + k.nama + " dihapus");
        toast("Kategori dihapus", "bahaya");
        tampilSemua();
    }
}

// ---------- Catatan kebutuhan lain ----------
function tambahCatatan(event) {
    event.preventDefault();
    var nama = document.getElementById("namaKebutuhan").value.trim();
    if (nama == "") {
        return;
    }
    for (var i = 0; i < catatan.length; i++) {
        if (catatan[i].done == false && catatan[i].nama.toLowerCase() == nama.toLowerCase()) {
            toast("Barang itu sudah ada di catatan", "peringatan");
            return;
        }
    }
    catatan.unshift({ id: idBaru(), nama: nama, done: false });
    document.getElementById("namaKebutuhan").value = "";
    toast("Ditambahkan ke catatan");
    tampilSemua();
}

function centangCatatan(id) {
    for (var i = 0; i < catatan.length; i++) {
        if (catatan[i].id == id) {
            catatan[i].done = !catatan[i].done;
        }
    }
    tampilSemua();
}

function hapusCatatan(id) {
    catatan = buangDariDaftar(catatan, id);
    tampilSemua();
}

function hapusCatatanSelesai() {
    var sisa = [];
    for (var i = 0; i < catatan.length; i++) {
        if (catatan[i].done == false) {
            sisa.push(catatan[i]);
        }
    }
    catatan = sisa;
    tampilSemua();
}

// ---------- Lain-lain ----------
function hapusRiwayat() {
    if (riwayat.length > 0 && confirm("Hapus semua riwayat?")) {
        riwayat = [];
        tampilSemua();
    }
}

function kembalikanContoh() {
    if (confirm("Kembalikan semua data ke contoh awal? Data saat ini akan hilang.")) {
        barang = buatBarangContoh();
        catatan = [];
        riwayat = [];
        catatRiwayat("-", "Info", "", "", "Data dikembalikan ke contoh awal");
        tampilSemua();
        toast("Data contoh dipulihkan");
    }
}

// Ekspor data stok ke file CSV (bisa dibuka di Excel)
function eksporCSV() {
    var teks = "Nama,Kategori,Lokasi,Stok,Satuan,Minimum,Status,Perlu Dibeli\n";
    for (var i = 0; i < barang.length; i++) {
        var b = barang[i];
        var beli = "Tidak";
        if (perluDibeli(b)) {
            beli = "Ya";
        }
        teks = teks + '"' + b.nama + '","' + b.kategori + '","' + b.lokasi + '",' + b.jumlah + ',"' + b.satuan + '",' + b.min + ',"' + status(b) + '","' + beli + '"\n';
    }
    var link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\ufeff" + teks], { type: "text/csv" }));
    link.download = "stok-stockly.csv";
    link.click();
    toast("Data stok diekspor");
}

// Tombol Escape menutup semua pop-up
document.addEventListener("keydown", function (e) {
    if (e.key == "Escape") {
        var semua = document.getElementsByClassName("overlay");
        for (var i = 0; i < semua.length; i++) {
            semua[i].classList.remove("show");
        }
    }
});

// Klik area gelap di luar kotak form juga menutup pop-up
var semuaOverlay = document.getElementsByClassName("overlay");
for (var o = 0; o < semuaOverlay.length; o++) {
    semuaOverlay[o].addEventListener("click", function (e) {
        if (e.target == this) {
            this.classList.remove("show");
        }
    });
}

// ---------- Jalankan saat halaman dibuka ----------
var jam = new Date().getHours();
var waktuHari = "malam";
if (jam < 11) {
    waktuHari = "pagi";
} else if (jam < 15) {
    waktuHari = "siang";
} else if (jam < 18) {
    waktuHari = "sore";
}
var namaDepan = namaUser.split(" ")[0];
document.getElementById("sapaan").textContent = "Selamat " + waktuHari + ", " + namaDepan;
document.getElementById("tanggal").textContent =
    new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) +
    ". Berikut ringkasan persediaan Anda.";
document.getElementById("namaUser").textContent = namaUser;

var inisial = "";
var kata = namaUser.split(" ");
for (var q = 0; q < kata.length && q < 2; q++) {
    inisial = inisial + kata[q].charAt(0);
}
document.getElementById("avatar").textContent = inisial.toUpperCase();

tampilSemua();
