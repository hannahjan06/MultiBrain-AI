document.addEventListener('DOMContentLoaded', async () => { // Made async for initial fetch

    // --- DOM Element References ---
    const nearestEventsList = document.getElementById('nearest-events-list');
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthYearSpan = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    // Event Detail Popup elements
    const eventDetailPopup = document.getElementById('event-detail-popup');
    const closePopupBtn = document.querySelector('.close-popup-btn');
    const popupEventTitle = document.getElementById('popup-event-title');
    const popupEventDate = document.getElementById('popup-event-date');
    const popupEventTime = document.getElementById('popup-event-time');
    const popupEventCategory = document.getElementById('popup-event-category');
    const popupEventDescription = document.getElementById('popup-event-description');

    // Add Event Popup elements
    const addEventBtn = document.querySelector('.add-event-btn');
    const addEventPopup = document.getElementById('add-event-popup');
    const closeAddEventPopupBtnRound = document.getElementById('close-add-event-popup-btn-round');
    const addEventForm = document.getElementById('add-event-form');
    const newEventTitleInput = document.getElementById('newEventTitle');
    const newEventDateInput = document.getElementById('newEventDate');
    const newEventTimeInput = document.getElementById('newEventTime');
    const newEventCategorySelect = document.getElementById('newEventCategory');
    const newEventDescriptionInput = document.getElementById('newEventDescription');
    const saveNewEventBtn = document.getElementById('saveNewEventBtn');
    const cancelAddEventBtn = document.querySelector('.cancel-add-event-btn');


    // --- State Variables ---
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let allEvents = []; // This will now hold the fetched event data


    // --- API Interaction Functions ---

    /**
     * Fetches all events from the backend API.
     * @returns {Array} An array of event objects, or an empty array on error.
     */
    async function fetchEvents() {
        try {
            const response = await fetch('/api/events');
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const events = await response.json();
            return events;
        } catch (error) {
            console.error("Error fetching events:", error);
            // alert('Failed to load events. Please check server connection.'); // Optional: user feedback
            return [];
        }
    }

    /**
     * Adds a new event to the backend API.
     * @param {Object} eventData - The data for the new event.
     * @returns {Object|null} The newly created event object from the backend, or null on error.
     */
    async function addEvent(eventData) {
        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const savedEvent = await response.json();
            return savedEvent;
        } catch (error) {
            console.error("Error saving new event:", error);
            alert('Failed to save event. Please try again.');
            return null;
        }
    }


    // --- Rendering Functions ---

    /**
     * Renders the nearest upcoming events.
     * @param {Array} events - The array of all events to process.
     */
    function renderNearestEvents(events) {
        nearestEventsList.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sortedEvents = events
            .filter(event => new Date(event.date) >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5);

        if (sortedEvents.length === 0) {
            nearestEventsList.innerHTML = '<p style="text-align: center; color: var(--light-text); margin-top: 20px;">No upcoming events.</p>';
            return;
        }

        sortedEvents.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.classList.add('event-item');
            eventItem.dataset.eventId = event.id;

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

    /**
     * Renders the calendar grid for a specific month and year.
     * @param {number} month - The month (0-11).
     * @param {number} year - The full year.
     * @param {Array} events - The array of all events to display.
     */
    function renderCalendar(month, year, events) {
        calendarGrid.innerHTML = '';
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayIndex = firstDay.getDay();

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
            dayElement.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayElement.innerHTML = `<div class="day-number">${day}</div>`;

            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayElement.classList.add('today');
            }

            // Add events for this day
            const eventsOnThisDay = events.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year;
            });

            eventsOnThisDay.forEach(event => {
                const eventSpan = document.createElement('span');
                eventSpan.classList.add('day-event', event.category);
                eventSpan.textContent = event.title;
                eventSpan.dataset.eventId = event.id;
                dayElement.appendChild(eventSpan);
            });

            calendarGrid.appendChild(dayElement);
        }
    }

    /**
     * Displays event details in a popup.
     * @param {number} eventId - The ID of the event to display.
     * @param {Array} events - The array of all events to search within.
     */
    function showEventDetailPopup(eventId, events) {
        const event = events.find(e => e.id == eventId);
        if (!event) {
            console.error("Event not found with ID:", eventId);
            return;
        }

        popupEventTitle.textContent = event.title;
        popupEventDate.textContent = new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        popupEventTime.textContent = event.time;
        popupEventCategory.textContent = event.category.charAt(0).toUpperCase() + event.category.slice(1);
        popupEventDescription.textContent = event.description;
        // Apply class based on category for styling
        popupEventCategory.className = ''; // Clear existing classes
        popupEventCategory.classList.add(event.category);


        eventDetailPopup.style.display = 'flex';
    }


    // --- Event Handlers ---

    // Function to re-render all components after data changes
    async function refreshEventsAndUI() {
        allEvents = await fetchEvents(); // Update global allEvents
        renderNearestEvents(allEvents);
        renderCalendar(currentMonth, currentYear, allEvents);
    }

    // Handle calendar navigation
    prevMonthBtn.addEventListener('click', async () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        await refreshEventsAndUI(); // Re-fetch and re-render
    });

    nextMonthBtn.addEventListener('click', async () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        await refreshEventsAndUI(); // Re-fetch and re-render
    });

    // Delegate event listener for nearest events list and calendar grid to show detail popup
    document.addEventListener('click', (event) => {
        const eventItem = event.target.closest('.nearest-events-column .event-item');
        const dayEvent = event.target.closest('.calendar-grid .day-event');

        if (eventItem && eventItem.dataset.eventId) {
            showEventDetailPopup(eventItem.dataset.eventId, allEvents);
        } else if (dayEvent && dayEvent.dataset.eventId) {
            showEventDetailPopup(dayEvent.dataset.eventId, allEvents);
        }
    });

    // Close event detail popup
    closePopupBtn.addEventListener('click', () => {
        eventDetailPopup.style.display = 'none';
    });

    // --- Add Event Popup Logic ---
    addEventBtn.addEventListener('click', () => {
        addEventForm.reset(); // Clear form fields
        // Set default date to today for convenience if desired
        const today = new Date();
        newEventDateInput.value = today.toISOString().split('T')[0];
        newEventTimeInput.value = '09:00'; // Default time
        addEventPopup.style.display = 'flex';
    });

    // Close add event popup (round 'x' button)
    closeAddEventPopupBtnRound.addEventListener('click', () => {
        addEventPopup.style.display = 'none';
    });

    // Close add event popup ('Cancel' button in the form)
    cancelAddEventBtn.addEventListener('click', () => {
        addEventPopup.style.display = 'none';
    });

    // Save New Event button handler
    saveNewEventBtn.addEventListener('click', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const newEventData = {
            title: newEventTitleInput.value,
            date: newEventDateInput.value,
            time: newEventTimeInput.value,
            category: newEventCategorySelect.value,
            description: newEventDescriptionInput.value,
        };

        if (newEventData.title && newEventData.date && newEventData.time && newEventData.category) {
            const savedEvent = await addEvent(newEventData); // Call API to add event
            if (savedEvent) {
                addEventPopup.style.display = 'none';
                await refreshEventsAndUI(); // Re-fetch and re-render
            }
        } else {
            alert('Please fill in all required fields: Title, Date, Time, and Category.');
        }
    });


    // --- Initial Load ---
    // Fetch events and render UI when the DOM is fully loaded
    await refreshEventsAndUI();
});