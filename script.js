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

    // Kiểm tra dữ liệu đầu vào
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

    // Kiểm tra & Đẩy dữ liệu lên Firebase
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
                errorEl.innerText = "Lỗi ghi dữ liệu (Vui lòng mở khóa Rule Firebase): " + error.message;
                errorEl.style.display = 'block';
            });
        }
    }).catch((error) => {
        errorEl.innerText = "Lỗi kết nối CSDL (Vui lòng mở khóa Rule Firebase): " + error.message;
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

            window.location.href = `mailto:${email}?subject=${subject}&body=${encodeURIComponent(bodyText)}`; successEl.innerText = `Đã cấp mật khẩu mới: [ ${newPassword} ]. Vui lòng kiểm tra Gmail!`;
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
   QUẢN LÝ GIAO DIỆN (NAV & TABS)
==================================================== */
function setupRoleUI(user) {
    const navContainer = document.getElementById('bottom-nav-container');
    navContainer.innerHTML = '';

    if (user.role === 'sinhvien') {
        document.getElementById('user-info').innerText = `SV: ${user.fullname}`;
        document.getElementById('user-subinfo').innerText = `MSV: ${user.studentId \vert{}\vert{} 'Chưa có'} \vert{} Lớp: ${user.studentClass}`;
        
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
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
            closeQRScanner();
            
            // Tìm tài liệu trên Firebase theo docId
            database.ref('docs/' + decodedText).once('value').then((snapshot) => {
                if (snapshot.exists()) {
                    const doc = snapshot.val();
                    document.getElementById('source-text').value = doc.content;
                    alert(`Đã quét thành công tài liệu: "${doc.title}". Đang tiến hành dịch...`);
                    doTranslate();
                } else {
                    // Nếu QR không nằm trong Database thì hiển thị nội dung trực tiếp
                    document.getElementById('source-text').value = decodedText;
                    doTranslate();
                }
            });
        },
        (errorMessage) => {}
    ).catch(err => {
        alert("Khuyến cáo: Vui lòng cấp quyền truy cập Camera cho ứng dụng trong cài đặt trình duyệt!");
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
   TÍNH NĂNG CỦA GIÁO VIÊN
==================================================== */
function listenToStudentsList() {
    database.ref('users').on('value', (snapshot) => {
        const container = document.getElementById('students-list-container');
        let html = '';
        
        snapshot.forEach((childSnap) => {
            const user = childSnap.val();
            if (user.role === 'sinhvien') {
                html += `
                <div style="background:var(--surface-light); padding:12px; border-radius:8px
