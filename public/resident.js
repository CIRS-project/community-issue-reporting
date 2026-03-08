const API = '';

// ===== HELPERS =====
function showAlert(msg, type = 'danger') {
  const box = document.getElementById('alertBox');
  if (!box) return;
  box.className = `alert alert-${type}`;
  box.textContent = msg;
}

function setLoading(loading) {
  const btn = document.getElementById('submitBtn');
  const txt = document.getElementById('btnText');
  const spin = document.getElementById('btnSpinner');
  if (!btn) return;
  btn.disabled = loading;
  txt && (txt.style.opacity = loading ? '0.6' : '1');
  spin && spin.classList.toggle('d-none', !loading);
}

function getToken() { return localStorage.getItem('token'); }
function getUser()  { return JSON.parse(localStorage.getItem('user') || '{}'); }

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/resident-login';
}

function getStatusBadge(status) {
  const map = { 'Pending': 'warning', 'In Progress': 'info', 'Resolved': 'success', 'Rejected': 'danger' };
  return `<span class="badge bg-${map[status] || 'secondary'}">${status}</span>`;
}

function getPriorityBadge(priority) {
  const map = { 'High': 'danger', 'Medium': 'warning', 'Low': 'success' };
  return `<span class="badge bg-${map[priority] || 'secondary'}">${priority}</span>`;
}

// ===== AUTH CHECK =====
function requireAuth() {
  if (!getToken()) { window.location.href = '/resident-login'; return false; }
  const user = getUser();
  const nameEl = document.getElementById('userName');
  if (nameEl && user.name) nameEl.textContent = user.name;
  return true;
}

// ===== RESIDENT REGISTER =====
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const confirm  = document.getElementById('confirmPassword').value;
    if (password !== confirm) return showAlert('Passwords do not match!');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/resident/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('name').value,
          email: document.getElementById('email').value,
          phone: document.getElementById('phone').value,
          address: document.getElementById('address').value,
          password
        })
      });
      const data = await res.json();
      if (!res.ok) return showAlert(data.message);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showAlert('Registration successful! Redirecting...', 'success');
      setTimeout(() => window.location.href = '/complaint', 1200);
    } catch (err) {
      showAlert('Server error. Please try again.');
    } finally { setLoading(false); }
  });
}

// ===== RESIDENT LOGIN =====
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/resident/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.getElementById('email').value,
          password: document.getElementById('password').value
        })
      });
      const data = await res.json();
      if (!res.ok) return showAlert(data.message);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showAlert('Login successful! Redirecting...', 'success');
      setTimeout(() => window.location.href = '/complaint', 1200);
    } catch (err) {
      showAlert('Server error. Please try again.');
    } finally { setLoading(false); }
  });
}

// ===== SUBMIT COMPLAINT =====
const complaintForm = document.getElementById('complaintForm');
if (complaintForm) {
  requireAuth();

  // File preview
  document.getElementById('attachments')?.addEventListener('change', function () {
    const preview = document.getElementById('filePreview');
    preview.innerHTML = '';
    Array.from(this.files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => {
          preview.innerHTML += `<img src="${e.target.result}" alt="preview"/>`;
        };
        reader.readAsDataURL(file);
      } else {
        preview.innerHTML += `<span class="badge bg-secondary">${file.name}</span>`;
      }
    });
  });

  complaintForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title',       document.getElementById('title').value);
      formData.append('description', document.getElementById('description').value);
      formData.append('category',    document.getElementById('category').value);
      formData.append('priority',    document.getElementById('priority').value);
      formData.append('location',    document.getElementById('location').value);
      const files = document.getElementById('attachments').files;
      for (let f of files) formData.append('attachments', f);

      const res = await fetch(`${API}/api/complaints/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) return showAlert(data.message);
      showAlert(`Complaint submitted! ID: ${data.complaint.complaintId}`, 'success');
      complaintForm.reset();
      document.getElementById('filePreview').innerHTML = '';
      setTimeout(() => window.location.href = '/track', 2000);
    } catch (err) {
      showAlert('Server error. Please try again.');
    } finally { setLoading(false); }
  });
}

// ===== TRACK PAGE =====
async function loadMyComplaints() {
  if (!requireAuth()) return;
  try {
    const res = await fetch(`${API}/api/complaints/my`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const complaints = await res.json();
    const container = document.getElementById('complaintsList');
    const total     = document.getElementById('totalCount');
    if (total) total.textContent = complaints.length;

    if (!complaints.length) {
      container.innerHTML = `<div class="text-center py-4 text-muted">
        <i class="bi bi-inbox fs-1"></i><p class="mt-2">No complaints submitted yet.</p>
        <a href="/complaint" class="btn btn-primary btn-sm">Submit First Complaint</a>
      </div>`;
      return;
    }

    container.innerHTML = complaints.map(c => `
      <div class="card complaint-card status-${c.status.toLowerCase().replace(' ','-')} mb-3 border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <h6 class="fw-bold mb-1">${c.title}</h6>
              <small class="text-muted"><i class="bi bi-geo-alt me-1"></i>${c.location}</small>
            </div>
            <div class="text-end">
              ${getStatusBadge(c.status)}
              <br/><small class="text-muted">${new Date(c.createdAt).toLocaleDateString()}</small>
            </div>
          </div>
          <div class="mt-2 d-flex gap-2 flex-wrap">
            <span class="badge bg-light text-dark border">${c.category}</span>
            ${getPriorityBadge(c.priority)}
            <span class="badge bg-light text-dark border">ID: ${c.complaintId}</span>
          </div>
          ${c.adminRemarks ? `<p class="mt-2 mb-0 small text-muted"><b>Admin Remarks:</b> ${c.adminRemarks}</p>` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {
    document.getElementById('complaintsList').innerHTML = `<p class="text-danger">Failed to load complaints.</p>`;
  }
}

async function trackComplaint() {
  const id  = document.getElementById('trackId').value.trim().toUpperCase();
  const box = document.getElementById('trackResult');
  if (!id) return;
  box.innerHTML = `<div class="text-center"><div class="spinner-border spinner-border-sm text-primary"></div></div>`;
  try {
    const res = await fetch(`${API}/api/complaints/track/${id}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const c = await res.json();
    if (!res.ok) { box.innerHTML = `<div class="alert alert-danger">${c.message}</div>`; return; }

    box.innerHTML = `
      <div class="card border-0 shadow-sm mt-2">
        <div class="card-body">
          <h6 class="fw-bold">${c.title} <span class="float-end">${getStatusBadge(c.status)}</span></h6>
          <p class="text-muted small mb-1"><i class="bi bi-geo-alt me-1"></i>${c.location}</p>
          <p class="mb-2">${c.description}</p>
          <div class="d-flex gap-2 flex-wrap mb-2">
            <span class="badge bg-light text-dark border">${c.category}</span>
            ${getPriorityBadge(c.priority)}
          </div>
          ${c.adminRemarks ? `<p class="small"><b>Admin Note:</b> ${c.adminRemarks}</p>` : ''}
          <hr/>
          <h6 class="fw-bold">Status Timeline</h6>
          <div class="timeline">
            ${c.statusHistory?.map(h => `
              <div class="timeline-item">
                <strong>${h.status}</strong> — <small class="text-muted">${new Date(h.updatedAt).toLocaleString()}</small>
                ${h.remarks ? `<p class="mb-0 small text-muted">${h.remarks}</p>` : ''}
              </div>
            `).join('') || '<p class="text-muted small">No history available.</p>'}
          </div>
        </div>
      </div>`;
  } catch (err) {
    box.innerHTML = `<div class="alert alert-danger">Server error.</div>`;
  }
}

// Initialize track page
if (document.getElementById('complaintsList')) loadMyComplaints();