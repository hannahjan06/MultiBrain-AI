document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.step');
    const stepContents = document.querySelectorAll('.step-content');
    const nextStepButtons = document.querySelectorAll('.next-step-btn');
    const uploadArea = document.querySelector('.upload-area');
    const fileTypeRadios = document.querySelectorAll('input[name="fileType"]');
    const step1NextButton = document.querySelector('#step1NextButton');

    const availableEmployeesList = document.getElementById('availableEmployees');
    let draggedEmployee = null;

    const allowedExtensions = {
        transcript: '.txt,.pdf,.docx',
        recording: '.mp3,.wav'
    };

    const fileInput = document.createElement('input');
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

    let currentStep = 1;
    let uploadedFile = null;

    function getSelectedFileType() {
        let selectedType = 'transcript';
        fileTypeRadios.forEach(radio => {
            if (radio.checked) {
                selectedType = radio.value;
            }
        });
        return selectedType;
    }

    function renderStep2Content(tasks, employees) {
        const meetingTasksColumn = document.querySelector('.meeting-tasks-column');
        meetingTasksColumn.innerHTML = '<h3>Meeting Tasks</h3>';

        availableEmployeesList.innerHTML = '';
        employees.forEach(employee => {
            const employeeItem = document.createElement('div');
            employeeItem.className = 'employee-item';
            employeeItem.draggable = true;
            employeeItem.dataset.name = employee.name;
            employeeItem.dataset.id = employee.id;
            employeeItem.textContent = employee.name;
            availableEmployeesList.appendChild(employeeItem);
        });

        if (tasks && tasks.length > 0) {
            tasks.forEach(task => {
                const taskDiv = document.createElement('div');
                taskDiv.className = 'meeting-task';
                taskDiv.innerHTML = `
                    <label>Task ${task.id}: ${task.description}</label>
                    <div class="drop-zone" id="task${task.id}Zone" data-task-id="${task.id}">
                        <p class="drop-placeholder">Drag employee here</p>
                    </div>
                `;
                meetingTasksColumn.appendChild(taskDiv);

                if (task.ai_assignee) {
                    const assigneeEmployee = employees.find(emp => emp.name === task.ai_assignee);
                    if (assigneeEmployee) {
                        const dropZone = taskDiv.querySelector('.drop-zone');
                        const employeeItem = availableEmployeesList.querySelector(`.employee-item[data-id="${assigneeEmployee.id}"]`);

                        if (employeeItem) {
                            availableEmployeesList.removeChild(employeeItem);
                            dropZone.appendChild(employeeItem);
                            employeeItem.classList.remove('hidden'); 
                            togglePlaceholder(dropZone, false); 
                        }
                    }
                }
            });
        } else {
            const noTasksMessage = document.createElement('p');
            noTasksMessage.textContent = 'No actionable tasks found in the transcript.';
            noTasksMessage.style.textAlign = 'center';
            noTasksMessage.style.marginTop = '20px';
            meetingTasksColumn.appendChild(noTasksMessage);
        }

        initializeDraggableEmployees();
        initializeDropZones();
    }

    nextStepButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const targetStep = parseInt(button.dataset.targetStep);
            if (targetStep) {
                if (currentStep === 1) {
                    if (uploadedFile) {
                        if (window.uploadedTasks && window.availableEmployees) {
                            renderStep2Content(window.uploadedTasks, window.availableEmployees);
                            updateStepUI(targetStep);
                        } else {
                            alert('Processing is still ongoing, please wait or re-upload.');
                        }
                    } else {
                        alert('Please upload a file before proceeding to the next step.');
                    }
                } else if (currentStep === 2) {
                    const assignments = {};
                    document.querySelectorAll('.meeting-task .drop-zone').forEach(zone => {
                        const taskId = zone.dataset.taskId;
                        const assignedEmployee = zone.querySelector('.employee-item');
                        if (taskId && assignedEmployee) {
                            assignments[taskId] = assignedEmployee.dataset.id;
                        }
                    });
                    console.log('Collected Assignments:', assignments);
                    updateStepUI(targetStep);
                }
                else {
                    updateStepUI(targetStep);
                }
            }
        });
    });

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

    async function fetchEmployees() {
        try {
            const response = await fetch('/employees');
            if (!response.ok) {
                throw new Error('Failed to fetch employees');
            }
            const employees = await response.json();
            return employees;
        } catch (error) {
            console.error('Error fetching employees:', error);
            return [];
        }
    }

    function initializeDraggableEmployees() {
        document.querySelectorAll('.employee-item').forEach(item => { 
            item.removeEventListener('dragstart', handleDragStart); 
            item.removeEventListener('dragend', handleDragEnd);
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragend', handleDragEnd);
        });
    }

    function handleDragStart(e) {
        draggedEmployee = e.target;
        e.dataTransfer.setData('text/plain', e.target.dataset.id);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => {
            if (draggedEmployee) {
                draggedEmployee.classList.add('hidden');
            }
        }, 0);
    }

    function handleDragEnd(e) {
        if (draggedEmployee && draggedEmployee.classList.contains('hidden')) {
            draggedEmployee.classList.remove('hidden');
        }
        draggedEmployee = null;
    }

    function initializeDropZones() {
        const dropZones = document.querySelectorAll('.drop-zone');
        dropZones.forEach(zone => {
            zone.removeEventListener('dragover', handleDragOver); 
            zone.removeEventListener('dragleave', handleDragLeave);
            zone.removeEventListener('drop', handleDrop);

            zone.addEventListener('dragover', handleDragOver);
            zone.addEventListener('dragleave', handleDragLeave);
            zone.addEventListener('drop', handleDrop);

            togglePlaceholder(zone, zone.children.length === 0 || (zone.children.length === 1 && zone.querySelector('.drop-placeholder')));
        });
        togglePlaceholder(availableEmployeesList, false);
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('drag-over-zone');
        togglePlaceholder(e.currentTarget, false);
    }

    function handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over-zone');
        togglePlaceholder(e.currentTarget, e.currentTarget.children.length === 0 || (e.currentTarget.children.length === 1 && e.currentTarget.querySelector('.drop-placeholder')));
    }

    function handleDrop(e) {
        e.preventDefault();
        const currentDropZone = e.currentTarget;
        currentDropZone.classList.remove('drag-over-zone');

        const employeeId = e.dataTransfer.getData('text/plain');
        const employeeItem = document.querySelector(`.employee-item[data-id="${employeeId}"]`);

        if (employeeItem && employeeItem !== currentDropZone) { 
            const originalParentZone = employeeItem.parentNode;

            if (currentDropZone.dataset.taskId) {
                const existingItemInZone = currentDropZone.querySelector('.employee-item');
                if (existingItemInZone) {
                    availableEmployeesList.appendChild(existingItemInZone);
                    togglePlaceholder(availableEmployeesList, false); 
                    existingItemInZone.classList.remove('hidden');
                }
            }

            const currentPlaceholder = currentDropZone.querySelector('.drop-placeholder');
            if (currentPlaceholder) {
                currentPlaceholder.remove();
            }

            currentDropZone.appendChild(employeeItem);
            employeeItem.classList.remove('hidden');

            togglePlaceholder(originalParentZone, originalParentZone.children.length === 0 || (originalParentZone.children.length === 1 && originalParentZone.querySelector('.drop-placeholder')));
            togglePlaceholder(currentDropZone, false);
        } else if (employeeItem) {
            employeeItem.classList.remove('hidden');
        }

        document.querySelectorAll('.drop-zone').forEach(zone => {
            togglePlaceholder(zone, zone.children.length === 0 || (zone.children.length === 1 && zone.querySelector('.drop-placeholder')));
        });
        togglePlaceholder(availableEmployeesList, false);
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
            const response = await fetch('/', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'File upload failed');
            }

            const data = await response.json();
            console.log('Backend Response:', data);

            uploadedFile = file;
            fileInfoParagraph.textContent = `Uploaded: ${data.filename}`;
            uploadStatusParagraph.textContent = 'Upload successful!';
            progressBarFill.style.width = '100%';
            progressBarFill.style.backgroundColor = 'var(--success-green)';
            if (step1NextButton) {
                step1NextButton.disabled = false;
            }

            window.uploadedTasks = data.tasks;
            window.availableEmployees = await fetchEmployees();

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

    if (browseFilesSpan) {
        browseFilesSpan.addEventListener('click', () => {
            fileInput.click();
        });
    }


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

    const dashboardButton = document.querySelector('.dashboard-btn');
    if (dashboardButton) {
        dashboardButton.addEventListener('click', () => {
            alert('Navigating to Dashboard!');
        });
    }

    updateStepUI(currentStep);
    updateFileInputAccept();

    function togglePlaceholder(zoneElement, show, text = 'Drag employee here') {
        let placeholder = zoneElement.querySelector('.drop-placeholder');

        if (zoneElement === availableEmployeesList) {
            if (placeholder) {
                placeholder.remove();
            }
            return;
        }

        if (show) {
            if (zoneElement.children.length === 0 || (zoneElement.children.length === 1 && placeholder)) {
                if (!placeholder) {
                    placeholder = document.createElement('p');
                    placeholder.className = 'drop-placeholder';
                    placeholder.textContent = text;
                    zoneElement.appendChild(placeholder);
                }
            }
        } else {
            if (placeholder && zoneElement.querySelector('.employee-item')) {
                placeholder.remove();
            } else if (placeholder && !show) {
                placeholder.remove();
            }
        }
    }
}); 