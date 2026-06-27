export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0
  }).format(amount || 0);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
};

export const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export const formatPercentage = (value) => {
  return `${Number(value || 0).toFixed(1)}%`;
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'present':
    case 'paid':
      return 'success';
    case 'pending':
    case 'late':
    case 'halfday':
      return 'warning';
    case 'inactive':
    case 'suspended':
    case 'absent':
    case 'overdue':
      return 'danger';
    case 'leave':
    case 'holiday':
    case 'processing':
      return 'info';
    default:
      return 'neutral';
  }
};
