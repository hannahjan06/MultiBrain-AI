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


    let allTasks = [];
    let allEmployees = [];

    async function fetchTasks() {
        try {
            const response = await fetch('/tasks');
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
        tasksGrid.innerHTML = '';
        let filteredTasks = [...allTasks];

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
            tasksGrid.appendChild(noTasksMessage);
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
                    assigneeAvatar = `https://i.pravatar.cc/150?img=${(employee.id % 70) + 1}`;
                }
            } else if (task.ai_assignee) {
                assigneeName = task.ai_assignee;
                assigneeAvatar = `https://i.pravatar.cc/150?img=${(task.id % 70) + 20}`;
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
                    <button class="status-button ${task.status}" data-task-id="${task.id}">
                        ${task.status}
                    </button>
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
        attachStatusButtonListeners();
    }

    function updateTaskCount(count = allTasks.length) {
        taskCountSpan.textContent = count;
    }

    autoAssignBtn.addEventListener('click', () => {
        window.location.href = '/auto_assign';
    });

    addNewTaskBtn.addEventListener('click', () => {
        addNewTaskModal.style.display = 'flex';
        addNewTaskForm.reset();
        taskAssigneeSelect.value = '';
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
            assigned_employee_id: assignedEmployeeId || null,
            status: 'pending'
        };

        try {
            const response = await fetch('/tasks', {
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
            await fetchTasks();

            alert('Task added successfully!');
        } catch (error) {
            console.error('Error adding new task:', error);
            alert(`Failed to add task: ${error.message}`);
        }
    });

    function attachStatusButtonListeners() {
        document.querySelectorAll('.status-button').forEach(button => {
            button.removeEventListener('click', handleStatusToggle);
            button.addEventListener('click', handleStatusToggle);
        });
    }

    async function handleStatusToggle(event) {
        const button = event.currentTarget;
        const taskId = button.dataset.taskId;
        const currentStatus = button.classList.contains('pending') ? 'pending' : 'complete';
        const newStatus = currentStatus === 'pending' ? 'complete' : 'pending';

        if (!taskId) {
            console.error('Missing task ID for status update');
            return;
        }

        try {
            const response = await fetch(`/tasks/${taskId}/status`, { 
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

            button.textContent = updatedTask.status;
            button.classList.remove('pending', 'complete');
            button.classList.add(updatedTask.status);

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

    statusFilter.addEventListener('change', renderTasks);
    employeeFilter.addEventListener('change', renderTasks);
    deadlineFilter.addEventListener('change', renderTasks);
    
    clearFiltersBtn.addEventListener('click', () => {
        statusFilter.value = 'all';
        employeeFilter.value = 'all';
        deadlineFilter.value = '';
        renderTasks();
    });

    async function initializeTasksPage() {
        await fetchEmployees();
        await fetchTasks();
    }

    initializeTasksPage();
});