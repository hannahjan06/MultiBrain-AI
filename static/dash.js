// (No changes needed from the previous version of dash.js)
document.addEventListener('DOMContentLoaded', () => {
    const topEmployeesGrid = document.getElementById('top-employees-grid');
    const autoAssignBtn = document.getElementById('autoAssignBtn');
    const sidebarLinks = document.querySelectorAll('.sidebar .main-nav ul li a');
    const assignedTasksList = document.getElementById('assigned-tasks-list');

    // Dummy data for top employees (Workload section)
    const employeesData = [
        { name: 'Shawn Stone', position: 'UI/UX Designer', avatar: 'https://i.pravatar.cc/150?img=3', completedAssignments: 16 },
        { name: 'Blake Silva', position: 'iOS Developer', avatar: 'https://i.pravatar.cc/150?img=4', completedAssignments: 20 },
        { name: 'Emily Tyler', position: 'Copywriter', avatar: 'https://i.pravatar.cc/150?img=1', completedAssignments: 18 },
        { name: 'Randy Delgado', position: 'UI/UX Designer', avatar: 'https://i.pravatar.cc/150?img=5', completedAssignments: 22 },
        { name: 'Millie Harvey', position: 'Android Developer', avatar: 'https://i.pravatar.cc/150?img=6', completedAssignments: 15 },
    ];

    // Dummy data for tasks (Tasks section)
    const tasksData = [
        { name: 'Review and approve marketing strategy', date: 'Nov 18, 2023', assigneeAvatar: 'https://i.pravatar.cc/150?img=10', priority: 'high' },
        { name: 'Conduct market research for new product', date: 'Nov 20, 2023', assigneeAvatar: 'https://i.pravatar.cc/150?img=11', priority: 'medium' },
        { name: 'Finalize Q4 budget report', date: 'Nov 22, 2023', assigneeAvatar: 'https://i.pravatar.cc/150?img=12', priority: 'high' },
        { name: 'Prepare presentation for client meeting', date: 'Nov 25, 2023', assigneeAvatar: 'https://i.pravatar.cc/150?img=13', priority: 'low' },
        { name: 'Update website content for holiday promo', date: 'Nov 28, 2023', assigneeAvatar: 'https://i.pravatar.cc/150?img=14', priority: 'medium' },
    ];


    // Function to render Workload (Top Employees)
    function renderWorkload() {
        if (topEmployeesGrid) {
            topEmployeesGrid.innerHTML = ''; // Clear existing cards
            employeesData.forEach(employee => {
                const employeeItem = document.createElement('div');
                employeeItem.classList.add('employee-item');
                employeeItem.innerHTML = `
                    <img src="${employee.avatar}" alt="${employee.name}" class="employee-avatar">
                    <div class="employee-details">
                        <p class="employee-name">${employee.name}</p>
                        <p class="employee-position">${employee.position}</p>
                    </div>
                    <span class="completed-tasks">${employee.completedAssignments} tasks</span>
                `;
                topEmployeesGrid.appendChild(employeeItem);
            });
        }
    }

    // Function to render Tasks
    function renderTasks() {
        if (assignedTasksList) {
            assignedTasksList.innerHTML = ''; // Clear existing tasks
            tasksData.forEach(task => {
                const taskItem = document.createElement('div');
                taskItem.classList.add('task-item');
                taskItem.innerHTML = `
                    <span class="task-priority-indicator priority-${task.priority}"></span>
                    <div class="task-details">
                        <p class="task-name">${task.name}</p>
                        <span class="task-date">${task.date}</span>
                    </div>
                    <img src="${task.assigneeAvatar}" alt="Assignee" class="task-assignee-avatar">
                `;
                assignedTasksList.appendChild(taskItem);
            });
        }
    }


    // Initial render calls
    renderWorkload();
    renderTasks();

    // Add click listener for the Auto assign button
    if (autoAssignBtn) {
        autoAssignBtn.addEventListener('click', () => {
            window.location.href = '/auto_assign'; // Redirect to the /auto_assign route
        });
    }

    // Add click listener for sidebar links
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            // Remove active from all
            sidebarLinks.forEach(item => item.parentElement.classList.remove('active'));
            // Add active to clicked one
            this.parentElement.classList.add('active');

            // Handle navigation
            const linkText = this.textContent.trim();
            if (linkText.includes('Dashboard')) {
                window.location.href = '/';
            } else if (linkText.includes('Transcribe')) {
                window.location.href = '/auto_assign';
            } else if (linkText.includes('Employees')) {
                window.location.href = '/employees_page';
            }
            else {
                // Prevent default for placeholder links, or add more specific routing
                event.preventDefault();
                console.log(`Clicked on: ${linkText}`);
            }
        });

        // Set active class based on current URL path
        const currentPath = window.location.pathname;
        const linkText = link.textContent.trim();

        if (
            (currentPath === '/' && linkText.includes('Dashboard')) ||
            (currentPath === '/auto_assign' && linkText.includes('Transcribe')) ||
            (currentPath === '/employees_page' && linkText.includes('Employees'))
        ) {
            link.parentElement.classList.add('active');
        }
    });
});