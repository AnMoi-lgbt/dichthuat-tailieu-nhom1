let currentUserEmail = '';
let currentUserRole = '';
let html5QrCode = null;

// Chuyển email thành chuỗi key hợp lệ trên Firebase (thay dấu '.' thành '_')
function encodeEmail(email) {
    return email.replace(/\./g, '_');
}

// Khởi tạo tài khoản Giảng viên mặc định lên Firebase
(function initDefaultUser() {
    const defaultEmail = "giangvien@tnut.edu.vn";
    const key = encodeEmail(defaultEmail);
    
    database.ref('users/' + key).once('value', (snapshot) => {
        if (!snapshot.exists()) {
            database.ref('users/' + key).set({
                fullname: "Giảng Viên Quản Trị",
                studentClass: "Khoa Cơ Điện Tử",
                password: "123456",
                role: "giangvien",
                email: defaultEmail
            });
        }
    });
})();

/* ====================================================
   ĐIỀU HƯỚNG MÀN HÌNH
==================================================== */
function showRegisterScreen() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('register-screen').style.display = 'block';
}
function hideRegisterScreen() {
    document.getElementById('register-screen').style.display = 'none';
    document.getElementById('login-screen').style.display = 'block';
}
function showForgotScreen() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('forgot-screen').style.display = 'block';
}
function hideForgotScreen() {
    document.getElementById('forgot-screen').style.display = 'none';
    document.getElementById('login-screen').style.display = 'block';
}

/* ====================================================
   ĐĂNG KÝ / ĐĂNG NHẬP / QUÊN MẬT KHẨU CÙNG FIREBASE
==================================================== */
function doRegister() {
    const fullname = document.getElementById('reg-fullname').value.trim();
    const studentClass = document.getElementById('reg-class').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const errorEl = document.getElementById('reg-error');
    const successEl = document.getElementById('reg-success');

    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    if (!fullname || !studentClass) {
        errorEl.innerText = "Vui lòng nhập đầy đủ Họ tên và Lớp/Mã SV.";
        errorEl.style.display = 'block';
        return;
    }
    if (!email.endsWith('@tnut.edu.vn')) {
        errorEl.innerText = "Lỗi: Email phải có đuôi @tnut.edu.vn";
        errorEl.style.display = 'block';
        return;
    }
    if (password.length < 6) {
        errorEl.innerText = "Lỗi: Mật khẩu phải từ 6 ký tự trở lên.";
        errorEl.style.display = 'block';
        return;
    }

    const userKey = encodeEmail(email);

    database.ref('users/' + userKey).once('value', (snapshot) => {
        if (snapshot.exists()) {
            errorEl.innerText = "Lỗi: Email này đã được đăng ký trên hệ thống!";
            errorEl.style.display = 'block';
        } else {
            database.ref('users/' + userKey).set({
                fullname: fullname,
                studentClass: studentClass,
                password: password,
                role: 'sinhvien',
                email: email
            }, (error) => {
                if (error) {
                    errorEl.innerText = "Có lỗi xảy ra khi lưu trên Firebase!";
                    errorEl.style.display = 'block';
                } else {
                    successEl.style.display = 'block';
                    setTimeout(() => {
                        document.getElementById('login-email').value = email;
                        hideRegisterScreen();
                    }, 1200);
                }
            });
        }
    });
}

function doLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.style.display = 'none';

    const userKey = encodeEmail(email);

    database.ref('users/' + userKey).once('value', (snapshot) => {
        if (snapshot.exists()) {
            const user = snapshot.val();
            if (user.password === password) {
                currentUserEmail = email;
                currentUserRole = user.role;

                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('main-app').style.display = 'block';

                setupRoleUI(user);
            } else {
                errorEl.innerText = "Mật khẩu không chính xác.";
                errorEl.style.display = 'block';
            }
        } else {
            errorEl.innerText = "Tài khoản không tồn tại trên hệ thống.";
            errorEl.style.display = 'block';
        }
    });
}

function doResetPassword() {
    const email = document.getElementById('forgot-email').value.trim();
    const errorEl = document.getElementById('forgot-error');
    const successEl = document.getElementById('forgot-success');
    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    const userKey = encodeEmail(email);

    database.ref('users/' + userKey).once('value', (snapshot) => {
        if (!snapshot.exists()) {
            errorEl.innerText = "Email này chưa được đăng ký trong hệ thống!";
            errorEl.style.display = 'block';
            return;
        }

        const newPassword = "TNUT" + Math.floor(1000 + Math.random() * 9000);
        
        database.ref('users/' + userKey + '/password').set(newPassword);

        const subject = encodeURIComponent("[TNUT] Thông báo cấp lại mật khẩu");
        const bodyText = `Hệ thống cấp lại mật khẩu thành công!\nTên đăng nhập: ${email}\nMật khẩu mới: ${newPassword}\n\nVui lòng đăng nhập và đổi mật khẩu.`;

        window.location.href = `mailto:${email}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
        successEl.innerText = `Đã cấp mật khẩu mới: [ ${newPassword} ]. Đã mở Gmail!`;
        successEl.style.display = 'block';
    });
}

function doLogout() {
    currentUserEmail = '';
    currentUserRole = '';
    closeQRScanner();
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('login-screen').style.display = 'block';
    document.getElementById('login-password').value = '';
}

/* ====================================================
   QUẢN LÝ GIAO DIỆN (NAV & TABS)
==================================================== */
function setupRoleUI(user) {
    const navContainer = document.getElementById('bottom-nav-container');
    navContainer.innerHTML = '';

    if (user.role === 'sinhvien') {
        document.getElementById('user-info').innerText = `SV: ${user.fullname}`;
        document.getElementById('user-subinfo').innerText = `${user.studentClass}`;
        
        navContainer.innerHTML = `
            <div class="nav-item active" onclick="switchTab('dich', this)"><i class="fa-solid fa-language"></i><span>Dịch</span></div>
            <div class="nav-item" onclick="switchTab('library', this)"><i class="fa-solid fa-book"></i><span>Tài liệu</span></div>
            <div class="nav-item" onclick="switchTab('history', this)"><i class="fa-solid fa-clock-rotate-left"></i><span>Lịch sử</span></div>
            <div class="nav-item" onclick="doLogout()"><i class="fa-solid fa-right-from-bracket"></i><span>Thoát</span></div>
        `;
        switchTab('dich', navContainer.children[0]);
        listenToHistory();
        listenToDocLibrary();
    } 
    else if (user.role === 'giangvien') {
        navContainer.innerHTML = `
            <div class="nav-item active" onclick="switchTab('manage-docs', this)"><i class="fa-solid fa-file-arrow-up"></i><span>Tài liệu</span></div>
            <div class="nav-item" onclick="switchTab('manage-students', this)"><i class="fa-solid fa-users"></i><span>Sinh viên</span></div>
            <div class="nav-item" onclick="doLogout()"><i class="fa-solid fa-right-from-bracket"></i><span>Thoát</span></div>
        `;
        switchTab('manage-docs', navContainer.children[0]);
        listenToStudentsList();
        listenToTeacherDocs();
    }
}

function switchTab(tabId, navElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if(navElement) navElement.classList.add('active');
}

/* ====================================================
   TÍNH NĂNG QUÉT MÃ QR BẰNG CAMERA
==================================================== */
function openQRScanner() {
    const modal = document.getElementById('qr-modal');
    modal.style.display = 'flex';

    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("qr-reader");
    }

    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
            closeQRScanner();
            
            // Tìm tài liệu trên Firebase theo docId
            database.ref('docs/' + decodedText).once('value', (snapshot) => {
                if (snapshot.exists()) {
                    const doc = snapshot.val();
                    document.getElementById('source-text').value = doc.content;
                    alert(`Đã quét thành công tài liệu: "${doc.title}". Đang tiến hành dịch...`);
                    doTranslate();
                } else {
                    document.getElementById('source-text').value = decodedText;
                    doTranslate();
                }
            });
        },
        (errorMessage) => {}
    ).catch(err => {
        alert("Khuyến cáo: Vui lòng cấp quyền truy cập Camera cho ứng dụng!");
        closeQRScanner();
    });
}

function closeQRScanner() {
    const modal = document.getElementById('qr-modal');
    modal.style.display = 'none';
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
        });
    }
}

/* ====================================================
   TÍNH NĂNG CỦA GIÁO VIÊN (FIREBASE REALTIME)
==================================================== */
function listenToStudentsList() {
    database.ref('users').on('value', (snapshot) => {
        const container = document.getElementById('students-list-container');
        let html = '';
        
        snapshot.forEach((childSnap) => {
            const user = childSnap.val();
            if (user.role === 'sinhvien') {
                html += `
                <div style="background:var(--surface-light); padding:10px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:var(--primary-yellow); font-size:14px;">${user.fullname}</strong><br>
                        <small class="text-muted">${user.studentClass} | ${user.email}</small>
                    </div>
                    <button onclick="deleteStudent('${encodeEmail(user.email)}')" style="background:var(--danger); color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                </div>`;
            }
        });
        container.innerHTML = html || '<p class="text-muted">Chưa có sinh viên nào đăng ký.</p>';
    });
}

function deleteStudent(encodedEmail) {
    if(confirm("Xóa sinh viên này khỏi Firebase?")) {
        database.ref('users/' + encodedEmail).remove();
    }
}

function uploadDocument() {
    const title = document.getElementById('doc-title').value.trim();
    const content = document.getElementById('doc-content').value.trim();
    
    if(!title || !content) {
        alert("Vui lòng nhập Tên tài liệu và Nội dung tài liệu!");
        return;
    }

    const newDocRef = database.ref('docs').push();
    const docId = newDocRef.key;

    newDocRef.set({
        id: docId,
        title: title,
        content: content,
        date: new Date().toLocaleDateString('vi-VN')
    }, (error) => {
        if(!error) {
            document.getElementById('doc-title').value = '';
            document.getElementById('doc-content').value = '';
            alert("Đã tải tài liệu lên Firebase thành công!");
        }
    });
}

function listenToTeacherDocs() {
    database.ref('docs').on('value', (snapshot) => {
        const container = document.getElementById('teacher-docs-container');
        let html = '';

        snapshot.forEach((childSnap) => {
            const doc = childSnap.val();
            html = `
                <div style="background:var(--surface-light); padding:12px; border-radius:8px; margin-bottom:12px; display:flex; gap: 12px; border-left: 3px solid var(--primary-yellow);">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${doc.id}&color=ffffff&bgcolor=1b1c21" style="border-radius:5px;">
                    <div style="flex:1;">
                        <strong style="color:white; font-size:14px;">${doc.title}</strong><br>
                        <small class="text-muted"><i class="fa-regular fa-calendar"></i> ${doc.date}</small>
                        <button onclick="deleteDoc('${doc.id}')" style="background:var(--danger); color:white; border:none; padding:3px 8px; border-radius:3px; margin-top:6px; cursor:pointer; font-size:11px; display:block;">Xóa tài liệu</button>
                    </div>
                </div>
            ` + html;
        });

        container.innerHTML = html || '<p class="text-muted">Chưa có tài liệu nào.</p>';
    });
}

function deleteDoc(docId) {
    if(confirm("Xóa tài liệu này trên Firebase?")) {
        database.ref('docs/' + docId).remove();
    }
}

/* ====================================================
   TÍNH NĂNG CỦA SINH VIÊN (KHO TÀI LIỆU & LỊCH SỬ)
==================================================== */
function listenToDocLibrary() {
    database.ref('docs').on('value', (snapshot) => {
        renderDocLibraryFromSnapshot(snapshot);
    });
}

function renderDocLibrary() {
    database.ref('docs').once('value', (snapshot) => {
        renderDocLibraryFromSnapshot(snapshot);
    });
}

function renderDocLibraryFromSnapshot(snapshot) {
    const container = document.getElementById('student-docs-container');
    const searchTerm = document.getElementById('search-doc').value.toLowerCase();
    let html = '';

    snapshot.forEach((childSnap) => {
        const doc = childSnap.val();
        if (doc.title.toLowerCase().includes(searchTerm)) {
            html = `
                <div style="background:var(--surface-light); padding:12px; border-radius:8px; margin-bottom:12px; display:flex; gap: 12px;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=65x65&data=${doc.id}&color=ffffff&bgcolor=1b1c21" style="border-radius:5px;">
                    <div style="flex:1;">
                        <strong style="color:var(--text-main); font-size:13px;">${doc.title}</strong><br>
                        <small class="text-muted">Ngày đăng: ${doc.date}</small><br>
                        <button class="btn-primary" onclick="openQRScanner()" style="padding: 4px 10px; font-size: 11px; margin-top: 6px; display:inline-block; width:auto;">
                            <i class="fa-solid fa-camera"></i> Quét Camera
                        </button>
                    </div>
                </div>
            ` + html;
        }
    });

    container.innerHTML = html || '<p class="text-muted" style="text-align:center; margin-top:20px;">Không tìm thấy tài liệu nào.</p>';
}

/* ====================================================
   DỊCH THUẬT GOOGLE & LỊCH SỬ FIREBASE
==================================================== */
const dictionary = {
    "spindle": "trục chính", "coolant": "dung dịch làm mát", "chuck": "mâm cặp",
    "valve": "van", "speed": "tốc độ", "rpm": "vòng/phút", "cnc": "máy tiện CNC", "machine": "máy"
};

async function doTranslate() {
    const sourceText = document.getElementById('source-text').value.trim();
    const sourceLang = document.getElementById('source-lang').value;
    const btn = document.getElementById('btn-translate');
    const resultBox = document.getElementById('result-box');
    
    if (!sourceText) { alert("Vui lòng nhập văn bản!"); return; }

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang dịch...';
    btn.style.opacity = '0.7';
    resultBox.style.display = 'none';

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=vi&dt=t&q=${encodeURIComponent(sourceText)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        let translatedText = '';
        if (data && data[0]) {
            data[0].forEach(item => { if (item[0]) translatedText += item[0]; });
        }

        let foundVocabs = [];
        const lowerSource = sourceText.toLowerCase();
        for (const [eng, vie] of Object.entries(dictionary)) {
            if (lowerSource.includes(eng)) {
                foundVocabs.push(`${eng} ➔ ${vie}`);
                const regexVie = new RegExp(vie, 'gi');
                translatedText = translatedText.replace(regexVie, `<strong style="color:var(--primary-yellow)">${vie}</strong>`);
            }
        }

        document.getElementById('translated-text').innerHTML = translatedText;
        const vocabList = document.getElementById('vocab-list');
        vocabList.innerHTML = foundVocabs.length > 0 
            ? foundVocabs.map(v => `<li>${v}</li>`).join('') 
            : "<li>Không phát hiện từ chuyên ngành đặc biệt.</li>";

        btn.innerHTML = '<i class="fa-solid fa-language"></i> Dịch sang tiếng Việt';
        btn.style.opacity = '1';
        resultBox.style.display = 'block';

        saveToHistory(sourceText, translatedText);
    } catch (error) {
        alert("Lỗi kết nối máy chủ dịch thuật!");
        btn.innerHTML = '<i class="fa-solid fa-language"></i> Dịch sang tiếng Việt';
        btn.style.opacity = '1';
    }
}

function saveToHistory(original, translated) {
    if (!currentUserEmail || currentUserRole !== 'sinhvien') return;
    
    const userKey = encodeEmail(currentUserEmail);
    database.ref('users/' + userKey + '/history').push({
        original: original,
        translated: translated,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    });
}

function listenToHistory() {
    if (!currentUserEmail || currentUserRole !== 'sinhvien') return;
    
    const userKey = encodeEmail(currentUserEmail);
    database.ref('users/' + userKey + '/history').on('value', (snapshot) => {
        const container = document.getElementById('history-container');
        let html = '';

        snapshot.forEach((childSnap) => {
            const item = childSnap.val();
            html = `
                <div style="background:var(--surface-dark); border:1px solid var(--border-color); border-radius:8px; padding:10px; margin-bottom:8px;">
                    <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;"><i class="fa-regular fa-clock"></i> ${item.time}</div>
                    <p style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">${item.original.substring(0,80)}...</p>
                    <p style="font-size:13px; color:var(--text-main); font-weight:500;">${item.translated}</p>
                </div>
            ` + html;
        });

        container.innerHTML = html || '<p class="text-muted" style="text-align:center; padding:30px 0;">Chưa có lịch sử dịch.</p>';
    });
}

function clearHistory() {
    if (!currentUserEmail) return;
    const userKey = encodeEmail(currentUserEmail);
    database.ref('users/' + userKey + '/history').remove();
}
