// Shared utility script for Community Issue Reporting System

// Format date nicely
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

// Capitalize first letter
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Get status color class
function statusColor(status) {
  const map = {
    'Pending':     'warning',
    'In Progress': 'info',
    'Resolved':    'success',
    'Rejected':    'danger'
  };
  return map[status] || 'secondary';
}

// Redirect if not authenticated
function checkAuth(role = 'resident') {
  const token = localStorage.getItem('token');
  const user  = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token || user.role !== role) {
    window.location.href = role === 'admin' ? '/admin-login' : '/resident-login';
    return false;
  }
  return true;
}