import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
import {
    getDatabase,
    ref,
    push,
    set,
    onValue,
    remove,
    update,
    child,
    get
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA3VZ0pPUXjtcJYHtajqKoPF3C9sGkezu0",
    authDomain: "alsrod-todo-backend.firebaseapp.com",
    databaseURL: "https://alsrod-todo-backend-default-rtdb.firebaseio.com/",
    projectId: "alsrod-todo-backend",
    storageBucket: "alsrod-todo-backend.firebasestorage.app",
    messagingSenderId: "92159844278",
    appId: "1:92159844278:web:03a8e35b55a010a968eb17",
    measurementId: "G-M2BD19786F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);
const todosRef = ref(db, 'todos');

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const todoInput = document.getElementById('todoInput');
    const prioritySelect = document.getElementById('prioritySelect');
    const deadlineInput = document.getElementById('deadlineInput');
    const noteInput = document.getElementById('noteInput');
    const addBtn = document.getElementById('addBtn');
    const todoList = document.getElementById('todoList');
    const itemsLeft = document.getElementById('itemsLeft');
    const clearAllBtn = document.getElementById('clearAll');
    const dateDisplay = document.getElementById('dateDisplay');

    // Orbital Timer Logic
    const timerRing = document.querySelector('.timer-ring-progress');
    const timerMinutes = document.getElementById('timer-minutes');
    const timerSeconds = document.getElementById('timer-seconds');
    const timerStartBtn = document.getElementById('timer-start');
    const timerResetBtn = document.getElementById('timer-reset');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const customTimerInput = document.getElementById('custom-timer-input');

    let timerInterval;
    let totalTime = 15 * 60; // Default 15 minutes in seconds
    let timeLeft = totalTime;
    let isRunning = false;

    // View Elements
    const focusTimerView = document.getElementById('focus-timer-view');
    const timeAttackerView = document.getElementById('time-attacker-view');
    const stopwatchDisplay = document.getElementById('stopwatch-display');
    const stopwatchStartBtn = document.getElementById('stopwatch-start');
    const stopwatchResetBtn = document.getElementById('stopwatch-reset');

    // Stopwatch State
    let isStopwatchMode = false;
    let stopwatchInterval;
    let stopwatchStartTime = 0;
    let stopwatchElapsedTime = 0;
    let stopwatchRunning = false;

    // Mode Switch Elements
    const modeSwitchBtn = document.getElementById('mode-switch-btn');
    const timerPresets = document.querySelector('.timer-presets');
    const timerCustomRow = document.querySelector('.timer-custom-row');
    // dateDisplay is already declared at line 43

    // Circumference = 2 * PI * r (r=90) => 565.48
    const circumference = 2 * Math.PI * 90;
    timerRing.style.strokeDasharray = `${circumference} ${circumference}`;
    timerRing.style.strokeDashoffset = 0;

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerMinutes.textContent = minutes.toString().padStart(2, '0');
        timerSeconds.textContent = seconds.toString().padStart(2, '0');

        // Update Ring
        const offset = circumference - (timeLeft / totalTime) * circumference;
        timerRing.style.strokeDashoffset = offset;

        // Color Change Logic (Green -> Yellow -> Red)
        const percentage = timeLeft / totalTime;
        if (percentage > 0.5) {
            timerRing.style.stroke = 'var(--secondary-color)'; // Purple/Secondary
        } else if (percentage > 0.2) {
            timerRing.style.stroke = '#f59e0b'; // Yellow/Warning
        } else {
            timerRing.style.stroke = '#ef4444'; // Red/Danger
        }
    }

    function formatStopwatchTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const centiseconds = Math.floor((ms % 1000) / 10);

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}h${minutes.toString().padStart(2, '0')}m${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
        }
    }

    function updateStopwatchDisplay() {
        stopwatchDisplay.textContent = formatStopwatchTime(stopwatchElapsedTime);
    }

    function startStopwatch() {
        if (stopwatchRunning) {
            // Pause
            clearInterval(stopwatchInterval);
            stopwatchRunning = false;
            stopwatchStartBtn.innerHTML = '<i class="fas fa-play"></i>';
            stopwatchStartBtn.classList.remove('active');
        } else {
            // Start
            stopwatchRunning = true;
            stopwatchStartBtn.innerHTML = '<i class="fas fa-pause"></i>';
            stopwatchStartBtn.classList.add('active');
            stopwatchStartTime = performance.now() - stopwatchElapsedTime;

            stopwatchInterval = setInterval(() => {
                stopwatchElapsedTime = performance.now() - stopwatchStartTime;
                updateStopwatchDisplay();
            }, 10); // Update every 10ms
        }
    }

    function resetStopwatch() {
        clearInterval(stopwatchInterval);
        stopwatchRunning = false;
        stopwatchElapsedTime = 0;
        updateStopwatchDisplay();
        stopwatchStartBtn.innerHTML = '<i class="fas fa-play"></i>';
        stopwatchStartBtn.classList.remove('active');
    }

    function startTimer() {
        if (isRunning) {
            // Pause
            clearInterval(timerInterval);
            isRunning = false;
            timerStartBtn.innerHTML = '<i class="fas fa-play"></i>';
            timerStartBtn.classList.remove('active');
        } else {
            // Start
            if (timeLeft <= 0) return;

            isRunning = true;
            timerStartBtn.innerHTML = '<i class="fas fa-pause"></i>';
            timerStartBtn.classList.add('active');

            timerInterval = setInterval(() => {
                timeLeft--;
                updateTimerDisplay();

                if (timeLeft <= 0) {
                    handleTimerComplete();
                }
            }, 1000);
        }
    }

    function handleTimerComplete() {
        clearInterval(timerInterval);
        isRunning = false;
        timerStartBtn.innerHTML = '<i class="fas fa-play"></i>';
        timerStartBtn.classList.remove('active');

        // Visual Feedback: Flash the ring
        timerRing.style.stroke = 'var(--primary-color)';
        const flashInterval = setInterval(() => {
            timerRing.style.opacity = timerRing.style.opacity === '0' ? '1' : '0';
        }, 300);

        // Stop flashing after 3 seconds
        setTimeout(() => {
            clearInterval(flashInterval);
            timerRing.style.opacity = '1';
        }, 3000);

        // Audio Feedback: Simple beep
        playTimerSound();
    }

    function playTimerSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
            oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.5); // Slide up to A5

            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.error("Audio playback failed", e);
        }
    }
    function resetTimer() {
        clearInterval(timerInterval);
        isRunning = false;

        // Logic:
        // If timer was running or paused (timeLeft < totalTime AND timeLeft > 0), reset to original duration.
        // If timer was setting up (timeLeft == totalTime) or finished (timeLeft <= 0), reset to 00:00.
        if (timeLeft < totalTime && timeLeft > 0) {
            timeLeft = totalTime;
        } else {
            totalTime = 0;
            timeLeft = 0;
        }

        updateTimerDisplay();
        timerStartBtn.innerHTML = '<i class="fas fa-play"></i>';
        timerStartBtn.classList.remove('active');
    }

    function toggleMode() {
        isStopwatchMode = !isStopwatchMode;

        if (isStopwatchMode) {
            // Switch to Stopwatch
            focusTimerView.classList.add('hidden');
            timeAttackerView.classList.remove('hidden');
            modeSwitchBtn.innerHTML = '<i class="fas fa-hourglass-start"></i>';

            // Reset Timer if running
            if (isRunning) resetTimer();
        } else {
            // Switch to Timer
            focusTimerView.classList.remove('hidden');
            timeAttackerView.classList.add('hidden');
            modeSwitchBtn.innerHTML = '<i class="fas fa-clock"></i>';

            // Reset Stopwatch if running
            if (stopwatchRunning) resetStopwatch();
        }
    }

    modeSwitchBtn.addEventListener('click', toggleMode);
    stopwatchStartBtn.addEventListener('click', startStopwatch);
    stopwatchResetBtn.addEventListener('click', resetStopwatch);

    function setTime(seconds) {
        resetTimer();
        totalTime = seconds;
        timeLeft = totalTime;
        updateTimerDisplay();
    }

    timerStartBtn.addEventListener('click', startTimer);
    timerResetBtn.addEventListener('click', resetTimer);

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const minutes = parseInt(btn.dataset.time);
            const secondsToAdd = minutes * 60;

            // If timer finished, reset first
            if (timeLeft <= 0) {
                totalTime = 0;
                timeLeft = 0;
                // If it was running (finished state), stop it
                if (isRunning) {
                    clearInterval(timerInterval);
                    isRunning = false;
                    timerStartBtn.innerHTML = '<i class="fas fa-play"></i>';
                    timerStartBtn.classList.remove('active');
                }
            }

            totalTime += secondsToAdd;
            timeLeft += secondsToAdd;
            updateTimerDisplay();
        });
    });

    // Custom Timer Modal Logic
    const customTimerBtn = document.getElementById('custom-timer-btn');
    const customModal = document.getElementById('custom-timer-modal');
    const customCancelBtn = document.getElementById('custom-cancel');
    const customStartBtn = document.getElementById('custom-start');
    const customHours = document.getElementById('custom-hours');
    const customMinutes = document.getElementById('custom-minutes');
    const customSeconds = document.getElementById('custom-seconds');

    if (customTimerBtn && customModal) {
        customTimerBtn.addEventListener('click', () => {
            customModal.classList.remove('hidden');
            customModal.classList.add('active');
        });

        const closeModal = () => {
            customModal.classList.remove('active');
            setTimeout(() => customModal.classList.add('hidden'), 300); // Wait for transition
            // Clear inputs
            customHours.value = '';
            customMinutes.value = '';
            customSeconds.value = '';
        };

        customCancelBtn.addEventListener('click', () => {
            setTime(900); // Default to 15 minutes
            closeModal();
        });

        customStartBtn.addEventListener('click', () => {
            const hours = parseInt(customHours.value) || 0;
            const minutes = parseInt(customMinutes.value) || 0;
            const seconds = parseInt(customSeconds.value) || 0;

            const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

            if (totalSeconds > 0) {
                setTime(totalSeconds);
                closeModal();
            } else {
                alert("시간을 입력해주세요.");
            }
        });

        // Close on outside click
        customModal.addEventListener('click', (e) => {
            if (e.target === customModal) {
                closeModal();
            }
        });
    }

    // Delete Confirmation Modal Logic
    const deleteModal = document.getElementById('delete-modal');
    const deleteMessage = document.getElementById('delete-message');
    const deleteCancelBtn = document.getElementById('delete-cancel');
    const deleteConfirmBtn = document.getElementById('delete-confirm');
    let todoIdToDelete = null;

    function openDeleteModal(id, message) {
        todoIdToDelete = id;
        deleteMessage.textContent = message;
        deleteModal.classList.remove('hidden');
        deleteModal.classList.add('active');
    }

    function closeDeleteModal() {
        deleteModal.classList.remove('active');
        setTimeout(() => deleteModal.classList.add('hidden'), 300);
        todoIdToDelete = null;
    }

    if (deleteModal) {
        deleteCancelBtn.addEventListener('click', closeDeleteModal);

        deleteConfirmBtn.addEventListener('click', () => {
            if (todoIdToDelete) {
                deleteTodo(todoIdToDelete);
                closeDeleteModal();
            }
        });

        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) {
                closeDeleteModal();
            }
        });
    }

    // Initialize
    updateTimerDisplay();

    // Initialize
    renderDate();

    // Real-time listener for Todos (Realtime Database)
    onValue(todosRef, (snapshot) => {
        try {
            const data = snapshot.val();
            console.log("Fetched data:", data); // Debug log
            const todos = [];

            // 30 Days in milliseconds
            const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
            const now = Date.now();

            if (data) {
                // Convert object to array and check for auto-deletion
                Object.keys(data).forEach(key => {
                    const todo = data[key];

                    // Auto-delete check
                    if (todo.deleted && todo.deletedAt) {
                        if (now - todo.deletedAt > THIRTY_DAYS_MS) {
                            // Silently remove old item
                            remove(ref(db, `todos/${key}`));
                            return; // Skip adding to list
                        }
                    }

                    todos.push({ id: key, ...todo });
                });
                // Sort by createdAt desc
                todos.sort((a, b) => b.createdAt - a.createdAt);
            }
            console.log("Parsed todos:", todos); // Debug log
            renderTodos(todos);
        } catch (e) {
            console.error("Error processing data:", e);
        }
    }, (error) => {
        console.error("Error getting data: ", error);
    });

    // ... (Event Listeners remain same)

    // Functions
    // ... (renderDate, addTodo, toggleComplete, updateEvaluation, cyclePriority, formatDeadline, editTodo, deleteTodo, restoreTodo, permanentDeleteTodo remain same)

    // Event Listeners
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });
    noteInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });
    clearAllBtn.addEventListener('click', clearAll);

    // Input Expansion Logic
    const inputContainer = document.getElementById('inputContainer');
    const inputDetails = document.querySelector('.input-details');

    todoInput.addEventListener('focus', () => {
        inputDetails.classList.add('expanded');
    });

    // Close input details when clicking outside
    document.addEventListener('click', (e) => {
        if (!inputContainer.contains(e.target)) {
            inputDetails.classList.remove('expanded');
        }
    });

    // Initialize Flatpickr for main input
    flatpickr(deadlineInput, {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        time_24hr: true,
        disableMobile: "true",
        locale: { firstDayOfWeek: 1 }
    });

    // Functions
    function emptyTrash(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        console.log("Empty trash clicked");

        // No confirmation - Immediate Action
        get(todosRef).then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const updates = {};
                let hasDeletedItems = false;

                Object.keys(data).forEach(key => {
                    if (data[key].deleted) {
                        updates[key] = null; // Delete
                        hasDeletedItems = true;
                    }
                });

                if (hasDeletedItems) {
                    update(todosRef, updates).then(() => {
                        console.log("Trash emptied successfully");
                    }).catch((error) => {
                        console.error("Error emptying trash: ", error);
                        alert("Error emptying trash.");
                    });
                } else {
                    alert("Trash is already empty.");
                }
            }
        }).catch((error) => {
            console.error("Error fetching data for empty trash: ", error);
        });
    }

    function renderDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = new Date().toLocaleDateString('en-GB', options);
    }

    function clearAll() {
        if (confirm('Are you sure you want to delete all tasks? This cannot be undone.')) {
            try {
                remove(todosRef);
            } catch (e) {
                console.error("Error clearing all todos: ", e);
            }
        }
    }

    function addTodo() {
        const text = todoInput.value.trim();
        const priority = prioritySelect.value;
        const deadline = deadlineInput.value;
        const note = noteInput.value.trim();

        if (text === '') return;

        try {
            const newTodoRef = push(todosRef);
            set(newTodoRef, {
                text: text,
                priority: priority,
                deadline: deadline,
                note: note,
                completed: false,
                createdAt: Date.now()
            });
            todoInput.value = '';
            noteInput.value = '';
            deadlineInput.value = '';
            todoInput.focus();
        } catch (e) {
            console.error("Error adding item: ", e);
            alert("할 일을 추가하는 중 오류가 발생했습니다.");
        }
    }



    function toggleComplete(id, currentStatus) {
        try {
            const updates = {
                completed: !currentStatus
            };
            if (!currentStatus) {
                updates.completedAt = Date.now();
            } else {
                updates.completedAt = null;
            }
            update(ref(db, `todos/${id}`), updates);
        } catch (e) {
            console.error("Error updating item: ", e);
        }
    }

    function updateEvaluation(id, field, value) {
        try {
            const updates = {};
            updates[`evaluation/${field}`] = value;
            update(ref(db, `todos/${id}`), updates);
        } catch (e) {
            console.error("Error updating evaluation: ", e);
        }
    }

    function cyclePriority(id, currentPriority) {
        const priorities = ['low', 'medium', 'high'];
        const currentIndex = priorities.indexOf(currentPriority || 'medium');
        const nextPriority = priorities[(currentIndex + 1) % priorities.length];

        try {
            update(ref(db, `todos/${id}`), {
                priority: nextPriority
            });
        } catch (e) {
            console.error("Error cycling priority: ", e);
        }
    }

    function formatDeadline(deadline) {
        if (!deadline) return '';
        const date = new Date(deadline);
        const options = { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('ko-KR', options);
    }

    function editTodo(id, todo, li) {
        const todoInfo = li.querySelector('.todo-info');
        const originalContent = todoInfo.innerHTML;

        // ... (rest of editTodo implementation remains the same, but for brevity I'll just keep the existing logic if I'm not changing it. 
        // Wait, I need to be careful with replace_file_content. I should only replace the toggleComplete function and add the helper, 
        // and then separately update renderTodos. 
        // Actually, I can do it in chunks if they are close, but they might not be.
        // Let's look at the file content again. toggleComplete is around line 90. renderTodos is around 280.
        // I will do separate calls.)

        // Create edit container
        const editContainer = document.createElement('div');
        editContainer.className = 'edit-container';

        // Main Row (Text)
        const mainRow = document.createElement('div');
        mainRow.className = 'edit-main-row';

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = todo.text;
        textInput.className = 'edit-input-text';
        textInput.placeholder = '할 일';

        mainRow.appendChild(textInput);

        // Details Row (Deadline)
        const detailsRow = document.createElement('div');
        detailsRow.className = 'edit-details-row';

        const deadlineInput = document.createElement('input');
        deadlineInput.type = 'text'; // Changed to text for Flatpickr
        deadlineInput.value = todo.deadline || '';
        deadlineInput.className = 'edit-input-deadline';

        // Initialize Flatpickr
        flatpickr(deadlineInput, {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            time_24hr: true,
            disableMobile: "true"
        });

        detailsRow.appendChild(deadlineInput);

        // Note Row (Textarea)
        const noteRow = document.createElement('div');
        noteRow.className = 'edit-note-row';

        const noteInput = document.createElement('textarea');
        noteInput.value = todo.note || '';
        noteInput.className = 'edit-input-note';
        noteInput.placeholder = '메모';
        noteInput.rows = 3; // Ensure at least 3 lines

        noteRow.appendChild(noteInput);

        // Buttons
        const btnContainer = document.createElement('div');
        btnContainer.className = 'edit-btn-container';

        const completeBtn = document.createElement('button');
        completeBtn.textContent = '수정완료';
        completeBtn.className = 'save-btn';
        completeBtn.style.width = '100%'; // Full width

        btnContainer.appendChild(completeBtn);

        editContainer.appendChild(mainRow);
        editContainer.appendChild(detailsRow);
        editContainer.appendChild(noteRow);
        editContainer.appendChild(btnContainer);

        // Replace content
        li.classList.add('editing-mode');
        todoInfo.innerHTML = '';
        todoInfo.appendChild(editContainer);
        textInput.focus();

        const cancel = () => {
            li.classList.remove('editing-mode');
            todoInfo.innerHTML = originalContent;
            document.removeEventListener('click', handleOutsideClick);

            // Re-attach Note Listeners if note exists
            if (todo.note) {
                const noteInput = li.querySelector(`#note-${todo.id}`);
                const noteEditBtn = li.querySelector(`#note-edit-${todo.id}`);
                const noteSaveBtn = li.querySelector(`#note-save-${todo.id}`);

                if (noteInput && noteEditBtn && noteSaveBtn) {
                    noteEditBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        noteInput.disabled = false;
                        noteInput.focus();
                        noteEditBtn.classList.add('hidden');
                        noteSaveBtn.classList.remove('hidden');
                        li.querySelector('.todo-notes').style.maxHeight = 'none';
                        li.querySelector('.todo-notes').style.opacity = '1';
                    });

                    noteSaveBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const newNote = noteInput.value.trim();
                        try {
                            update(ref(db, `todos/${todo.id}`), {
                                note: newNote
                            });
                        } catch (e) {
                            console.error("Error updating note: ", e);
                        }
                        noteInput.disabled = true;
                        noteSaveBtn.classList.add('hidden');
                        noteEditBtn.classList.remove('hidden');
                        li.querySelector('.todo-notes').style.maxHeight = '';
                        li.querySelector('.todo-notes').style.opacity = '';
                    });
                }
            }
        };

        const handleOutsideClick = (e) => {
            if (!editContainer.contains(e.target)) {
                cancel();
            }
        };

        // Delay adding the listener to avoid immediate trigger from the open button click
        setTimeout(() => {
            document.addEventListener('click', handleOutsideClick);
        }, 0);

        const complete = async () => {
            const newText = textInput.value.trim();
            const newDeadline = deadlineInput.value;
            const newNote = noteInput.value.trim();

            if (newText) {
                completeBtn.textContent = 'Saving...';
                completeBtn.disabled = true;
                try {
                    await update(ref(db, `todos/${id}`), {
                        text: newText,
                        deadline: newDeadline,
                        note: newNote
                    });
                    // Success
                    li.classList.remove('editing-mode');
                    document.removeEventListener('click', handleOutsideClick);
                } catch (e) {
                    console.error("Error updating item: ", e);
                    alert("Error updating item.");
                    completeBtn.textContent = 'Saved';
                    completeBtn.disabled = false;
                }
            } else {
                alert("Please enter a task.");
            }
        };

        completeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            complete();
        });

        // Enter key to save
        [textInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') complete();
            });
        });
    }

    function deleteTodo(id) {
        try {
            // Soft delete: Move to trash
            update(ref(db, `todos/${id}`), {
                deleted: true,
                deletedAt: Date.now()
            });
        } catch (e) {
            console.error("Error moving to trash: ", e);
        }
    }

    function restoreTodo(id) {
        try {
            update(ref(db, `todos/${id}`), {
                deleted: null,
                deletedAt: null
            });
        } catch (e) {
            console.error("Error restoring todo: ", e);
        }
    }

    function permanentDeleteTodo(id) {
        if (confirm('Are you sure you want to permanently delete this? This cannot be undone.')) {
            try {
                remove(ref(db, `todos/${id}`));
            } catch (e) {
                console.error("Error permanently deleting todo: ", e);
            }
        }
    }

    // Trash Dock Elements
    const trashDock = document.getElementById('trash-dock');
    const trashHeader = document.getElementById('trash-header');
    const emptyTrashBtn = document.getElementById('empty-trash');

    if (trashHeader && trashDock) {
        trashHeader.addEventListener('click', () => {
            trashDock.classList.toggle('expanded');
        });
    }

    if (emptyTrashBtn) {
        emptyTrashBtn.addEventListener('click', emptyTrash);
    }

    // Close trash dock on outside click
    document.addEventListener('click', (e) => {
        if (trashDock && trashDock.classList.contains('expanded') && !trashDock.contains(e.target)) {
            trashDock.classList.remove('expanded');
        }
    });

    function renderTodos(todos) {
        const activeList = document.getElementById('todoList');
        const achievedList = document.getElementById('achievedList');
        const trashListContainer = document.getElementById('trashList');

        if (!activeList || !achievedList || !trashListContainer) return;

        activeList.innerHTML = '';
        achievedList.innerHTML = '';
        trashListContainer.innerHTML = '';

        // Sort: High Priority > Medium > Low, then by Date
        const priorityWeight = { high: 3, medium: 2, low: 1 };

        todos.sort((a, b) => {
            // 1. Sort by priority (High > Medium > Low)
            const pA = priorityWeight[a.priority || 'medium'];
            const pB = priorityWeight[b.priority || 'medium'];
            if (pA !== pB) return pB - pA;

            // 2. Sort by Deadline (Has Deadline > No Deadline)
            // If both have deadlines, closer deadline first
            if (a.deadline && b.deadline) {
                return new Date(a.deadline) - new Date(b.deadline);
            }
            if (a.deadline && !b.deadline) return -1; // a comes first
            if (!a.deadline && b.deadline) return 1;  // b comes first

            // 3. If no deadlines (or equal), sort by creation date (newest first)
            return b.createdAt - a.createdAt;
        });

        let activeCount = 0;
        let trashCount = 0;

        todos.forEach(todo => {
            // Handle Deleted Items (Trash)
            if (todo.deleted) {
                trashCount++;
                const div = document.createElement('div');
                div.className = 'trash-item';
                div.innerHTML = `
                    <div class="trash-info">
                        <span class="trash-text">${escapeHtml(todo.text)}</span>
                        <span style="font-size: 0.7rem; color: var(--text-muted);">Deleted: ${new Date(todo.deletedAt).toLocaleString()}</span>
                    </div>
                    <div class="trash-actions">
                        <button class="restore-btn" id="restore-${todo.id}"><i class="fas fa-undo"></i></button>
                        <button class="perm-delete-btn" id="perm-delete-${todo.id}"><i class="fas fa-trash"></i></button>
                    </div>
                `;

                div.querySelector(`#restore-${todo.id}`).addEventListener('click', () => restoreTodo(todo.id));
                div.querySelector(`#perm-delete-${todo.id}`).addEventListener('click', () => permanentDeleteTodo(todo.id));

                trashListContainer.appendChild(div);
                return; // Skip rendering in main lists
            }

            const li = document.createElement('li');
            const priority = todo.priority || 'medium';
            li.className = `todo-item ${todo.completed ? 'completed' : ''} priority-${priority}`;
            li.dataset.id = todo.id;

            const priorityLabel = {
                'low': 'Low',
                'medium': 'Medium',
                'high': 'High'
            }[priority];

            // Common Content
            const deadlineHtml = todo.deadline ? `<span class="deadline-badge"><i class="far fa-clock"></i> ${formatDeadline(todo.deadline)}</span>` : '';

            if (!todo.completed) {
                // Active Task Layout
                activeCount++;
                const dropdownSection = `
                    <div class="todo-notes">
                        <div class="feedback-wrapper">
                            <div class="dropdown-inputs">
                                <div class="dropdown-row">
                                    <label><i class="far fa-clock"></i></label>
                                    <input type="text" class="dropdown-deadline" id="deadline-${todo.id}" value="${todo.deadline || ''}" placeholder="Set deadline">
                                </div>
                                <textarea class="feedback-input note-input" id="note-${todo.id}" placeholder="Enter a note...">${escapeHtml(todo.note || '')}</textarea>
                            </div>
                            <div class="feedback-actions">
                                <button class="fb-btn save" id="dropdown-save-${todo.id}">Save</button>
                            </div>
                        </div>
                    </div>
                `;

                li.innerHTML = `
                    <div class="priority-strip" id="strip-${todo.id}" data-label="${priorityLabel}"></div>
                    <div class="todo-main">
                        <button class="check-btn" id="check-${todo.id}">
                            <i class="fas fa-check"></i>
                        </button>
                        <div class="todo-info">
                            <div class="todo-header">
                                <span class="todo-text">${escapeHtml(todo.text)}</span>
                                ${deadlineHtml}
                            </div>
                            ${dropdownSection}
                        </div>
                        <div class="actions">
                            <button class="icon-btn delete" id="delete-${todo.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;

                // Initialize Flatpickr
                flatpickr(li.querySelector(`#deadline-${todo.id}`), {
                    enableTime: true,
                    dateFormat: "Y-m-d H:i",
                    time_24hr: true,
                    disableMobile: "true",
                    locale: { firstDayOfWeek: 1 }
                });

                // Listeners
                li.querySelector(`#check-${todo.id}`).addEventListener('click', () => toggleComplete(todo.id, todo.completed));
                li.querySelector(`#delete-${todo.id}`).addEventListener('click', () => deleteTodo(todo.id));
                li.querySelector(`#strip-${todo.id}`).addEventListener('click', (e) => {
                    e.stopPropagation();
                    cyclePriority(todo.id, priority);
                });

                // Dropdown Save
                const saveBtn = li.querySelector(`#dropdown-save-${todo.id}`);
                const noteInput = li.querySelector(`#note-${todo.id}`);
                const deadlineInput = li.querySelector(`#deadline-${todo.id}`);

                saveBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const newNote = noteInput.value.trim();
                    const newDeadline = deadlineInput.value;

                    saveBtn.textContent = 'Saving...';
                    saveBtn.disabled = true;

                    try {
                        await update(ref(db, `todos/${todo.id}`), {
                            note: newNote,
                            deadline: newDeadline
                        });
                        saveBtn.textContent = 'Saved';
                        setTimeout(() => {
                            saveBtn.textContent = 'Save';
                            saveBtn.disabled = false;
                        }, 1000);
                    } catch (e) {
                        console.error("Error updating todo: ", e);
                        alert("Error saving.");
                        saveBtn.textContent = 'Save';
                        saveBtn.disabled = false;
                    }
                });

                activeList.appendChild(li);

            } else {
                // Achieved Task Layout
                const rating = todo.evaluation?.rating || '';
                const feedback = todo.evaluation?.feedback || '';

                const ratingLabels = {
                    'high': 'Nailed It',
                    'medium': 'Solid Work',
                    'low': "It's Done"
                };

                const ratingBadge = rating ? `<span class="rating-badge ${rating}">${ratingLabels[rating]}</span>` : '';

                // Time Comparison Logic
                let timeComparisonHtml = '';
                if (todo.deadline && todo.completedAt) {
                    const deadlineDate = new Date(todo.deadline);
                    const completedDate = new Date(todo.completedAt);
                    const diffMs = completedDate - deadlineDate;
                    const diffMins = Math.floor(Math.abs(diffMs) / 60000);
                    const diffHrs = Math.floor(diffMins / 60);
                    const remainingMins = diffMins % 60;

                    let diffText = '';
                    if (diffHrs > 0) diffText += `${diffHrs}h `;
                    diffText += `${remainingMins}m`;

                    let statusClass = '';
                    let statusIcon = '';
                    let statusLabel = '';

                    if (diffMs > 0) {
                        statusClass = 'late';
                        statusIcon = '<i class="fas fa-exclamation-circle"></i>';
                        statusLabel = 'Late';
                    } else {
                        statusClass = 'early';
                        statusIcon = '<i class="fas fa-check-circle"></i>';
                        statusLabel = 'On Time';
                    }

                    timeComparisonHtml = `
                        <div class="time-comparison ${statusClass}" id="time-comp-${todo.id}">
                            <div class="time-summary">
                                ${statusIcon} <strong>${diffText}</strong> ${statusLabel}
                                <button class="icon-btn edit-time-btn" id="edit-time-${todo.id}" style="margin-left: auto; font-size: 0.8rem; opacity: 0.7;">
                                    <i class="fas fa-pen"></i>
                                </button>
                            </div>
                            <div class="time-details" id="time-details-${todo.id}">
                                <div class="time-detail-row">
                                    <i class="far fa-clock"></i> <span>Due: ${formatDeadline(todo.deadline)}</span>
                                </div>
                                <div class="time-detail-row">
                                    <i class="fas fa-check"></i> <span>Done: ${formatDeadline(todo.completedAt)}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }

                li.innerHTML = `
                    <div class="todo-main">
                        <button class="check-btn" id="check-${todo.id}">
                            <i class="fas fa-check"></i>
                        </button>
                        <div class="todo-info">
                            <div class="todo-header">
                                <span class="todo-text">${escapeHtml(todo.text)}</span>
                                ${ratingBadge}
                            </div>
                            ${timeComparisonHtml}
                        </div>
                        <div class="actions">
                            <button class="icon-btn delete" id="delete-${todo.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    
                    <div class="evaluation-box">
                        <div class="rating-group">
                            <button class="rating-btn ${rating === 'high' ? 'selected' : ''}" data-val="high" id="rate-high-${todo.id}">Nailed It</button>
                            <button class="rating-btn ${rating === 'medium' ? 'selected' : ''}" data-val="medium" id="rate-medium-${todo.id}">Solid Work</button>
                            <button class="rating-btn ${rating === 'low' ? 'selected' : ''}" data-val="low" id="rate-low-${todo.id}">It's Done</button>
                        </div>
                        <div class="feedback-wrapper">
                            <textarea class="feedback-input" id="feedback-${todo.id}" placeholder="Self-feedback..." disabled>${feedback}</textarea>
                            <div class="feedback-actions">
                                <button class="fb-btn edit" id="fb-edit-${todo.id}">수정</button>
                                <button class="fb-btn save hidden" id="fb-save-${todo.id}">저장</button>
                            </div>
                        </div>
                    </div>
                `;

                // Listeners
                li.querySelector(`#check-${todo.id}`).addEventListener('click', () => toggleComplete(todo.id, todo.completedAt));
                li.querySelector(`#delete-${todo.id}`).addEventListener('click', () => deleteTodo(todo.id));

                // Rating
                ['high', 'medium', 'low'].forEach(val => {
                    li.querySelector(`#rate-${val}-${todo.id}`).addEventListener('click', () => updateEvaluation(todo.id, 'rating', val));
                });

                // Feedback
                const fbInput = li.querySelector(`#feedback-${todo.id}`);
                const fbEditBtn = li.querySelector(`#fb-edit-${todo.id}`);
                const fbSaveBtn = li.querySelector(`#fb-save-${todo.id}`);

                fbEditBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    fbInput.disabled = false;
                    fbInput.focus();
                    fbEditBtn.classList.add('hidden');
                    fbSaveBtn.classList.remove('hidden');
                });

                fbSaveBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const newFeedback = fbInput.value.trim();
                    updateEvaluation(todo.id, 'feedback', newFeedback);
                    fbInput.disabled = true;
                    fbSaveBtn.classList.add('hidden');
                    fbEditBtn.classList.remove('hidden');
                });

                // Time Edit Logic
                if (todo.deadline && todo.completedAt) {
                    const editTimeBtn = li.querySelector(`#edit-time-${todo.id}`);
                    const timeDetails = li.querySelector(`#time-details-${todo.id}`);

                    if (editTimeBtn) {
                        editTimeBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const originalContent = timeDetails.innerHTML;

                            timeDetails.innerHTML = `
                                <div class="time-edit-container" style="display: flex; flex-direction: column; gap: 5px; margin-top: 5px;">
                                    <div style="display: flex; align-items: center; gap: 5px;">
                                        <label style="font-size: 0.7rem; color: var(--text-muted); width: 30px;">마감</label>
                                        <input type="datetime-local" id="edit-deadline-${todo.id}" value="${todo.deadline}" style="background: rgba(255,255,255,0.1); border: 1px solid var(--glass-border); color: white; border-radius: 4px; font-size: 0.8rem; padding: 2px;">
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 5px;">
                                        <label style="font-size: 0.7rem; color: var(--text-muted); width: 30px;">완료</label>
                                        <input type="datetime-local" id="edit-completed-${todo.id}" value="${todo.completedAt}" style="background: rgba(255,255,255,0.1); border: 1px solid var(--glass-border); color: white; border-radius: 4px; font-size: 0.8rem; padding: 2px;">
                                    </div>
                                    <div style="display: flex; justify-content: flex-end; gap: 5px; margin-top: 5px;">
                                        <button id="cancel-time-${todo.id}" style="background: transparent; border: 1px solid var(--glass-border); color: var(--text-muted); border-radius: 4px; padding: 2px 8px; font-size: 0.7rem; cursor: pointer;">취소</button>
                                        <button id="save-time-${todo.id}" style="background: var(--primary-color); border: none; color: white; border-radius: 4px; padding: 2px 8px; font-size: 0.7rem; cursor: pointer;">저장</button>
                                    </div>
                                </div>
                            `;

                            editTimeBtn.style.display = 'none';
                            timeDetails.style.maxHeight = 'none';
                            timeDetails.style.opacity = '1';

                            // Save
                            li.querySelector(`#save-time-${todo.id}`).addEventListener('click', (e) => {
                                e.stopPropagation();
                                const newDeadline = li.querySelector(`#edit-deadline-${todo.id}`).value;
                                const newCompletedAt = li.querySelector(`#edit-completed-${todo.id}`).value;

                                if (newDeadline && newCompletedAt) {
                                    update(ref(db, `todos/${todo.id}`), {
                                        deadline: newDeadline,
                                        completedAt: newCompletedAt
                                    });
                                }
                            });

                            // Cancel
                            li.querySelector(`#cancel-time-${todo.id}`).addEventListener('click', (e) => {
                                e.stopPropagation();
                                timeDetails.innerHTML = originalContent;
                                editTimeBtn.style.display = 'block';
                                timeDetails.style.maxHeight = '';
                                timeDetails.style.opacity = '';
                            });
                        });
                    }
                }

                achievedList.appendChild(li);
            }
        });

        // Update counts
        if (document.getElementById('itemsLeft')) {
            document.getElementById('itemsLeft').textContent = activeCount;
        }
        if (document.getElementById('trash-count')) {
            document.getElementById('trash-count').textContent = trashCount;
        }
    }

    function updateStats(todos) {
        const activeCount = todos.filter(todo => !todo.completed).length;
        itemsLeft.textContent = activeCount;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
