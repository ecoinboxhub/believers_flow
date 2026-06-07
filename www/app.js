// State Management
let state = {
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    prayerLogs: JSON.parse(localStorage.getItem('prayerLogs')) || [],
    studyPlan: JSON.parse(localStorage.getItem('studyPlan')) || { book: '', chapter: '' },
    currentFilter: 'all',
    currentView: 'tasks',
    apiKey: localStorage.getItem('groq_api_key') || ''
};

const verses = [
    { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
    { text: "For I know the plans I have for you, declares the Lord.", ref: "Jeremiah 29:11" },
    { text: "Be strong and courageous. Do not be afraid; do not be discouraged.", ref: "Joshua 1:9" },
    { text: "Trust in the Lord with all your heart.", ref: "Proverbs 3:5" },
    { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
    { text: "God is our refuge and strength, a very present help in trouble.", ref: "Psalm 46:1" }
];

// Selectors
const taskList = document.getElementById('task-list');
const taskInput = document.getElementById('task-input');
const taskCategory = document.getElementById('task-category');
const addTaskBtn = document.getElementById('add-task');
const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('.nav-item');
const filterBtns = document.querySelectorAll('.filter-btn');

// Initialization
function init() {
    renderTasks();
    updateBalance();
    renderPrayerHistory();
    renderStudyPlan();
    setRandomVerse();
    
    // View Switching
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            switchView(item.dataset.view);
        });
    });

    // Task Filtering
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    document.getElementById('log-prayer').addEventListener('click', logPrayer);
    document.getElementById('save-study').addEventListener('click', saveStudyPlan);
    document.getElementById('save-key').addEventListener('click', saveApiKey);
    document.getElementById('generate-ai').addEventListener('click', generateAiSuggestions);
}

// Core Functions
function switchView(viewId) {
    views.forEach(v => v.classList.add('hidden'));
    document.getElementById(`view-${viewId}`).classList.remove('hidden');
    state.currentView = viewId;
}

function setRandomVerse() {
    const verse = verses[Math.floor(Math.random() * verses.length)];
    document.getElementById('verse-text').innerText = `"${verse.text}"`;
    document.getElementById('verse-ref').innerText = verse.ref;
}

function saveState() {
    localStorage.setItem('tasks', JSON.stringify(state.tasks));
    localStorage.setItem('prayerLogs', JSON.stringify(state.prayerLogs));
    localStorage.setItem('studyPlan', JSON.stringify(state.studyPlan));
    updateBalance();
}

// Task Logic
function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const newTask = {
        id: Date.now(),
        text,
        category: taskCategory.value,
        completed: false,
        createdAt: new Date()
    };

    state.tasks.unshift(newTask);
    taskInput.value = '';
    saveState();
    renderTasks();
}

function toggleTask(id) {
    state.tasks = state.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveState();
    renderTasks();
}

function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveState();
    renderTasks();
}

function renderTasks() {
    taskList.innerHTML = '';
    const filtered = state.tasks.filter(t => {
        if (state.currentFilter === 'active') return !t.completed;
        if (state.currentFilter === 'completed') return t.completed;
        return true;
    });

    filtered.forEach(t => {
        const li = document.createElement('li');
        li.className = `task-item ${t.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTask(${t.id})">
            <div class="task-text">
                <span>${t.text}</span>
                <div class="task-cat ${t.category}">${t.category}</div>
            </div>
            <button class="delete-btn" onclick="deleteTask(${t.id})" style="background:none; color:#ff4d4d; padding:5px;">🗑</button>
        `;
        taskList.appendChild(li);
    });
}

// Spiritual Logic
function logPrayer() {
    const minutes = parseInt(document.getElementById('prayer-minutes').value);
    if (!minutes) return;

    state.prayerLogs.unshift({
        date: new Date().toLocaleDateString(),
        minutes
    });

    document.getElementById('prayer-minutes').value = '';
    saveState();
    renderPrayerHistory();
}

function renderPrayerHistory() {
    const history = document.getElementById('prayer-history');
    history.innerHTML = state.prayerLogs.slice(0, 5).map(log => 
        `<p style="font-size:0.8rem; border-bottom:1px solid #eee; padding:5px 0;">📅 ${log.date}: ${log.minutes} mins</p>`
    ).join('');
}

function saveStudyPlan() {
    state.studyPlan = {
        book: document.getElementById('study-book').value,
        chapter: document.getElementById('study-chapter').value
    };
    saveState();
    renderStudyPlan();
}

function renderStudyPlan() {
    const div = document.getElementById('study-current');
    if (state.studyPlan.book) {
        div.innerHTML = `<p style="margin-top:10px; color:var(--success-green);">Current Focus: 📖 ${state.studyPlan.book} ${state.studyPlan.chapter}</p>`;
    }
}

function updateBalance() {
    const total = state.tasks.length;
    if (total === 0) return;

    const spiritualCount = state.tasks.filter(t => t.category === 'spiritual').length;
    const spiritualPercent = Math.round((spiritualCount / total) * 100);
    const secularPercent = 100 - spiritualPercent;

    document.getElementById('balance-bar').style.width = `${spiritualPercent}%`;
    document.getElementById('balance-stats').innerText = `Spiritual: ${spiritualPercent}% | Secular: ${secularPercent}%`;
}

// AI Logic
function saveApiKey() {
    state.apiKey = document.getElementById('api-key').value;
    localStorage.setItem('groq_api_key', state.apiKey);
    alert("Key saved locally.");
}

async function generateAiSuggestions() {
    const box = document.getElementById('ai-response');
    if (!state.apiKey) {
        box.innerText = "Please save your GROQ API key first.";
        return;
    }

    box.innerText = "Thinking and praying for suggestions...";
    
    const taskNames = state.tasks.map(t => t.text).join(", ");
    const prompt = `As a Christian mentor, look at these tasks: [${taskNames}]. 
    Suggest 3 specific Christian activities or Bible study topics that would complement this day. 
    Keep it short, encouraging, and include 1 emoji per suggestion.`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: Math.stringify({
                model: "mixtral-8x7b-32768",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();
        box.innerText = data.choices[0].message.content;
    } catch (err) {
        box.innerText = "Couldn't reach the AI. Check your connection or API key.";
    }
}

// Expose functions to global scope for HTML inline calls
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;

init();
