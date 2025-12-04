document.addEventListener('DOMContentLoaded', () => {
    const topEmployeesGrid = document.getElementById('top-employees-grid');
    const autoAssignBtn = document.querySelector('.auto-assign-btn'); // Get the Auto assign button
    const sidebarLinks = document.querySelectorAll('.sidebar .main-nav ul li a'); // All sidebar links

    const employees = [
        { name: 'Michael Scott', position: 'Regional Manager', completedAssignments: 45 },
        { name: 'Dwight Schrute', position: 'Assistant (to the) Regional Manager', completedAssignments: 42 },
        { name: 'Pam Beesly', position: 'Office Administrator', completedAssignments: 38 },
        { name: 'Jim Halpert', position: 'Sales Representative', completedAssignments: 35 },
    ];

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

    // Add click listener for the Auto Assign button
    autoAssignBtn.addEventListener('click', () => {
        window.location.href = '/auto_assign'; // Redirect to the /auto_assign route
    });

    // Add click listener for sidebar links
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            // Remove active from all
            sidebarLinks.forEach(item => item.parentElement.classList.remove('active'));
            // Add active to clicked one
            this.parentElement.classList.add('active');

            // Prevent default link behavior for demonstration IF not a specific navigation link
            // For Dashboard and Transcribe, we want to navigate
            if (this.textContent.includes('Dashboard')) {
                window.location.href = '/'; // Go to the dashboard
            } else if (this.textContent.includes('Transcribe')) {
                window.location.href = '/auto_assign'; // Go to the auto_assign page (which handles transcription)
            } else {
                // For other links, prevent default behavior if they are just placeholders
                event.preventDefault();
                console.log(`Clicked on: ${this.textContent.trim()}`);
                // You might want to add more specific routing here for other sidebar items
            }
        });
    });
});