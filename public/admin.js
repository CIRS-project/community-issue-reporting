const API = '';

function getToken() { return localStorage.getItem('token'); }
function getAdmin()  { return JSON.parse(localStorage.getItem('user') || '{}'); }

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/admin-login';
}

function showAlert(msg, type = 'danger') {
  const box = document.getElementById('alertBox');
  if (!box) return;
  box.className = `alert alert-${type}`;
  box.textContent = msg;
}

function setLoading(loading) {
  const btn  = document.getElementById('submitBtn');
  const txt  = document.getElementById('btnText');
  const spin = document.getElementById('btnSpinner');
  if (!btn) return;
  btn.disabled = loading;
  txt  && (txt.style.opacity  = loading ? '0.6' : '1');
  spin && spin.classList.toggle('d-none', !loading);
}

function requireAdmin() {
  if (!getToken()) { window.location.href = '/admin-login'; return false; }
  const user = getAdmin();
  if (user.role !== 'admin') { window.location.href = '/admin-login'; return false; }
  const el = document.getElementById('adminName');
  if (el && user.name) el.textContent = user.name;
  return true;
}

function getStatusBadge(status) {
  const map = { 'Pending': 'warning', 'In Progress': 'info', 'Resolved': 'success', 'Rejected': 'danger' };
  return `<span class="badge bg-${map[status] || 'secondary'}">${status}</span>`;
}

function getPriorityBadge(priority) {
  const map = { 'High': 'danger', 'Medium': 'warning', 'Low': 'success' };
  return `<span class="badge bg-${map[priority] || 'secondary'}">${priority}</span>`;
}

// ===== ADMIN LOGIN =====
const adminLoginForm = document.getElementById('adminLoginForm');
if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/admin/login`, {
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
      setTimeout(() => window.location.href = '/dashboard', 1200);
    } catch (err) {
      showAlert('Server error. Please try again.');
    } finally { setLoading(false); }
  });
}

// ===== ADMIN REGISTER =====
const adminRegisterForm = document.getElementById('adminRegisterForm');
if (adminRegisterForm) {
  adminRegisterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const confirm  = document.getElementById('confirmPassword').value;
    if (password !== confirm) return showAlert('Passwords do not match!');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/admin/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       document.getElementById('name').value,
          email:      document.getElementById('email').value,
          department: document.getElementById('department').value,
          password
        })
      });
      const data = await res.json();
      if (!res.ok) return showAlert(data.message);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showAlert('Admin registered! Redirecting...', 'success');
      setTimeout(() => window.location.href = '/dashboard', 1200);
    } catch (err) {
      showAlert('Server error. Please try again.');
    } finally { setLoading(false); }
  });
}

// ===== LOAD DASHBOARD STATS =====
async function loadStats() {
  try {
    const res = await fetch(`${API}/api/complaints/stats`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    document.getElementById('totalCount').textContent      = data.total      || 0;
    document.getElementById('pendingCount').textContent    = data.pending     || 0;
    document.getElementById('inProgressCount').textContent = data.inProgress  || 0;
    document.getElementById('resolvedCount').textContent   = data.resolved    || 0;
  } catch (err) { console.error('Stats error:', err); }
}

// ===== LOAD ALL COMPLAINTS =====
async function loadComplaints() {
  const status   = document.getElementById('filterStatus')?.value   || '';
  const category = document.getElementById('filterCategory')?.value || '';
  const priority = document.getElementById('filterPriority')?.value || '';

  let url = `${API}/api/complaints/all?`;
  if (status)   url += `status=${status}&`;
  if (category) url += `category=${category}&`;
  if (priority) url += `priority=${priority}&`;

  const tbody = document.getElementById('complaintsTable');
  tbody.innerHTML = `<tr><td colspan="9" class="text-center py-3">
    <div class="spinner-border spinner-border-sm text-danger"></div> Loading...
  </td></tr>`;

  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const complaints = await res.json();

    if (!complaints.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">No complaints found.</td></tr>`;
      return;
    }

    tbody.innerHTML = complaints.map(c => `
      <tr>
        <td><span class="badge bg-light text-dark border">${c.complaintId}</span></td>
        <td class="fw-semibold">${c.title}</td>
        <td>${c.category}</td>
        <td><small>${c.location}</small></td>
        <td>${getPriorityBadge(c.priority)}</td>
        <td>${getStatusBadge(c.status)}</td>
        <td><small>${c.submittedBy?.name || 'N/A'}<br/><span class="text-muted">${c.submittedBy?.email || ''}</span></small></td>
        <td><small>${new Date(c.createdAt).toLocaleDateString()}</small></td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="viewComplaint('${c._id}')">
            <i class="bi bi-eye"></i> View
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="openUpdateModal('${c._id}', '${c.status}')">
            <i class="bi bi-pencil"></i> Update
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-danger text-center py-3">Failed to load complaints.</td></tr>`;
  }
}

// ===== OPEN UPDATE MODAL =====
function openUpdateModal(id, currentStatus) {
  document.getElementById('updateComplaintId').value = id;
  document.getElementById('updateStatus').value = currentStatus;
  document.getElementById('updateRemarks').value = '';
  new bootstrap.Modal(document.getElementById('updateModal')).show();
}

// ===== UPDATE COMPLAINT =====
async function updateComplaint() {
  const id      = document.getElementById('updateComplaintId').value;
  const status  = document.getElementById('updateStatus').value;
  const remarks = document.getElementById('updateRemarks').value;

  try {
    const res = await fetch(`${API}/api/complaints/update/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ status, adminRemarks: remarks })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.message);
    bootstrap.Modal.getInstance(document.getElementById('updateModal')).hide();
    loadComplaints();
    loadStats();
  } catch (err) {
    alert('Server error. Please try again.');
  }
}
// ===== VIEW COMPLAINT DETAILS WITH IMAGES =====
async function viewComplaint(id) {
  try {
    const res = await fetch(`${API}/api/admin/complaint/${id}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const c = await res.json();

    // Build attachments HTML
    let attachmentsHTML = '<p class="text-muted">No attachments uploaded.</p>';
    if (c.attachments && c.attachments.length > 0) {
      attachmentsHTML = '<div class="d-flex flex-wrap gap-2">';
      c.attachments.forEach(file => {
        if (file.mimetype && file.mimetype.startsWith('image/')) {
          attachmentsHTML += `
            <a href="/${file.path}" target="_blank">
              <img src="/${file.path}" 
                   style="width:150px;height:150px;object-fit:cover;border-radius:8px;border:2px solid #dee2e6;cursor:pointer;"
                   title="Click to view full image"/>
            </a>`;
        } else {
          attachmentsHTML += `
            <a href="/${file.path}" target="_blank" class="btn btn-outline-secondary btn-sm">
              <i class="bi bi-file-earmark-play"></i> View Video
            </a>`;
        }
      });
      attachmentsHTML += '</div>';
    }

    // Show in modal
    document.getElementById('viewComplaintBody').innerHTML = `
      <div class="mb-3">
        <h6 class="fw-bold text-primary">${c.title}</h6>
        <span class="badge bg-secondary">${c.category}</span>
        ${getPriorityBadge(c.priority)}
        ${getStatusBadge(c.status)}
      </div>
      <p><b>Description:</b> ${c.description}</p>
      <p><b>Location:</b> ${c.location}</p>
      <p><b>Submitted By:</b> ${c.submittedBy?.name} (${c.submittedBy?.email})</p>
      <p><b>Phone:</b> ${c.submittedBy?.phone || 'N/A'}</p>
      <p><b>Date:</b> ${new Date(c.createdAt).toLocaleString()}</p>
      ${c.adminRemarks ? `<p><b>Admin Remarks:</b> ${c.adminRemarks}</p>` : ''}
      <hr/>
      <h6 class="fw-bold">Attachments / Photos</h6>
      ${attachmentsHTML}
    `;

    new bootstrap.Modal(document.getElementById('viewModal')).show();
  } catch (err) {
    alert('Failed to load complaint details.');
  }
}

// ===== INIT DASHBOARD =====
if (document.getElementById('complaintsTable')) {
  if (requireAdmin()) {
    loadStats();
    loadComplaints();
  }
}