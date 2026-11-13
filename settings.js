
// ============================================================
// FOCUS FLOW - SETTINGS JAVASCRIPT
// File: settings.js
//
// FUNGSI UTAMA:
// 1. Menampilkan nama dan email pengguna.
// 2. Mengatur pilihan tema website.
// 3. Mengatur target dan durasi belajar.
// 4. Mengatur pilihan notifikasi.
// 5. Menyimpan pengaturan ke Firebase Firestore.
// 6. Menyimpan pilihan tema ke Local Storage.
// 7. Menjalankan tombol Save Settings.
// 8. Menjalankan tombol Reset Settings.
// 9. Menjalankan tombol Logout.
// ============================================================

// ============================================================
// BAGIAN 1: IMPORT FIREBASE
// Mengambil alat yang dibutuhkan untuk menggunakan Firebase.
// ============================================================

// Mengambil koneksi Firebase Authentication dan Firestore
// dari file firebase.js milik Focus Flow.
import { auth, db } from "./firebase.js";

// Mengambil fungsi untuk memeriksa akun yang sedang login
// dan mengeluarkan pengguna dari akun.
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

// Mengambil fungsi untuk membaca dan menyimpan data
// pengaturan pengguna ke Firebase Firestore.
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

// ============================================================
// BAGIAN 2: MENGAMBIL ELEMENT HTML
// Menghubungkan JavaScript dengan bagian-bagian HTML.
// ============================================================

// Mengambil kolom yang nantinya digunakan untuk menampilkan
// nama dan email dari akun pengguna.
const profileNameInput = document.getElementById("profile-name");
const profileEmailInput = document.getElementById("profile-email");

// Element untuk memilih, menampilkan, dan mengganti foto profil.
const profilePhotoInput = document.getElementById("profile-photo-input");
const changeProfilePhotoButton = document.getElementById("change-profile-photo-btn");
const settingsProfilePhoto = document.getElementById("settings-profile-photo");
const settingsProfilePlaceholder = document.getElementById("settings-profile-placeholder");

// Mengambil semua pilihan tema yang tersedia.
// querySelectorAll digunakan karena pilihan tema berjumlah lebih dari satu.
const themeInputs = document.querySelectorAll('input[name="theme"]');

// Mengambil kolom untuk mengatur target dan waktu belajar.
const dailyStudyGoalInput = document.getElementById("daily-study-goal");
const focusDurationInput = document.getElementById("focus-duration");
const shortBreakDurationInput = document.getElementById("short-break-duration");
const longBreakDurationInput = document.getElementById("long-break-duration");

// Mengambil checkbox untuk pengaturan pengingat tugas dan belajar.
const taskNotificationInput = document.getElementById("task-notification");
const studyNotificationInput = document.getElementById("study-notification");

// Mengambil tombol untuk menyimpan, mengembalikan, dan keluar dari pengaturan.
const saveSettingsButton = document.getElementById("save-settings-btn");
const resetSettingsButton = document.getElementById("reset-settings-btn");
const logoutButton = document.getElementById("logout-btn");

// Mengambil tempat untuk menampilkan pesan berhasil atau gagal.
const settingsMessage = document.getElementById("settings-message");


// ============================================================
// BAGIAN 3: PENGATURAN DEFAULT
// Menentukan nilai awal jika pengguna belum pernah menyimpan pengaturan.
// ============================================================

// Tema Lavender menjadi tema awal Focus Flow.
const DEFAULT_THEME = "lavender";

// Nama tempat penyimpanan tema di browser.
// Nama ini digunakan agar halaman lain dapat membaca tema yang sama.
const THEME_STORAGE_KEY = "focusFlowTheme";

// Kumpulan nilai awal untuk pengaturan belajar.
// Angka-angka ini akan digunakan jika belum ada data tersimpan.
const DEFAULT_STUDY_PREFERENCES = {
    dailyStudyGoal: 2,       // Target belajar awal adalah 2 jam sehari.
    focusDuration: 25,       // Waktu fokus awal adalah 25 menit.
    shortBreakDuration: 5,   // Istirahat pendek awal adalah 5 menit.
    longBreakDuration: 15    // Istirahat panjang awal adalah 15 menit.
};

// Kumpulan pilihan notifikasi yang aktif secara bawaan.
const DEFAULT_NOTIFICATION_PREFERENCES = {
    taskNotification: true,  // Pengingat tugas awalnya aktif.
    studyNotification: true  // Pengingat belajar awalnya aktif.
};

// Daftar nama tema yang boleh digunakan oleh website.
// Daftar ini membantu mencegah penggunaan nama tema yang tidak tersedia.
const VALID_THEMES = ["lavender", "pink", "blue", "green"];

// Menyimpan informasi akun pengguna yang sedang login.
// Nilainya akan diisi setelah Firebase memeriksa status login.
let currentUser = null;

// Menandai apakah proses penyimpanan sedang berjalan.
// Tujuannya agar tombol Save tidak diproses berkali-kali.
let isSaving = false;


// ============================================================
// BAGIAN 4: DAFTAR WARNA TEMA
// Menyimpan kumpulan warna untuk setiap pilihan tema.
// ============================================================

// Setiap tema mempunyai warna utama, warna latar,
// warna teks, dan warna garis pembatas.
// Warna ini digunakan untuk mengubah tampilan website.

const themeColors = {

    // Kumpulan warna untuk tema Lavender.
    lavender: {
        primary: "#9275e8",
        primaryDark: "#7658d2",
        primaryLight: "#e9e1ff",
        background: "#f8f6ff",
        card: "#ffffff",
        textDark: "#332b4a",
        textMuted: "#8b849d",
        border: "#ece6f8"
    },

    // Kumpulan warna untuk tema Pink.
    pink: {
        primary: "#e879a9",
        primaryDark: "#cf5d91",
        primaryLight: "#ffe2ef",
        background: "#fff5fa",
        card: "#ffffff",
        textDark: "#4a2b3b",
        textMuted: "#a18494",
        border: "#f7dfeb"
    },

    // Kumpulan warna untuk tema Blue.
    blue: {
        primary: "#6c9ee8",
        primaryDark: "#4e7fc9",
        primaryLight: "#deebff",
        background: "#f3f8ff",
        card: "#ffffff",
        textDark: "#263b57",
        textMuted: "#8494aa",
        border: "#e0ebf9"
    },

    // Kumpulan warna untuk tema Green.
    green: {
        primary: "#70b99a",
        primaryDark: "#4d9979",
        primaryLight: "#ddf5e9",
        background: "#f3fbf6",
        card: "#ffffff",
        textDark: "#294638",
        textMuted: "#839b8e",
        border: "#e0f0e6"
    }

};


// ============================================================
// BAGIAN 5: FUNGSI MENERAPKAN TEMA
// Mengubah warna halaman sesuai tema yang dipilih.
// ============================================================

// Parameter theme berisi nama tema yang ingin digunakan.
// Contohnya: lavender, pink, blue, atau green.

function applyTheme(theme) {

    // Memeriksa apakah nama tema tersedia.
    // Jika tidak tersedia, website menggunakan Lavender.
    const selectedTheme = VALID_THEMES.includes(theme)
        ? theme
        : DEFAULT_THEME;

    // Mengambil kumpulan warna sesuai tema yang dipilih.
    const colors = themeColors[selectedTheme];

    // Mengubah warna utama yang sudah disiapkan di CSS.
    document.documentElement.style.setProperty("--primary", colors.primary);

    // Mengubah warna utama untuk bagian tombol atau efek yang lebih gelap.
    document.documentElement.style.setProperty("--primary-dark", colors.primaryDark);

    // Mengubah warna utama versi lebih terang.
    document.documentElement.style.setProperty("--primary-light", colors.primaryLight);

    // Mengubah warna latar belakang halaman.
    document.documentElement.style.setProperty("--background", colors.background);

    // Mengubah warna dasar kartu.
    document.documentElement.style.setProperty("--card", colors.card);

    // Mengubah warna tulisan utama.
    document.documentElement.style.setProperty("--text-dark", colors.textDark);

    // Mengubah warna tulisan tambahan.
    document.documentElement.style.setProperty("--text-muted", colors.textMuted);

    // Mengubah warna garis pembatas.
    document.documentElement.style.setProperty("--border", colors.border);

    // Memberikan tanda pada HTML mengenai tema yang sedang digunakan.
    // Tanda ini juga dapat dibaca oleh CSS.
    document.documentElement.setAttribute("data-theme", selectedTheme);
}


// ============================================================
// BAGIAN 6: MEMBACA PILIHAN TEMA
// Mengetahui tema mana yang sedang dipilih pengguna.
// ============================================================

function getSelectedTheme() {

    // Mencari pilihan tema yang sedang dicentang.
    const selectedInput = document.querySelector(
        'input[name="theme"]:checked'
    );

    // Jika belum ada tema yang dipilih, gunakan Lavender.
    if (!selectedInput) {
        return DEFAULT_THEME;
    }

    // Mengambil nama tema dari atribut value.
    // Contohnya, jika Pink dipilih, hasilnya adalah "pink".
    return VALID_THEMES.includes(selectedInput.value)
        ? selectedInput.value
        : DEFAULT_THEME;
}


// ============================================================
// BAGIAN 7: MENYIMPAN TEMA KE LOCAL STORAGE
// Menyimpan pilihan tema pada browser pengguna.
// ============================================================

// Parameter theme berisi nama tema yang akan disimpan.

function saveThemeToLocalStorage(theme) {

    try {

        // Memastikan tema yang disimpan tersedia.
        // Jika tidak tersedia, gunakan tema Lavender.
        if (!VALID_THEMES.includes(theme)) {
            theme = DEFAULT_THEME;
        }

        // Menyimpan nama tema ke penyimpanan browser.
        // Halaman lain dapat membaca nilai ini.
        localStorage.setItem(THEME_STORAGE_KEY, theme);

    } catch (error) {

        // Menampilkan informasi kesalahan jika browser
        // tidak mengizinkan penyimpanan Local Storage.
        console.error("Gagal menyimpan tema lokal:", error);

    }

}


// ============================================================
// BAGIAN 8: MENAMPILKAN PESAN
// Menampilkan informasi kepada pengguna setelah melakukan tindakan.
// ============================================================

// message berisi tulisan yang ingin ditampilkan.
// type menentukan jenis pesan, misalnya success atau error.

function showMessage(message, type = "success") {

    // Jika tempat pesan tidak ditemukan di HTML,
    // fungsi dihentikan agar tidak terjadi kesalahan.
    if (!settingsMessage) {
        return;
    }

    // Memasukkan tulisan ke dalam tempat pesan.
    settingsMessage.textContent = message;

    // Mengembalikan class pesan ke bentuk dasarnya.
    settingsMessage.className = "settings-message";

    // Menambahkan class sesuai jenis pesan.
    // CSS dapat membedakan tampilan pesan berhasil dan gagal.
    settingsMessage.classList.add(type);

}

// ============================================================
// BAGIAN 9: MENAMPILKAN INFORMASI PROFIL
// Mengambil nama dan email dari akun Firebase Authentication.
// Foto profil dibaca dari Local Storage browser.
// ============================================================

// Nama dasar penyimpanan foto profil di browser.
// UID digunakan agar setiap akun memiliki foto masing-masing.
const PROFILE_PHOTO_STORAGE_KEY = "focusFlowProfilePhoto_";

// Parameter user berisi informasi akun pengguna yang sedang login.
function displayProfile(user) {

    // Jika kolom nama tersedia, tampilkan nama pengguna.
    if (profileNameInput) {

        // Jika nama akun belum tersedia,
        // tampilkan tulisan Focus Flow User.
        profileNameInput.value =
            user.displayName || "Focus Flow User";

    }

    // Jika kolom email tersedia, tampilkan email pengguna.
    if (profileEmailInput) {

        // Jika email tidak tersedia, tampilkan keterangan pengganti.
        profileEmailInput.value =
            user.email || "Email tidak tersedia";

    }

    // Menampilkan foto profil berdasarkan UID pengguna.
    displayProfilePhoto(user.uid);

}


// ============================================================
// MENAMPILKAN FOTO PROFIL
// Membaca foto dari Local Storage sesuai UID pengguna.
// ============================================================

function displayProfilePhoto(userId) {

    // Memastikan elemen gambar dan placeholder tersedia.
    if (!settingsProfilePhoto || !settingsProfilePlaceholder) {
        return;
    }

    try {

        // Mengambil foto yang tersimpan di browser.
        // UID membuat foto setiap akun tersimpan secara terpisah.
        const savedPhoto = localStorage.getItem(
            PROFILE_PHOTO_STORAGE_KEY + userId
        );

        // Jika foto ditemukan, tampilkan foto tersebut.
        if (savedPhoto) {

            settingsProfilePhoto.src = savedPhoto;

            settingsProfilePhoto.hidden = false;

            settingsProfilePlaceholder.hidden = true;

        } else {

            // Jika belum ada foto, tampilkan ikon bawaan.
            settingsProfilePhoto.removeAttribute("src");

            settingsProfilePhoto.hidden = true;

            settingsProfilePlaceholder.hidden = false;

        }

    } catch (error) {

        // Menampilkan kesalahan jika Local Storage bermasalah.
        console.error("Gagal membaca foto profil:", error);

        // Mengembalikan tampilan ke ikon bawaan.
        settingsProfilePhoto.removeAttribute("src");

        settingsProfilePhoto.hidden = true;

        settingsProfilePlaceholder.hidden = false;

    }

}


// ============================================================
// MENYIMPAN FOTO PROFIL
// Mengubah foto menjadi format yang lebih ringan,
// kemudian menyimpannya ke Local Storage browser.
// ============================================================

async function uploadProfilePhoto(file) {

    // Memastikan pengguna sudah login dan file tersedia.
    if (!currentUser || !file) {
        return;
    }

    // Memeriksa apakah file merupakan gambar.
    if (!file.type.startsWith("image/")) {

        showMessage(
            "Pilih file gambar terlebih dahulu.",
            "error"
        );

        return;

    }

    // Membatasi ukuran file asli maksimal 5 MB.
    if (file.size > 5 * 1024 * 1024) {

        showMessage(
            "Ukuran foto maksimal 5 MB.",
            "error"
        );

        return;

    }

    try {

        // Menonaktifkan tombol selama proses berlangsung.
        changeProfilePhotoButton.disabled = true;

        changeProfilePhotoButton.textContent = "Memproses...";

        // Membuat alamat sementara untuk membaca gambar.
        const imageURL = URL.createObjectURL(file);

        // Membuat objek gambar untuk memproses file.
        const image = new Image();

        // Menunggu sampai gambar berhasil dibaca browser.
        await new Promise((resolve, reject) => {

            image.onload = resolve;

            image.onerror = reject;

            image.src = imageURL;

        });

        // Menentukan ukuran maksimal gambar.
        const maxWidth = 1000;

        const maxHeight = 1000;

        // Mengambil ukuran asli gambar.
        let width = image.width;

        let height = image.height;

        // Mengecilkan gambar jika ukurannya terlalu besar.
        // Perbandingan lebar dan tinggi tetap dipertahankan.
        if (width > maxWidth || height > maxHeight) {

            const scale = Math.min(
                maxWidth / width,
                maxHeight / height
            );

            width = Math.round(width * scale);

            height = Math.round(height * scale);

        }

        // Membuat canvas untuk mengolah gambar.
        const canvas = document.createElement("canvas");

        // Menentukan ukuran canvas sesuai hasil pengolahan.
        canvas.width = width;

        canvas.height = height;

        // Mengambil alat untuk menggambar pada canvas.
        const context = canvas.getContext("2d");

        // Memasukkan gambar ke dalam canvas.
        context.drawImage(
            image,
            0,
            0,
            width,
            height
        );

        // Mengubah gambar menjadi JPEG dengan kualitas 80%.
        // Cara ini membantu mengurangi ukuran penyimpanan.
        const compressedPhoto = canvas.toDataURL(
            "image/jpeg",
            0.8
        );

        // Menghapus alamat sementara gambar.
        URL.revokeObjectURL(imageURL);

        // Memeriksa apakah hasil foto masih terlalu besar.
        if (compressedPhoto.length > 4500000) {

            showMessage(
                "Foto masih terlalu besar. Pilih gambar lain.",
                "error"
            );

            return;

        }

        // Membuat nama penyimpanan berdasarkan UID pengguna.
        const photoStorageKey =
            PROFILE_PHOTO_STORAGE_KEY + currentUser.uid;

        // Menyimpan foto ke Local Storage browser.
        localStorage.setItem(
            photoStorageKey,
            compressedPhoto
        );

        // Memperbarui tampilan foto profil.
        displayProfilePhoto(currentUser.uid);

        // Menampilkan pesan keberhasilan.
        showMessage(
            "Foto profil berhasil diperbarui.",
            "success"
        );

    } catch (error) {

        // Menampilkan informasi kesalahan di Console.
        console.error(
            "Gagal menyimpan foto profil:",
            error
        );

        // Memberi tahu pengguna jika penyimpanan gagal.
        showMessage(
            "Foto gagal disimpan. Periksa penyimpanan browser.",
            "error"
        );

    } finally {

        // Mengaktifkan kembali tombol.
        changeProfilePhotoButton.disabled = false;

        // Mengembalikan tulisan tombol seperti semula.
        changeProfilePhotoButton.textContent = "Ubah Foto Profil";

        // Mengosongkan input file agar foto yang sama
        // dapat dipilih kembali jika diperlukan.
        profilePhotoInput.value = "";

    }

}

// ============================================================
// BAGIAN 10: MEMUAT PREFERENSI BELAJAR
// Memasukkan data durasi dan target belajar ke kolom HTML.
// ============================================================

// Parameter preferences berisi data pengaturan belajar
// yang dibaca dari Firebase.

function loadStudyPreferences(preferences) {

    // Menampilkan target belajar harian.
    if (dailyStudyGoalInput) {

        // Jika data belum tersedia, gunakan target awal 2 jam.
        dailyStudyGoalInput.value =
            preferences.dailyStudyGoal ??
            DEFAULT_STUDY_PREFERENCES.dailyStudyGoal;

    }

    // Menampilkan durasi sesi fokus.
    if (focusDurationInput) {

        // Jika data belum tersedia, gunakan 25 menit.
        focusDurationInput.value =
            preferences.focusDuration ??
            DEFAULT_STUDY_PREFERENCES.focusDuration;

    }

    // Menampilkan durasi istirahat pendek.
    if (shortBreakDurationInput) {

        // Jika data belum tersedia, gunakan 5 menit.
        shortBreakDurationInput.value =
            preferences.shortBreakDuration ??
            DEFAULT_STUDY_PREFERENCES.shortBreakDuration;

    }

    // Menampilkan durasi istirahat panjang.
    if (longBreakDurationInput) {

        // Jika data belum tersedia, gunakan 15 menit.
        longBreakDurationInput.value =
            preferences.longBreakDuration ??
            DEFAULT_STUDY_PREFERENCES.longBreakDuration;

    }

}


// ============================================================
// BAGIAN 11: MEMUAT PREFERENSI NOTIFIKASI
// Mengatur kondisi checkbox sesuai data yang tersimpan.
// ============================================================

// Parameter preferences berisi pilihan notifikasi pengguna.

function loadNotificationPreferences(preferences) {

    // Mengatur pilihan pengingat tugas.
    if (taskNotificationInput) {

        // Jika belum ada data, gunakan kondisi awal yang aktif.
        taskNotificationInput.checked =
            preferences.taskNotification ??
            DEFAULT_NOTIFICATION_PREFERENCES.taskNotification;

    }

    // Mengatur pilihan pengingat jadwal belajar.
    if (studyNotificationInput) {

        // Jika belum ada data, gunakan kondisi awal yang aktif.
        studyNotificationInput.checked =
            preferences.studyNotification ??
            DEFAULT_NOTIFICATION_PREFERENCES.studyNotification;

    }

}


// ============================================================
// BAGIAN 12: MEMUAT SEMUA PENGATURAN
// Membaca pengaturan pengguna dari Firebase Firestore.
// ============================================================

// Fungsi async digunakan karena proses membaca Firebase
// membutuhkan waktu dan harus menunggu hasilnya.
// Parameter user berisi akun yang pengaturannya ingin dibaca.

async function loadSettings(user) {

    try {

        // Menentukan lokasi dokumen pengaturan milik pengguna.
        // Setiap pengguna memiliki tempat penyimpanan sendiri.
        const settingsRef = doc(
            db,
            "users",
            user.uid,
            "settings",
            "preferences"
        );

        // Membaca dokumen pengaturan dari Firebase.
        const settingsSnapshot = await getDoc(settingsRef);

        // Menyiapkan tempat untuk menampung data pengaturan.
        // Jika dokumen belum ada, isinya tetap berupa objek kosong.
        let settingsData = {};

        // Memeriksa apakah dokumen pengaturan sudah tersedia.
        if (settingsSnapshot.exists()) {

            // Mengambil seluruh data yang tersimpan.
            settingsData = settingsSnapshot.data();

        }

        // Mengambil nama tema dari data Firebase.
        const savedTheme = settingsData.theme;

        // Memastikan tema yang tersimpan termasuk tema yang tersedia.
        // Jika belum ada, gunakan Lavender.
        const selectedTheme = VALID_THEMES.includes(savedTheme)
            ? savedTheme
            : DEFAULT_THEME;

        // Memberikan tanda centang pada tema yang tersimpan.
        themeInputs.forEach((input) => {

            input.checked = input.value === selectedTheme;

        });

        // Menerapkan warna tema pada halaman Settings.
        applyTheme(selectedTheme);

        // Menyamakan tema yang ada di browser dengan tema Firebase.
        saveThemeToLocalStorage(selectedTheme);

        // Memasukkan data target dan durasi belajar ke kolom HTML.
        loadStudyPreferences(settingsData);

        // Memasukkan data pilihan notifikasi ke checkbox.
        loadNotificationPreferences(settingsData);

        // Menampilkan informasi di Console bahwa proses berhasil.
        console.log("Pengaturan berhasil dimuat.");

    } catch (error) {

        // Menampilkan informasi kesalahan di Console.
        console.error("Gagal memuat pengaturan:", error);

        // Jika terjadi masalah, tema dikembalikan ke Lavender.
        themeInputs.forEach((input) => {

            input.checked = input.value === DEFAULT_THEME;

        });

        // Menerapkan tema awal.
        applyTheme(DEFAULT_THEME);

        // Menyimpan tema awal di browser.
        saveThemeToLocalStorage(DEFAULT_THEME);

        // Mengembalikan target dan durasi belajar ke nilai awal.
        loadStudyPreferences(DEFAULT_STUDY_PREFERENCES);

        // Mengembalikan pilihan notifikasi ke nilai awal.
        loadNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);

        // Memberi tahu pengguna bahwa pengaturan gagal dimuat.
        showMessage(
            "Pengaturan gagal dimuat. Periksa koneksi Firebase.",
            "error"
        );

    }

}


// ============================================================
// BAGIAN 13: VALIDASI PENGATURAN BELAJAR
// Memastikan angka yang dimasukkan pengguna sesuai batas.
// ============================================================

function validateStudyPreferences() {

    // Mengambil angka dari kolom target belajar.
    // Number digunakan agar isi kolom dibaca sebagai angka.
    const dailyGoal = Number(dailyStudyGoalInput?.value);

    // Mengambil angka durasi fokus.
    const focusDuration = Number(focusDurationInput?.value);

    // Mengambil angka durasi istirahat pendek.
    const shortBreak = Number(shortBreakDurationInput?.value);

    // Mengambil angka durasi istirahat panjang.
    const longBreak = Number(longBreakDurationInput?.value);

    // Memastikan semua nilai merupakan angka yang benar.
    if (
        !Number.isFinite(dailyGoal) ||
        !Number.isFinite(focusDuration) ||
        !Number.isFinite(shortBreak) ||
        !Number.isFinite(longBreak)
    ) {

        return false;

    }

    // Memeriksa batas angka yang boleh digunakan:
    // Target belajar: 1 sampai 24 jam.
    // Fokus: 1 sampai 120 menit.
    // Istirahat pendek: 1 sampai 60 menit.
    // Istirahat panjang: 1 sampai 120 menit.
    return (
        dailyGoal >= 1 && dailyGoal <= 24 &&
        focusDuration >= 1 && focusDuration <= 120 &&
        shortBreak >= 1 && shortBreak <= 60 &&
        longBreak >= 1 && longBreak <= 120
    );

}


// ============================================================
// BAGIAN 14: MENYIMPAN PENGATURAN
// Mengirim pilihan pengguna ke Firebase Firestore.
// ============================================================

async function saveSettings() {

    // Memeriksa apakah ada akun yang sedang login.
    if (!currentUser) {

        showMessage("Pengguna belum login.", "error");

        return;

    }

    // Jika penyimpanan sedang berlangsung,
    // proses baru tidak akan dijalankan.
    if (isSaving) {

        return;

    }

    // Memeriksa apakah angka yang dimasukkan sudah benar.
    if (!validateStudyPreferences()) {

        showMessage(
            "Periksa kembali nilai pengaturan belajar.",
            "error"
        );

        return;

    }

    // Memberi tanda bahwa proses penyimpanan sedang berjalan.
    isSaving = true;

    // Menonaktifkan tombol agar tidak ditekan berulang kali.
    if (saveSettingsButton) {

        saveSettingsButton.disabled = true;

        // Mengubah tulisan tombol sementara.
        saveSettingsButton.textContent = "Menyimpan...";

    }

    try {

        // Mengambil nama tema yang sedang dipilih.
        const selectedTheme = getSelectedTheme();

        // Mengumpulkan semua angka pengaturan belajar.
        const studyPreferences = {

            dailyStudyGoal: Number(dailyStudyGoalInput.value),

            focusDuration: Number(focusDurationInput.value),

            shortBreakDuration: Number(shortBreakDurationInput.value),

            longBreakDuration: Number(longBreakDurationInput.value)

        };

        // Mengumpulkan pilihan pengingat tugas dan belajar.
        const notificationPreferences = {

            taskNotification: taskNotificationInput.checked,

            studyNotification: studyNotificationInput.checked

        };

        // Menentukan tempat penyimpanan pengaturan di Firebase.
        const settingsRef = doc(
            db,
            "users",
            currentUser.uid,
            "settings",
            "preferences"
        );

        // Mengirim semua pengaturan ke Firebase Firestore.
        await setDoc(
            settingsRef,
            {

                // Menyimpan tema yang dipilih.
                theme: selectedTheme,

                // Menggabungkan semua pengaturan belajar.
                ...studyPreferences,

                // Menggabungkan semua pengaturan notifikasi.
                ...notificationPreferences,

                // Menyimpan waktu terakhir pengaturan diperbarui.
                updatedAt: serverTimestamp()

            },

            // merge true berarti data lama yang tidak disebutkan
            // tidak ikut dihapus saat pengaturan disimpan.
            { merge: true }

        );

        // Menerapkan tema setelah penyimpanan berhasil.
        applyTheme(selectedTheme);

        // Menyimpan tema yang sama ke browser.
        saveThemeToLocalStorage(selectedTheme);

        // Menampilkan pesan bahwa pengaturan berhasil disimpan.
        showMessage(
            "Settings berhasil disimpan!",
            "success"
        );

        // Menampilkan informasi keberhasilan di Console.
        console.log("Pengaturan berhasil disimpan.");

    } catch (error) {

        // Menampilkan penyebab kesalahan di Console.
        console.error("Gagal menyimpan pengaturan:", error);

        // Memberi tahu pengguna bahwa penyimpanan gagal.
        showMessage(
            "Settings gagal disimpan. Periksa koneksi dan izin Firebase.",
            "error"
        );

    } finally {

        // Mengubah tanda penyimpanan menjadi tidak aktif lagi.
        isSaving = false;

        // Mengaktifkan kembali tombol Save.
        if (saveSettingsButton) {

            saveSettingsButton.disabled = false;

            // Mengembalikan tulisan tombol seperti semula.
            saveSettingsButton.textContent = "Save Settings";

        }

    }

}


// ============================================================
// BAGIAN 15: RESET PENGATURAN
// Mengembalikan pengaturan ke nilai awal.
// ============================================================

async function resetSettings() {

    // Memilih kembali tema Lavender.
    themeInputs.forEach((input) => {

        input.checked = input.value === DEFAULT_THEME;

    });

    // Mengembalikan target dan durasi belajar ke nilai awal.
    loadStudyPreferences(DEFAULT_STUDY_PREFERENCES);

    // Mengembalikan pilihan notifikasi ke kondisi awal.
    loadNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);

    // Langsung menerapkan warna tema Lavender.
    applyTheme(DEFAULT_THEME);

    // Menyimpan hasil reset ke Firebase.
    // Dengan begitu, nilai awal tetap digunakan saat login berikutnya.
    await saveSettings();

}

// ============================================================
// BAGIAN 16: MEMERIKSA STATUS LOGIN
// Memastikan halaman Settings hanya digunakan oleh pengguna login.
// ============================================================

// Ketika tombol Ubah Foto Profil ditekan,
// browser akan membuka jendela pemilihan gambar.
if (changeProfilePhotoButton && profilePhotoInput) {

    changeProfilePhotoButton.addEventListener("click", () => {

        // Membuka pemilihan file dari perangkat pengguna.
        profilePhotoInput.click();

    });

    // Menjalankan proses penyimpanan setelah gambar dipilih.
    profilePhotoInput.addEventListener("change", (event) => {

        // Mengambil file gambar yang dipilih pengguna.
        const selectedFile = event.target.files[0];

        // Jika file tersedia, simpan foto ke Local Storage.
        if (selectedFile) {

            uploadProfilePhoto(selectedFile);

        }

    });

}

// ============================================================
// MEMERIKSA STATUS LOGIN FIREBASE
// ============================================================

onAuthStateChanged(auth, async (user) => {

    // Jika tidak ada pengguna yang login...
    if (!user) {

        // Arahkan pengguna kembali ke halaman Login.
        window.location.href = "login.html";

        return;

    }

    // Menyimpan informasi akun yang sedang login.
    currentUser = user;

    // Menampilkan nama, email, dan foto akun.
    displayProfile(user);

    // Membaca semua pengaturan dari Firebase Firestore.
    await loadSettings(user);

});

// ============================================================
// BAGIAN 17: EVENT PILIHAN TEMA
// Mengubah tampilan ketika pengguna memilih tema lain.
// ============================================================

// Memasang pendengar perubahan pada setiap pilihan tema.
themeInputs.forEach((input) => {

    // Kode di dalam fungsi ini berjalan ketika pilihan berubah.
    input.addEventListener("change", () => {

        // Mengambil tema terbaru dan langsung menerapkannya.
        applyTheme(getSelectedTheme());

    });

});


// ============================================================
// BAGIAN 18: EVENT TOMBOL SAVE
// Menjalankan penyimpanan ketika tombol ditekan.
// ============================================================

if (saveSettingsButton) {

    // Saat tombol Save diklik, jalankan fungsi saveSettings.
    saveSettingsButton.addEventListener("click", saveSettings);

}


// ============================================================
// BAGIAN 19: EVENT TOMBOL RESET
// Menjalankan pengembalian pengaturan ketika tombol ditekan.
// ============================================================

if (resetSettingsButton) {

    // Saat tombol Reset diklik, jalankan fungsi resetSettings.
    resetSettingsButton.addEventListener("click", resetSettings);

}


// ============================================================
// BAGIAN 20: EVENT TOMBOL LOGOUT
// Mengeluarkan pengguna dari akun Focus Flow.
// ============================================================

if (logoutButton) {

    // Menunggu pengguna menekan tombol Logout.
    logoutButton.addEventListener("click", async () => {

        try {

            // Meminta Firebase mengeluarkan akun yang sedang digunakan.
            await signOut(auth);

            // Setelah berhasil keluar, kembali ke halaman Login.
            window.location.href = "login.html";

        } catch (error) {

            // Menampilkan informasi kesalahan jika logout gagal.
            console.error("Gagal logout:", error);

            // Menampilkan pesan kepada pengguna.
            showMessage(
                "Logout gagal. Silakan coba kembali.",
                "error"
            );

        }

    });

}


// ============================================================
// BAGIAN 21: PEMERIKSAAN ELEMENT HTML
// Memeriksa apakah beberapa bagian penting berhasil ditemukan.
// ============================================================

// Pesan ini dapat dilihat melalui Console browser.
console.log("Settings JavaScript berhasil dijalankan.");

// Menampilkan hasil pemeriksaan beberapa elemen HTML.
// Nilai true berarti elemen ditemukan.
// Nilai false berarti elemen tidak ditemukan.
console.log({

    profileName: !!profileNameInput,

    profileEmail: !!profileEmailInput,

    saveButton: !!saveSettingsButton,

    resetButton: !!resetSettingsButton,

    logoutButton: !!logoutButton

});
