// ... (existing imports) ...

document.addEventListener('DOMContentLoaded', () => {
    const topEmployeesGrid = document.getElementById('top-employees-grid');
    const nearestEventsList = document.querySelector('.nearest-events-section .event-list'); // Get the event list container
    const autoAssignBtn = document.getElementById('autoAssignBtn');
    const sidebarLinks = document.querySelectorAll('.sidebar .main-nav ul li a');
    const assignedTasksList = document.getElementById('assigned-tasks-list');
    const viewAllWorkloadLink = document.getElementById('view-all-workload-link');
    const viewAllEventsLink = document.querySelector('.nearest-events-section .view-all-link'); // Get the 'View All' link for events

    // Function to fetch and render Workload (Top Employees) from backend
    async function fetchAndRenderWorkload() {
        if (!topEmployeesGrid) return;

        try {
            const response = await fetch('/employees'); // Fetch from your backend /employees endpoint
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const employees = await response.json();

            // Sort employees by total_pending_tasks (highest first) for workload
            const sortedEmployees = employees.sort((a, b) => b.total_pending_tasks - a.total_pending_tasks);

            topEmployeesGrid.innerHTML = ''; // Clear existing cards
            sortedEmployees.slice(0, 5).forEach(employee => { // Display top 5 employees
                const employeeItem = document.createElement('div');
                employeeItem.classList.add('employee-item');

                const avatarUrl = employee.avatar || `https://i.pravatar.cc/150?img=${(employee.id % 70) + 1}`;

                employeeItem.innerHTML = `
                    <img src="${avatarUrl}" alt="${employee.name}" class="employee-avatar">
                    <div class="employee-details">
                        <p class="employee-name">${employee.name}</p>
                        <p class="employee-position">${employee.position}</p>
                    </div>
                    <span class="completed-tasks">${employee.total_pending_tasks || 0} pending</span>
                `; // Changed to 'pending'
                topEmployeesGrid.appendChild(employeeItem);
            });

            if (sortedEmployees.length === 0) {
                topEmployeesGrid.innerHTML = '<p class="no-data">No employee workload data available.</p>';
            }

        } catch (error) {
            console.error('Error fetching employees for workload:', error);
            topEmployeesGrid.innerHTML = '<p class="error-message">Failed to load employee workload data.</p>';
        }
    }

    // NEW: Function to fetch and render Nearest Events from backend
    async function fetchAndRenderEvents() {
        if (!nearestEventsList) return;

        try {
            const response = await fetch('/api/events'); // Fetch from your backend /api/events endpoint
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const events = await response.json();

            nearestEventsList.innerHTML = ''; // Clear existing events

            // Limit to a few nearest events, e.g., the first 3 or 4
            events.slice(0, 4).forEach(event => {
                const eventItem = document.createElement('div');
                eventItem.classList.add('event-item');

                let tagClass = '';
                if (event.category === 'work') {
                    tagClass = 'orange';
                } else if (event.category === 'social') {
                    tagClass = 'blue';
                } else if (event.category === 'meeting') {
                    tagClass = 'green';
                }
                // You can add more categories and colors here

                eventItem.innerHTML = `
                    <div class="event-details">
                        <p class="event-title">${event.title}</p>
                        <span class="event-time">${event.date} | ${event.time}</span>
                    </div>
                    <span class="event-tag ${tagClass}">${event.category}</span>
                `;
                nearestEventsList.appendChild(eventItem);
            });

            if (events.length === 0) {
                nearestEventsList.innerHTML = '<p class="no-data">No upcoming events.</p>';
            }

        } catch (error) {
            console.error('Error fetching events:', error);
            nearestEventsList.innerHTML = '<p class="error-message">Failed to load events data.</p>';
        }
    }

    // New: Function to fetch and render Tasks from backend
    // ... (This function remains largely the same, but ensure it fetches *pending* tasks for the dashboard) ...
    async function fetchAndRenderTasks() {
        if (!assignedTasksList) return;

        try {
            const response = await fetch('/assignments'); // Fetch from your backend /assignments endpoint
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const allTasks = await response.json();

            assignedTasksList.innerHTML = ''; // Clear existing tasks

            const pendingTasks = allTasks.filter(t => t.status === 'pending');

            // Display a limited number of pending tasks, e.g., the first 7
            pendingTasks.slice(0, 7).forEach(task => {
                const taskItem = document.createElement('div');
                taskItem.classList.add('task-item');

                let priorityClass = 'priority-low';
                // Example: If a task has a deadline within the next 7 days, consider it medium priority.
                // This would require parsing the deadline into a Date object for accurate comparison.
                // For simplicity, let's just use a basic logic or assume backend provides a priority.
                if (task.deadline) {
                    const today = new Date();
                    const deadlineDate = new Date(task.deadline); // Assuming deadline is in YYYY-MM-DD format
                    const diffTime = deadlineDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays <= 3) { // Deadline in 3 days or less
                        priorityClass = 'priority-high';
                    } else if (diffDays <= 7) { // Deadline in 7 days or less
                        priorityClass = 'priority-medium';
                    }
                }


                let assigneeAvatar = '';
                let assigneeName = 'Unassigned';

                if (task.assignee_avatar) { // Use avatar provided by the backend /assignments endpoint
                    assigneeAvatar = task.assignee_avatar;
                    assigneeName = task.assignee_name;
                } else if (task.ai_assignee) {
                    assigneeName = task.ai_assignee + ' (AI)';
                    assigneeAvatar = `https://i.pravatar.cc/150?img=${(task.id % 70) + 20}`; // Fallback random for AI
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

            if (pendingTasks.length === 0) {
                 assignedTasksList.innerHTML = '<p class="no-tasks">No pending tasks found.</p>';
            }

        } catch (error) {
            console.error('Error fetching tasks for dashboard:', error);
            assignedTasksList.innerHTML = '<p class="error-message">Failed to load tasks data.</p>';
        }
    }


    // Initial render calls
    fetchAndRenderWorkload(); // Call the async function to load real employee data
    fetchAndRenderEvents();  // NEW: Call to load real event data
    fetchAndRenderTasks(); // Call the async function to load real task data

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

    // NEW: Add click listener for "View All" events link
    if (viewAllEventsLink) {
        viewAllEventsLink.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = '/events'; // Redirect to the /events page
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
                window.location.href = '/events'; // Redirect to the new events page (Python route)
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
            (currentPath === '/events' && linkText.includes('Events')) // Updated for '/events' route
        ) {
            link.parentElement.classList.add('active');
        }
    });
});