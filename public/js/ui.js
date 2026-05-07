/**
 * UI Helper Utility
 * Handles aesthetic toasts, modals, and confirmations
 * Uses Tailwind CSS and Material Symbols
 */

window.UI = {
  // Toast Notification
  toast: function(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) {
      const newContainer = document.createElement('div');
      newContainer.id = 'toast-container';
      newContainer.className = 'fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none';
      document.body.appendChild(newContainer);
    }

    const toast = document.createElement('div');
    const colors = {
      success: 'bg-emerald-500 text-white shadow-emerald-200',
      error: 'bg-rose-500 text-white shadow-rose-200',
      info: 'bg-blue-600 text-white shadow-blue-200',
      warning: 'bg-amber-500 text-white shadow-amber-200'
    };
    
    const icons = {
      success: 'check_circle',
      error: 'error',
      info: 'info',
      warning: 'warning'
    };

    toast.className = `flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl transition-all duration-500 translate-y-10 opacity-0 pointer-events-auto ${colors[type] || colors.info}`;
    toast.innerHTML = `
      <span class="material-symbols-outlined">${icons[type] || icons.info}</span>
      <span class="font-bold text-sm tracking-wide">${message}</span>
    `;

    document.getElementById('toast-container').appendChild(toast);

    // Animation in
    setTimeout(() => {
      toast.classList.remove('translate-y-10', 'opacity-0');
    }, 10);

    // Auto remove
    setTimeout(() => {
      toast.classList.add('translate-y-[-20px]', 'opacity-0');
      setTimeout(() => toast.remove(), 500);
    }, duration);
  },

  // Modal Alert / Confirm
  showModal: function({ title, message, icon = 'info', confirmLabel = 'OK', cancelLabel = null, type = 'info' }) {
    return new Promise((resolve) => {
      const modalId = 'ui-modal-' + Date.now();
      const modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm opacity-0 transition-opacity duration-300';
      
      const iconColors = {
        success: 'bg-emerald-50 text-emerald-500',
        error: 'bg-rose-50 text-rose-500',
        info: 'bg-blue-50 text-blue-500',
        warning: 'bg-amber-50 text-amber-500'
      };

      const btnColors = {
        success: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100',
        error: 'bg-rose-500 hover:bg-rose-600 shadow-rose-100',
        info: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100',
        warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-100'
      };

      const icons = {
        success: 'check_circle',
        error: 'cancel',
        info: 'info',
        warning: 'warning'
      };

      modal.innerHTML = `
        <div class="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden transform scale-90 transition-transform duration-300">
          <div className="p-8 flex flex-col items-center text-center">
            <div class="w-20 h-20 rounded-3xl ${iconColors[type]} flex items-center justify-center mb-6">
              <span class="material-symbols-outlined text-4xl">${icons[type]}</span>
            </div>
            <h3 class="text-2xl font-extrabold text-slate-800 mb-2 leading-tight px-4">${title}</h3>
            <p class="text-slate-500 text-sm font-medium px-4 mb-8">${message}</p>
            
            <div class="flex flex-col w-full gap-3 px-8 pb-8">
              <button id="${modalId}-confirm" class="w-full py-4 rounded-2xl text-white font-bold text-sm transition-all shadow-lg ${btnColors[type]}">
                ${confirmLabel}
              </button>
              ${cancelLabel ? `
                <button id="${modalId}-cancel" class="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 font-bold text-sm hover:bg-slate-100 transition-all">
                  ${cancelLabel}
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Animate in
      setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-90');
      }, 10);

      const cleanup = (value) => {
        modal.classList.add('opacity-0');
        modal.querySelector('div').classList.add('scale-90');
        setTimeout(() => {
          modal.remove();
          resolve(value);
        }, 300);
      };

      document.getElementById(`${modalId}-confirm`).onclick = () => cleanup(true);
      if (cancelLabel) {
        document.getElementById(`${modalId}-cancel`).onclick = () => cleanup(false);
      }
    });
  },

  alert: function(title, message, type = 'info') {
    return this.showModal({ title, message, type, confirmLabel: 'Mengerti' });
  },

  confirm: function(title, message, type = 'warning') {
    return this.showModal({ 
      title, 
      message, 
      type, 
      confirmLabel: 'Ya, Lanjutkan', 
      cancelLabel: 'Batal' 
    });
  },

  error: function(title, message) {
    return this.alert(title, message, 'error');
  },

  success: function(title, message) {
    return this.alert(title, message, 'success');
  },

  prompt: function(title, message, placeholder = '') {
    return new Promise((resolve) => {
      const modalId = 'ui-modal-' + Date.now();
      const modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm opacity-0 transition-opacity duration-300';
      
      modal.innerHTML = `
        <div class="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden transform scale-90 transition-transform duration-300">
          <div class="p-8 flex flex-col items-center text-center">
            <div class="w-20 h-20 rounded-3xl bg-blue-50 text-blue-500 flex items-center justify-center mb-6">
              <span class="material-symbols-outlined text-4xl">edit_note</span>
            </div>
            <h3 class="text-2xl font-extrabold text-slate-800 mb-2 leading-tight px-4">${title}</h3>
            <p class="text-slate-500 text-sm font-medium px-4 mb-6">${message}</p>
            
            <div class="w-full px-4 mb-8">
              <input type="text" id="${modalId}-input" class="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-sm" placeholder="${placeholder}" autofocus>
            </div>

            <div class="flex flex-col w-full gap-3 px-8 pb-8">
              <button id="${modalId}-confirm" class="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm transition-all shadow-lg hover:bg-blue-700 shadow-blue-100">
                Lanjutkan
              </button>
              <button id="${modalId}-cancel" class="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 font-bold text-sm hover:bg-slate-100 transition-all">
                Batal
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-90');
        document.getElementById(`${modalId}-input`).focus();
      }, 10);

      const cleanup = (value) => {
        modal.classList.add('opacity-0');
        modal.querySelector('div').classList.add('scale-90');
        setTimeout(() => {
          modal.remove();
          resolve(value);
        }, 300);
      };

      document.getElementById(`${modalId}-confirm`).onclick = () => {
        const val = document.getElementById(`${modalId}-input`).value;
        cleanup(val);
      };
      document.getElementById(`${modalId}-cancel`).onclick = () => cleanup(null);
      
      // Enter key support
      document.getElementById(`${modalId}-input`).onkeydown = (e) => {
        if (e.key === 'Enter') document.getElementById(`${modalId}-confirm`).click();
      };
    });
  }
};
