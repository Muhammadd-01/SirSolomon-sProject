import Swal from 'sweetalert2';

// Create a custom styled instance of SweetAlert2
export const customAlert = Swal.mixin({
  customClass: {
    popup: 'glass-card border border-slate-200 dark:border-white/10 !bg-white/80 dark:!bg-dark-800/80 backdrop-blur-xl rounded-2xl',
    title: 'text-xl font-bold font-display text-slate-800 dark:text-white',
    htmlContainer: 'text-slate-600 dark:text-slate-300',
    confirmButton: 'btn btn-primary px-6 py-2 rounded-xl text-white font-medium bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30',
    cancelButton: 'btn btn-ghost px-6 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors ml-3',
  },
  buttonsStyling: false,
  background: 'transparent',
});

export const confirmDelete = async (itemName = 'this item') => {
  const result = await customAlert.fire({
    title: 'Are you sure?',
    text: `You are about to delete ${itemName}. This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    iconColor: '#ef4444', // red-500
  });
  return result.isConfirmed;
};

export const showSuccess = (message) => {
  return customAlert.fire({
    title: 'Success!',
    text: message,
    icon: 'success',
    iconColor: '#10b981', // emerald-500
    timer: 2000,
    showConfirmButton: false,
  });
};

export const showError = (message) => {
  return customAlert.fire({
    title: 'Error!',
    text: message,
    icon: 'error',
    iconColor: '#ef4444',
  });
};
