document.addEventListener('DOMContentLoaded', () => {
    const topEmployeesGrid = document.getElementById('top-employees-grid');

    const employees = [
        { name: 'Michael Scott', position: 'Regional Manager', completedAssignments: 45 },
        { name: 'Dwight Schrute', position: 'Assistant (to the) Regional Manager', completedAssignments: 42 },
        { name: 'Pam Beesly', position: 'Office Administrator', completedAssignments: 38 },
        { name: 'Jim Halpert', position: 'Sales Representative', completedAssignments: 35 },
    ];

    // Sort employees by completed assignments in descending order (already sorted in this example)
    // employees.sort((a, b) => b.completedAssignments - a.completedAssignments);

    // Take the top 5
    const top5Employees = employees.slice(0, 5);

    top5Employees.forEach(employee => {
        const employeeCard = document.createElement('div');
        employeeCard.classList.add('employee-card');

        employeeCard.innerHTML = `
            <div class="employee-avatar">
                <i class="fas fa-user"></i>
            </div>
            <p class="employee-name">${employee.name}</p>
            <p class="employee-position">${employee.position}</p>
            <div class="employee-stats">
                Completed on time: <span>${employee.completedAssignments}</span>
            </div>
        `;
        topEmployeesGrid.appendChild(employeeCard);
    });

    // Optional: Add active class to sidebar link based on current page (for a multi-page setup)
    const sidebarLinks = document.querySelectorAll('.sidebar .main-nav ul li a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            // Remove active from all
            sidebarLinks.forEach(item => item.parentElement.classList.remove('active'));
            // Add active to clicked one
            this.parentElement.classList.add('active');
            // Prevent default link behavior for demonstration
            event.preventDefault();
        });
    });
});