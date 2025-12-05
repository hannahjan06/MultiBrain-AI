document.addEventListener('DOMContentLoaded', () => {
    const employeeGrid = document.getElementById('employee-grid');
    const employeeCountSpan = document.getElementById('employee-count');
    const addEmployeeBtn = document.getElementById('add-employee-btn');
    const addEmployeeModal = document.getElementById('addEmployeeModal');
    const closeAddModalButton = addEmployeeModal.querySelector('.close-button'); // Specific close button for Add Employee
    const addEmployeeForm = document.getElementById('addEmployeeForm');

    // NEW: Employee Details Modal Elements
    const employeeDetailsModal = document.getElementById('employeeDetailsModal');
    const closeDetailsModalButton = employeeDetailsModal.querySelector('.close-button'); // Specific close button for Details
    const detailsAvatar = document.getElementById('details-avatar');
    const detailsName = document.getElementById('details-name');
    const detailsRole = document.getElementById('details-role');
    const detailsPosition = document.getElementById('details-position');
    const detailsEmail = document.getElementById('details-email');
    const totalPendingTasksSpan = document.getElementById('details-total-pending');
    const totalCompletedTasksSpan = document.getElementById('details-total-completed');
    const employeeTasksList = document.getElementById('employee-tasks-list');


    let employees = []; // Initialize as empty, data will come from the backend

    async function fetchEmployees() {
        try {
            const response = await fetch('/employees');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            employees = await response.json();
            renderEmployees();
        } catch (error) {
            console.error('Error fetching employees:', error);
            // Optionally, display an error message to the user
        }
    }

    function renderEmployees() {
        employeeGrid.innerHTML = ''; // Clear existing cards
        employees.forEach(employee => {
            const employeeCard = document.createElement('div');
            employeeCard.classList.add('employee-card');
            employeeCard.dataset.employeeId = employee.id; // Store employee ID

            const avatarContent = employee.avatar ? `<img src="${employee.avatar}" alt="${employee.name}" class="avatar">` : `<i class="fas fa-user-circle avatar"></i>`;

            employeeCard.innerHTML = `
                ${avatarContent}
                <p class="name">${employee.name}</p>
                <p class="role">${employee.role}</p>
                <div class="tags">
                    <span class="tag">${employee.position}</span>
                </div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value">${employee.total_pending_tasks}</div>
                        <div class="stat-label">Pending</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${employee.total_completed_tasks}</div>
                        <div class="stat-label">Completed</div>
                    </div>
                </div>
            `;
            employeeGrid.appendChild(employeeCard);
        });
        employeeCountSpan.textContent = employees.length; // Update the count

        // Attach event listeners to newly rendered employee cards
        attachEmployeeCardClickListeners();
    }

    // NEW: Function to attach click listeners to employee cards
    function attachEmployeeCardClickListeners() {
        document.querySelectorAll('.employee-card').forEach(card => {
            card.addEventListener('click', async (event) => {
                const employeeId = event.currentTarget.dataset.employeeId;
                if (employeeId) {
                    await showEmployeeDetails(employeeId);
                }
            });
        });
    }

    // NEW: Function to show employee details modal
    async function showEmployeeDetails(employeeId) {
        const employee = employees.find(emp => emp.id == employeeId);
        if (!employee) {
            console.error('Employee not found for ID:', employeeId);
            return;
        }

        // Populate basic employee info
        detailsAvatar.innerHTML = employee.avatar ? `<img src="${employee.avatar}" alt="${employee.name}" class="avatar-large">` : `<i class="fas fa-user-circle avatar-large"></i>`;
        detailsName.textContent = employee.name;
        detailsRole.textContent = employee.role;
        detailsPosition.textContent = employee.position;
        detailsEmail.textContent = employee.email;

        // Populate task stats
        totalPendingTasksSpan.textContent = employee.total_pending_tasks;
        totalCompletedTasksSpan.textContent = employee.total_completed_tasks;

        // Fetch and populate tasks
        employeeTasksList.innerHTML = '<li class="no-tasks"><i class="fas fa-spinner fa-spin"></i> Loading tasks...</li>'; // Loading state
        try {
            const response = await fetch(`/employees/${employeeId}/tasks`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const tasks = await response.json();
            renderEmployeeTasks(tasks);
        } catch (error) {
            console.error('Error fetching employee tasks:', error);
            employeeTasksList.innerHTML = '<li class="no-tasks"><i class="fas fa-exclamation-circle"></i> Failed to load tasks.</li>';
        }

        employeeDetailsModal.style.display = 'flex'; // Show the modal
    }

    // NEW: Function to render tasks in the details modal
    function renderEmployeeTasks(tasks) {
        employeeTasksList.innerHTML = ''; // Clear previous tasks

        if (tasks.length === 0) {
            employeeTasksList.innerHTML = '<li class="no-tasks"><i class="fas fa-clipboard-list"></i> No tasks assigned yet.</li>';
            return;
        }

        tasks.forEach(task => {
            const taskItem = document.createElement('li');
            const statusClass = task.status === 'pending' ? 'pending' : 'complete';
            const deadlineIcon = task.deadline ? '<i class="far fa-calendar-alt"></i>' : '';
            const deadlineText = task.deadline ? `Due: ${task.deadline}` : 'No deadline';
            const meetingIcon = task.meeting_file_name ? '<i class="fas fa-handshake"></i>' : '';
            const meetingText = task.meeting_file_name ? `From: ${task.meeting_file_name.split('.')[0]}` : ''; // Show name without extension

            taskItem.innerHTML = `
                <div class="task-description">${task.description}</div>
                <div class="task-meta">
                    <span>${deadlineIcon} ${deadlineText}</span>
                    <span>${meetingIcon} ${meetingText}</span>
                </div>
                <span class="task-status-badge ${statusClass}">${task.status}</span>
            `;
            employeeTasksList.appendChild(taskItem);
        });
    }


    // Modal functionality for ADD EMPLOYEE modal
    addEmployeeBtn.addEventListener('click', () => {
        addEmployeeModal.style.display = 'flex'; // Use flex to center
    });

    closeAddModalButton.addEventListener('click', () => {
        addEmployeeModal.style.display = 'none';
        addEmployeeForm.reset(); // Clear the form
    });

    // Close ADD EMPLOYEE modal if user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target == addEmployeeModal) {
            addEmployeeModal.style.display = 'none';
            addEmployeeForm.reset(); // Clear the form
        }
    });

    // NEW: Close EMPLOYEE DETAILS modal
    closeDetailsModalButton.addEventListener('click', () => {
        employeeDetailsModal.style.display = 'none';
    });

    // NEW: Close EMPLOYEE DETAILS modal if user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target == employeeDetailsModal) {
            employeeDetailsModal.style.display = 'none';
        }
    });


    // Handle form submission to add a new employee
    addEmployeeForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const newEmployeeData = {
            name: document.getElementById('employeeName').value,
            role: document.getElementById('employeeRole').value,
            position: document.getElementById('employeePosition').value,
            email: document.getElementById('employeeEmail').value,
            // Avatar will be handled by the backend or set to a default
            // total_pending_tasks and total_completed_tasks will be initialized by the backend
        };

        try {
            const response = await fetch('/employees', { // POST request to /employees
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newEmployeeData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const addedEmployee = await response.json();
            console.log('New employee added:', addedEmployee);

            await fetchEmployees(); // Re-fetch all employees to ensure the UI is up-to-date with the new data

            addEmployeeModal.style.display = 'none'; // Close modal
            addEmployeeForm.reset(); // Clear the form

            alert('New employee added successfully!');
        } catch (error) {
            console.error('Error adding new employee:', error);
            alert(`Failed to add employee: ${error.message}`);
        }
    });

    // Initial fetch and render of employees when the page loads
    fetchEmployees();
});