document.addEventListener('DOMContentLoaded', () => {
    const tasksGrid = document.getElementById('tasks-grid');
    const taskCountSpan = document.getElementById('task-count');
    const autoAssignBtn = document.getElementById('autoAssignBtn');
    const addNewTaskBtn = document.getElementById('addNewTaskBtn');
    const addNewTaskModal = document.getElementById('addNewTaskModal');
    const closeNewTaskModalButton = addNewTaskModal.querySelector('.close-button');
    const addNewTaskForm = document.getElementById('addNewTaskForm');
    const taskAssigneeSelect = document.getElementById('taskAssignee');
    const statusFilter = document.getElementById('status-filter');
    const employeeFilter = document.getElementById('employee-filter');
    const deadlineFilter = document.getElementById('deadline-filter');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const noTasksMessage = tasksGrid.querySelector('.no-tasks-message');


    let allTasks = []; // To store all fetched tasks
    let allEmployees = []; // To store all fetched employees

    // --- Fetch Data Functions ---
    async function fetchTasks() {
        try {
            const response = await fetch('/tasks'); // New endpoint for fetching all tasks
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allTasks = await response.json();
            console.log('Fetched tasks:', allTasks);
            renderTasks();
            updateTaskCount();
        } catch (error) {
            console.error('Error fetching tasks:', error);
            tasksGrid.innerHTML = '<p class="error-message"><i class="fas fa-exclamation-circle"></i> Failed to load tasks. Please try again later.</p>';
            updateTaskCount();
        }
    }

    async function fetchEmployees() {
        try {
            const response = await fetch('/employees');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allEmployees = await response.json();
            populateEmployeeFilters();
            populateAssigneeDropdown(taskAssigneeSelect);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    }

    // --- Rendering and Filtering Functions ---
    function populateEmployeeFilters() {
        employeeFilter.innerHTML = '<option value="all">All Employees</option>';
        allEmployees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = employee.name;
            employeeFilter.appendChild(option);
        });
    }

    function populateAssigneeDropdown(selectElement) {
        selectElement.innerHTML = '<option value="">Unassigned</option>';
        allEmployees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = employee.name;
            selectElement.appendChild(option);
        });
    }

    function renderTasks() {
        tasksGrid.innerHTML = ''; // Clear existing tasks
        let filteredTasks = [...allTasks]; // Start with all tasks

        // Apply filters
        const selectedStatus = statusFilter.value;
        const selectedEmployee = employeeFilter.value;
        const selectedDeadline = deadlineFilter.value;

        if (selectedStatus !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.status === selectedStatus);
        }

        if (selectedEmployee !== 'all' && selectedEmployee !== '') {
            filteredTasks = filteredTasks.filter(task => 
                task.assigned_employee_id == selectedEmployee
            );
        }

        if (selectedDeadline) {
            filteredTasks = filteredTasks.filter(task => 
                task.deadline && task.deadline.startsWith(selectedDeadline)
            );
        }


        if (filteredTasks.length === 0) {
            noTasksMessage.style.display = 'block';
            tasksGrid.appendChild(noTasksMessage); // Re-append it if cleared
            taskCountSpan.textContent = 0;
            return;
        } else {
            noTasksMessage.style.display = 'none';
        }

        filteredTasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.classList.add('task-card');
            taskCard.dataset.taskId = task.id;

            let assigneeInfoHtml = '';
            let assigneeName = 'Unassigned';
            let assigneeAvatar = '';

            if (task.assigned_employee_id) {
                const employee = allEmployees.find(emp => emp.id === task.assigned_employee_id);
                if (employee) {
                    assigneeName = employee.name;
                    // Using a dummy avatar service; replace with actual paths if you have them
                    assigneeAvatar = `https://i.pravatar.cc/150?img=${(employee.id % 70) + 1}`;
                }
            } else if (task.ai_assignee) {
                assigneeName = task.ai_assignee;
                assigneeAvatar = `https://i.pravatar.cc/150?img=${(task.id % 70) + 20}`; // Different image for AI
                assigneeInfoHtml += `<span class="ai-suggestion">(AI Suggestion)</span>`;
            }

            if (assigneeName !== 'Unassigned') {
                assigneeInfoHtml = `
                    <img src="${assigneeAvatar}" alt="${assigneeName}" class="assignee-avatar">
                    <span class="assignee-name">${assigneeName}</span>
                    ${assigneeInfoHtml}
                `;
            } else {
                assigneeInfoHtml = `<i class="fas fa-user-times"></i> <span>${assigneeName}</span>`;
            }

            const deadlineIcon = task.deadline ? '<i class="far fa-calendar-alt"></i>' : '';
            const deadlineText = task.deadline ? `Due: ${task.deadline}` : 'No deadline';
            const meetingIcon = task.meeting_file_name ? '<i class="fas fa-handshake"></i>' : '';
            const meetingText = task.meeting_file_name ? `From: ${task.meeting_file_name.split('.')[0]}` : '';

            taskCard.innerHTML = `
                <div class="task-header">
                    <div class="task-description">${task.description}</div>
                    <div class="status-dropdown-container">
                        <button class="status-dropdown-button ${task.status}">
                            ${task.status} <i class="fas fa-caret-down"></i>
                        </button>
                        <div class="status-dropdown-content">
                            <a href="#" data-status="pending">Pending</a>
                            <a href="#" data-status="complete">Complete</a>
                        </div>
                    </div>
                </div>
                <div class="task-meta">
                    <div>${deadlineIcon} ${deadlineText}</div>
                    <div>${meetingIcon} ${meetingText}</div>
                    <div class="task-assignee-info">${assigneeInfoHtml}</div>
                </div>
            `;
            tasksGrid.appendChild(taskCard);
        });
        updateTaskCount(filteredTasks.length);
        attachStatusDropdownListeners();
    }

    function updateTaskCount(count = allTasks.length) {
        taskCountSpan.textContent = count;
    }

    // --- Event Listeners ---
    autoAssignBtn.addEventListener('click', () => {
        window.location.href = '/auto_assign'; // Redirect to the transcribe page
    });

    addNewTaskBtn.addEventListener('click', () => {
        addNewTaskModal.style.display = 'flex';
        // Reset form fields
        addNewTaskForm.reset();
        taskAssigneeSelect.value = ''; // Ensure unassigned is selected
    });

    closeNewTaskModalButton.addEventListener('click', () => {
        addNewTaskModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == addNewTaskModal) {
            addNewTaskModal.style.display = 'none';
        }
    });

    addNewTaskForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const description = document.getElementById('taskDescription').value;
        const deadline = document.getElementById('taskDeadline').value;
        const assignedEmployeeId = document.getElementById('taskAssignee').value;

        const newTaskData = {
            description: description,
            deadline: deadline || null,
            assigned_employee_id: assignedEmployeeId || null
        };

        try {
            const response = await fetch('/tasks', { // New endpoint for adding tasks
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newTaskData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const addedTask = await response.json();
            console.log('New task added:', addedTask);

            addNewTaskModal.style.display = 'none';
            addNewTaskForm.reset();
            await fetchTasks(); // Re-fetch all tasks to update the list

            alert('Task added successfully!');
        } catch (error) {
            console.error('Error adding new task:', error);
            alert(`Failed to add task: ${error.message}`);
        }
    });

    function attachStatusDropdownListeners() {
        document.querySelectorAll('.status-dropdown-button').forEach(button => {
            button.removeEventListener('click', toggleStatusDropdown); // Prevent multiple listeners
            button.addEventListener('click', toggleStatusDropdown);
        });

        document.querySelectorAll('.status-dropdown-content a').forEach(link => {
            link.removeEventListener('click', handleStatusChange); // Prevent multiple listeners
            link.addEventListener('click', handleStatusChange);
        });
    }

    function toggleStatusDropdown(event) {
        event.stopPropagation(); // Prevent card click if there was one
        // Close all other open dropdowns
        document.querySelectorAll('.status-dropdown-content').forEach(content => {
            if (content.parentNode.querySelector('.status-dropdown-button') !== event.currentTarget) {
                content.style.display = 'none';
            }
        });

        const dropdownContent = event.currentTarget.nextElementSibling;
        dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
    }

    async function handleStatusChange(event) {
        event.preventDefault();
        event.stopPropagation(); // Prevent parent elements from getting the click

        const newStatus = event.target.dataset.status;
        const taskCard = event.target.closest('.task-card');
        const taskId = taskCard.dataset.taskId;

        if (!taskId || !newStatus) {
            console.error('Missing task ID or new status for update');
            return;
        }

        try {
            const response = await fetch(`/tasks/${taskId}/status`, { // New endpoint for updating status
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const updatedTask = await response.json();
            console.log('Task status updated:', updatedTask);

            // Update UI
            const statusButton = taskCard.querySelector('.status-dropdown-button');
            statusButton.textContent = `${updatedTask.status} `;
            statusButton.classList.remove('pending', 'complete'); // Remove old status classes
            statusButton.classList.add(updatedTask.status); // Add new status class
            
            const caretIcon = document.createElement('i');
            caretIcon.classList.add('fas', 'fa-caret-down');
            statusButton.appendChild(caretIcon);

            taskCard.querySelector('.status-dropdown-content').style.display = 'none'; // Close dropdown

            // Update the task in allTasks array and re-render to apply filters correctly
            const taskIndex = allTasks.findIndex(t => t.id == taskId);
            if (taskIndex !== -1) {
                allTasks[taskIndex].status = updatedTask.status;
            }
            renderTasks();

        } catch (error) {
            console.error('Error updating task status:', error);
            alert(`Failed to update task status: ${error.message}`);
        }
    }

    // Close dropdowns if user clicks anywhere else
    window.addEventListener('click', () => {
        document.querySelectorAll('.status-dropdown-content').forEach(content => {
            content.style.display = 'none';
        });
    });

    // Filter event listeners
    statusFilter.addEventListener('change', renderTasks);
    employeeFilter.addEventListener('change', renderTasks);
    deadlineFilter.addEventListener('change', renderTasks);
    
    clearFiltersBtn.addEventListener('click', () => {
        statusFilter.value = 'all';
        employeeFilter.value = 'all';
        deadlineFilter.value = '';
        renderTasks();
    });


    // --- Initialization ---
    async function initializeTasksPage() {
        await fetchEmployees(); // Fetch employees first to populate dropdowns
        await fetchTasks(); // Then fetch tasks
    }

    initializeTasksPage();
});