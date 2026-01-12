/**
 * Yen-Doku
 */

// ===== Service Worker Registration =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('SW registered:', registration.scope);
            })
            .catch((error) => {
                console.log('SW registration failed:', error);
            });
    });
}

// ===== State =====
const state = {
    puzzle: null,
    grid: null,
    pencil: null,
    history: [],
    selected: null,
    pencilMode: false,
    difficulty: 'extreme',
    startTime: null,      // Hidden timer - revealed on completion
    elapsedPaused: 0,     // Accumulated time while tab was hidden
};

// ===== DOM =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const el = {
    grid: $('#sudoku-grid'),
    date: $('#puzzle-date'),
    error: $('#error-message'),
    toast: $('#toast'),
    btnPencil: $('#btn-pencil'),
    btnErase: $('#btn-erase'),
    btnHint: $('#btn-hint'),
    btnCheck: $('#btn-check'),
    btnUndo: $('#btn-undo'),
    btnReset: $('#btn-reset'),
    tabs: $$('.tab'),
    nums: $$('.num'),
    modal: $('#modal'),
    modalIcon: $('#modal-icon'),
    modalTitle: $('#modal-title'),
    modalMessage: $('#modal-message'),
    modalCancel: $('#modal-cancel'),
    modalConfirm: $('#modal-confirm'),
};

// ===== Utils =====
const today = () => new Date().toISOString().split('T')[0];
const year = (d) => d.split('-')[0];

// Fixed path - puzzles are at root level, site is a subdirectory
function path(date, diff) {
    return `../puzzles/${year(date)}/${diff}/${date}.json`;
}

// ===== Wake Lock (Screen Stay On) =====
let wakeLock = null;

/**
 * Request screen wake lock to prevent screen from dimming/locking during play.
 * Works on iOS 16.4+, Android Chrome 84+, Safari 16.4+, Firefox 126+.
 * Gracefully fails on unsupported browsers.
 */
async function requestWakeLock() {
    // Feature detection - silent fail if not supported
    if (!('wakeLock' in navigator)) {
        console.log('Wake Lock API not supported');
        return;
    }
    
    // Already have a lock
    if (wakeLock !== null) {
        return;
    }
    
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake Lock acquired');
        
        // Listen for release (e.g., tab switch, low battery)
        wakeLock.addEventListener('release', () => {
            console.log('Wake Lock released');
            wakeLock = null;
        });
    } catch (err) {
        // Wake lock request failed - usually system related (battery, power mode)
        console.log('Wake Lock request failed:', err.message);
        wakeLock = null;
    }
}

/**
 * Release wake lock when puzzle is completed or user leaves.
 */
async function releaseWakeLock() {
    if (wakeLock !== null) {
        try {
            await wakeLock.release();
            console.log('Wake Lock released manually');
        } catch (err) {
            console.log('Wake Lock release failed:', err.message);
        }
        wakeLock = null;
    }
}

// Auto-reacquire wake lock when tab becomes visible again
// Also handle timer pause/resume
let hiddenTime = null;

document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden') {
        // Tab hidden - record time for pause calculation
        hiddenTime = Date.now();
        saveGameState();  // Save progress when leaving
    } else if (document.visibilityState === 'visible') {
        // Tab visible - accumulate paused time
        if (hiddenTime && state.startTime) {
            state.elapsedPaused += Date.now() - hiddenTime;
            hiddenTime = null;
        }
        
        if (state.puzzle !== null) {
            await requestWakeLock();
        }
    }
});

/**
 * Format elapsed time as MM:SS or HH:MM:SS
 */
function formatElapsedTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// ===== Game State Persistence =====
const STORAGE_PREFIX = 'yen-doku-';
const STORAGE_MAX_AGE_DAYS = 30;

/**
 * Get storage key for a specific puzzle.
 */
function getStorageKey(date, difficulty) {
    return `${STORAGE_PREFIX}${date}-${difficulty}`;
}

/**
 * Save current game state to localStorage.
 * Called after each move (enter, erase, hint).
 */
function saveGameState() {
    if (!state.puzzle) return;
    
    const key = getStorageKey(state.puzzle.date, state.difficulty);
    const data = {
        grid: state.grid,
        pencil: state.pencil.map(row => row.map(set => [...set])), // Convert Sets to Arrays
        startTime: state.startTime,
        elapsedPaused: state.elapsedPaused,
        lastActive: Date.now(),
    };
    
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn('Failed to save game state:', e.message);
    }
}

/**
 * Load game state from localStorage.
 * Returns saved state or null if not found/invalid.
 */
function loadGameState(date, difficulty) {
    const key = getStorageKey(date, difficulty);
    
    try {
        const saved = localStorage.getItem(key);
        if (!saved) return null;
        
        const data = JSON.parse(saved);
        
        // Convert Arrays back to Sets for pencil marks
        if (data.pencil) {
            data.pencil = data.pencil.map(row => 
                row.map(arr => new Set(arr))
            );
        }
        
        return data;
    } catch (e) {
        console.warn('Failed to load game state:', e.message);
        return null;
    }
}

/**
 * Clear game state from localStorage.
 * Called on puzzle completion or reset.
 */
function clearGameState() {
    if (!state.puzzle) return;
    
    const key = getStorageKey(state.puzzle.date, state.difficulty);
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.warn('Failed to clear game state:', e.message);
    }
}

/**
 * Clean up old game states (older than 30 days).
 * Called on app init.
 */
function cleanupOldGameStates() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - STORAGE_MAX_AGE_DAYS);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    
    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(STORAGE_PREFIX)) {
                // Extract date from key: yen-doku-2026-01-12-extreme
                const match = key.match(/yen-doku-(\d{4}-\d{2}-\d{2})/);
                if (match && match[1] < cutoffStr) {
                    keysToRemove.push(key);
                }
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        if (keysToRemove.length > 0) {
            console.log(`Cleaned up ${keysToRemove.length} old game states`);
        }
    } catch (e) {
        console.warn('Failed to cleanup old game states:', e.message);
    }
}

function showLoadingSkeleton() {
    el.grid.innerHTML = '';
    for (let i = 0; i < 81; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell skeleton-cell';
        el.grid.appendChild(cell);
    }
}

function toast(msg, type = '') {
    el.toast.textContent = msg;
    el.toast.className = `toast ${type}`;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.toast.classList.add('hidden'), 2500);
}

function modal({ icon, title, message, confirm, danger, onConfirm }) {
    el.modalIcon.textContent = icon;
    el.modalTitle.textContent = title;
    el.modalMessage.textContent = message;
    el.modalConfirm.textContent = confirm;
    el.modalConfirm.className = `modal-btn ${danger ? 'modal-btn-danger' : 'modal-btn-primary'}`;
    el.modal.classList.remove('hidden');
    
    const cleanup = () => {
        el.modal.classList.add('hidden');
        el.modalConfirm.onclick = null;
        el.modalCancel.onclick = null;
    };
    
    el.modalCancel.onclick = cleanup;
    el.modalConfirm.onclick = () => { cleanup(); onConfirm(); };
}

// ===== Puzzle =====

/**
 * Validates puzzle JSON schema before use.
 * @param {Object} puzzle - The puzzle object to validate
 * @returns {boolean} True if valid, throws Error if invalid
 */
function validatePuzzle(puzzle) {
    const required = ['date', 'difficulty', 'grid', 'solution'];
    for (const field of required) {
        if (!(field in puzzle)) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
    
    // Validate grid dimensions
    if (!Array.isArray(puzzle.grid) || puzzle.grid.length !== 9) {
        throw new Error('Invalid grid: must be 9x9 array');
    }
    for (let i = 0; i < 9; i++) {
        if (!Array.isArray(puzzle.grid[i]) || puzzle.grid[i].length !== 9) {
            throw new Error(`Invalid grid row ${i}: must have 9 cells`);
        }
    }
    
    // Validate solution dimensions
    if (!Array.isArray(puzzle.solution) || puzzle.solution.length !== 9) {
        throw new Error('Invalid solution: must be 9x9 array');
    }
    for (let i = 0; i < 9; i++) {
        if (!Array.isArray(puzzle.solution[i]) || puzzle.solution[i].length !== 9) {
            throw new Error(`Invalid solution row ${i}: must have 9 cells`);
        }
    }
    
    // Validate cell values
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const gridVal = puzzle.grid[r][c];
            const solVal = puzzle.solution[r][c];
            if (!Number.isInteger(gridVal) || gridVal < 0 || gridVal > 9) {
                throw new Error(`Invalid grid value at [${r}][${c}]: ${gridVal}`);
            }
            if (!Number.isInteger(solVal) || solVal < 1 || solVal > 9) {
                throw new Error(`Invalid solution value at [${r}][${c}]: ${solVal}`);
            }
        }
    }
    
    return true;
}

/**
 * Core puzzle loading logic.
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} difficulty - Difficulty level
 * @param {boolean} fallbackToToday - If true, fallback to today's date on failure
 */
async function loadPuzzle(date, difficulty, fallbackToToday = false) {
    const puzzlePath = path(date, difficulty);
    console.log('Loading puzzle from:', puzzlePath);
    
    // Show loading state
    el.grid.classList.add('loading');
    showLoadingSkeleton();
    
    try {
        const res = await fetch(puzzlePath);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const puzzle = await res.json();
        
        // Validate puzzle schema before using
        validatePuzzle(puzzle);
        
        state.puzzle = puzzle;
        state.difficulty = difficulty;
        
        // Try to restore saved game state
        const saved = loadGameState(date, difficulty);
        if (saved && saved.grid) {
            console.log('Restoring saved game state');
            state.grid = saved.grid;
            state.pencil = saved.pencil || Array.from({ length: 9 }, () => 
                Array.from({ length: 9 }, () => new Set())
            );
            state.startTime = saved.startTime || Date.now();
            state.elapsedPaused = saved.elapsedPaused || 0;
        } else {
            // Fresh puzzle - no saved state
            state.grid = puzzle.grid.map(r => [...r]);
            state.pencil = Array.from({ length: 9 }, () => 
                Array.from({ length: 9 }, () => new Set())
            );
            state.startTime = Date.now();
            state.elapsedPaused = 0;
        }
        
        state.history = [];
        state.selected = null;
        
        el.date.textContent = formatDate(puzzle.date);
        el.error.classList.add('hidden');
        el.grid.classList.remove('loading');
        updateTabs();
        render();
        updateURL();
        
        // Keep screen on during gameplay
        requestWakeLock();
    } catch (e) {
        console.error('Failed to load puzzle:', e);
        el.grid.classList.remove('loading');
        
        // Fallback to today if loading a specific date failed
        if (fallbackToToday && date !== today()) {
            console.log('Falling back to today\'s puzzle');
            loadPuzzle(today(), difficulty, false);
            return;
        }
        
        el.error.textContent = 'No puzzle available. Check back after midnight UTC.';
        el.error.classList.remove('hidden');
        el.grid.innerHTML = '';
    }
}

async function load(difficulty) {
    return loadPuzzle(today(), difficulty, false);
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function updateTabs() {
    el.tabs.forEach(t => {
        const active = t.dataset.difficulty === state.difficulty;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', active);
    });
}

function updateURL() {
    const url = new URL(location);
    url.searchParams.set('difficulty', state.difficulty);
    url.searchParams.set('date', state.puzzle.date);
    history.replaceState({}, '', url);
}

// Load a specific date's puzzle (with fallback to today)
async function loadWithDate(date, difficulty) {
    return loadPuzzle(date, difficulty, true);
}

// ===== Render =====
function render() {
    el.grid.innerHTML = '';
    
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            el.grid.appendChild(createCell(r, c));
        }
    }
    
    updateNumpadState();
}

function createCell(row, col) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.row = row;
    cell.dataset.col = col;
    cell.tabIndex = 0; // Make focusable for keyboard navigation
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `Row ${row + 1}, Column ${col + 1}`);
    
    const given = state.puzzle.grid[row][col];
    const value = state.grid[row][col];
    const marks = state.pencil[row][col];
    
    if (given !== 0) {
        cell.classList.add('given');
        cell.textContent = given;
    } else if (value !== 0) {
        cell.classList.add('user');
        cell.textContent = value;
    } else if (marks.size > 0) {
        cell.classList.add('empty');
        cell.appendChild(createPencilMarks(marks));
    } else {
        cell.classList.add('empty');
    }
    
    // Selection and highlighting
    if (state.selected) {
        const { row: sr, col: sc } = state.selected;
        if (row === sr && col === sc) {
            cell.classList.add('selected');
        } else if (row === sr || col === sc) {
            // Highlight entire row and column for focus
            cell.classList.add('highlight');
        } else if (isRelated(row, col, sr, sc)) {
            cell.classList.add('related');
        }
    }
    
    // Conflicts
    if (value !== 0 && hasConflict(row, col, value)) {
        cell.classList.add('conflict');
    }
    
    return cell;
}

function createPencilMarks(marks) {
    const div = document.createElement('div');
    div.className = 'pencil';
    for (let n = 1; n <= 9; n++) {
        const span = document.createElement('span');
        span.textContent = marks.has(n) ? n : '';
        div.appendChild(span);
    }
    return div;
}

function isRelated(r1, c1, r2, c2) {
    if (r1 === r2) return true;
    if (c1 === c2) return true;
    return Math.floor(r1/3) === Math.floor(r2/3) && Math.floor(c1/3) === Math.floor(c2/3);
}

function hasConflict(row, col, val) {
    if (val === 0) return false;
    
    for (let c = 0; c < 9; c++) {
        if (c !== col && state.grid[row][c] === val) return true;
    }
    for (let r = 0; r < 9; r++) {
        if (r !== row && state.grid[r][col] === val) return true;
    }
    
    const br = Math.floor(row/3) * 3;
    const bc = Math.floor(col/3) * 3;
    for (let r = br; r < br + 3; r++) {
        for (let c = bc; c < bc + 3; c++) {
            if ((r !== row || c !== col) && state.grid[r][c] === val) return true;
        }
    }
    return false;
}

function updateNumpadState() {
    // Count occurrences of each number
    const counts = Array(10).fill(0);
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const v = state.grid[r][c];
            if (v > 0) counts[v]++;
        }
    }
    
    el.nums.forEach(btn => {
        const n = parseInt(btn.dataset.num);
        btn.classList.toggle('disabled', counts[n] >= 9);
    });
}

// ===== Interaction =====
function select(row, col) {
    console.log('Cell selected:', row, col);
    state.selected = { row, col };
    render();
}

function enter(num) {
    if (!state.selected) return;
    const { row, col } = state.selected;
    if (state.puzzle.grid[row][col] !== 0) return; // Can't edit given
    
    // Save history
    saveHistory();
    
    if (state.pencilMode) {
        // In pencil mode: if cell has a value, clear it first to allow pencil marks
        if (state.grid[row][col] !== 0 && num !== 0) {
            state.grid[row][col] = 0;
        }
        if (num === 0) {
            state.pencil[row][col].clear();
        } else {
            const marks = state.pencil[row][col];
            marks.has(num) ? marks.delete(num) : marks.add(num);
        }
    } else {
        // Normal mode: set value and clear pencil marks
        state.grid[row][col] = num;
        if (num !== 0) state.pencil[row][col].clear();
    }
    
    render();
    saveGameState();  // Persist progress
    checkWin();
}

function erase() {
    if (!state.selected) return;
    const { row, col } = state.selected;
    if (state.puzzle.grid[row][col] !== 0) return;
    
    saveHistory();
    state.grid[row][col] = 0;
    state.pencil[row][col].clear();
    render();
    saveGameState();  // Persist progress
}

function saveHistory() {
    state.history.push({
        grid: state.grid.map(r => [...r]),
        pencil: state.pencil.map(r => r.map(s => new Set(s))),
    });
    if (state.history.length > 50) state.history.shift();
}

function undo() {
    if (state.history.length === 0) {
        toast('Nothing to undo');
        return;
    }
    const prev = state.history.pop();
    state.grid = prev.grid;
    state.pencil = prev.pencil;
    render();
    saveGameState();  // Persist after undo
}

function togglePencil() {
    state.pencilMode = !state.pencilMode;
    el.btnPencil.classList.toggle('active', state.pencilMode);
}

function hint() {
    const empty = [];
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (state.puzzle.grid[r][c] === 0 && state.grid[r][c] === 0) {
                empty.push({ row: r, col: c });
            }
        }
    }
    
    if (empty.length === 0) {
        toast('No empty cells');
        return;
    }
    
    const { row, col } = empty[Math.floor(Math.random() * empty.length)];
    saveHistory();
    state.grid[row][col] = state.puzzle.solution[row][col];
    state.pencil[row][col].clear();
    state.selected = { row, col };
    
    render();
    
    // Animate
    const cells = el.grid.querySelectorAll('.cell');
    cells[row * 9 + col].classList.add('hint-reveal');
    
    toast('💡 Hint revealed');
    saveGameState();  // Persist progress
    checkWin();
}

function check() {
    let correct = 0, incorrect = 0, empty = 0;
    
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (state.puzzle.grid[r][c] !== 0) continue;
            
            const val = state.grid[r][c];
            const sol = state.puzzle.solution[r][c];
            
            if (val === 0) {
                empty++;
            } else if (val === sol) {
                correct++;
            } else {
                incorrect++;
            }
        }
    }
    
    // Count only - no highlighting (preserves challenge)
    if (incorrect === 0 && empty === 0) {
        checkWin();  // Trigger victory modal
    } else if (incorrect === 0) {
        toast(`${empty} cells remaining`);
    } else {
        toast(`${incorrect} incorrect`, 'error');
    }
}

function checkWin() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (state.grid[r][c] !== state.puzzle.solution[r][c]) return;
        }
    }
    
    // Victory! Clear saved state and release wake lock
    clearGameState();
    releaseWakeLock();
    
    // Calculate elapsed time (subtract paused time)
    const elapsed = state.startTime 
        ? (Date.now() - state.startTime - state.elapsedPaused) 
        : 0;
    const timeStr = formatElapsedTime(elapsed);
    
    // Show victory modal with time
    el.modalIcon.textContent = '🎉';
    el.modalTitle.textContent = 'Congratulations!';
    el.modalMessage.textContent = `Completed in ${timeStr}`;
    el.modalConfirm.textContent = 'New Puzzle';
    el.modalConfirm.className = 'modal-btn modal-btn-primary';
    el.modal.classList.remove('hidden');
    
    el.modalCancel.onclick = () => el.modal.classList.add('hidden');
    el.modalConfirm.onclick = () => {
        el.modal.classList.add('hidden');
        load(state.difficulty);
    };
}

function reset() {
    // Check if any progress
    let hasProgress = false;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (state.puzzle.grid[r][c] === 0) {
                if (state.grid[r][c] !== 0 || state.pencil[r][c].size > 0) {
                    hasProgress = true;
                    break;
                }
            }
        }
        if (hasProgress) break;
    }
    
    if (!hasProgress) {
        doReset();
        return;
    }
    
    modal({
        icon: '↻',
        title: 'Reset Puzzle?',
        message: 'This will clear all your progress and cannot be undone.',
        confirm: 'Reset',
        danger: true,
        onConfirm: doReset,
    });
}

function doReset() {
    state.grid = state.puzzle.grid.map(r => [...r]);
    state.pencil = Array.from({ length: 9 }, () => 
        Array.from({ length: 9 }, () => new Set())
    );
    state.history = [];
    state.selected = null;
    state.startTime = Date.now();  // Reset timer
    state.elapsedPaused = 0;
    clearGameState();  // Clear saved progress
    render();
    toast('Puzzle reset');
}

// ===== Keyboard =====
function onKey(e) {
    // Modal open
    if (!el.modal.classList.contains('hidden')) {
        if (e.key === 'Escape') el.modalCancel.click();
        if (e.key === 'Enter') el.modalConfirm.click();
        return;
    }
    
    const key = e.key;
    
    // Numbers
    if (key >= '1' && key <= '9') {
        enter(parseInt(key));
        e.preventDefault();
        return;
    }
    
    // Delete
    if (key === 'Backspace' || key === 'Delete' || key === '0') {
        erase();
        e.preventDefault();
        return;
    }
    
    // Navigation
    if (state.selected) {
        let { row, col } = state.selected;
        if (key === 'ArrowUp' && row > 0) { select(row - 1, col); e.preventDefault(); }
        if (key === 'ArrowDown' && row < 8) { select(row + 1, col); e.preventDefault(); }
        if (key === 'ArrowLeft' && col > 0) { select(row, col - 1); e.preventDefault(); }
        if (key === 'ArrowRight' && col < 8) { select(row, col + 1); e.preventDefault(); }
    }
    
    // Shortcuts
    if (key === 'p' || key === 'P') { togglePencil(); e.preventDefault(); }
    if (key === 'h' || key === 'H') { hint(); e.preventDefault(); }
    if (key === 'z' && (e.metaKey || e.ctrlKey)) { undo(); e.preventDefault(); }
}

// ===== Init =====
function init() {
    // Cleanup old saved game states (older than 30 days)
    cleanupOldGameStates();
    
    // Grid cell clicks (event delegation)
    el.grid.addEventListener('click', (e) => {
        const cell = e.target.closest('.cell');
        if (cell) {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            select(row, col);
        }
    });
    
    // Difficulty tabs
    el.tabs.forEach(tab => {
        tab.onclick = () => load(tab.dataset.difficulty);
    });
    
    // Numpad
    el.nums.forEach(btn => {
        btn.onclick = () => enter(parseInt(btn.dataset.num));
    });
    
    // Toolbar
    el.btnPencil.onclick = togglePencil;
    el.btnErase.onclick = erase;
    el.btnHint.onclick = hint;
    el.btnCheck.onclick = check;
    el.btnUndo.onclick = undo;
    el.btnReset.onclick = reset;
    
    // Keyboard
    document.addEventListener('keydown', onKey);
    
    // Click outside grid deselects
    // Note: We check the grid rect because render() may have removed the clicked element
    document.addEventListener('click', (e) => {
        const gridRect = el.grid.getBoundingClientRect();
        const inGrid = e.clientX >= gridRect.left && e.clientX <= gridRect.right &&
                       e.clientY >= gridRect.top && e.clientY <= gridRect.bottom;
        const inNumpad = e.target.closest('.numpad');
        const inToolbar = e.target.closest('.toolbar');
        
        if (!inGrid && !inNumpad && !inToolbar) {
            state.selected = null;
            render();
        }
    });
    
    // Load from URL or default
    const params = new URLSearchParams(location.search);
    const diff = params.get('difficulty');
    const dateParam = params.get('date');
    const valid = ['easy', 'medium', 'hard', 'extreme'];
    const difficulty = valid.includes(diff) ? diff : 'extreme';
    
    // If date specified in URL, load that specific puzzle
    if (dateParam) {
        loadWithDate(dateParam, difficulty);
    } else {
        load(difficulty);
    }
}

init();
