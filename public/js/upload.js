/**
 * Upload Handler
 * Drag-and-drop file upload with preview and progress
 */

const Upload = {
  /**
   * Initialize drag-and-drop zones
   */
  init() {
    document.querySelectorAll(".upload-zone").forEach((zone) => {
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.classList.add("drag-over");
      });

      zone.addEventListener("dragleave", (e) => {
        e.preventDefault();
        zone.classList.remove("drag-over");
      });

      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("drag-over");

        const docType = zone.dataset.doctype;
        const files = e.dataTransfer.files;

        if (files.length > 0) {
          Wizard.handleFileSelect(docType, { files });
        }
      });
    });
  },
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  Upload.init();
});
