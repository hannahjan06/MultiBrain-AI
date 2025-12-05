document.addEventListener('DOMContentLoaded', () => {
    const nearestEventsList = document.getElementById('nearest-events-list');
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthYearSpan = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const eventDetailPopup = document.getElementById('event-detail-popup');
    const closePopupBtn = document.querySelector('.close-popup-btn'); // This now targets the event detail popup's close button
    const popupEventTitle = document.getElementById('popup-event-title');
    const popupEventDate = document.getElementById('popup-event-date');
    const popupEventTime = document.getElementById('popup-event-time');
    const popupEventCategory = document.getElementById('popup-event-category');
    const popupEventDescription = document.getElementById('popup-event-description');

    // New elements for Add Event Popup
    const addEventBtn = document.querySelector('.add-event-btn');
    const addEventPopup = document.getElementById('add-event-popup');
    // Renamed and re-targeted for the new round close button
    const closeAddEventPopupBtnRound = document.getElementById('close-add-event-popup-btn-round'); 
    const addEventForm = document.getElementById('add-event-form');
    const newEventTitleInput = document.getElementById('newEventTitle');
    const newEventDateInput = document.getElementById('newEventDate');
    const newEventTimeInput = document.getElementById('newEventTime');
    const newEventCategorySelect = document.getElementById('newEventCategory');
    const newEventDescriptionInput = document.getElementById('newEventDescription');
    const saveNewEventBtn = document.getElementById('saveNewEventBtn');
    // New variable for the cancel button in the add event form
    const cancelAddEventBtn = document.querySelector('.cancel-add-event-btn');


    // Dummy Data for Events
    let dummyEvents = [
        // Change all dates to December 2025
        { id: 1, title: "Team Sync", date: "2025-12-04", time: "10:00", category: "meeting", description: "Weekly team synchronization meeting." },
        { id: 4, title: "Client Presentation", date: "2025-12-18", time: "11:00", category: "work", description: "Final client presentation for the year." },
    ];

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    // Function to render Nearest Events
    function renderNearestEvents() {
        nearestEventsList.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sortedEvents = dummyEvents
            .filter(event => new Date(event.date) >= today) // Only future events
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort by date
            .slice(0, 5); // Display top 5 nearest events

        if (sortedEvents.length === 0) {
            nearestEventsList.innerHTML = '<p style="text-align: center; color: var(--light-text); margin-top: 20px;">No upcoming events.</p>';
            return;
        }

        sortedEvents.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.classList.add('event-item');
            eventItem.dataset.eventId = event.id; // Store event ID for popup

            const eventDate = new Date(event.date);
            const dateString = eventDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            const timeString = event.time;

            eventItem.innerHTML = `
                <div class="event-details">
                    <p class="event-title">${event.title}</p>
                    <span class="event-time">${dateString} | ${timeString}</span>
                </div>
                <span class="event-tag ${event.category}">${event.category}</span>
            `;
            nearestEventsList.appendChild(eventItem);
        });
    }

    // Function to render Calendar
    function renderCalendar(month, year) {
        calendarGrid.innerHTML = '';
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayIndex = firstDay.getDay(); // 0 for Sunday, 1 for Monday, etc.

        currentMonthYearSpan.textContent = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            const dayNameElement = document.createElement('div');
            dayNameElement.classList.add('day-name');
            dayNameElement.textContent = day;
            calendarGrid.appendChild(dayNameElement);
        });

        // Fill in leading empty days from previous month
        for (let i = 0; i < startDayIndex; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day', 'inactive');
            calendarGrid.appendChild(emptyDay);
        }

        // Fill in days of the current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            dayElement.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; // YYYY-MM-DD
            dayElement.innerHTML = `<div class="day-number">${day}</div>`;

            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayElement.classList.add('today');
            }

            // Add events for this day
            const eventsOnThisDay = dummyEvents.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year;
            });

            eventsOnThisDay.forEach(event => {
                const eventSpan = document.createElement('span');
                eventSpan.classList.add('day-event', event.category);
                eventSpan.textContent = event.title;
                eventSpan.dataset.eventId = event.id; // Store event ID
                dayElement.appendChild(eventSpan);
            });

            calendarGrid.appendChild(dayElement);
        }
    }

    // Function to display event details in a popup
    function showEventDetailPopup(eventId) {
        const event = dummyEvents.find(e => e.id == eventId);
        if (!event) return;

        popupEventTitle.textContent = event.title;
        popupEventDate.textContent = new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        popupEventTime.textContent = event.time;
        popupEventCategory.textContent = event.category.charAt(0).toUpperCase() + event.category.slice(1);
        popupEventDescription.textContent = event.description;

        eventDetailPopup.style.display = 'flex';
    }

    // Handle calendar navigation
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentMonth, currentYear);
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
    });

    // Delegate event listener for nearest events list and calendar grid
    document.addEventListener('click', (event) => {
        // For Nearest Events List
        const eventItem = event.target.closest('.nearest-events-column .event-item');
        if (eventItem && eventItem.dataset.eventId) {
            showEventDetailPopup(eventItem.dataset.eventId);
        }

        // For Calendar Day Events
        const dayEvent = event.target.closest('.calendar-grid .day-event');
        if (dayEvent && dayEvent.dataset.eventId) {
            showEventDetailPopup(dayEvent.dataset.eventId);
        }
    });

    // Close event detail popup (original 'x' button)
    closePopupBtn.addEventListener('click', () => {
        eventDetailPopup.style.display = 'none';
    });

    // --- Add Event Popup Logic ---
    addEventBtn.addEventListener('click', () => {
        addEventForm.reset(); // Clear form fields
        addEventPopup.style.display = 'flex';
    });

    // Close add event popup (new round 'x' button)
    closeAddEventPopupBtnRound.addEventListener('click', () => {
        addEventPopup.style.display = 'none';
    });

    // Close add event popup (new 'Cancel' button in the form)
    cancelAddEventBtn.addEventListener('click', () => {
        addEventPopup.style.display = 'none';
    });

    saveNewEventBtn.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default form submission

        const newId = dummyEvents.length > 0 ? Math.max(...dummyEvents.map(e => e.id)) + 1 : 1;
        const newEvent = {
            id: newId,
            title: newEventTitleInput.value,
            date: newEventDateInput.value,
            time: newEventTimeInput.value,
            category: newEventCategorySelect.value,
            description: newEventDescriptionInput.value,
        };

        if (newEvent.title && newEvent.date && newEvent.time && newEvent.category) {
            dummyEvents.push(newEvent);
            addEventPopup.style.display = 'none';
            renderNearestEvents(); // Re-render to show new event
            renderCalendar(currentMonth, currentYear); // Re-render calendar
        } else {
            alert('Please fill in all required fields: Title, Date, Time, and Category.');
        }
    });

    // Initial render for the events page
    renderNearestEvents();
    renderCalendar(currentMonth, currentYear);
});