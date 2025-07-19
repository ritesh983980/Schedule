document.addEventListener('DOMContentLoaded', function() {
    // Sample tasks data (more realistic dates for testing calendar)
    // Updated dates to be relevant to current date for notification testing
    let tasks = [
        { id: 1, title: 'Team Meeting', date: '2025-07-19', time: '10:00', filterCategory: 'today', taskCategory: 'Work' }, // Today
        { id: 2, title: 'Buy Groceries', date: '2025-07-20', time: '18:00', filterCategory: 'upcoming', taskCategory: 'Shopping' }, // Tomorrow
        { id: 3, title: 'Doctor Appointment', date: '2025-07-25', time: '15:30', filterCategory: 'upcoming', taskCategory: 'Health' },
        { id: 4, title: 'Finish Project Report', date: '2025-07-19', time: '17:00', filterCategory: 'today', taskCategory: 'Work' }, // Today
        { id: 5, title: 'Call Mom', date: '2025-07-28', time: '11:00', filterCategory: 'upcoming', taskCategory: 'Personal' },
        { id: 6, title: 'Gym Session', date: '2025-08-01', time: '07:00', filterCategory: 'later', taskCategory: 'Health' },
        { id: 7, title: 'Book Flight', date: '2025-08-15', time: '14:00', filterCategory: 'later', taskCategory: 'Personal' }
    ];

    // User Profile Data (Load from localStorage if available, otherwise default)
    let userProfile = JSON.parse(localStorage.getItem('userProfile')) || {
        name: 'Aapka Naam',
        photo: null, // Stores base64 string of the image
        notificationsEnabled: true,
        defaultTaskCategory: 'Work',
        isDarkTheme: false // New property for theme preference
    };
    
    // DOM Elements - Pages
    const homePage = document.getElementById('home-page');
    const categoriesPage = document.getElementById('categories-page');
    const calendarPage = document.getElementById('calendar-page');
    const profilePage = document.getElementById('profile-page'); 

    // DOM Elements - Header
    const headerProfileIcon = document.getElementById('header-profile-icon');
    const headerProfileName = document.getElementById('header-profile-name');
    const searchIcon = document.getElementById('search-icon'); // New
    const notificationIcon = document.getElementById('notification-icon'); // New
    const notificationBadge = document.getElementById('notification-badge'); // New

    // DOM Elements - Search Overlay
    const searchOverlay = document.getElementById('search-overlay'); // New
    const searchInput = document.getElementById('search-input'); // New
    const closeSearchBtn = document.getElementById('close-search-btn'); // New

    // DOM Elements - Notification Panel
    const notificationPanel = document.getElementById('notification-panel'); // New
    const closeNotificationBtn = document.getElementById('close-notification-btn'); // New
    const notificationList = document.getElementById('notification-list'); // New

    // DOM Elements - Task Containers
    const taskContainer = document.getElementById('task-container'); 
    const categorizedTaskContainer = document.getElementById('categorized-task-container'); 
    const selectedDayTasksContainer = document.getElementById('selected-day-tasks-container'); 

    // DOM Elements - Filters
    const filterButtons = document.querySelectorAll('.filter-btn'); 
    const categoryFilterButtons = document.querySelectorAll('.category-filter-btn'); 
    
    // DOM Elements - Footer
    const footerButtons = document.querySelectorAll('.footer-btn');
    
    // DOM Elements - Modals
    const addTaskModal = document.getElementById('add-task-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal'); 
    const taskForm = document.getElementById('task-form');
    const editTaskModal = document.getElementById('edit-task-modal');
    const editTaskForm = document.getElementById('edit-task-form');
    const editTaskId = document.getElementById('edit-task-id');
    const editTaskTitle = document.getElementById('edit-task-title');
    const editTaskDate = document.getElementById('edit-task-date');
    const editTaskTime = document.getElementById('edit-task-time');
    const editTaskCategory = document.getElementById('edit-task-category');

    // DOM Elements - Calendar
    const currentMonthYearDisplay = document.getElementById('current-month-year');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const calendarDaysGrid = document.getElementById('calendar-days');
    const selectedDateDisplay = document.getElementById('selected-date-display');

    // DOM Elements - Profile Page
    const profilePhotoPreview = document.getElementById('profile-photo-preview');
    const profilePhotoInput = document.getElementById('profile-photo-input');
    const deletePhotoBtn = document.getElementById('delete-photo-btn'); // New delete photo button
    const profileNameInput = document.getElementById('profile-name-input');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const notificationToggle = document.getElementById('notification-toggle');
    const defaultCategorySelect = document.getElementById('default-category-select');
    const themeToggle = document.getElementById('theme-toggle'); // New theme toggle
    const privacyPolicyLink = document.getElementById('privacy-policy-link'); // New link
    const aboutAppLink = document.getElementById('about-app-link'); // New link

    // Current filters and calendar state
    let currentHomePageFilter = 'today'; 
    let currentCategoryPageFilter = 'all'; 
    let currentCalendarDate = new Date(); 
    let selectedCalendarDate = new Date(); 

    // --- Helper Functions ---

    // Format date (e.g., Jul 19, 2025)
    function formatDate(dateString, includeYear = true) {
        const options = { month: 'short', day: 'numeric' };
        if (includeYear) {
            options.year = 'numeric';
        }
        return new Date(dateString).toLocaleDateString('en-US', options);
    }
    
    // Format time (e.g., 10:00 AM)
    function formatTime(timeString) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    }

    // Determine task's filter category (today, upcoming, later) based on date
    function getFilterCategory(dateString) {
        const today = new Date();
        today.setHours(0,0,0,0); 

        const taskDate = new Date(dateString);
        taskDate.setHours(0,0,0,0); 

        if (taskDate.getTime() === today.getTime()) {
            return 'today';
        } else if (taskDate > today) {
            return 'upcoming';
        } else {
            return 'later';
        }
    }

    // Apply or remove dark theme class to the body
    function applyTheme() {
        if (userProfile.isDarkTheme) {
            document.body.classList.add('dark-theme');
            themeToggle.checked = true;
        } else {
            document.body.classList.remove('dark-theme');
            themeToggle.checked = false;
        }
    }

    // Save user profile to localStorage
    function saveUserProfile() {
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
    }

    // Close all overlays/modals except the active one
    function closeAllOverlays() {
        searchOverlay.classList.add('hidden');
        notificationPanel.classList.add('hidden');
        addTaskModal.style.display = 'none';
        editTaskModal.style.display = 'none';
    }

    // --- Render Functions ---

    // Render tasks for the Home Page (now includes search filter)
    function renderHomePageTasks(searchTerm = '') {
        taskContainer.innerHTML = ''; 

        let filteredTasks = tasks.filter(task => task.filterCategory === currentHomePageFilter);
        
        // Apply search filter if a search term is provided
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(lowerCaseSearchTerm) ||
                task.taskCategory.toLowerCase().includes(lowerCaseSearchTerm) ||
                formatDate(task.date, true).toLowerCase().includes(lowerCaseSearchTerm)
            );
        }

        if (filteredTasks.length === 0) {
            taskContainer.innerHTML = '<p class="no-tasks">No tasks found for this filter or search.</p>';
            return;
        }
        
        filteredTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-card';
            taskElement.innerHTML = `
                <h4 class="task-title">${task.title}</h4>
                <p class="task-date">
                    <i class="far fa-calendar-alt"></i>
                    ${formatDate(task.date)} at ${formatTime(task.time)}
                </p>
            `;
            taskContainer.appendChild(taskElement);
        });
    }

    // Render tasks for the Categories Page
    function renderCategoriesPageTasks() {
        categorizedTaskContainer.innerHTML = ''; 

        let tasksToRender = tasks;
        if (currentCategoryPageFilter !== 'all') {
            tasksToRender = tasks.filter(task => task.taskCategory === currentCategoryPageFilter);
        }

        if (tasksToRender.length === 0) {
            categorizedTaskContainer.innerHTML = '<p class="no-tasks">No tasks found for this category.</p>';
            return;
        }

        // Sort tasks by date and time for better display
        tasksToRender.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });

        tasksToRender.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-card';
            taskElement.innerHTML = `
                <h4 class="task-title">${task.title}</h4>
                <p class="task-date">
                    <i class="far fa-calendar-alt"></i>
                    ${formatDate(task.date)} at ${formatTime(task.time)} <span style="font-weight: bold; color: var(--text-color-secondary);">${task.taskCategory}</span>
                </p>
                <div class="task-actions">
                    <button class="edit-btn" data-id="${task.id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="delete-btn" data-id="${task.id}"><i class="fas fa-trash-alt"></i> Delete</button>
                </div>
            `;
            categorizedTaskContainer.appendChild(taskElement);
        });

        // Add event listeners for edit and delete buttons (important for newly rendered elements)
        document.querySelectorAll('#categorized-task-container .edit-btn').forEach(button => {
            button.addEventListener('click', openEditModal);
        });
        document.querySelectorAll('#categorized-task-container .delete-btn').forEach(button => {
            button.addEventListener('click', deleteTask);
        });
    }

    // Render calendar grid and tasks for selected day
    function renderCalendar() {
        currentMonthYearDisplay.textContent = currentCalendarDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        calendarDaysGrid.innerHTML = ''; 

        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth(); 

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const today = new Date();
        today.setHours(0,0,0,0); 

        // Calculate days from previous month to fill the first row
        for (let i = 0; i < firstDayOfMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day inactive';
            calendarDaysGrid.appendChild(dayElement);
        }

        // Render current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            const currentDate = new Date(year, month, day);
            currentDate.setHours(0,0,0,0); 

            dayElement.textContent = day;
            dayElement.className = 'calendar-day';
            dayElement.dataset.date = currentDate.toISOString().split('T')[0]; 

            // Add classes for current day, selected day
            if (currentDate.getTime() === today.getTime()) {
                dayElement.classList.add('current-day');
            }
            // Ensure selectedCalendarDate is also normalized for comparison
            const normalizedSelectedDate = new Date(selectedCalendarDate);
            normalizedSelectedDate.setHours(0,0,0,0);

            if (currentDate.getTime() === normalizedSelectedDate.getTime()) {
                 dayElement.classList.add('selected-day');
            }

            // Check if this day has tasks
            const hasTasks = tasks.some(task => {
                const taskDate = new Date(task.date);
                taskDate.setHours(0,0,0,0);
                return taskDate.getTime() === currentDate.getTime();
            });

            if (hasTasks) {
                dayElement.classList.add('has-tasks');
                const taskDot = document.createElement('span');
                taskDot.className = 'task-dot';
                dayElement.appendChild(taskDot);
            }

            dayElement.addEventListener('click', function() {
                // Remove selected class from previously selected day
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected-day'));
                // Add selected class to the clicked day
                this.classList.add('selected-day');
                selectedCalendarDate = new Date(this.dataset.date); // Update selected date
                renderTasksForSelectedDay(this.dataset.date); // Render tasks for selected day
            });

            calendarDaysGrid.appendChild(dayElement);
        }

        // Render tasks for the initially selected day (defaults to today or current calendar date)
        renderTasksForSelectedDay(selectedCalendarDate.toISOString().split('T')[0]);
    }

    // Render tasks for a specific selected day on the calendar page
    function renderTasksForSelectedDay(dateString) {
        selectedDayTasksContainer.innerHTML = '';
        
        const tasksForDay = tasks.filter(task => task.date === dateString);

        // Update selected date display title
        const displayDate = new Date(dateString);
        const today = new Date();
        today.setHours(0,0,0,0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (displayDate.getTime() === today.getTime()) {
            selectedDateDisplay.textContent = 'Today';
        } else if (displayDate.getTime() === tomorrow.getTime()) {
            selectedDateDisplay.textContent = 'Tomorrow';
        } else {
            selectedDateDisplay.textContent = formatDate(dateString, true); // Include year for other dates
        }

        if (tasksForDay.length === 0) {
            selectedDayTasksContainer.innerHTML = '<p class="no-tasks">No tasks for this day.</p>';
            return;
        }

        // Sort tasks by time for better display
        tasksForDay.sort((a, b) => {
            const timeA = a.time;
            const timeB = b.time;
            if (timeA < timeB) return -1;
            if (timeA > timeB) return 1;
            return 0;
        });
        
        tasksForDay.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-card';
            taskElement.innerHTML = `
                <h4 class="task-title">${task.title}</h4>
                <p class="task-date">
                    <i class="far fa-clock"></i> ${formatTime(task.time)} <span style="font-weight: bold; color: var(--text-color-secondary);">${task.taskCategory}</span>
                </p>
                <div class="task-actions">
                    <button class="edit-btn" data-id="${task.id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="delete-btn" data-id="${task.id}"><i class="fas fa-trash-alt"></i> Delete</button>
                </div>
            `;
            selectedDayTasksContainer.appendChild(taskElement);
        });

        // Add event listeners for edit and delete buttons (important for newly rendered elements)
        document.querySelectorAll('#selected-day-tasks-container .edit-btn').forEach(button => {
            button.addEventListener('click', openEditModal);
        });
        document.querySelectorAll('#selected-day-tasks-container .delete-btn').forEach(button => {
            button.addEventListener('click', deleteTask);
        });
    }

                          
    // Render Profile information in header and on profile page
    function renderProfile() {
        // Update Header
        headerProfileName.textContent = userProfile.name;
        if (userProfile.photo) {
            headerProfileIcon.innerHTML = `<img src="${userProfile.photo}" alt="Profile Photo">`;
        } else {
            headerProfileIcon.innerHTML = `<i class="fas fa-user"></i>`;
        }

        // Update Profile Page inputs
        profileNameInput.value = userProfile.name;
        notificationToggle.checked = userProfile.notificationsEnabled;
        defaultCategorySelect.value = userProfile.defaultTaskCategory;
        themeToggle.checked = userProfile.isDarkTheme; // Set theme toggle state

        if (userProfile.photo) {
            profilePhotoPreview.innerHTML = `<img src="${userProfile.photo}" alt="Profile Photo">`;
        } else {
            profilePhotoPreview.innerHTML = `<i class="fas fa-user"></i>`;
        }
        // Show/hide delete photo button based on whether a photo exists
        deletePhotoBtn.style.display = userProfile.photo ? 'flex' : 'none';
    }

     // Render Notifications in the panel
    function renderNotifications() {
        notificationList.innerHTML = '';
        const now = new Date();
        const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Current date/time + 24 hours
        const fortyEightHoursLater = new Date(now.getTime() + 48 * 60 * 60 * 1000); // Current date/time + 48 hours

        const upcomingTasks = tasks.filter(task => {
            const taskDateTime = new Date(`${task.date}T${task.time}`);
            return taskDateTime > now && taskDateTime <= fortyEightHoursLater;
        }).sort((a, b) => {
            // Sort by earliest time first
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });

        if (upcomingTasks.length === 0) {
            notificationList.innerHTML = '<p class="no-notifications-msg">No upcoming tasks in the next 48 hours.</p>';
            notificationBadge.classList.add('hidden');
            notificationBadge.textContent = '';
            return;
        }

        upcomingTasks.forEach(task => {
            const taskDateTime = new Date(`${task.date}T${task.time}`);
            let notificationMessage = `${task.title} at ${formatTime(task.time)}, ${formatDate(task.date)}`;
            
            // Add a more specific message if within 24 hours
            if (taskDateTime <= twentyFourHoursLater) {
                notificationMessage = `Due Soon: ${task.title} at ${formatTime(task.time)}, ${formatDate(task.date)}`;
            }

            const notificationItem = document.createElement('div');
            notificationItem.className = 'notification-item';
            notificationItem.innerHTML = `
                <h4>${task.title}</h4>
                <p>${notificationMessage}</p>
            `;
            notificationList.appendChild(notificationItem);
        });

        notificationBadge.classList.remove('hidden');
        notificationBadge.textContent = upcomingTasks.length;
    }


    // --- Event Handlers ---

    // Home Page Filter tasks
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentHomePageFilter = this.dataset.filter;
            searchInput.value = ''; // Clear search when changing filter
            renderHomePageTasks();
        });
    });

    // Categories Page Filter tasks
    categoryFilterButtons.forEach(button => {
        button.addEventListener('click', function() {
            categoryFilterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentCategoryPageFilter = this.dataset.categoryFilter;
            renderCategoriesPageTasks();
        });
    });
    
    // Footer navigation
    footerButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all footer buttons
            footerButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const page = this.dataset.page;
            
            // Hide all main pages and overlays/modals
            homePage.classList.add('hidden');
            categoriesPage.classList.add('hidden');
            calendarPage.classList.add('hidden'); 
            profilePage.classList.add('hidden'); 
            closeAllOverlays(); // Close search/notification/modals

            if (page === 'add-task') {
                addTaskModal.style.display = 'flex';
                // Reset form on opening and set default date to today & category
                taskForm.reset();
                document.getElementById('task-date').valueAsDate = new Date(); 
                document.getElementById('task-category').value = userProfile.defaultTaskCategory; 
            } else if (page === 'home') {
                homePage.classList.remove('hidden');
                renderHomePageTasks(); 
            } else if (page === 'categories') {
                categoriesPage.classList.remove('hidden');
                renderCategoriesPageTasks(); 
            } else if (page === 'calendar') {
                calendarPage.classList.remove('hidden');
                currentCalendarDate = new Date(); 
                selectedCalendarDate = new Date(); 
                renderCalendar(); 
            } else if (page === 'profile') { 
                profilePage.classList.remove('hidden');
                renderProfile(); 
            }
        });
    });
    
    // Close modals (generic close buttons)
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            addTaskModal.style.display = 'none';
            editTaskModal.style.display = 'none';
        });
    });
    
    // Close modal/overlay when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === addTaskModal || event.target === editTaskModal) {
            closeAllOverlays();
        }
        // Handle closing search/notification panel if clicked outside
        if (!searchOverlay.classList.contains('hidden') && !searchOverlay.contains(event.target) && event.target !== searchIcon) {
            searchOverlay.classList.add('hidden');
        }
        if (!notificationPanel.classList.contains('hidden') && !notificationPanel.contains(event.target) && event.target !== notificationIcon) {
            notificationPanel.classList.add('hidden');
        }
    });
    
    // Add new task
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('task-title').value;
        const date = document.getElementById('task-date').value;
        const time = document.getElementById('task-time').value;
        const taskCategory = document.getElementById('task-category').value;
        
        const filterCategory = getFilterCategory(date);
        
        const newTask = {
            id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1, 
            title,
            date,
            time,
            filterCategory, 
            taskCategory    
        };
        
        tasks.push(newTask);
        
        taskForm.reset();
        
        addTaskModal.style.display = 'none';
        
        // Re-render tasks for all relevant pages and update notifications
        renderHomePageTasks();
        renderCategoriesPageTasks();
        if (!calendarPage.classList.contains('hidden')) {
            renderCalendar(); 
        }
        renderNotifications(); // Update notifications after adding a task
    });

    // Open Edit Task Modal
    function openEditModal(event) {
        closeAllOverlays(); // Close other overlays before opening modal
        const taskId = parseInt(event.currentTarget.dataset.id);
        const taskToEdit = tasks.find(task => task.id === taskId);

        if (taskToEdit) {
            editTaskId.value = taskToEdit.id;
            editTaskTitle.value = taskToEdit.title;
            editTaskDate.value = taskToEdit.date;
            editTaskTime.value = taskToEdit.time;
            editTaskCategory.value = taskToEdit.taskCategory;
            editTaskModal.style.display = 'flex';
        }
    }

    // Save Edited Task
    editTaskForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const id = parseInt(editTaskId.value);
        const title = editTaskTitle.value;
        const date = editTaskDate.value;
        const time = editTaskTime.value; // Corrected this line in previous fix
        const taskCategory = editTaskCategory.value;

        const taskIndex = tasks.findIndex(task => task.id === id);

        if (taskIndex > -1) {
            const updatedTask = {
                ...tasks[taskIndex], 
                title,
                date,
                time,
                taskCategory,
                filterCategory: getFilterCategory(date) 
            };
            tasks[taskIndex] = updatedTask;
        }

        editTaskModal.style.display = 'none';
        // Re-render tasks for all relevant pages and update notifications
        renderHomePageTasks();
        renderCategoriesPageTasks();
        if (!calendarPage.classList.contains('hidden')) {
            renderCalendar(); 
        }
        renderNotifications(); // Update notifications after editing a task
    });

    // Delete Task
    function deleteTask(event) {
        const taskId = parseInt(event.currentTarget.dataset.id);
        if (confirm('Are you sure you want to delete this task?')) {
            tasks = tasks.filter(task => task.id !== taskId);
            // Re-render tasks for all relevant pages and update notifications
            renderHomePageTasks();
            renderCategoriesPageTasks();
            if (!calendarPage.classList.contains('hidden')) {
                renderCalendar(); 
            }
            renderNotifications(); // Update notifications after deleting a task
        }
    }

                          
    // Calendar Navigation
    prevMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });

    // --- Profile Page Logic ---

    // Handle profile photo input change
    profilePhotoInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                userProfile.photo = e.target.result; // Store as base64
                renderProfile(); // Update display immediately
                saveUserProfile(); // Save changes
            };
            reader.readAsDataURL(file); // Read file as base64
        }
    });

    // Handle delete photo button click
    deletePhotoBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to remove your profile photo?')) {
            userProfile.photo = null; // Remove the photo
            profilePhotoInput.value = ''; // Clear the file input
            renderProfile(); // Update display to show default icon
            saveUserProfile(); // Save changes
        }
    });

    // Save profile data
    saveProfileBtn.addEventListener('click', function() {
        userProfile.name = profileNameInput.value;
        userProfile.notificationsEnabled = notificationToggle.checked;
        userProfile.defaultTaskCategory = defaultCategorySelect.value;
        // userProfile.isDarkTheme is updated by themeToggle listener directly
        
        saveUserProfile(); // Save to localStorage

        renderProfile(); // Update header
        alert('Profile saved successfully!');
        renderNotifications(); // Rerender notifications as toggle might affect them (though not directly for now)
    });

    // Theme Toggle Logic
    themeToggle.addEventListener('change', function() {
        userProfile.isDarkTheme = this.checked;
        applyTheme(); // Apply the theme to the body
        saveUserProfile(); // Save theme preference
    });

    // Privacy Policy and About App links (for demonstration)
    privacyPolicyLink.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Privacy Policy: Your data is stored locally in your browser and is not shared with anyone.');
    });

    aboutAppLink.addEventListener('click', function(e) {
        e.preventDefault();
        alert('About My Schedule App: Version 1.0. This app helps you manage your tasks efficiently.');
    });


    // --- New Search & Notification Features ---

    // Search Icon click handler
    searchIcon.addEventListener('click', function() {
        closeAllOverlays(); // Close other overlays/modals
        searchOverlay.classList.toggle('hidden'); // Toggle visibility
        if (!searchOverlay.classList.contains('hidden')) {
            searchInput.focus(); // Focus on input when opened
        } else {
            searchInput.value = ''; // Clear search when closing
            renderHomePageTasks(); // Re-render tasks without search filter
        }
    });

    // Close Search Button click handler
    closeSearchBtn.addEventListener('click', function() {
        searchOverlay.classList.add('hidden');
        searchInput.value = ''; // Clear search when closing
        renderHomePageTasks(); // Re-render tasks without search filter
    });

    // Search input keyup event handler
    searchInput.addEventListener('keyup', function() {
        renderHomePageTasks(this.value); // Re-render tasks with current search term
    });

    // Notification Icon click handler
    notificationIcon.addEventListener('click', function() {
        closeAllOverlays(); // Close other overlays/modals
        notificationPanel.classList.toggle('hidden'); // Toggle visibility
        if (!notificationPanel.classList.contains('hidden')) {
            renderNotifications(); // Render notifications when panel is opened
        }
    });

    // Close Notification Button click handler
    closeNotificationBtn.addEventListener('click', function() {
        notificationPanel.classList.add('hidden');
    });


    // --- Initial Render ---
    // Apply theme on initial load first
    applyTheme(); 

    // Ensure only home page is active on initial load
    homePage.classList.remove('hidden');
    categoriesPage.classList.add('hidden'); 
    calendarPage.classList.add('hidden');
    profilePage.classList.add('hidden');

    renderHomePageTasks();
    renderProfile(); // Initial render of profile info (name, photo)
    renderNotifications(); // Initial render of notifications and badge count
});
