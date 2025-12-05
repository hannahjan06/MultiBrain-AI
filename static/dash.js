document.addEventListener('DOMContentLoaded', () => {
    const topEmployeesGrid = document.getElementById('top-employees-grid');
    const autoAssignBtn = document.getElementById('autoAssignBtn');
    const sidebarLinks = document.querySelectorAll('.sidebar .main-nav ul li a');
    const assignedTasksList = document.getElementById('assigned-tasks-list');
    const viewAllWorkloadLink = document.getElementById('view-all-workload-link');

    // Dummy data for tasks removed, now fetched from backend.

    // Function to fetch and render Workload (Top Employees) from backend
    async function fetchAndRenderWorkload() {
        if (!topEmployeesGrid) return; // Exit if grid element not found

        try {
            const response = await fetch('/employees'); // Fetch from your backend /employees endpoint
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const employees = await response.json();

            // Sort employees by completed tasks in descending order
            const sortedEmployees = employees.sort((a, b) => b.total_completed_tasks - a.total_completed_tasks);

            topEmployeesGrid.innerHTML = ''; // Clear existing cards
            sortedEmployees.slice(0, 5).forEach(employee => { // Display top 5 employees
                const employeeItem = document.createElement('div');
                employeeItem.classList.add('employee-item');

                // Use a random avatar for now if backend doesn't provide one
                const avatarUrl = employee.avatar || `https://i.pravatar.cc/150?img=${(employee.id % 70) + 1}`; // Simple random based on ID

                employeeItem.innerHTML = `
                    <img src="${avatarUrl}" alt="${employee.name}" class="employee-avatar">
                    <div class="employee-details">
                        <p class="employee-name">${employee.name}</p>
                        <p class="employee-position">${employee.position}</p>
                    </div>
                    <span class="completed-tasks">${employee.total_completed_tasks || 0} tasks</span>
                `;
                topEmployeesGrid.appendChild(employeeItem);
            });
        } catch (error) {
            console.error('Error fetching employees for workload:', error);
            // Optionally, display an error message to the user on the dashboard
            topEmployeesGrid.innerHTML = '<p class="error-message">Failed to load employee workload data.</p>';
        }
    }

    // New: Function to fetch and render Tasks from backend
    async function fetchAndRenderTasks() {
        if (!assignedTasksList) return; // Exit if list element not found

        try {
            const response = await fetch('/assignments'); // Fetch from your backend /assignments endpoint
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const tasks = await response.json();

            assignedTasksList.innerHTML = ''; // Clear existing tasks

            // Display a limited number of tasks, e.g., the first 5 or 10
            tasks.slice(0, 7).forEach(task => { // Limiting to 7 tasks for brevity on dashboard
                const taskItem = document.createElement('div');
                taskItem.classList.add('task-item');

                // Determine priority class (you'll need to define how priority is determined or if it comes from backend)
                // For demonstration, let's assume if deadline is present, it's medium, else low.
                // You might need to adjust this based on how your backend stores 'priority' or 'status'.
                let priorityClass = 'priority-low'; // Default low
                if (task.status === 'pending' && task.deadline) {
                    // Simple logic: if pending and has deadline, consider it medium
                    priorityClass = 'priority-medium';
                    // You could add more complex logic, e.g., check if deadline is soon for 'high'
                } else if (task.status === 'pending') {
                    // Still pending, but no deadline, might be low
                    priorityClass = 'priority-low';
                } else if (task.status === 'complete') {
                    // Completed tasks usually don't need a priority indicator on a pending list
                    return; // Skip rendering completed tasks in this dashboard section
                }


                // Fetch employee data to get avatar if task has an assigned_employee_id
                let assigneeAvatar = '';
                let assigneeName = 'Unassigned';

                if (task.assigned_employee_id) {
                    // This would ideally be optimized on the backend to avoid N+1 queries.
                    // For now, we'll simulate a simple random avatar for assigned tasks
                    // Or, if your /employees endpoint also included avatars, we could match.
                    // For a more robust solution, the /assignments endpoint should include assignee details.
                    assigneeAvatar = `https://i.pravatar.cc/150?img=${(task.assigned_employee_id % 70) + 1}`; // Simple random based on assignee ID
                    // If you want real names, you'd need to fetch employees separately and map,
                    // or have the backend /assignments endpoint include assignee name/avatar.
                } else if (task.ai_assignee) {
                    assigneeName = task.ai_assignee + ' (AI)';
                    assigneeAvatar = `https://i.pravatar.cc/150?img=${(task.id % 70) + 20}`; // Another random for AI
                } else {
                    assigneeAvatar = `https://i.pravatar.cc/150?img=70`; // Generic for truly unassigned
                }

                taskItem.innerHTML = `
                    <span class="task-priority-indicator ${priorityClass}"></span>
                    <div class="task-details">
                        <p class="task-name">${task.description}</p>
                        <span class="task-date">${task.deadline || 'No deadline'}</span>
                    </div>
                    <img src="${assigneeAvatar}" alt="${assigneeName}" class="task-assignee-avatar">
                `;
                assignedTasksList.appendChild(taskItem);
            });

            // If no tasks are found or none are pending
            if (tasks.filter(t => t.status === 'pending').length === 0) {
                 assignedTasksList.innerHTML = '<p class="no-tasks">No pending tasks found.</p>';
            }

        } catch (error) {
            console.error('Error fetching tasks for dashboard:', error);
            assignedTasksList.innerHTML = '<p class="error-message">Failed to load tasks data.</p>';
        }
    }


    // Initial render calls
    fetchAndRenderWorkload(); // Call the async function to load real employee data
    fetchAndRenderTasks(); // New: Call the async function to load real task data

    // Add click listener for the Auto assign button
    if (autoAssignBtn) {
        autoAssignBtn.addEventListener('click', () => {
            window.location.href = '/auto_assign'; // Redirect to the /auto_assign route
        });
    }

    // Now correctly targeting the "View All" link by its ID
    if (viewAllWorkloadLink) {
        viewAllWorkloadLink.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior (#)
            window.location.href = '/employees_page'; // Redirect to the /employees_page
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
            } else if (linkText.includes('Events')) { // Add this condition for the new Events link
                window.location.href = 'events.html'; // Redirect to the new events page
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
            (currentPath === '/employees_page' && linkText.includes('Employees')) ||
            (currentPath.includes('events.html') && linkText.includes('Events')) // Add this for events.html
        ) {
            link.parentElement.classList.add('active');
        }
    });
});