const STORAGE_KEY = 'econRevisionHubData';
const USERS_KEY = 'econRevisionHubUsers';
const CURRENT_USER_KEY = 'econRevisionHubCurrentUser';

const flashcardsByTopic = {
    'UCU 110': [
        { question: 'What is effective communication?', answer: 'The process of exchanging information in a clear, concise, and understandable manner.' },
        { question: 'What are key communication skills?', answer: 'Listening, speaking, writing, and non-verbal communication.' },
    ],
    'UCU 111': [
        { question: 'What is critical thinking?', answer: 'The objective analysis and evaluation of an issue in order to form a judgment.' },
        { question: 'Why is critical thinking important?', answer: 'It helps in making reasoned judgments and solving problems effectively.' },
    ],
    'UCU 106': [
        { question: 'What is ethics?', answer: 'The moral principles that govern a person\'s behavior or the conducting of an activity.' },
        { question: 'What is cultural diversity?', answer: 'The existence of differences in culture, ethnicity, and race among a group of people.' },
    ],
    'BBA 102': [
        { question: 'What are the principles of management?', answer: 'Planning, organizing, leading, and controlling.' },
        { question: 'What is the role of a manager?', answer: 'To coordinate and oversee the work of others to achieve organizational goals.' },
    ],
    'BAC 101': [
        { question: 'What is accounting?', answer: 'The process of recording, summarizing, and analyzing financial transactions.' },
        { question: 'What is the accounting equation?', answer: 'Assets = Liabilities + Equity.' },
    ],
    'BMS 101': [
        { question: 'What is insurance?', answer: 'A contract where an individual or entity receives financial protection or reimbursement against losses.' },
        { question: 'What are the types of insurance?', answer: 'Life, health, property, and liability insurance.' },
    ],
    'EET 101': [
        { question: 'What is macroeconomic theory?', answer: 'The study of the economy as a whole, including inflation, unemployment, and economic growth.' },
        { question: 'What is GDP?', answer: 'Gross Domestic Product: the total value of goods and services produced within a country in a specific time period.' },
    ],
    'K16': [
        { question: 'What does K16 Economics and Finance cover?', answer: 'Micro and macroeconomics, financial systems, accounting basics, and applied finance.' },
        { question: 'How to approach past papers for K16?', answer: 'Practice timed past papers, focus on common question patterns, and review model answers.' },
    ],
    'K14': [
        { question: 'What is K14 Economics Pure focus?', answer: 'Theoretical economics with emphasis on core economic models and proofs.' },
        { question: 'Study tip for K14', answer: 'Master derivations and practice problem sets regularly.' },
    ],
    'K24': [
        { question: 'What is K24 Economics and Statistics?', answer: 'Applied economics with strong emphasis on statistical methods and data analysis.' },
        { question: 'K24 study tip', answer: 'Work on statistical software examples and interpret data outputs.' },
    ],
};

// Merge curriculum topics with existing unit flashcards where available
flashcardsByTopic['K16'] = [
    ...(flashcardsByTopic['K16'] || []),
    ...(flashcardsByTopic['EET 101'] || []),
    ...(flashcardsByTopic['BAC 101'] || []),
    ...(flashcardsByTopic['BBA 102'] || []),
];

flashcardsByTopic['K14'] = [
    ...(flashcardsByTopic['K14'] || []),
    ...(flashcardsByTopic['EET 101'] || []),
];

flashcardsByTopic['K24'] = [
    ...(flashcardsByTopic['K24'] || []),
    ...(flashcardsByTopic['EET 101'] || []),
];

const state = {
    topic: 'UCU 110',
    cardIndex: 0,
    showAnswer: false,
};

const flashcardFront = document.getElementById('flashcardFront');
const flashcardBack = document.getElementById('flashcardBack');
const topicSelect = document.getElementById('topicSelect');
const showAnswerBtn = document.getElementById('showAnswerBtn');
const nextCardBtn = document.getElementById('nextCardBtn');
const sessionList = document.getElementById('sessionList');
const notesGrid = document.getElementById('notesGrid');
const papersGrid = document.getElementById('papersGrid');
const addPlanBtn = document.getElementById('addPlanBtn');
const addNoteBtn = document.getElementById('addNoteBtn');
const addPaperBtn = document.getElementById('addPaperBtn');
const researchInput = document.getElementById('researchInput');
const researchBtn = document.getElementById('researchBtn');
const modalOverlay = document.getElementById('modalOverlay');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalForm = document.getElementById('modalForm');
const modalTitle = document.getElementById('modalTitle');
const modalSubject = document.getElementById('modalSubject');
const modalDescription = document.getElementById('modalDescription');
const modalDuration = document.getElementById('modalDuration');
const modalLink = document.getElementById('modalLink');
const modalDurationField = document.querySelector('.modal-duration-field');
const modalLinkField = document.querySelector('.modal-link-field');
const startReviewBtn = document.getElementById('startReviewBtn');

const authOverlay = document.getElementById('authOverlay');
const authCloseBtn = document.getElementById('authCloseBtn');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authUsername = document.getElementById('authUsername');
const authPassword = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authToggleText = document.getElementById('authToggleText');
const authToggleMessage = document.getElementById('authToggleMessage');
const authToggleBtn = document.getElementById('authToggleBtn');
const userStatus = document.getElementById('userStatus');
const authButton = document.getElementById('authButton');
const logoutBtn = document.getElementById('logoutBtn');

const appState = {
    sessions: [],
    notes: [],
    papers: [],
    editingMode: 'session',
};

// Owner image UI removed — owner managed on About page now.


const authState = {
    users: {},
    currentUser: null,
    mode: 'signin',
    // When a protected link is clicked while not signed in, store the target here
    pendingNavigation: null,
};

function safeLocalStorageGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        console.warn('Local storage unavailable:', error);
        return null;
    }
}

function safeLocalStorageSet(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        console.warn('Unable to save to local storage:', error);
    }
}

function safeLocalStorageRemove(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn('Unable to remove local storage key:', error);
    }
}

function loadAppData() {
    const saved = JSON.parse(safeLocalStorageGet(STORAGE_KEY) || '{}');
    appState.sessions = saved.sessions || [];
    appState.notes = saved.notes || [];
    appState.papers = saved.papers || [];
    authState.users = JSON.parse(safeLocalStorageGet(USERS_KEY) || '{}');
    authState.currentUser = safeLocalStorageGet(CURRENT_USER_KEY);
    updateUserUI();
}

function saveAppData() {
    safeLocalStorageSet(STORAGE_KEY, JSON.stringify({
        sessions: appState.sessions,
        notes: appState.notes,
        papers: appState.papers,
    }));
}

function saveAuthData() {
    safeLocalStorageSet(USERS_KEY, JSON.stringify(authState.users));
    if (authState.currentUser) {
        safeLocalStorageSet(CURRENT_USER_KEY, authState.currentUser);
    } else {
        safeLocalStorageRemove(CURRENT_USER_KEY);
    }
}

function updateUserUI() {
    if (authState.currentUser) {
        userStatus.textContent = `Signed in as ${authState.currentUser}`;
        authButton.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
    } else {
        userStatus.textContent = 'Guest - sign in to save notes and papers';
        authButton.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
    }
}

function showAuthModal(mode = 'signin') {
    authState.mode = mode;
    authTitle.textContent = mode === 'signin' ? 'Sign In' : 'Create Account';
    authSubmitBtn.textContent = mode === 'signin' ? 'Sign In' : 'Sign Up';
    if (authToggleMessage) {
        authToggleMessage.textContent = mode === 'signin'
            ? 'Don’t have an account?'
            : 'Already have an account?';
    }
    if (authToggleBtn) {
        authToggleBtn.textContent = mode === 'signin' ? 'Sign Up' : 'Sign In';
    }
    authOverlay.classList.remove('hidden');
    authUsername.value = '';
    authPassword.value = '';
    authUsername.focus();
}

function attachToggleButtonListener() {
    if (!authToggleBtn) {
        return;
    }
    authToggleBtn.addEventListener('click', () => {
        showAuthModal(authState.mode === 'signin' ? 'signup' : 'signin');
    });
}

function closeAuthModal() {
    authOverlay.classList.add('hidden');
}

function requireLogin() {
    if (!authState.currentUser) {
        showAuthModal('signin');
        return false;
    }
    return true;
}

function openModal(mode) {
    if (!requireLogin()) {
        return;
    }
    appState.editingMode = mode;
    modalTitle.textContent = mode === 'note' ? 'Add Revision Note' : mode === 'paper' ? 'Add Past Paper' : 'Add Session';
    modalSubject.value = '';
    modalDescription.value = '';
    modalDuration.value = '30';
    modalLink.value = '';
    if (mode === 'paper') {
        modalDurationField.classList.add('hidden');
        modalLinkField.classList.remove('hidden');
    } else {
        modalDurationField.classList.remove('hidden');
        modalLinkField.classList.add('hidden');
    }
    modalOverlay.classList.remove('hidden');
}

function closeModal() {
    modalOverlay.classList.add('hidden');
}

function handleModalSubmit(event) {
    event.preventDefault();
    const subject = modalSubject.value.trim();
    const description = modalDescription.value.trim();
    const duration = Number(modalDuration.value);
    const link = modalLink.value.trim();
    if (!subject || !description) {
        return;
    }
    if (appState.editingMode === 'note') {
        appState.notes.push({ subject, text: description, addedBy: authState.currentUser || 'guest' });
        renderNotes();
    } else if (appState.editingMode === 'paper') {
        appState.papers.push({ subject, description, link, addedBy: authState.currentUser || 'guest' });
        renderPapers();
    } else {
        appState.sessions.push({ subject, description, duration, addedBy: authState.currentUser || 'guest' });
        renderSessions();
    }
    saveAppData();
    closeModal();
}

function handleStartReview() {
    const topics = Object.keys(flashcardsByTopic);
    const nextTopic = topics[Math.floor(Math.random() * topics.length)];
    topicSelect.value = nextTopic;
    changeTopic();
    document.querySelector('#flashcards').scrollIntoView({ behavior: 'smooth' });
}

function handleResearchSearch() {
    const query = researchInput.value.trim();
    if (!query) {
        researchInput.focus();
        return;
    }
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
}

function signOut() {
    authState.currentUser = null;
    saveAuthData();
    updateUserUI();
}

function handleAuthSubmit(event) {
    event.preventDefault();
    const username = authUsername.value.trim();
    const password = authPassword.value.trim();
    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }
    if (authState.mode === 'signin') {
        if (!authState.users[username] || authState.users[username] !== password) {
            alert('Invalid username or password.');
            return;
        }
        authState.currentUser = username;
        saveAuthData();
        updateUserUI();
        // After sign-in, redirect if we were trying to visit a protected page
        const target = authState.pendingNavigation;
        authState.pendingNavigation = null;
        closeAuthModal();
        if (target) {
            window.location.href = target;
        }
        return;
    }
    if (authState.users[username]) {
        alert('That username is already taken. Please choose another.');
        return;
    }
    authState.users[username] = password;
    authState.currentUser = username;
    saveAuthData();
    updateUserUI();
    // After sign-up, redirect if we were trying to visit a protected page
    const target2 = authState.pendingNavigation;
    authState.pendingNavigation = null;
    closeAuthModal();
    if (target2) {
        window.location.href = target2;
    }
}

function protectGoodsLinks() {
    // Pages that contain paid/goods content — require account to access
    const protectedSelectors = [
        'a[href$="k14.html"]',
        'a[href$="k16.html"]',
        'a[href$="k24.html"]'
    ];
    const anchors = document.querySelectorAll(protectedSelectors.join(','));
    anchors.forEach(a => {
        a.addEventListener('click', (e) => {
            if (!authState.currentUser) {
                e.preventDefault();
                // prompt the user to create an account
                authState.pendingNavigation = a.href;
                showAuthModal('signup');
            }
        });
    });
}

function updateFlashcard() {
    const cards = flashcardsByTopic[state.topic];
    const card = cards[state.cardIndex % cards.length];
    flashcardFront.textContent = card.question;
    flashcardBack.textContent = state.showAnswer ? card.answer : 'Click "Show Answer" to reveal.';
}

function nextFlashcard() {
    state.cardIndex += 1;
    state.showAnswer = false;
    updateFlashcard();
}

function toggleAnswer() {
    state.showAnswer = !state.showAnswer;
    updateFlashcard();
}

function changeTopic() {
    state.topic = topicSelect.value;
    state.cardIndex = 0;
    state.showAnswer = false;
    updateFlashcard();
}

function renderSessions() {
    if (appState.sessions.length === 0) {
        sessionList.innerHTML = '<li>No sessions yet. Add one to get started.</li>';
        return;
    }
    sessionList.innerHTML = appState.sessions
        .map(session => `
            <li class="session-card">
                <div>
                    <h4>${session.subject}</h4>
                    <p>${session.description}</p>
                    <p><em>Added by ${session.addedBy || 'guest'}</em></p>
                </div>
                <span class="badge">${session.duration} min</span>
            </li>
        `)
        .join('');
}

function renderNotes() {
    if (appState.notes.length === 0) {
        notesGrid.innerHTML = `
            <article class="note-card empty-note">
                <p>Use the button above to add your first revision note.</p>
            </article>
        `;
        return;
    }
    notesGrid.innerHTML = appState.notes
        .map(note => `
            <article class="note-card">
                <h4>${note.subject}</h4>
                <p>${note.text}</p>
                <p><em>Added by ${note.addedBy || 'guest'}</em></p>
            </article>
        `)
        .join('');
}

function renderPapers() {
    if (appState.papers.length === 0) {
        papersGrid.innerHTML = `
            <article class="paper-card empty-note">
                <p>Add your first past paper to build a revision archive.</p>
            </article>
        `;
        return;
    }
    papersGrid.innerHTML = appState.papers
        .map(paper => `
            <article class="paper-card">
                <h4>${paper.subject}</h4>
                <p>${paper.description}</p>
                ${paper.link ? `<a href="${paper.link}" target="_blank">View Paper</a>` : ''}
                <p><em>Added by ${paper.addedBy || 'guest'}</em></p>
            </article>
        `)
        .join('');
}

loadAppData();
updateFlashcard();
renderSessions();
renderNotes();
renderPapers();

topicSelect.addEventListener('change', changeTopic);
showAnswerBtn.addEventListener('click', toggleAnswer);
nextCardBtn.addEventListener('click', nextFlashcard);
addPlanBtn.addEventListener('click', () => openModal('session'));
addNoteBtn.addEventListener('click', () => openModal('note'));
addPaperBtn.addEventListener('click', () => openModal('paper'));
researchBtn.addEventListener('click', handleResearchSearch);
modalCloseBtn.addEventListener('click', closeModal);
modalForm.addEventListener('submit', handleModalSubmit);
startReviewBtn.addEventListener('click', handleStartReview);
modalOverlay.addEventListener('click', event => {
    if (event.target === modalOverlay) {
        closeModal();
    }
});

authButton.addEventListener('click', () => showAuthModal('signin'));
authCloseBtn.addEventListener('click', closeAuthModal);
authForm.addEventListener('submit', handleAuthSubmit);
authOverlay.addEventListener('click', event => {
    if (event.target === authOverlay) {
        closeAuthModal();
    }
});
logoutBtn.addEventListener('click', signOut);
attachToggleButtonListener();
protectGoodsLinks();
// If the index page is opened with #signup or #signup=<target>, automatically show the sign-up modal
if (window.location.hash && window.location.hash.startsWith('#signup')) {
    const hash = window.location.hash.substring(1); // remove '#'
    const parts = hash.split('=');
    const target = parts[1] ? parts[1] : null;
    if (target) {
        try {
            // convert to absolute URL if it's a relative path
            const abs = new URL(target, window.location.origin + window.location.pathname).href;
            authState.pendingNavigation = abs;
        } catch (e) {
            authState.pendingNavigation = target;
        }
    }
    showAuthModal('signup');
    try { history.replaceState(null, '', window.location.pathname); } catch (e) { /* ignore */ }
}
