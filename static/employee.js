document.addEventListener('DOMContentLoaded', () => {
    const employeeGrid = document.getElementById('employee-grid');
    const employeeCountSpan = document.getElementById('employee-count');
    const addEmployeeBtn = document.getElementById('add-employee-btn');
    const addEmployeeModal = document.getElementById('addEmployeeModal');
    const closeButton = document.querySelector('.close-button');
    const addEmployeeForm = document.getElementById('addEmployeeForm');

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

            // Use a default avatar if none is provided or if you want consistent styling
            // For now, we'll assume the backend provides a valid avatar URL or we use a Font Awesome icon.
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

            const addedEmployee = await response.json(); // Backend should return the newly added employee
            console.log('New employee added:', addedEmployee);

            // Re-fetch all employees to ensure the UI is up-to-date with the new data
            await fetchEmployees(); 

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