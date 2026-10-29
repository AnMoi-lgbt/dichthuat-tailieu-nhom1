// Khởi tạo tài khoản Giảng viên mặc định
(function initDefaultUser() {
  let users = JSON.parse(localStorage.getItem('tnut_users')) || {};
  users['giangvien@tnut.edu.vn'] = {
    fullname: 'Giảng Viên Quản Trị',
    studentClass: 'Khoa Cơ Điện Tử',
    password: '123456',
    role: 'giangvien',
    history: [],
  };
  localStorage.setItem('tnut_users', JSON.stringify(users));
})();

if (!localStorage.getItem('tnut_docs')) {
  localStorage.setItem('tnut_docs', JSON.stringify([]));
}

let currentUserEmail = '';
let currentUserRole = '';
let html5QrCode = null;

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
 ĐĂNG KÝ / ĐĂNG NHẬP / QUÊN MẬT KHẨU
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
    errorEl.innerText = 'Vui lòng nhập đầy đủ Họ tên và Lớp/Mã SV.';
    errorEl.style.display = 'block';
    return;
  }
  if (!email.endsWith('@tnut.edu.vn')) {
    errorEl.innerText = 'Lỗi: Email phải có đuôi @tnut.edu.vn';
    errorEl.style.display = 'block';
    return;
  }
  if (password.length < 6) {
    errorEl.innerText = 'Lỗi: Mật khẩu phải từ 6 ký tự trở lên.';
    errorEl.style.display = 'block';
    return;
  }

  let users = JSON.parse(localStorage.getItem('tnut_users'));
  if (users[email]) {
    errorEl.innerText = 'Lỗi: Email này đã được đăng ký trước đó!';
    errorEl.style.display = 'block';
    return;
  }

  users[email] = {
    fullname: fullname,
    studentClass: studentClass,
    password: password,
    role: 'sinhvien',
    history: [],
  };
  localStorage.setItem('tnut_users', JSON.stringify(users));

  successEl.style.display = 'block';
  setTimeout(() => {
    document.getElementById('login-email').value = email;
    hideRegisterScreen();
  }, 1200);
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.style.display = 'none';

  let users = JSON.parse(localStorage.getItem('tnut_users'));

  if (users[email] && users[email].password === password) {
    currentUserEmail = email;
    const user = users[email];
    currentUserRole = user.role;

    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';

    setupRoleUI(user);
  } else {
    errorEl.innerText = 'Email hoặc mật khẩu không chính xác.';
    errorEl.style.display = 'block';
  }
}

function doResetPassword() {
  const email = document.getElementById('forgot-email').value.trim();
  const errorEl = document.getElementById('forgot-error');
  const successEl = document.getElementById('forgot-success');
  errorEl.style.display = 'none';
  successEl.style.display = 'none';

  let users = JSON.parse(localStorage.getItem('tnut_users'));
  if (!users[email]) {
    errorEl.innerText = 'Email này chưa được đăng ký trong hệ thống!';
    errorEl.style.display = 'block';
    return;
  }

  const newPassword = 'TNUT' + Math.floor(1000 + Math.random() * 9000);
  users[email].password = newPassword;
  localStorage.setItem('tnut_users', JSON.stringify(users));

  const subject = encodeURIComponent('[TNUT] Thông báo cấp lại mật khẩu');
  const bodyText = `Hệ thống cấp lại mật khẩu thành công!\nTên đăng nhập: ${email}\nMật khẩu mới: ${newPassword}\n\nVui lòng đăng nhập và đổi mật khẩu.`;

  window.location.href = `mailto:${email}?subject=${subject}&body=${encodeURIComponent(
    bodyText
  )}`;
  successEl.innerText = `Đã cấp mật khẩu: [ ${newPassword} ]. Đã mở Gmail!`;
  successEl.style.display = 'block';
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
    renderHistory();
    renderDocLibrary();
  } else if (user.role === 'giangvien') {
    navContainer.innerHTML = `
          <div class="nav-item active" onclick="switchTab('manage-docs', this)"><i class="fa-solid fa-file-arrow-up"></i><span>Tài liệu</span></div>
          <div class="nav-item" onclick="switchTab('manage-students', this)"><i class="fa-solid fa-users"></i><span>Sinh viên</span></div>
          <div class="nav-item" onclick="doLogout()"><i class="fa-solid fa-right-from-bracket"></i><span>Thoát</span></div>
      `;
    switchTab('manage-docs', navContainer.children[0]);
    renderStudentsList();
    renderTeacherDocs();
  }
}

function switchTab(tabId, navElement) {
  document
    .querySelectorAll('.tab-content')
    .forEach((tab) => tab.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.add('active');

  document
    .querySelectorAll('.nav-item')
    .forEach((item) => item.classList.remove('active'));
  if (navElement) navElement.classList.add('active');
}

/* ====================================================
 TÍNH NĂNG QUÉT MA QR BẰNG CAMERA THỰC TẾ
==================================================== */
function openQRScanner() {
  const modal = document.getElementById('qr-modal');
  modal.style.display = 'flex';

  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode('qr-reader');
  }

  // Bật camera
  html5QrCode
    .start(
      { facingMode: 'environment' }, // Ưu tiên camera sau của điện thoại
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (decodedText) => {
        // Khi quét thành công mã QR
        closeQRScanner();

        let docs = JSON.parse(localStorage.getItem('tnut_docs'));
        let doc = docs.find((d) => d.id === decodedText);

        if (doc) {
          // Nhập nội dung tài liệu tìm được vào ô dịch
          document.getElementById('source-text').value = doc.content;
          alert(
            `Đã quét thành công tài liệu: "${doc.title}". Đang tiến hành dịch...`
          );
          doTranslate();
        } else {
          // Nếu QR không thuộc hệ thống nhưng chứa text
          document.getElementById('source-text').value = decodedText;
          doTranslate();
        }
      },
      (errorMessage) => {
        // Lỗi khi chưa quét thấy mã (Bỏ qua log)
      }
    )
    .catch((err) => {
      alert('Khuyến cáo: Vui lòng cấp quyền truy cập Camera cho ứng dụng!');
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
 TÍNH NĂNG CỦA GIÁO VIÊN
==================================================== */
function renderStudentsList() {
  const container = document.getElementById('students-list-container');
  let users = JSON.parse(localStorage.getItem('tnut_users'));
  let html = '';

  for (const [email, user] of Object.entries(users)) {
    if (user.role === 'sinhvien') {
      html += `
          <div style="background:var(--surface-light); padding:10px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                  <strong style="color:var(--primary-yellow); font-size:14px;">${user.fullname}</strong><br>
                  <small class="text-muted">${user.studentClass} | ${email}</small>
              </div>
              <button onclick="deleteStudent('${email}')" style="background:var(--danger); color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
          </div>`;
    }
  }
  container.innerHTML =
    html || '<p class="text-muted">Chưa có sinh viên nào đăng ký.</p>';
}

function deleteStudent(email) {
  if (confirm('Xóa sinh viên này khỏi hệ thống?')) {
    let users = JSON.parse(localStorage.getItem('tnut_users'));
    delete users[email];
    localStorage.setItem('tnut_users', JSON.stringify(users));
    renderStudentsList();
  }
}

function uploadDocument() {
  const title = document.getElementById('doc-title').value.trim();
  const content = document.getElementById('doc-content').value.trim();

  if (!title || !content) {
    alert('Vui lòng nhập Tên tài liệu và Nội dung tài liệu!');
    return;
  }

  let docs = JSON.parse(localStorage.getItem('tnut_docs'));
  const docId = 'DOC_' + Date.now();

  docs.unshift({
    id: docId,
    title: title,
    content: content,
    date: new Date().toLocaleDateString('vi-VN'),
  });

  localStorage.setItem('tnut_docs', JSON.stringify(docs));
  document.getElementById('doc-title').value = '';
  document.getElementById('doc-content').value = '';
  alert('Tải tài liệu thành công! Mã QR đã được tạo.');
  renderTeacherDocs();
}

function renderTeacherDocs() {
  const container = document.getElementById('teacher-docs-container');
  let docs = JSON.parse(localStorage.getItem('tnut_docs'));

  if (docs.length === 0) {
    container.innerHTML = '<p class="text-muted">Chưa có tài liệu nào.</p>';
    return;
  }

  container.innerHTML = docs
    .map(
      (doc) => `
      <div style="background:var(--surface-light); padding:12px; border-radius:8px; margin-bottom:12px; display:flex; gap: 12px; border-left: 3px solid var(--primary-yellow);">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${doc.id}&color=ffffff&bgcolor=1b1c21" style="border-radius:5px;">
          <div style="flex:1;">
              <strong style="color:white; font-size:14px;">${doc.title}</strong><br>
              <small class="text-muted"><i class="fa-regular fa-calendar"></i> ${doc.date}</small>
              <button onclick="deleteDoc('${doc.id}')" style="background:var(--danger); color:white; border:none; padding:3px 8px; border-radius:3px; margin-top:6px; cursor:pointer; font-size:11px; display:block;">Xóa tài liệu</button>
          </div>
      </div>
  `
    )
    .join('');
}

function deleteDoc(docId) {
  if (confirm('Xóa tài liệu này?')) {
    let docs = JSON.parse(localStorage.getItem('tnut_docs'));
    docs = docs.filter((d) => d.id !== docId);
    localStorage.setItem('tnut_docs', JSON.stringify(docs));
    renderTeacherDocs();
  }
}

/* ====================================================
 TÍNH NĂNG CỦA SINH VIÊN (KHO TÀI LIỆU & DỊCH)
==================================================== */
function renderDocLibrary() {
  const container = document.getElementById('student-docs-container');
  const searchTerm = document.getElementById('search-doc').value.toLowerCase();
  let docs = JSON.parse(localStorage.getItem('tnut_docs'));

  let filteredDocs = docs.filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm)
  );

  if (filteredDocs.length === 0) {
    container.innerHTML =
      '<p class="text-muted" style="text-align:center; margin-top:20px;">Không tìm thấy tài liệu nào.</p>';
    return;
  }

  container.innerHTML = filteredDocs
    .map(
      (doc) => `
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
  `
    )
    .join('');
}

/* ====================================================
 DỊCH THUẬT GOOGLE & LỊCH SỬ
==================================================== */
const dictionary = {
  spindle: 'trục chính',
  coolant: 'dung dịch làm mát',
  chuck: 'mâm cặp',
  valve: 'van',
  speed: 'tốc độ',
  rpm: 'vòng/phút',
  cnc: 'máy tiện CNC',
  machine: 'máy',
};

async function doTranslate() {
  const sourceText = document.getElementById('source-text').value.trim();
  const sourceLang = document.getElementById('source-lang').value;
  const btn = document.getElementById('btn-translate');
  const resultBox = document.getElementById('result-box');

  if (!sourceText) {
    alert('Vui lòng nhập văn bản!');
    return;
  }

  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang dịch...';
  btn.style.opacity = '0.7';
  resultBox.style.display = 'none';

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=vi&dt=t&q=${encodeURIComponent(
      sourceText
    )}`;
    const response = await fetch(url);
    const data = await response.json();

    let translatedText = '';
    if (data && data[0]) {
      data[0].forEach((item) => {
        if (item[0]) translatedText += item[0];
      });
    }

    let foundVocabs = [];
    const lowerSource = sourceText.toLowerCase();
    for (const [eng, vie] of Object.entries(dictionary)) {
      if (lowerSource.includes(eng)) {
        foundVocabs.push(`${eng} ➔ ${vie}`);
        const regexVie = new RegExp(vie, 'gi');
        translatedText = translatedText.replace(
          regexVie,
          `<strong style="color:var(--primary-yellow)">${vie}</strong>`
        );
      }
    }

    document.getElementById('translated-text').innerHTML = translatedText;
    const vocabList = document.getElementById('vocab-list');
    vocabList.innerHTML =
      foundVocabs.length > 0
        ? foundVocabs.map((v) => `<li>${v}</li>`).join('')
        : '<li>Không phát hiện từ chuyên ngành đặc biệt.</li>';

    btn.innerHTML = '<i class="fa-solid fa-language"></i> Dịch sang tiếng Việt';
    btn.style.opacity = '1';
    resultBox.style.display = 'block';

    saveToHistory(sourceText, translatedText);
  } catch (error) {
    alert('Lỗi kết nối máy chủ dịch thuật!');
    btn.innerHTML = '<i class="fa-solid fa-language"></i> Dịch sang tiếng Việt';
    btn.style.opacity = '1';
  }
}

function saveToHistory(original, translated) {
  if (!currentUserEmail || currentUserRole !== 'sinhvien') return;
  let users = JSON.parse(localStorage.getItem('tnut_users'));
  if (!users[currentUserEmail].history) users[currentUserEmail].history = [];

  users[currentUserEmail].history.unshift({
    original: original,
    translated: translated,
    time: new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  });
  localStorage.setItem('tnut_users', JSON.stringify(users));
}

function renderHistory() {
  const container = document.getElementById('history-container');
  if (!currentUserEmail || currentUserRole !== 'sinhvien') return;

  let users = JSON.parse(localStorage.getItem('tnut_users'));
  let history = users[currentUserEmail]?.history || [];

  if (history.length === 0) {
    container.innerHTML =
      '<p class="text-muted" style="text-align:center; padding:30px 0;">Chưa có lịch sử dịch.</p>';
    return;
  }
  container.innerHTML = history
    .map(
      (item) => `
      <div style="background:var(--surface-dark); border:1px solid var(--border-color); border-radius:8px; padding:10px; margin-bottom:8px;">
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;"><i class="fa-regular fa-clock"></i> ${
            item.time
          }</div>
          <p style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">${item.original.substring(
            0,
            80
          )}...</p>
          <p style="font-size:13px; color:var(--text-main); font-weight:500;">${
            item.translated
          }</p>
      </div>
  `
    )
    .join('');
}

function clearHistory() {
  if (!currentUserEmail) return;
  let users = JSON.parse(localStorage.getItem('tnut_users'));
  users[currentUserEmail].history = [];
  localStorage.setItem('tnut_users', JSON.stringify(users));
  renderHistory();
}
