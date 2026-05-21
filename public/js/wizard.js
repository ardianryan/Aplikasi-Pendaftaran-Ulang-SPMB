/**
 * Wizard State Machine
 * Manages the multi-step registration flow (Steps 1-5)
 * Handles navigation, auto-save, validation, and UI updates
 */

const Wizard = {
  currentStep: 1,
  studentData: null,
  biodataData: null,
  autoSaveTimer: null,
  isDirty: false,

  // ============================================
  // Initialization
  // ============================================

  async init() {
    // Check auth
    if (!API.isLoggedIn()) {
      window.location.href = "/login";
      return;
    }

    // Load student profile
    try {
      const res = await API.getProfile();
      this.studentData = res.data;

      // If already submitted, go to DONE
      if (this.studentData.isSubmitted) {
        this.goToStep(5);
        return;
      }

      // Resume from last step
      this.goToStep(this.studentData.wizardStep || 1);
    } catch (err) {
      UI.toast("Gagal memuat data. Silakan login ulang.", "error");
      setTimeout(() => API.logout(), 2000);
    }
  },

  // ============================================
  // Step Navigation
  // ============================================

  goToStep(step) {
    const isUploadEnabled = window.WizardSettings?.upload_document_enabled !== false && window.WizardSettings?.upload_document_enabled !== "false";
    if (step === 3 && !isUploadEnabled) {
      if (this.currentStep === 4) {
        step = 2;
      } else {
        step = 4;
      }
    }

    // Save current biodata before leaving step 2
    if (this.currentStep === 2 && this.isDirty) {
      this.saveBiodata(false); // silent save
    }

    this.currentStep = step;
    this.updateUI();
    this.loadStepData(step);

    // Update URL without reload (for back button)
    history.replaceState({ step }, "", `#step-${step}`);

    // Focus management (WCAG)
    setTimeout(() => {
      const stepSection = document.getElementById(`step-${step}`);
      if (stepSection) {
        const heading = stepSection.querySelector("h2, h3");
        if (heading) heading.focus();
      }
    }, 100);
  },

  updateUI() {
    // Hide all steps
    document.querySelectorAll(".wizard-step").forEach((el) => {
      el.classList.add("hidden");
      el.setAttribute("aria-hidden", "true");
    });

    // Show current step
    const current = document.getElementById(`step-${this.currentStep}`);
    if (current) {
      current.classList.remove("hidden");
      current.setAttribute("aria-hidden", "false");
    }

    // Update progress bar
    const isUploadEnabled = window.WizardSettings?.upload_document_enabled !== false && window.WizardSettings?.upload_document_enabled !== "false";
    
    let progress = 0;
    let displayStep = this.currentStep;
    let totalSteps = 5;
    
    if (isUploadEnabled) {
      progress = ((this.currentStep - 1) / 4) * 100;
    } else {
      totalSteps = 4;
      let calcStep = this.currentStep;
      if (calcStep > 3) calcStep = this.currentStep - 1;
      displayStep = calcStep;
      progress = ((calcStep - 1) / 3) * 100;
    }
    
    const progressBar = document.getElementById("progress-fill");
    const progressText = document.getElementById("progress-text");
    const stepLabel = document.getElementById("step-label");

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
      progressBar.setAttribute("aria-valuenow", displayStep);
    }
    if (progressText) {
      progressText.textContent = `Langkah ${displayStep} dari ${totalSteps}`;
    }

    const labels = ["Konfirmasi", "Biodata", "Berkas", "Review", "Selesai"];
    if (stepLabel) {
      stepLabel.textContent = labels[this.currentStep - 1] || "";
    }

    // Update sidebar steps (desktop)
    document.querySelectorAll(".sidebar-step").forEach((el) => {
      const stepNum = parseInt(el.dataset.step);
      el.classList.remove("active", "completed");
      if (stepNum < this.currentStep) el.classList.add("completed");
      if (stepNum === this.currentStep) el.classList.add("active");
      el.setAttribute("aria-current", stepNum === this.currentStep ? "step" : "false");
    });
  },

  // ============================================
  // Step Data Loading
  // ============================================

  async loadStepData(step) {
    switch (step) {
      case 1:
        this.renderConfirmation();
        break;
      case 2:
        await this.loadBiodata();
        break;
      case 3:
        await this.loadUploadStatus();
        break;
      case 4:
        await this.loadReview();
        break;
      case 5:
        this.renderDone();
        break;
    }
  },

  // ============================================
  // Step 1: Confirmation
  // ============================================

  renderConfirmation() {
    const s = this.studentData;
    if (!s) return;

    document.getElementById("confirm-nama").textContent = s.nama || "-";
    document.getElementById("confirm-nisn").textContent = s.nisn || "-";
    document.getElementById("confirm-tgl").textContent = s.tanggalLahir
      ? new Date(s.tanggalLahir).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-";
    document.getElementById("confirm-smp").textContent = s.asalSmp || "-";
    document.getElementById("confirm-jalur").textContent = s.jalur || "-";
  },

  async confirmAndNext() {
    try {
      this.setButtonLoading("btn-confirm", true);
      await API.confirmData();
      
      const isUploadEnabled = window.WizardSettings?.upload_document_enabled !== false && window.WizardSettings?.upload_document_enabled !== "false";
      if (isUploadEnabled) {
        // Show document checklist popup instead of going directly to step 2
        this.showDocChecklist();
      } else {
        this.goToStep(2);
      }
    } catch (err) {
      UI.toast(err.message || "Gagal mengkonfirmasi data.", "error");
    } finally {
      this.setButtonLoading("btn-confirm", false);
    }
  },

  showDocChecklist() {
    const modal = document.getElementById("modal-doc-checklist");
    if (!modal) { this.goToStep(2); return; }

    // Populate berkas list based on student's jalur
    const studentJalur = this.studentData?.konfirmasi?.jalur || "all";
    const berkasSettings = window.WizardSettings?.landing_berkas_json || [];
    const activeBerkas = berkasSettings.filter(b => {
      if (!b.active) return false;
      if (!b.jalur || b.jalur === "all" || b.jalur.includes("all")) return true;
      const jalurList = Array.isArray(b.jalur) ? b.jalur : b.jalur.split(",").map(s => s.trim());
      return jalurList.includes(studentJalur);
    });

    const list = document.getElementById("modal-berkas-list");
    if (list) {
      if (activeBerkas.length === 0) {
        list.innerHTML = `<li class="text-center text-sm text-slate-400 py-4">Tidak ada dokumen wajib yang diperlukan.</li>`;
      } else {
        list.innerHTML = activeBerkas.map(b => `
          <li class="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div class="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-xl">${b.icon || 'description'}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-slate-800 text-sm">${b.title}</p>
              <div class="flex items-center gap-3 mt-0.5">
                ${b.desc ? `<p class="text-xs text-slate-400 truncate">${b.desc}</p>` : ''}
                <span class="text-[10px] font-bold text-slate-300 shrink-0">maks ${b.max_size_mb || 5}MB</span>
              </div>
            </div>
            ${b.required ? `<span class="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg uppercase tracking-wider shrink-0">Wajib</span>` : ''}
          </li>
        `).join('');
      }
    }

    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";
  },

  closeDocChecklist() {
    const modal = document.getElementById("modal-doc-checklist");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      document.body.style.overflow = "";
    }
  },

  proceedToStep2() {
    this.closeDocChecklist();
    this.goToStep(2);
  },

  // ============================================
  // Step 2: Biodata (Section Management)
  // ============================================
  
  currentSection: 'bio',

  async loadBiodata() {
    try {
      const res = await API.getBiodata();
      this.biodataData = res.data;
      this.populateBiodataForm(res.data);
      this.setupAutoSave();
      
      // Initialize Step 2 UI
      this.switchSection('bio');
      this.updateBiodataProgress();
    } catch (err) {
      UI.toast("Gagal memuat biodata.", "error");
    }
  },

  switchSection(sectionId) {
    this.currentSection = sectionId;
    
    // Hide all sections
    document.querySelectorAll('.biodata-section').forEach(el => el.classList.add('hidden'));
    
    // Show target section
    const target = document.getElementById(`sec-${sectionId}`);
    if (target) {
      target.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update nav sidebar
    document.querySelectorAll('.sub-step').forEach(el => {
      el.classList.remove('bg-blue-50', 'text-blue-600', 'border-blue-200', 'border');
      el.querySelector('.sub-step-num').classList.replace('bg-blue-600', 'bg-slate-100');
      el.querySelector('.sub-step-num').classList.replace('text-white', 'text-slate-400');
    });

    const activeNav = document.getElementById(`nav-sec-${sectionId}`);
    if (activeNav) {
      activeNav.classList.add('bg-blue-50', 'text-blue-600', 'border-blue-100', 'border');
      activeNav.querySelector('.sub-step-num').classList.replace('bg-slate-100', 'bg-blue-600');
      activeNav.querySelector('.sub-step-num').classList.replace('text-slate-400', 'text-white');
    }
  },

  nextSection(currentId) {
    const sections = ['bio', 'alm', 'kes', 'pend', 'ayah', 'ibu', 'wali', 'gem'];
    const idx = sections.indexOf(currentId);
    if (idx < sections.length - 1) {
      this.switchSection(sections[idx + 1]);
    }
  },

  prevSection(currentId) {
    const sections = ['bio', 'alm', 'kes', 'pend', 'ayah', 'ibu', 'wali', 'gem'];
    const idx = sections.indexOf(currentId);
    if (idx > 0) {
      this.switchSection(sections[idx - 1]);
    }
  },

  updateBiodataProgress() {
    const sections = {
      bio: ['bio-namaPanggilan', 'bio-jenisKelamin', 'bio-tempatLahir', 'bio-nik', 'bio-agama', 'bio-anakKe'],
      alm: ['alm-alamatLengkap', 'alm-telepon', 'alm-email', 'alm-tinggalDengan'],
      kes: ['kes-golonganDarah', 'kes-tinggiBadan', 'kes-beratBadan'],
      pend: ['pend-nomorIjazah'],
      ayah: ['ayah-nama', 'ayah-status', 'ayah-pekerjaan'],
      ibu: ['ibu-nama', 'ibu-status', 'ibu-pekerjaan'],
      wali: [], // optional
      gem: ['gem-kesenian', 'gem-olahraga']
    };

    let totalFields = 0;
    let filledFields = 0;

    Object.keys(sections).forEach(secId => {
      const fields = sections[secId];
      let secFilled = true;
      
      fields.forEach(fId => {
        totalFields++;
        const val = this.getVal(fId);
        if (val && val.trim() !== '') {
          filledFields++;
        } else {
          secFilled = false;
        }
      });

      // Update sidebar checkmark
      const navEl = document.getElementById(`nav-sec-${secId}`);
      if (navEl) {
        const check = navEl.querySelector('.sub-step-check');
        if (fields.length > 0 && secFilled) {
          check.classList.replace('opacity-0', 'opacity-100');
        } else if (fields.length > 0) {
          check.classList.replace('opacity-100', 'opacity-0');
        }
      }
    });

    const pct = Math.round((filledFields / totalFields) * 100);
    const progressBar = document.getElementById('biodata-progress-bar');
    const progressPct = document.getElementById('biodata-progress-pct');
    
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (progressPct) progressPct.textContent = `${pct}%`;
  },

  populateBiodataForm(data) {
    if (!data) return;

    // Section A: Biodata
    const b = data.biodata || {};
    this.setVal("bio-namaLengkap", b.namaLengkap);
    this.setVal("bio-namaPanggilan", b.namaPanggilan);
    this.setVal("bio-jenisKelamin", b.jenisKelamin);
    this.setVal("bio-tempatLahir", b.tempatLahir);
    this.setDatePicker("bio-tanggalLahir", b.tanggalLahir);
    this.setVal("bio-agama", b.agama);
    this.setVal("bio-kewarganegaraan", b.kewarganegaraan || "WNI");
    this.setVal("bio-nik", b.nik);
    this.setVal("bio-anakKe", b.anakKe);
    this.setVal("bio-jumlahSaudara", b.jumlahSaudara);
    this.setVal("bio-saudaraKandung", b.saudaraKandung);
    this.setVal("bio-saudaraTiri", b.saudaraTiri);
    this.setVal("bio-saudaraAngkat", b.saudaraAngkat);
    this.setVal("bio-statusYatim", b.statusYatim);
    this.setVal("bio-bahasaSehari", b.bahasaSehari);

    // Section B: Alamat
    const a = data.alamat || {};
    this.setVal("alm-alamatLengkap", a.alamatLengkap);
    this.setVal("alm-telepon", a.telepon);
    this.setVal("alm-email", a.email);
    this.setVal("alm-tinggalDengan", a.tinggalDengan);
    this.setVal("alm-jarakSekolah", a.jarakSekolah);
    this.setVal("alm-transportasi", a.transportasi);

    // Section C: Kesehatan
    const k = data.kesehatan || {};
    this.setVal("kes-golonganDarah", k.golonganDarah);
    this.setVal("kes-penyakit", k.penyakit);
    this.setVal("kes-kelainanJasmani", k.kelainanJasmani);
    this.setVal("kes-tinggiBadan", k.tinggiBadan);
    this.setVal("kes-beratBadan", k.beratBadan);

    // Section D: Pendidikan
    const p = data.pendidikan || {};
    this.setVal("pend-asalSekolah", p.asalSekolah);
    this.setVal("pend-nomorIjazah", p.nomorIjazah);
    this.setVal("pend-lamaBelajar", p.lamaBelajar);
    this.setVal("pend-kelas", p.kelas);

    // Section E: Ayah
    this.populateOrangTua("ayah", data.ayah || {});

    // Section F: Ibu
    this.populateOrangTua("ibu", data.ibu || {});

    // Section G: Wali
    this.populateOrangTua("wali", data.wali || {});

    // Update same-address checkbox states based on loaded data comparison
    const studentAlamat = (data.alamat || {}).alamatLengkap || "";
    ["ayah", "ibu", "wali"].forEach((prefix) => {
      const parentAlamat = (data[prefix] || {}).alamat || "";
      const chk = document.getElementById(`${prefix}-alamat-sama`);
      if (chk) {
        chk.checked = !!(studentAlamat && parentAlamat === studentAlamat);
      }
    });

    // Section H: Kegemaran
    const kg = data.kegemaran || {};
    this.setVal("gem-kesenian", kg.kesenian);
    this.setVal("gem-olahraga", kg.olahraga);
    this.setVal("gem-organisasi", kg.organisasi);
    this.setVal("gem-lainLain", kg.lainLain);
  },

  populateOrangTua(prefix, data) {
    this.setVal(`${prefix}-nama`, data.nama);
    this.setVal(`${prefix}-tempatLahir`, data.tempatLahir);
    this.setDatePicker(`${prefix}-tanggalLahir`, data.tanggalLahir);
    this.setVal(`${prefix}-agama`, data.agama);
    this.setVal(`${prefix}-kewarganegaraan`, data.kewarganegaraan);
    this.setVal(`${prefix}-pendidikan`, data.pendidikan);
    this.setVal(`${prefix}-pekerjaan`, data.pekerjaan);
    this.setVal(`${prefix}-penghasilan`, data.penghasilan);
    this.setVal(`${prefix}-email`, data.email);
    this.setVal(`${prefix}-alamat`, data.alamat);
    this.setVal(`${prefix}-telepon`, data.telepon);
    this.setVal(`${prefix}-status`, data.status);
  },

  setVal(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) {
      el.value = value;
    }
  },

  setDatePicker(id, dateValue) {
    if (!dateValue) return;
    const dateStr = typeof dateValue === "string" ? dateValue : new Date(dateValue).toISOString();
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length !== 3) return;
    const [year, month, day] = parts;
    this.setVal(`${id}-hari`, day);
    this.setVal(`${id}-bulan`, month);
    this.setVal(`${id}-tahun`, year);
    this.setVal(id, `${year}-${month}-${day}`);
  },

  getDatePicker(id) {
    const hari = this.getVal(`${id}-hari`).trim();
    const bulan = this.getVal(`${id}-bulan`);
    const tahun = this.getVal(`${id}-tahun`).trim();
    if (!hari || !bulan || !tahun || tahun.length < 4) return null;
    return `${tahun}-${bulan}-${hari.padStart(2, "0")}`;
  },

  getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
  },

  getNumVal(id) {
    const el = document.getElementById(id);
    if (!el || el.value === "") return null;
    const num = parseInt(el.value);
    return isNaN(num) ? null : num;
  },

  collectBiodataForm() {
    return {
      biodata: {
        namaLengkap: this.getVal("bio-namaLengkap"),
        namaPanggilan: this.getVal("bio-namaPanggilan"),
        jenisKelamin: this.getVal("bio-jenisKelamin"),
        tempatLahir: this.getVal("bio-tempatLahir"),
        tanggalLahir: this.getDatePicker("bio-tanggalLahir") || this.getVal("bio-tanggalLahir"),
        agama: this.getVal("bio-agama"),
        kewarganegaraan: this.getVal("bio-kewarganegaraan"),
        nik: this.getVal("bio-nik"),
        anakKe: this.getNumVal("bio-anakKe"),
        jumlahSaudara: this.getNumVal("bio-jumlahSaudara"),
        saudaraKandung: this.getNumVal("bio-saudaraKandung"),
        saudaraTiri: this.getNumVal("bio-saudaraTiri"),
        saudaraAngkat: this.getNumVal("bio-saudaraAngkat"),
        statusYatim: this.getVal("bio-statusYatim"),
        bahasaSehari: this.getVal("bio-bahasaSehari"),
      },
      alamat: {
        alamatLengkap: this.getVal("alm-alamatLengkap"),
        telepon: this.getVal("alm-telepon"),
        email: this.getVal("alm-email"),
        tinggalDengan: this.getVal("alm-tinggalDengan"),
        jarakSekolah: this.getVal("alm-jarakSekolah"),
        transportasi: this.getVal("alm-transportasi"),
      },
      kesehatan: {
        golonganDarah: this.getVal("kes-golonganDarah"),
        penyakit: this.getVal("kes-penyakit"),
        kelainanJasmani: this.getVal("kes-kelainanJasmani"),
        tinggiBadan: this.getNumVal("kes-tinggiBadan"),
        beratBadan: this.getNumVal("kes-beratBadan"),
      },
      pendidikan: {
        asalSekolah: this.getVal("pend-asalSekolah"),
        nomorIjazah: this.getVal("pend-nomorIjazah"),
        lamaBelajar: this.getVal("pend-lamaBelajar"),
        kelas: this.getVal("pend-kelas"),
      },
      ayah: this.collectOrangTua("ayah"),
      ibu: this.collectOrangTua("ibu"),
      wali: this.collectOrangTua("wali"),
      kegemaran: {
        kesenian: this.getVal("gem-kesenian"),
        olahraga: this.getVal("gem-olahraga"),
        organisasi: this.getVal("gem-organisasi"),
        lainLain: this.getVal("gem-lainLain"),
      },
    };
  },

  collectOrangTua(prefix) {
    return {
      nama: this.getVal(`${prefix}-nama`),
      tempatLahir: this.getVal(`${prefix}-tempatLahir`),
      tanggalLahir: this.getDatePicker(`${prefix}-tanggalLahir`) || null,
      agama: this.getVal(`${prefix}-agama`),
      kewarganegaraan: this.getVal(`${prefix}-kewarganegaraan`),
      pendidikan: this.getVal(`${prefix}-pendidikan`),
      pekerjaan: this.getVal(`${prefix}-pekerjaan`),
      penghasilan: this.getVal(`${prefix}-penghasilan`),
      email: this.getVal(`${prefix}-email`),
      alamat: this.getVal(`${prefix}-alamat`),
      telepon: this.getVal(`${prefix}-telepon`),
      status: this.getVal(`${prefix}-status`),
    };
  },

  setupAutoSave() {
    const form = document.getElementById("biodata-form");
    if (form) {
      const handleInput = (e) => {
        // If student address changed, check if any parent address checkbox is checked
        if (e && e.target && e.target.id === "alm-alamatLengkap") {
          const val = e.target.value;
          ["ayah", "ibu", "wali"].forEach((prefix) => {
            const chk = document.getElementById(`${prefix}-alamat-sama`);
            if (chk && chk.checked) {
              const target = document.getElementById(`${prefix}-alamat`);
              if (target) target.value = val;
            }
          });
        }

        // If parent address is manually edited, uncheck the corresponding "same as student" checkbox
        if (e && e.target && ["ayah-alamat", "ibu-alamat", "wali-alamat"].includes(e.target.id)) {
          const prefix = e.target.id.split("-")[0];
          const chk = document.getElementById(`${prefix}-alamat-sama`);
          if (chk) chk.checked = false;
        }

        this.isDirty = true;
        this.updateBiodataProgress(); // Live update progress
        this.scheduleAutoSave();
      };
      form.addEventListener("input", handleInput);
      form.addEventListener("change", handleInput);
    }
  },

  handleSameAddress(prefix, checkbox) {
    const studentAddressEl = document.getElementById("alm-alamatLengkap");
    const parentAddressEl = document.getElementById(`${prefix}-alamat`);
    
    if (checkbox.checked) {
      if (studentAddressEl && parentAddressEl) {
        parentAddressEl.value = studentAddressEl.value;
        this.isDirty = true;
        this.updateBiodataProgress();
        this.scheduleAutoSave();
      }
    }
  },

  scheduleAutoSave() {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => this.saveBiodata(false), 3000);
  },

  async saveBiodata(showFeedback = true) {
    if (!this.isDirty && !showFeedback) return;
    const data = this.collectBiodataForm();
    try {
      await API.saveBiodata(data);
      this.isDirty = false;
      if (showFeedback) UI.toast("Data berhasil disimpan.", "success");
    } catch (err) {
      if (showFeedback) UI.toast(err.message || "Gagal menyimpan data.", "error");
    }
  },

  async completeBiodataAndNext() {
    this.setButtonLoading("btn-biodata-next", true);
    const data = this.collectBiodataForm();
    try {
      await API.saveBiodata(data);
      this.isDirty = false;
    } catch (saveErr) {
      UI.toast(saveErr.message || "Gagal menyimpan data.", "error");
      this.setButtonLoading("btn-biodata-next", false);
      return;
    }

    try {
      await API.completeBiodata();
      this.goToStep(3);
    } catch (err) {
      if (err.errors && err.errors.length > 0) {
        UI.toast(`Data belum lengkap: ${err.errors[0].message}`, "error");
      } else {
        UI.toast(err.message || "Biodata belum lengkap.", "error");
      }
    } finally {
      this.setButtonLoading("btn-biodata-next", false);
    }
  },

  async loadUploadStatus() {
    try {
      const res = await API.getReview();
      const docs = res.data.dokumen || {};
      const studentJalur = this.studentData?.konfirmasi?.jalur || "all";
      const berkasSettings = window.WizardSettings?.landing_berkas_json || [];

      // Filter berkas based on active status and student's jalur
      this.activeBerkas = berkasSettings.filter(b => {
        if (!b.active) return false;
        if (!b.jalur || b.jalur.includes("all")) return true;
        return b.jalur.includes(studentJalur);
      });

      const container = document.getElementById("upload-zones-container");
      if (container) {
        container.innerHTML = "";
        this.activeBerkas.forEach(doc => {
          const zoneId = `upload-${doc.id}`;
          const col = document.createElement("div");
          col.className = "bg-white p-6 rounded-3xl border border-slate-200 shadow-sm";
          col.innerHTML = `
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-800">${doc.title}</h3>
              ${doc.required ? '<span class="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-wider">Wajib</span>' : ""}
            </div>
            <div id="${zoneId}" class="min-h-[160px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 hover:border-blue-400 transition-colors cursor-pointer">
            </div>
          `;
          container.appendChild(col);

          if (docs[doc.id] && docs[doc.id].key) {
            this.setUploadSuccess(doc.id, docs[doc.id].originalName);
          } else {
            this.setUploadEmpty(doc.id, doc.title);
          }
        });
      }
      this.updateUploadNextButton();
    } catch (err) {
      UI.toast("Gagal memuat status dokumen.", "error");
    }
  },

  setUploadSuccess(docId, filename) {
    const zone = document.getElementById(`upload-${docId}`);
    if (!zone) return;
    zone.innerHTML = `
      <div class="flex items-center gap-4 p-4 w-full">
        <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-2xl">check_circle</span>
        </div>
        <div class="flex-1 min-w-0 text-left">
          <p class="text-sm font-bold text-slate-800 truncate">${filename}</p>
          <p class="text-xs text-emerald-600 font-medium">Berhasil diunggah</p>
        </div>
        <button onclick="Wizard.removeFile('${docId}')" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>
    `;
    zone.onclick = null;
    zone.classList.remove("border-dashed", "hover:border-blue-400", "cursor-pointer");
    zone.classList.add("border-emerald-100", "bg-emerald-50/30");
  },

  setUploadEmpty(docId, label) {
    const zone = document.getElementById(`upload-${docId}`);
    if (!zone) return;
    
    // Find doc entry for title and max_size_mb
    const doc = (this.activeBerkas || []).find(b => b.id === docId);
    if(!label) {
       label = doc ? doc.title : docId;
    }
    const maxMB = doc?.max_size_mb || 5;

    zone.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center w-full">
        <div class="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
          <span class="material-symbols-outlined text-2xl">cloud_upload</span>
        </div>
        <p class="text-sm font-bold text-slate-700">${label}</p>
        <p class="text-xs text-slate-400 mt-1">PDF, JPG, PNG (maks ${maxMB}MB)</p>
      </div>
      <input type="file" id="file-${docId}" class="hidden" accept=".pdf,.jpg,.jpeg,.png" onchange="Wizard.handleFileSelect('${docId}', this)">
    `;
    zone.onclick = () => document.getElementById(`file-${docId}`).click();
    zone.classList.add("border-dashed", "hover:border-blue-400", "cursor-pointer");
    zone.classList.remove("border-emerald-100", "bg-emerald-50/30");
  },

  async handleFileSelect(docId, input) {
    const file = input.files[0];
    if (!file) return;
    const doc = (this.activeBerkas || []).find(b => b.id === docId);
    const maxMB = (doc?.max_size_mb) || 5;
    if (file.size > maxMB * 1024 * 1024) {
      UI.toast(`Ukuran file melebihi ${maxMB}MB untuk dokumen ini.`, 'error');
      input.value = '';
      return;
    }
    const zone = document.getElementById(`upload-${docId}`);
    zone.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center w-full">
        <div class="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-3"></div>
        <p class="text-xs font-bold text-slate-500">Mengunggah ${file.name}...</p>
      </div>
    `;
    try {
      await API.uploadDocument(docId, file);
      this.setUploadSuccess(docId, file.name);
      UI.toast("Dokumen berhasil diunggah.", "success");
      this.updateUploadNextButton();
    } catch (err) {
      this.setUploadEmpty(docId);
      UI.toast(err.message || "Gagal mengunggah dokumen.", "error");
    }
  },

  async removeFile(docId) {
    if(!await UI.confirm('Hapus Dokumen?', 'Dokumen yang dihapus tidak dapat dikembalikan.')) return;
    try {
      await API.deleteDocument(docId);
      this.setUploadEmpty(docId);
      this.updateUploadNextButton();
      UI.toast("Dokumen berhasil dihapus.", "success");
    } catch (err) {
      UI.toast(err.message || "Gagal menghapus dokumen.", "error");
    }
  },

  updateUploadNextButton() {
    const allRequiredUploaded = (this.activeBerkas || []).every((doc) => {
      if (!doc.required) return true;
      const zone = document.getElementById(`upload-${doc.id}`);
      return zone && zone.classList.contains("bg-emerald-50/30");
    });
    const btn = document.getElementById("btn-upload-next");
    if (btn) btn.disabled = !allRequiredUploaded;
  },

  async loadReview() {
    try {
      const res = await API.getReview();
      const reviewContainer = document.getElementById("review-content");
      if (reviewContainer) reviewContainer.innerHTML = this.buildReviewHTML(res.data);
    } catch (err) {
      UI.toast("Gagal memuat data review.", "error");
    }
  },

  buildReviewHTML(d) {
    const formatDate = (dateStr) => {
      if (!dateStr) return "-";
      try {
        const dStr = new Date(dateStr);
        if (isNaN(dStr.getTime())) return "-";
        return dStr.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      } catch (e) {
        return "-";
      }
    };

    const b = d.biodata || {};
    const a = d.alamat || {};
    const k = d.kesehatan || {};
    const p = d.pendidikan || {};
    const ayah = d.ayah || {};
    const ibu = d.ibu || {};
    const wali = d.wali || {};
    const h = d.kegemaran || {};

    let waliHTML = "";
    if (wali.nama && wali.nama.trim() !== "") {
      waliHTML = `
        <div class="bg-surface-container-low rounded-lg p-4 border border-slate-100 shadow-sm">
          <h4 class="font-bold text-sm text-primary mb-3 flex items-center gap-2">
            <span class="material-symbols-outlined text-lg">supervisor_account</span> Data Wali (Opsional)
          </h4>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div><dt class="text-slate-400 font-medium">Nama Wali</dt><dd class="font-bold text-slate-700">${wali.nama || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Status Hidup</dt><dd class="font-medium text-slate-700">${wali.status || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Tempat, Tanggal Lahir</dt><dd class="font-medium text-slate-700">${wali.tempatLahir || "-"}, ${formatDate(wali.tanggalLahir)}</dd></div>
            <div><dt class="text-slate-400 font-medium">Agama & Kewarganegaraan</dt><dd class="font-medium text-slate-700">${wali.agama || "-"} / ${wali.kewarganegaraan || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Pendidikan & Pekerjaan</dt><dd class="font-medium text-slate-700">${wali.pendidikan || "-"} / ${wali.pekerjaan || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Penghasilan Bulanan</dt><dd class="font-medium text-slate-700">${wali.penghasilan || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">No. Telepon & Email</dt><dd class="font-medium text-slate-700">${wali.telepon || "-"} / ${wali.email || "-"}</dd></div>
            <div class="sm:col-span-2"><dt class="text-slate-400 font-medium">Alamat</dt><dd class="font-medium text-slate-700">${wali.alamat || "-"}</dd></div>
          </dl>
        </div>
      `;
    }

    return `
      <div class="space-y-6 text-left">
        <!-- Section A: Data Diri -->
        <div class="bg-surface-container-low rounded-lg p-4 border border-slate-100 shadow-sm">
          <h4 class="font-bold text-sm text-primary mb-3 flex items-center gap-2">
            <span class="material-symbols-outlined text-lg">person</span> Data Diri Peserta Didik
          </h4>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div><dt class="text-slate-400 font-medium">Nama Lengkap</dt><dd class="font-bold text-slate-700">${b.namaLengkap || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Nama Panggilan</dt><dd class="font-medium text-slate-700">${b.namaPanggilan || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">NIK</dt><dd class="font-medium text-slate-700">${b.nik || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Jenis Kelamin</dt><dd class="font-medium text-slate-700">${b.jenisKelamin || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Tempat, Tanggal Lahir</dt><dd class="font-medium text-slate-700">${b.tempatLahir || "-"}, ${formatDate(b.tanggalLahir)}</dd></div>
            <div><dt class="text-slate-400 font-medium">Agama & Kewarganegaraan</dt><dd class="font-medium text-slate-700">${b.agama || "-"} / ${b.kewarganegaraan || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Anak Ke / Jumlah Saudara</dt><dd class="font-medium text-slate-700">Anak ke-${b.anakKe || "-"} dari ${b.jumlahSaudara || "-"} bersaudara</dd></div>
            <div><dt class="text-slate-400 font-medium">Saudara Kandung/Tiri/Angkat</dt><dd class="font-medium text-slate-700">Kandung: ${b.saudaraKandung || "0"}, Tiri: ${b.saudaraTiri || "0"}, Angkat: ${b.saudaraAngkat || "0"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Status Yatim / Piatu</dt><dd class="font-medium text-slate-700">${b.statusYatim || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Bahasa Sehari-hari</dt><dd class="font-medium text-slate-700">${b.bahasaSehari || "-"}</dd></div>
          </dl>
        </div>

        <!-- Section B: Tempat Tinggal -->
        <div class="bg-surface-container-low rounded-lg p-4 border border-slate-100 shadow-sm">
          <h4 class="font-bold text-sm text-primary mb-3 flex items-center gap-2">
            <span class="material-symbols-outlined text-lg">home</span> Tempat Tinggal & Kontak
          </h4>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="sm:col-span-2"><dt class="text-slate-400 font-medium">Alamat Lengkap</dt><dd class="font-medium text-slate-700">${a.alamatLengkap || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">No. Telepon / HP</dt><dd class="font-medium text-slate-700">${a.telepon || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Email</dt><dd class="font-medium text-slate-700">${a.email || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Tinggal Dengan</dt><dd class="font-medium text-slate-700">${a.tinggalDengan || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Jarak ke Sekolah / Transportasi</dt><dd class="font-medium text-slate-700">${a.jarakSekolah || "-"} / ${a.transportasi || "-"}</dd></div>
          </dl>
        </div>

        <!-- Section C: Kesehatan -->
        <div class="bg-surface-container-low rounded-lg p-4 border border-slate-100 shadow-sm">
          <h4 class="font-bold text-sm text-primary mb-3 flex items-center gap-2">
            <span class="material-symbols-outlined text-lg">medical_services</span> Kesehatan
          </h4>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div><dt class="text-slate-400 font-medium">Golongan Darah</dt><dd class="font-medium text-slate-700">${k.golonganDarah || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Tinggi / Berat Badan</dt><dd class="font-medium text-slate-700">${k.tinggiBadan || "-"} cm / ${k.beratBadan || "-"} kg</dd></div>
            <div><dt class="text-slate-400 font-medium">Penyakit Pernah Diderita</dt><dd class="font-medium text-slate-700">${k.penyakit || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Kelainan Jasmani</dt><dd class="font-medium text-slate-700">${k.kelainanJasmani || "-"}</dd></div>
          </dl>
        </div>

        <!-- Section D: Pendidikan -->
        <div class="bg-surface-container-low rounded-lg p-4 border border-slate-100 shadow-sm">
          <h4 class="font-bold text-sm text-primary mb-3 flex items-center gap-2">
            <span class="material-symbols-outlined text-lg">school</span> Pendidikan Sebelumnya
          </h4>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div><dt class="text-slate-400 font-medium">Asal Sekolah (SMP)</dt><dd class="font-bold text-slate-700">${p.asalSekolah || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Nomor Ijazah</dt><dd class="font-medium text-slate-700">${p.nomorIjazah || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Lama Belajar</dt><dd class="font-medium text-slate-700">${p.lamaBelajar || "-"} tahun</dd></div>
            <div><dt class="text-slate-400 font-medium">Kelas</dt><dd class="font-medium text-slate-700">${p.kelas || "-"}</dd></div>
          </dl>
        </div>

        <!-- Section E: Data Ayah Kandung -->
        <div class="bg-surface-container-low rounded-lg p-4 border border-slate-100 shadow-sm">
          <h4 class="font-bold text-sm text-primary mb-3 flex items-center gap-2">
            <span class="material-symbols-outlined text-lg">person</span> Data Ayah Kandung
          </h4>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div><dt class="text-slate-400 font-medium">Nama Ayah</dt><dd class="font-bold text-slate-700">${ayah.nama || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Status Hidup</dt><dd class="font-medium text-slate-700">${ayah.status || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Tempat, Tanggal Lahir</dt><dd class="font-medium text-slate-700">${ayah.tempatLahir || "-"}, ${formatDate(ayah.tanggalLahir)}</dd></div>
            <div><dt class="text-slate-400 font-medium">Agama & Kewarganegaraan</dt><dd class="font-medium text-slate-700">${ayah.agama || "-"} / ${ayah.kewarganegaraan || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Pendidikan & Pekerjaan</dt><dd class="font-medium text-slate-700">${ayah.pendidikan || "-"} / ${ayah.pekerjaan || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Penghasilan Bulanan</dt><dd class="font-medium text-slate-700">${ayah.penghasilan || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">No. Telepon & Email</dt><dd class="font-medium text-slate-700">${ayah.telepon || "-"} / ${ayah.email || "-"}</dd></div>
            <div class="sm:col-span-2"><dt class="text-slate-400 font-medium">Alamat</dt><dd class="font-medium text-slate-700">${ayah.alamat || "-"}</dd></div>
          </dl>
        </div>

        <!-- Section F: Data Ibu Kandung -->
        <div class="bg-surface-container-low rounded-lg p-4 border border-slate-100 shadow-sm">
          <h4 class="font-bold text-sm text-primary mb-3 flex items-center gap-2">
            <span class="material-symbols-outlined text-lg">person</span> Data Ibu Kandung
          </h4>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div><dt class="text-slate-400 font-medium">Nama Ibu</dt><dd class="font-bold text-slate-700">${ibu.nama || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Status Hidup</dt><dd class="font-medium text-slate-700">${ibu.status || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Tempat, Tanggal Lahir</dt><dd class="font-medium text-slate-700">${ibu.tempatLahir || "-"}, ${formatDate(ibu.tanggalLahir)}</dd></div>
            <div><dt class="text-slate-400 font-medium">Agama & Kewarganegaraan</dt><dd class="font-medium text-slate-700">${ibu.agama || "-"} / ${ibu.kewarganegaraan || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Pendidikan & Pekerjaan</dt><dd class="font-medium text-slate-700">${ibu.pendidikan || "-"} / ${ibu.pekerjaan || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Penghasilan Bulanan</dt><dd class="font-medium text-slate-700">${ibu.penghasilan || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">No. Telepon & Email</dt><dd class="font-medium text-slate-700">${ibu.telepon || "-"} / ${ibu.email || "-"}</dd></div>
            <div class="sm:col-span-2"><dt class="text-slate-400 font-medium">Alamat</dt><dd class="font-medium text-slate-700">${ibu.alamat || "-"}</dd></div>
          </dl>
        </div>

        <!-- Section G: Wali -->
        ${waliHTML}

        <!-- Section H: Kegemaran -->
        <div class="bg-surface-container-low rounded-lg p-4 border border-slate-100 shadow-sm">
          <h4 class="font-bold text-sm text-primary mb-3 flex items-center gap-2">
            <span class="material-symbols-outlined text-lg">interests</span> Kegemaran & Bakat
          </h4>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div><dt class="text-slate-400 font-medium">Kesenian</dt><dd class="font-medium text-slate-700">${h.kesenian || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Olahraga</dt><dd class="font-medium text-slate-700">${h.olahraga || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Organisasi</dt><dd class="font-medium text-slate-700">${h.organisasi || "-"}</dd></div>
            <div><dt class="text-slate-400 font-medium">Lain-lain</dt><dd class="font-medium text-slate-700">${h.lainLain || "-"}</dd></div>
          </dl>
        </div>
      </div>
    `;
  },

  async submitFinal() {
    const checkbox = document.getElementById("pernyataan-check");
    if (!checkbox || !checkbox.checked) {
      UI.toast("Anda harus menyetujui pernyataan integritas.", "error");
      return;
    }
    if (!await UI.confirm('Kirim Pendaftaran?', "Setelah dikirim, data tidak dapat diubah lagi. Pastikan semua isian sudah benar.")) return;
    try {
      this.setButtonLoading("btn-submit-final", true);
      await API.submitFinal();
      this.goToStep(5);
    } catch (err) {
      UI.toast(err.message || "Gagal mengirim data.", "error");
    } finally {
      this.setButtonLoading("btn-submit-final", false);
    }
  },

  async renderDone() {
    try {
      const res = await API.getReview();
      const status = res.data?.verifikasi?.status || "pending";
      const statusEl = document.getElementById("verification-status");
      if (statusEl) {
        if (status === "verified") {
          statusEl.className = "inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm";
          statusEl.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px">verified</span><span>Status: Terverifikasi</span>';
        } else if (status === "rejected") {
          statusEl.className = "inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm";
          statusEl.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px">cancel</span><span>Status: Ditolak</span>';
        }
      }

      // Render Queue Ticket
      const ticket = res.data?.queueTicket;
      const queueConfig = res.data?.queueConfig;
      this.renderQueueTicket(ticket, queueConfig);
    } catch (e) {}
  },

  async claimQueueTicket() {
    try {
      this.setButtonLoading("btn-claim-ticket", true);
      const res = await API.request("/student/queue/join", { method: "POST" });
      UI.toast(res.message || "Nomor antrean berhasil diambil!", "success");
      await this.renderDone();
    } catch (err) {
      UI.toast(err.message || "Gagal mengambil nomor antrean.", "error");
    } finally {
      this.setButtonLoading("btn-claim-ticket", false);
    }
  },

  renderQueueTicket(ticket, queueConfig) {
    const ticketEl = document.getElementById("student-queue-ticket");
    if (!ticketEl) return;

    if (ticket) {
      // Kondisi 3: Siswa memiliki tiket antrean aktif
      ticketEl.innerHTML = `
        <div class="mt-6 mb-8 p-8 bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-white border border-blue-100 rounded-3xl max-w-md mx-auto text-center shadow-md relative overflow-hidden">
          <div class="absolute -right-10 -top-10 w-24 h-24 bg-blue-100/30 rounded-full blur-xl pointer-events-none"></div>

          <div class="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm shadow-blue-50">
            <span class="material-symbols-outlined text-2xl">confirmation_number</span>
          </div>
          
          <span class="text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-1">Nomor Antrean Anda</span>
          <span class="text-5xl font-extrabold text-blue-700 tracking-tight block">${ticket.ticketNumber}</span>
          
          <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-100 rounded-full text-xs font-bold text-slate-600 shadow-sm mt-3 mb-6">
            <span class="w-2 h-2 rounded-full ${ticket.status === 'serving' ? 'bg-emerald-500 animate-ping' : 'bg-blue-400'}"></span>
            <span>Status: </span>
            ${ticket.status === 'serving' ? '<span class="text-emerald-600 font-extrabold">Sedang Dilayani</span>' : 
              ticket.status === 'done' ? '<span class="text-slate-500 font-extrabold">Selesai</span>' :
              ticket.status === 'skipped' ? '<span class="text-amber-600 font-extrabold">Dilewati</span>' :
              '<span class="text-blue-500 font-extrabold">Menunggu Panggilan</span>'}
          </div>

          ${ticket.status === 'waiting' ? `
            <div class="grid grid-cols-2 gap-4 border-t border-b border-blue-100/60 py-4 mb-4">
              <div class="text-center border-r border-blue-100/40">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Estimasi Tunggu</span>
                <span class="text-base font-extrabold text-blue-700">~${ticket.estimatedWaitMinutes} Menit</span>
                <span class="text-[9px] font-semibold text-slate-400 block mt-0.5">${ticket.waitingAhead} siswa di depan</span>
              </div>
              <div class="text-center">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Jam Kehadiran</span>
                <span class="text-base font-extrabold text-indigo-700">${ticket.recommendedTimeWindow || '-'}</span>
                <span class="text-[9px] font-semibold text-slate-400 block mt-0.5">Rekomendasi Hadir</span>
              </div>
            </div>
          ` : ticket.status === 'serving' ? `
            <div class="mt-4 bg-emerald-50/80 border border-emerald-100 rounded-2xl py-4 px-4 mb-4 text-center">
              <span class="material-symbols-outlined text-emerald-600 text-2xl animate-bounce mb-1 block">campaign</span>
              <span class="text-sm font-bold text-emerald-800 block">Nomor Anda Sedang Dipanggil!</span>
              <span class="text-xs font-semibold text-emerald-600 mt-1 block">Silakan menuju ke meja/loket verifikasi pendaftaran sekarang.</span>
            </div>
          ` : ticket.status === 'skipped' ? `
            <div class="mt-4 bg-amber-50/80 border border-amber-100 rounded-2xl py-4 px-4 mb-4 text-center">
              <span class="material-symbols-outlined text-amber-600 text-2xl mb-1 block">warning</span>
              <span class="text-sm font-bold text-amber-800 block">Antrean Anda Dilewati</span>
              <span class="text-xs font-medium text-slate-500 mt-1 block">Anda tidak berada di lokasi saat dipanggil. Hubungi panitia di loket untuk dipanggil ulang.</span>
            </div>
          ` : `
            <div class="mt-4 bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 mb-4 text-center">
              <span class="material-symbols-outlined text-slate-500 text-2xl mb-1 block">task_alt</span>
              <span class="text-sm font-bold text-slate-700 block">Verifikasi Fisik Selesai</span>
              <span class="text-xs font-medium text-slate-500 mt-1 block">Proses verifikasi berkas fisik Anda telah selesai diproses. Terima kasih!</span>
            </div>
          `}

          <p class="text-[10px] text-slate-400 leading-relaxed">
            Harap datang tepat waktu sesuai rekomendasi jam kehadiran. Tiket antrean ini hanya berlaku hari ini dan akan kedaluwarsa setelah sesi ditutup oleh admin.
          </p>
        </div>
      `;
      ticketEl.classList.remove("hidden");
      this.initQueueSSE();
    } else if (queueConfig && queueConfig.isActive === true && queueConfig.studentLinkEnabled === true) {
      // Kondisi 2: Sesi aktif & siswa belum mengambil antrean
      ticketEl.innerHTML = `
        <div class="mt-6 mb-8 p-8 bg-gradient-to-br from-indigo-600 via-indigo-600 to-blue-700 text-white rounded-3xl max-w-md mx-auto text-center shadow-xl shadow-indigo-100 relative overflow-hidden">
          <div class="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div class="absolute -left-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

          <div class="w-16 h-16 bg-white/15 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <span class="material-symbols-outlined text-3xl">confirmation_number</span>
          </div>
          <h3 class="text-xl font-extrabold mb-2 tracking-tight text-white">Ambil Nomor Antrean</h3>
          <p class="text-sm text-indigo-100/90 leading-relaxed mb-6">
            Sesi verifikasi berkas fisik hari ini telah dibuka secara online. Ambil nomor antrean Anda sekarang secara mandiri.
          </p>
          
          <div class="p-4 bg-white/10 border border-white/10 rounded-2xl text-left mb-6 backdrop-blur-sm">
            <div class="flex gap-3">
              <span class="material-symbols-outlined text-amber-300 text-xl shrink-0 mt-0.5">warning</span>
              <div>
                <span class="text-xs font-bold text-white block mb-0.5">Peringatan Penting</span>
                <span class="text-[11px] font-medium text-indigo-100 leading-relaxed block">
                  Tiket ini hanya berlaku untuk sesi hari ini. Pastikan Anda mengklik tombol saat Anda sudah siap menuju lokasi sekolah atau telah berada di dekat lokasi pendaftaran.
                </span>
              </div>
            </div>
          </div>

          <button id="btn-claim-ticket" onclick="Wizard.claimQueueTicket()" class="w-full py-4 px-6 bg-white text-indigo-700 hover:bg-slate-50 font-extrabold rounded-2xl transition-all duration-255 active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg shadow-indigo-950/20 text-sm">
            <span class="material-symbols-outlined text-lg">add_circle</span>
            <span class="btn-text">Ambil Nomor Antrean Hari Ini</span>
          </button>
        </div>
      `;
      ticketEl.classList.remove("hidden");
      this.initQueueSSE();
    } else {
      // Kondisi 1: Sesi nonaktif / link dinonaktifkan
      ticketEl.innerHTML = `
        <div class="mt-6 mb-8 p-8 bg-slate-50 border border-slate-200 rounded-3xl max-w-md mx-auto text-center shadow-sm">
          <div class="w-16 h-16 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm shadow-slate-100">
            <span class="material-symbols-outlined text-3xl">schedule</span>
          </div>
          <h3 class="text-lg font-bold text-slate-800 mb-2">Antrean Belum Dibuka</h3>
          <p class="text-sm text-slate-500 leading-relaxed mb-6">
            ${!queueConfig || queueConfig.isActive === false 
              ? 'Formulir Buku Induk Anda telah berhasil dikirim & dikunci. Sesi pelayanan antrean verifikasi berkas fisik hari ini belum dibuka oleh panitia.' 
              : 'Formulir Buku Induk Anda telah dikirim. Saat ini antrean online mandiri dinonaktifkan. Silakan datangi loket verifikasi fisik di sekolah secara langsung.'}
          </p>
          <div class="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-left">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-slate-400 text-xl">calendar_month</span>
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Jam Operasional Loket</span>
                <span class="text-xs font-extrabold text-slate-700 block">${queueConfig?.operationalHours || 'Senin - Jumat, 08:00 - 14:00 WIB'}</span>
              </div>
            </div>
          </div>
          <p class="text-[11px] text-slate-400 mt-6 leading-relaxed">
            Harap persiapkan berkas fisik pendukung Anda dan cetak dokumen Buku Induk di atas sebelum menuju ke sekolah.
          </p>
        </div>
      `;
      ticketEl.classList.remove("hidden");
      this.initQueueSSE(); // Tetap mendengarkan agar otomatis berubah jika sesi dibuka
    }
  },

  initQueueSSE() {
    if (this.queueSSE) return;

    this.queueSSE = new EventSource('/api/queue/stream');

    const handleUpdate = async () => {
      try {
        const res = await API.getReview();
        this.renderQueueTicket(res.data?.queueTicket, res.data?.queueConfig);
      } catch (err) {}
    };

    this.queueSSE.addEventListener('status_update', handleUpdate);
    this.queueSSE.addEventListener('call', handleUpdate);
    this.queueSSE.addEventListener('done', handleUpdate);
    this.queueSSE.addEventListener('session_end', handleUpdate);
    this.queueSSE.addEventListener('session_start', handleUpdate);
    
    this.queueSSE.onerror = () => {
      // Silent error handler
    };
  },

  closeQueueSSE() {
    if (this.queueSSE) {
      try {
        this.queueSSE.close();
      } catch (err) {}
      this.queueSSE = null;
    }
  },

  async downloadPdf() {
    try {
      this.setButtonLoading("btn-download-pdf", true);
      const blob = await API.downloadPdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const nama = (this.studentData?.nama || "SISWA").toUpperCase();
      const nisn = this.studentData?.nisn || "";
      const asalSmp = (this.studentData?.asalSmp || "SMP").toUpperCase();
      a.download = `${nama} - ${nisn} - ${asalSmp} - BUKU INDUK.pdf`;

      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      UI.toast("Gagal mengunduh PDF.", "error");
    } finally {
      this.setButtonLoading("btn-download-pdf", false);
    }
  },


  // ============================================
  // Utilities
  // ============================================

  setButtonLoading(id, loading) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = loading;
    const textEl = btn.querySelector(".btn-text");
    if (textEl) {
      if (loading) {
        if (!textEl.dataset.original) textEl.dataset.original = textEl.textContent;
        textEl.textContent = "Memproses...";
      } else {
        textEl.textContent = textEl.dataset.original || textEl.textContent;
      }
    }
  },
};

// ============================================
// Initialize on page load
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  Wizard.init();
});

// Warn before leaving with unsaved changes
window.addEventListener("beforeunload", (e) => {
  if (Wizard.isDirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
