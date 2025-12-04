document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.step');
    const stepContents = document.querySelectorAll('.step-content');
    const nextStepButtons = document.querySelectorAll('.next-step-btn');
    const uploadArea = document.querySelector('.upload-area');
    const fileInput = document.createElement('input');
    const fileTypeRadios = document.querySelectorAll('input[name="fileType"]');
    const step1NextButton = document.querySelector('#step1NextButton');

    let currentStep = 1;
    let uploadedFile = null;

    const allowedExtensions = {
        transcript: '.txt,.pdf,.docx',
        recording: '.mp3,.wav'
    };

    fileInput.type = 'file';
    fileInput.accept = allowedExtensions[getSelectedFileType()];
    fileInput.style.display = 'none';

    uploadArea.innerHTML = `
        <i class="fas fa-cloud-upload-alt upload-icon"></i>
        <p>Drag & Drop files here or <span class="browse-files">Browse files</span></p>
        <p class="file-info"></p>
        <div class="progress-bar-container hidden">
            <div class="progress-bar-fill"></div>
        </div>
        <p class="upload-status"></p>
    `;
    uploadArea.appendChild(fileInput);

    const browseFilesSpan = uploadArea.querySelector('.browse-files');
    const fileInfoParagraph = uploadArea.querySelector('.file-info');
    const progressBarContainer = uploadArea.querySelector('.progress-bar-container');
    const progressBarFill = uploadArea.querySelector('.progress-bar-fill');
    const uploadStatusParagraph = uploadArea.querySelector('.upload-status');

    function getSelectedFileType() {
        let selectedType = 'transcript';
        fileTypeRadios.forEach(radio => {
            if (radio.checked) {
                selectedType = radio.value;
            }
        });
        return selectedType;
    }

    function updateFileInputAccept() {
        const selectedType = getSelectedFileType();
        fileInput.accept = allowedExtensions[selectedType];
        console.log("File input 'accept' attribute updated to:", fileInput.accept);
        fileInput.value = '';
        uploadedFile = null;
        fileInfoParagraph.textContent = '';
        uploadStatusParagraph.textContent = '';
        if (step1NextButton) {
            step1NextButton.disabled = true;
        }
    }

    fileTypeRadios.forEach(radio => {
        radio.addEventListener('change', updateFileInputAccept);
    });

    function updateStepUI(stepNumber) {
        steps.forEach(step => {
            if (parseInt(step.dataset.step) === stepNumber) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        stepContents.forEach(content => {
            if (parseInt(content.id.replace('step', '')) === stepNumber) {
                content.classList.remove('hidden');
                if (stepNumber === 1 && step1NextButton) {
                    step1NextButton.disabled = !uploadedFile;
                }
            } else {
                content.classList.add('hidden');
            }
        });

        currentStep = stepNumber;
    }

    async function handleFileUpload(file) {
        if (!file) return;

        const selectedType = getSelectedFileType();
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

        if (!allowedExtensions[selectedType].includes(fileExtension)) {
            uploadStatusParagraph.textContent = `Error: Please upload a ${selectedType} file (allowed: ${allowedExtensions[selectedType]})`;
            progressBarFill.style.width = '100%';
            progressBarFill.style.backgroundColor = 'orange';
            uploadedFile = null;
            if (step1NextButton) {
                step1NextButton.disabled = true;
            }
            return;
        }

        fileInfoParagraph.textContent = '';
        uploadStatusParagraph.textContent = 'Uploading...';
        progressBarContainer.classList.remove('hidden');
        progressBarFill.style.width = '0%';
        progressBarFill.style.backgroundColor = 'var(--primary-blue)';
        if (step1NextButton) {
            step1NextButton.disabled = true;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', selectedType);

        try {
            const simulatedData = { filename: file.name, size: file.size };

            await new Promise(resolve => setTimeout(resolve, 1500));

            uploadedFile = file;
            fileInfoParagraph.textContent = `Uploaded: ${simulatedData.filename}`;
            uploadStatusParagraph.textContent = 'Upload successful!';
            progressBarFill.style.width = '100%';
            progressBarFill.style.backgroundColor = 'var(--success-green)';
            if (step1NextButton) {
                step1NextButton.disabled = false;
            }

        } catch (error) {
            console.error('Upload Error:', error);
            uploadStatusParagraph.textContent = `Upload failed: ${error.message}`;
            progressBarFill.style.width = '100%';
            progressBarFill.style.backgroundColor = 'red';
            uploadedFile = null;
            if (step1NextButton) {
                step1NextButton.disabled = true;
            }
        } finally {
            setTimeout(() => {
                progressBarContainer.classList.add('hidden');
                progressBarFill.style.width = '0%';
                progressBarFill.style.backgroundColor = 'var(--primary-blue)';
            }, 2000);
        }
    }

    fileInput.addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            handleFileUpload(event.target.files[0]);
        }
    });

    browseFilesSpan.addEventListener('click', () => {
        fileInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    nextStepButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetStep = parseInt(button.dataset.targetStep);
            if (targetStep) {
                if (currentStep === 1) {
                    if (uploadedFile) {
                        updateStepUI(targetStep);
                    } else {
                        alert('Please upload a file before proceeding to the next step.');
                    }
                } else {
                    updateStepUI(targetStep);
                }
            }
        });
    });

    const dashboardButton = document.querySelector('.dashboard-btn');
    if (dashboardButton) {
        dashboardButton.addEventListener('click', () => {
            alert('Navigating to Dashboard!');
        });
    }

    updateStepUI(currentStep);
    updateFileInputAccept();

    const availableEmployeesList = document.getElementById('availableEmployees');
    const dropZones = document.querySelectorAll('.drop-zone');

    let draggedEmployee = null;

    function togglePlaceholder(zoneElement, show, text = 'Drag employee here') {
        let placeholder = zoneElement.querySelector('.drop-placeholder');

        if (zoneElement === availableEmployeesList) {
            if (placeholder) {
                placeholder.remove();
            }
            return;
        }

        if (show) {
            if (zoneElement.children.length === 0 && !placeholder) {
                placeholder = document.createElement('p');
                placeholder.className = 'drop-placeholder';
                placeholder.textContent = text;
                zoneElement.appendChild(placeholder);
            }
        } else {
            if (placeholder && zoneElement.querySelector('.employee-item')) {
                placeholder.remove();
            }
        }

        if (zoneElement !== availableEmployeesList && zoneElement.children.length === 0) {
            if (!zoneElement.querySelector('.drop-placeholder')) {
                const newPlaceholder = document.createElement('p');
                newPlaceholder.className = 'drop-placeholder';
                newPlaceholder.textContent = text;
                zoneElement.appendChild(newPlaceholder);
            }
        }
    }

    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('employee-item')) {
            draggedEmployee = e.target;
            e.dataTransfer.setData('text/plain', e.target.dataset.id); 
            setTimeout(() => {
                e.target.classList.add('hidden');
            }, 0);
        }
    });

    document.addEventListener('dragend', (e) => {
        if (draggedEmployee) {
            if (draggedEmployee.classList.contains('hidden')) {
                draggedEmployee.classList.remove('hidden');
            }
            draggedEmployee = null;
        }
    });

    // Event listeners for each drop zone
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            zone.classList.add('drag-over-zone');
            togglePlaceholder(zone, false);
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over-zone');
            togglePlaceholder(zone, true);
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over-zone');

            const employeeId = e.dataTransfer.getData('text/plain');
            const employeeItem = document.querySelector(`.employee-item[data-id="${employeeId}"]`);

            if (employeeItem && employeeItem.parentNode !== zone) {
                const originalParentZone = employeeItem.parentNode;

                if (zone.children.length > 0 && zone !== availableEmployeesList) {
                    const existingItemInZone = zone.querySelector('.employee-item');
                    if (existingItemInZone) {
                        availableEmployeesList.appendChild(existingItemInZone);
                        togglePlaceholder(zone, true);
                    }
                }

                zone.appendChild(employeeItem);
                employeeItem.classList.remove('hidden'); 

                togglePlaceholder(zone, false); 
                togglePlaceholder(originalParentZone, true); 
            } else if (employeeItem && employeeItem.parentNode === zone) {
                employeeItem.classList.remove('hidden');
            }

            dropZones.forEach(dz => togglePlaceholder(dz, dz.children.length === 0));
        });
    });

    togglePlaceholder(availableEmployeesList, false);

    document.querySelectorAll('.meeting-tasks-column .drop-zone').forEach(zone => {
        togglePlaceholder(zone, zone.children.length === 0);
    });

    availableEmployeesList.querySelectorAll('.employee-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedEmployee = e.target;
            e.dataTransfer.setData('text/plain', e.target.dataset.id);
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => {
                e.target.classList.add('hidden');
            }, 0);
        });
        item.addEventListener('dragend', (e) => {
            if (draggedEmployee) {
                if (draggedEmployee.classList.contains('hidden')) {
                    draggedEmployee.classList.remove('hidden');
                }
                draggedEmployee = null;
            }
        });
    });

});