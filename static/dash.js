// ... (existing imports) ...

document.addEventListener('DOMContentLoaded', () => {
    const topEmployeesGrid = document.getElementById('top-employees-grid');
    const nearestEventsList = document.querySelector('.nearest-events-section .event-list');
    const autoAssignBtn = document.getElementById('autoAssignBtn');
    const sidebarLinks = document.querySelectorAll('.sidebar .main-nav ul li a');
    const assignedTasksList = document.getElementById('assigned-tasks-list');
    const viewAllWorkloadLink = document.getElementById('view-all-workload-link');
    const viewAllEventsLink = document.querySelector('.nearest-events-section .view-all-link');

    async function fetchAndRenderWorkload() {
        if (!topEmployeesGrid) return;

        try {
            const response = await fetch('/employees');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const employees = await response.json();

            const sortedEmployees = employees.sort((a, b) => b.total_pending_tasks - a.total_pending_tasks);

            topEmployeesGrid.innerHTML = '';
            sortedEmployees.slice(0, 5).forEach(employee => {
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
                `;
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

    async function fetchAndRenderEvents() {
        if (!nearestEventsList) return;

        try {
            const response = await fetch('/api/events');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const events = await response.json();

            nearestEventsList.innerHTML = ''; 

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

    async function fetchAndRenderTasks() {
        if (!assignedTasksList) return;

        try {
            const response = await fetch('/assignments');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const allTasks = await response.json();

            assignedTasksList.innerHTML = '';

            const pendingTasks = allTasks.filter(t => t.status === 'pending');

            pendingTasks.slice(0, 7).forEach(task => {
                const taskItem = document.createElement('div');
                taskItem.classList.add('task-item');

                let priorityClass = 'priority-low';
                if (task.deadline) {
                    const today = new Date();
                    const deadlineDate = new Date(task.deadline);
                    const diffTime = deadlineDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays <= 3) {
                        priorityClass = 'priority-high';
                    } else if (diffDays <= 7) {
                        priorityClass = 'priority-medium';
                    }
                }


                let assigneeAvatar = '';
                let assigneeName = 'Unassigned';

                if (task.assignee_avatar) {
                    assigneeAvatar = task.assignee_avatar;
                    assigneeName = task.assignee_name;
                } else if (task.ai_assignee) {
                    assigneeName = task.ai_assignee + ' (AI)';
                    assigneeAvatar = `https://i.pravatar.cc/150?img=${(task.id % 70) + 20}`;
                } else {
                    assigneeAvatar = `https://i.pravatar.cc/150?img=70`;
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

    fetchAndRenderWorkload();
    fetchAndRenderEvents();
    fetchAndRenderTasks();

    if (autoAssignBtn) {
        autoAssignBtn.addEventListener('click', () => {
            window.location.href = '/auto_assign';
        });
    }

    if (viewAllWorkloadLink) {
        viewAllWorkloadLink.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = '/employees_page';
        });
    }

    if (viewAllEventsLink) {
        viewAllEventsLink.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = '/events';
        });
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            sidebarLinks.forEach(item => item.parentElement.classList.remove('active'));
            this.parentElement.classList.add('active');

            const linkText = this.textContent.trim();
            if (linkText.includes('Dashboard')) {
                window.location.href = '/';
            } else if (linkText.includes('Events')) {
                window.location.href = '/events';
            } else if (linkText.includes('Transcribe')) {
                window.location.href = '/auto_assign';
            } else if (linkText.includes('Employees')) {
                window.location.href = '/employees_page';
            }
            else {
                event.preventDefault();
                console.log(`Clicked on: ${linkText}`);
            }
        });

        const currentPath = window.location.pathname;
        const linkText = link.textContent.trim();

        if (
            (currentPath === '/' && linkText.includes('Dashboard')) ||
            (currentPath === '/auto_assign' && linkText.includes('Transcribe')) ||
            (currentPath === '/employees_page' && linkText.includes('Employees')) ||
            (currentPath === '/events' && linkText.includes('Events'))
        ) {
            link.parentElement.classList.add('active');
        }
    });
});