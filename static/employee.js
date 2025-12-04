document.addEventListener('DOMContentLoaded', () => {
    const employeeGrid = document.getElementById('employee-grid');
    const employeeCountSpan = document.getElementById('employee-count');
    const addEmployeeBtn = document.getElementById('add-employee-btn');
    const addEmployeeModal = document.getElementById('addEmployeeModal');
    const closeButton = document.querySelector('.close-button');
    const addEmployeeForm = document.getElementById('addEmployeeForm');

    // Dummy data for employees
    // Changed to 'total_pending_tasks' and 'total_completed_tasks'
    let employees = [
        { id: 1, name: 'Shawn Stone', role: 'UI/UX Designer', position: 'Designer', email: 'shawn@example.com', avatar: 'https://i.pravatar.cc/150?img=3', total_pending_tasks: 5, total_completed_tasks: 25 },
        { id: 2, name: 'Randy Delgado', role: 'UI/UX Designer', position: 'Designer', email: 'randy@example.com', avatar: 'https://i.pravatar.cc/150?img=4', total_pending_tasks: 10, total_completed_tasks: 30 },
        { id: 3, name: 'Emily Tyler', role: 'Copywriter', position: 'Writer', email: 'emily@example.com', avatar: 'https://i.pravatar.cc/150?img=1', total_pending_tasks: 3, total_completed_tasks: 18 },
        { id: 4, name: 'Louis Castro', role: 'Copywriter', position: 'Writer', email: 'louis@example.com', avatar: 'https://i.pravatar.cc/150?img=5', total_pending_tasks: 7, total_completed_tasks: 22 },
        { id: 5, name: 'Millie Harvey', role: 'Android Developer', position: 'Developer', email: 'millie@example.com', avatar: 'https://i.pravatar.cc/150?img=6', total_pending_tasks: 2, total_completed_tasks: 15 },
        { id: 6, name: 'Ethel Weber', role: 'Copywriter', position: 'Writer', email: 'ethel@example.com', avatar: 'https://i.pravatar.cc/150?img=7', total_pending_tasks: 9, total_completed_tasks: 28 },
        { id: 7, name: 'Charlie Palmer', role: 'Copywriter', position: 'Writer', email: 'charlie@example.com', avatar: 'https://i.pravatar.cc/150?img=8', total_pending_tasks: 4, total_completed_tasks: 20 },
        { id: 8, name: 'Pual Sims', role: 'Project Manager', position: 'Manager', email: 'pual@example.com', avatar: 'https://i.pravatar.cc/150?img=9', total_pending_tasks: 1, total_completed_tasks: 10 },
    ];

    function renderEmployees() {
        employeeGrid.innerHTML = ''; // Clear existing cards
        employees.forEach(employee => {
            const employeeCard = document.createElement('div');
            employeeCard.classList.add('employee-card');

            // Use font-awesome icon if no avatar URL provided or if it fails
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
    }

    // Modal functionality
    addEmployeeBtn.addEventListener('click', () => {
        addEmployeeModal.style.display = 'flex'; // Use flex to center
    });

    closeButton.addEventListener('click', () => {
        addEmployeeModal.style.display = 'none';
        addEmployeeForm.reset(); // Clear the form
    });

    // Close modal if user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target == addEmployeeModal) {
            addEmployeeModal.style.display = 'none';
            addEmployeeForm.reset(); // Clear the form
        }
    });

    // Handle form submission (for dummy data, just add to array)
    addEmployeeForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission

        const newEmployee = {
            id: employees.length + 1, // Simple ID generation
            name: document.getElementById('employeeName').value,
            role: document.getElementById('employeeRole').value,
            position: document.getElementById('employeePosition').value,
            email: document.getElementById('employeeEmail').value,
            avatar: 'https://i.pravatar.cc/150?img=' + (Math.floor(Math.random() * 70) + 10), // Random avatar
            total_pending_tasks: 0, // Initialize new employees with 0 pending
            total_completed_tasks: 0, // Initialize new employees with 0 completed
        };

        employees.push(newEmployee); // Add new employee to our dummy array
        renderEmployees(); // Re-render the grid with the new employee
        addEmployeeModal.style.display = 'none'; // Close modal
        addEmployeeForm.reset(); // Clear the form

        alert('New employee added (frontend only for now)!'); // For demonstration
    });

    renderEmployees(); // Initial render of employees
}); 