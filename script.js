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
                studentId: "GV",
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
   ĐĂNG KÝ / ĐĂNG NHẬP / QUÊN MẬT KHẨU (FIREBASE)
==================================================== */
function doRegister() {
    const fullname = document.getElementById('reg-fullname').value.trim();
    const studentClass = document.getElementById('reg-class').value.trim();
    const studentId = document.getElementById('reg-studentid').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const errorEl = document.getElementById('reg-error');
    const successEl = document.getElementById('reg-success');

    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    if (!fullname || !studentClass || !studentId) {
        errorEl.innerText = "Vui lòng nhập đầy đủ Họ tên, Lớp và Mã sinh viên.";
        errorEl.style.display = 'block';
        return;
    }
    if (!email.endsWith('@tnut.edu.vn')) {
        errorEl.innerText = "Lỗi: Email đăng ký phải có đuôi @tnut.edu.vn";
        errorEl.style.display = 'block';
        return;
    }
    if (password.length < 6) {
        errorEl.innerText = "Lỗi: Mật khẩu phải từ 6 ký tự trở lên.";
        errorEl.style.display = 'block';
        return;
    }

    const userKey = encodeEmail(email);

    database.ref('users/' + userKey).once('value').then((snapshot) => {
        if (snapshot.exists()) {
            errorEl.innerText = "Lỗi: Email này đã được đăng ký trên hệ thống!";
            errorEl.style.display = 'block';
        } else {
            database.ref('users/' + userKey).set({
                fullname: fullname,
                studentClass: studentClass,
                studentId: studentId,
                password: password,
                role: 'sinhvien',
                email: email
            }).then(() => {
                successEl.style.display = 'block';
                setTimeout(() => {
                    document.getElementById('login-email').value = email;
                    hideRegisterScreen();
                }, 1500);
            }).catch((error) => {
                errorEl.innerText = "Lỗi ghi dữ liệu: " + error.message;
                errorEl.style.display = 'block';
            });
        }
    }).catch((error) => {
        errorEl.innerText = "Lỗi kết nối CSDL: " + error.message;
        errorEl.style.display = 'block';
    });
}

function doLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.style.display = 'none';

    if (!email || !password) {
        errorEl.innerText = "Vui lòng nhập đủ email và mật khẩu.";
        errorEl.style.display = 'block';
        return;
    }

    const userKey = encodeEmail(email);

    database.ref('users/' + userKey).once('value').then((snapshot) => {
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
    }).catch((error) => {
        errorEl.innerText = "Lỗi kết nối: " + error.message;
        errorEl.style.display = 'block';
    });
}

function doResetPassword() {
    const email = document.getElementById('forgot-email').value.trim();
    const errorEl = document.getElementById('forgot-error');
    const successEl = document.getElementById('forgot-success');
    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    if (!email) {
        errorEl.innerText = "Vui lòng nhập email để khôi phục mật khẩu.";
        errorEl.style.display = 'block';
        return;
    }

    const userKey = encodeEmail(email);

    database.ref('users/' + userKey).once('value').then((snapshot) => {
        if (!snapshot.exists()) {
            errorEl.innerText = "Email này chưa được đăng ký trong hệ thống!";
            errorEl.style.display = 'block';
            return;
        }

        const newPassword = "TNUT" + Math.floor(1000 + Math.random() * 9000);
        
        database.ref('users/' + userKey + '/password').set(newPassword).then(() => {
            const subject = encodeURIComponent("[TNUT] Thông báo cấp lại mật khẩu");
            const bodyText = `Hệ thống cấp lại mật khẩu thành công!\nTên đăng nhập: ${email}\nMật khẩu mới: ${newPassword}\n\nVui lòng đăng nhập và tiến hành đổi mật khẩu.`;

            window.location.href = `mailto:${email}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
            successEl.innerText = `Đã cấp mật khẩu mới: [ ${newPassword} ]. Vui lòng kiểm tra Gmail!`;
            successEl.style.display = 'block';
        });
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
   QUẢN LÝ GIAO DIỆN (NAV & TABS - SỬA LỖI CHUYỂN TAB)
==================================================== */
function setupRoleUI(user) {
    const navContainer = document.getElementById('bottom-nav-container');
    navContainer.innerHTML = '';

    if (user.role === 'sinhvien') {
        document.getElementById('user-info').innerText = `SV: ${user.fullname}`;
        document.getElementById('user-subinfo').innerText = `MSV: ${user.studentId || 'Chưa có'} | Lớp: ${user.studentClass}`;
        
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
        document.getElementById('user-info').innerText = `GIẢNG VIÊN`;
        document.getElementById('user-subinfo').innerText = `Quản trị hệ thống`;

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

// Xử lý ẩn/hiển thị Tab chính xác bằng style display
function switchTab(tabId, navElement) {
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });

    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) {
        targetTab.style.display = 'block';
        targetTab.classList.add('active');
    }

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if (navElement) {
        navElement.classList.add('active');
    }
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
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
            closeQRScanner();
            
            database.ref('docs/' + decodedText).once('value').then((snapshot) => {
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
        alert("Cần cấp quyền truy cập Camera cho ứng dụng!");
        closeQRScanner();
    });
}

function closeQRScanner() {
    const modal = document.getElementById('qr-modal');
    modal.style.display = 'none';
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
        }).catch(err => console.log(err));
    }
}

/* ====================================================
   TÍNH NĂNG GIÁO VIÊN
==================================================== */
function listenToStudentsList() {
    database.ref('users').on('value', (snapshot) => {
        const container = document.getElementById('students-list-container');
        let html = '';
        
        snapshot.forEach((childSnap) => {
            const user = childSnap.val();
            if (user.role === 'sinhvien') {
                html += `
                <div style="background:#1e1e1e; padding:12px; border-radius:8px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:#f1c40f; font-size:15px;">${user.fullname}</strong><br>
                        <small style="color:#888; font-size:13px;">MSV: <strong>${user.studentId || 'Trống'}</strong> | Lớp: ${user.studentClass}</small><br>
                        <small style="color:#888; font-size:12px;"><i class="fa-regular fa-envelope"></i> ${user.email}</small>
                    </div>
                    <button onclick="deleteStudent('${encodeEmail(user.email)}')" style="background:#e74c3c; color:white; border:none; padding:8px 12px; border-radius:5px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                </div>`;
            }
        });
        container.innerHTML = html || '<p style="color:#888; text-align:center; padding-top:20px;">Chưa có sinh viên nào đăng ký.</p>';
    });
}

function deleteStudent(encodedEmail) {
    if(confirm("Xóa sinh viên này khỏi hệ thống?")) {
        database.ref('users/' + encodedEmail).remove();
    }
}

function uploadDocument() {
    const title = document.getElementById('doc-title').value.trim();
    const content = document.getElementById('doc-content').value.trim();
    
    if(!title || !content) {
        alert("Vui lòng nhập đầy đủ Tên tài liệu và Nội dung tài liệu!");
        return;
    }

    const newDocRef = database.ref('docs').push();
    const docId = newDocRef.key;

    newDocRef.set({
        id: docId,
        title: title,
        content: content,
        date: new Date().toLocaleDateString('vi-VN')
    }).then(() => {
        document.getElementById('doc-title').value = '';
        document.getElementById('doc-content').value = '';
        alert("Đã tải tài liệu lên hệ thống và tạo mã QR thành công!");
    }).catch(err => {
        alert("Lỗi tải tài liệu: " + err.message);
    });
}

function listenToTeacherDocs() {
    database.ref('docs').on('value', (snapshot) => {
        const container = document.getElementById('teacher-docs-container');
        let html = '';

        snapshot.forEach((childSnap) => {
            const doc = childSnap.val();
            html = `
                <div style="background:#1e1e1e; padding:12px; border-radius:8px; margin-bottom:12px; display:flex; gap: 12px; border-left: 3px solid #f1c40f;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${doc.id}&color=ffffff&bgcolor=1b1c21" style="border-radius:5px; width: 80px; height: 80px;">
                    <div style="flex:1;">
                        <strong style="color:white; font-size:14px; display:block; margin-bottom:5px;">${doc.title}</strong>
                        <small style="color:#888;"><i class="fa-regular fa-calendar"></i> ${doc.date}</small>
                        <button onclick="deleteDoc('${doc.id}')" style="background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:4px; margin-top:8px; cursor:pointer; font-size:12px; display:block;"><i class="fa-solid fa-trash"></i> Xóa tài liệu</button>
                    </div>
                </div>
            ` + html;
        });

        container.innerHTML = html || '<p style="color:#888; text-align:center; padding-top:20px;">Chưa có tài liệu nào.</p>';
    });
}

function deleteDoc(docId) {
    if(confirm("Xóa tài liệu này trên Firebase?")) {
        database.ref('docs/' + docId).remove();
    }
}

/* ====================================================
   TÍNH NĂNG SINH VIÊN (KHO TÀI LIỆU & LỊCH SỬ)
==================================================== */
function listenToDocLibrary() {
    database.ref('docs').on('value', (snapshot) => {
        renderDocLibraryFromSnapshot(snapshot);
    });
}

function renderDocLibrary() {
    database.ref('docs').once('value').then((snapshot) => {
        renderDocLibraryFromSnapshot(snapshot);
    });
}

function renderDocLibraryFromSnapshot(snapshot) {
    const container = document.getElementById('student-docs-container');
    const searchInput = document.getElementById('search-doc');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    let html = '';

    snapshot.forEach((childSnap) => {
        const doc = childSnap.val();
        if (doc.title.toLowerCase().includes(searchTerm)) {
            html = `
                <div style="background:#1e1e1e; padding:12px; border-radius:8px; margin-bottom:12px; display:flex; gap: 12px; align-items:center;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=65x65&data=${doc.id}&color=ffffff&bgcolor=1b1c21" style="border-radius:5px; width:65px; height:65px;">
                    <div style="flex:1;">
                        <strong style="color:#fff; font-size:14px;">${doc.title}</strong><br>
                        <small style="color:#888;">Đăng lúc: ${doc.date}</small><br>
                        <button class="btn-primary" onclick="openQRScanner()" style="padding: 5px 12px; font-size: 11px; margin-top: 8px; display:inline-block; width:auto; border-radius: 4px;">
                            <i class="fa-solid fa-camera"></i> Quét mã ngay
                        </button>
                    </div>
                </div>
            ` + html;
        }
    });

    container.innerHTML = html || '<p style="color:#888; text-align:center; margin-top:20px;">Chưa có tài liệu nào trong kho.</p>';
}

/* ====================================================
   DỊCH THUẬT GOOGLE & LỊCH SỬ
==================================================== */
const dictionary = {
    "spindle": "trục chính", "coolant": "dung dịch làm mát", "chuck": "mâm cặp",
    "valve": "van", "speed": "tốc độ", "rpm": "vòng/phút", "cnc": "máy tiện CNC", "machine": "máy",
    "bearing": "vòng bi", "gear": "bánh răng", "motor": "động cơ", "shaft": "trục",
    "sensor": "cảm biến", "voltage": "điện áp", "current": "dòng điện", "power": "công suất"
};

async function doTranslate() {
    const sourceText = document.getElementById('source-text').value.trim();
    const sourceLang = document.getElementById('source-lang').value;
    const btn = document.getElementById('btn-translate');
    const resultBox = document.getElementById('result-box');
    
    if (!sourceText) { 
        alert("Vui lòng nhập văn bản hoặc quét mã QR trước!"); 
        return; 
    }

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
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
                translatedText = translatedText.replace(regexVie, `<strong style="color:#f1c40f">${vie}</strong>`);
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
        time: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'})
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
                <div style="background:#1e1e1e; border:1px solid #333; border-radius:8px; padding:12px; margin-bottom:12px;">
                    <div style="font-size:12px; color:#888; margin-bottom:6px;"><i class="fa-regular fa-clock"></i> ${item.time}</div>
                    <p style="font-size:13px; color:#888; margin-bottom:8px; font-style:italic;">${item.original.substring(0, 100)}${item.original.length > 100 ? '...' : ''}</p>
                    <p style="font-size:14px; color:#fff; font-weight:500; line-height: 1.4;">${item.translated}</p>
                </div>
            ` + html;
        });

        container.innerHTML = html || '<p style="color:#888; text-align:center; padding:30px 0;">Chưa có lịch sử dịch thuật.</p>';
    });
}

function clearHistory() {
    if (!currentUserEmail) return;
    if(confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử dịch thuật không?")) {
        const userKey = encodeEmail(currentUserEmail);
        database.ref('users/' + userKey + '/history').remove();
    }
}
