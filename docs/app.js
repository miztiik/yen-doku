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
    startTime: null,
    revealed: false,
};

// ===== Storage Keys =====
const STORAGE_PREFIX = 'yen-doku-';
const STORAGE_RETENTION_DAYS = 7;

function getStorageKey(date, difficulty) {
    return `${STORAGE_PREFIX}${date}-${difficulty}`;
}

/**
 * Clean up puzzle saves older than STORAGE_RETENTION_DAYS
 */
function cleanupOldSaves() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - STORAGE_RETENTION_DAYS);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX) && !key.startsWith('yen-doku-best-')) {
            // Extract date from key: yen-doku-{date}-{difficulty}
            const match = key.match(/yen-doku-(\d{4}-\d{2}-\d{2})/);
            if (match) {
                const saveDate = match[1];
                if (saveDate < cutoffStr) {
                    keysToRemove.push(key);
                }
            }
        }
    }
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('🗑️ Cleaned up old save:', key);
    });
    
    if (keysToRemove.length > 0) {
        console.log(`🧹 Cleaned up ${keysToRemove.length} old puzzle saves`);
    }
}

// ===== DOM =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const el = {
    grid: $('#sudoku-grid'),
    date: $('#puzzle-date'),
    prevDay: $('#btn-prev-day'),
    nextDay: $('#btn-next-day'),
    error: $('#error-message'),
    toast: $('#toast'),
    btnPencil: $('#btn-pencil'),
    btnErase: $('#btn-erase'),
    btnHint: $('#btn-hint'),
    btnCheck: $('#btn-check'),
    btnReveal: $('#btn-reveal'),
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
// All dates in UTC only - no timezone conversions
const today = () => new Date().toISOString().split('T')[0];
const year = (d) => d.split('-')[0];

// Get yesterday's date (pure string math, no Date object timezone issues)
function yesterday(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().split('T')[0];
}

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

// ===== Best Time Tracking =====
const BEST_TIME_PREFIX = 'yen-doku-best-';

function getBestTime(difficulty) {
    try {
        const key = `${BEST_TIME_PREFIX}${difficulty}`;
        const saved = localStorage.getItem(key);
        return saved ? parseInt(saved, 10) : null;
    } catch (e) {
        return null;
    }
}

function saveBestTime(difficulty, ms) {
    try {
        const key = `${BEST_TIME_PREFIX}${difficulty}`;
        const current = getBestTime(difficulty);
        if (current === null || ms < current) {
            localStorage.setItem(key, ms.toString());
            return true; // New best!
        }
        return false;
    } catch (e) {
        return false;
    }
}

// ===== LocalStorage Persistence =====
function saveGame() {
    if (!state.puzzle) return;
    
    const key = getStorageKey(state.puzzle.date, state.difficulty);
    const saveData = {
        date: state.puzzle.date,
        difficulty: state.difficulty,
        grid: state.grid,
        pencil: state.pencil.map(row => row.map(set => [...set])),
        history: state.history.map(h => ({
            grid: h.grid,
            pencil: h.pencil.map(row => row.map(set => [...set]))
        })),
        startTime: state.startTime,
        savedAt: Date.now()
    };
    
    try {
        localStorage.setItem(key, JSON.stringify(saveData));
        console.log('💾 Saved:', key);
    } catch (e) {
        console.warn('Failed to save game:', e);
    }
}

function loadSavedGame(date, difficulty) {
    const key = getStorageKey(date, difficulty);
    try {
        const saved = localStorage.getItem(key);
        if (!saved) {
            console.log('❌ No saved state for:', key);
            return null;
        }
        
        console.log('✅ Found saved state:', key);
        const data = JSON.parse(saved);
        
        // Restore pencil marks as Sets
        data.pencil = data.pencil.map(row => row.map(arr => new Set(arr)));
        data.history = data.history.map(h => ({
            grid: h.grid,
            pencil: h.pencil.map(row => row.map(arr => new Set(arr)))
        }));
        
        return data;
    } catch (e) {
        console.warn('Failed to load saved game:', e);
        return null;
    }
}

function clearSavedGame() {
    if (!state.puzzle) return;
    const key = getStorageKey(state.puzzle.date, state.difficulty);
    try {
        localStorage.removeItem(key);
        console.log('🗑️ Cleared:', key);
    } catch (e) {
        console.warn('Failed to clear saved game:', e);
    }
}

// Puzzles path - convention-based with variant suffix
// Format: ./puzzles/{year}/{difficulty}/{date}-{variant}.json
function puzzlePath(date, diff, variant = 1) {
    const suffix = String(variant).padStart(3, '0');
    return `./puzzles/${year(date)}/${diff}/${date}-${suffix}.json`;
}

// Legacy alias for compatibility
function path(date, diff) {
    return puzzlePath(date, diff, 1);
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
 * Check if a puzzle exists for a given date using HEAD request (convention-based)
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} difficulty - Difficulty level
 * @param {number} variant - Puzzle variant number (default: 1)
 * @returns {Promise<boolean>} True if puzzle exists
 */
async function puzzleExists(date, difficulty, variant = 1) {
    try {
        const url = `${puzzlePath(date, difficulty, variant)}?_=${Date.now()}`;
        const res = await fetch(url, { method: 'HEAD' });
        return res.ok;
    } catch (e) {
        return false;
    }
}

/**
 * Find the latest available puzzle by probing backwards from a start date (convention-based)
 * @param {string} startDate - Date to start searching from
 * @param {string} difficulty - Difficulty level
 * @param {number} maxDays - Maximum days to search backwards (default: 7)
 * @returns {Promise<string|null>} Latest available date or null
 */
async function findLatestPuzzle(startDate, difficulty, maxDays = 7) {
    let date = startDate;
    for (let i = 0; i < maxDays; i++) {
        if (await puzzleExists(date, difficulty)) {
            return date;
        }
        date = yesterday(date);
    }
    return null;
}

/**
 * Get count of puzzle variants for a given date (convention-based, sequential 404)
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} difficulty - Difficulty level
 * @returns {Promise<number>} Number of variants (0 if none exist)
 */
async function getPuzzleVariantCount(date, difficulty) {
    let count = 0;
    while (await puzzleExists(date, difficulty, count + 1)) {
        count++;
        if (count >= 10) break; // Safety limit
    }
    return count;
}

/**
 * Core puzzle loading logic.
 * Uses convention-based probing for smart fallback (no index.json required).
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} difficulty - Difficulty level
 * @param {number} variant - Puzzle variant (default: 1)
 * @param {boolean} isFallback - Whether this is already a fallback attempt
 */
async function loadPuzzle(date, difficulty, variant = 1, isFallback = false) {
    // Cache-bust puzzle requests to avoid stale 404s
    const puzzleUrl = `${puzzlePath(date, difficulty, variant)}?_=${Date.now()}`;
    console.log(`[loadPuzzle] date=${date}, difficulty=${difficulty}, variant=${variant}, isFallback=${isFallback}`);
    console.log('[loadPuzzle] Fetching:', puzzleUrl);
    
    // Show loading state
    el.grid.classList.add('loading');
    showLoadingSkeleton();
    
    try {
        const res = await fetch(puzzleUrl);
        console.log(`[loadPuzzle] Response: ${res.status} ${res.ok ? 'OK' : 'FAIL'}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const puzzle = await res.json();
        
        // Validate puzzle schema before using
        validatePuzzle(puzzle);
        
        state.puzzle = puzzle;
        state.grid = puzzle.grid.map(r => [...r]);
        state.pencil = Array.from({ length: 9 }, () => 
            Array.from({ length: 9 }, () => new Set())
        );
        state.history = [];
        state.selected = null;
        state.difficulty = difficulty;
        state.startTime = Date.now();
        state.revealed = false;
        
        el.date.textContent = formatDate(puzzle.date);
        el.error.classList.add('hidden');
        el.grid.classList.remove('loading');
        el.grid.classList.remove('revealed'); // Remove revealed state from previous puzzle
        updateTabs();
        render();
        updateURL();
        updateDateNav(); // Update chevron states
        saveGame(); // Save initial state
    } catch (e) {
        console.error('Failed to load puzzle:', e);
        el.grid.classList.remove('loading');
        
        // Smart fallback: probe backwards to find latest available puzzle (convention-based)
        if (!isFallback) {
            console.log('[loadPuzzle] Probing for latest available puzzle...');
            const latestDate = await findLatestPuzzle(yesterday(date), difficulty);
            console.log(`[loadPuzzle] latestDate=${latestDate}, requestedDate=${date}`);
            if (latestDate) {
                console.log(`[loadPuzzle] Falling back to: ${latestDate}`);
                loadPuzzle(latestDate, difficulty, 1, true);
                return;
            }
            console.log('[loadPuzzle] No fallback possible');
        }
        
        el.error.textContent = 'No puzzle available. Check back later.';
        el.error.classList.remove('hidden');
        el.grid.innerHTML = '';
    }
}

async function load(difficulty) {
    // Preserve current date when switching difficulty, default to today for fresh load
    const targetDate = state.puzzle ? state.puzzle.date : today();
    
    // Check for saved game for this puzzle at new difficulty
    const saved = loadSavedGame(targetDate, difficulty);
    if (saved) {
        console.log('🔄 Resuming saved game for', targetDate, difficulty);
        return resumeGame(saved);
    }
    return loadPuzzle(targetDate, difficulty);
}

/**
 * Resume a saved game from localStorage
 */
async function resumeGame(saved) {
    const savedPuzzlePath = path(saved.date, saved.difficulty);
    
    try {
        const res = await fetch(savedPuzzlePath);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const puzzle = await res.json();
        validatePuzzle(puzzle);
        
        state.puzzle = puzzle;
        state.grid = saved.grid;
        state.pencil = saved.pencil;
        state.history = saved.history;
        state.selected = null;
        state.difficulty = saved.difficulty;
        state.startTime = saved.startTime;
        state.revealed = false;
        
        el.date.textContent = formatDate(puzzle.date);
        el.error.classList.add('hidden');
        el.grid.classList.remove('revealed'); // Ensure clean state
        updateTabs();
        render();
        updateURL();
        updateDateNav(); // Update chevron states
        
        toast('Game resumed');
    } catch (e) {
        console.error('Failed to resume, loading fresh:', e);
        clearSavedGame();
        loadPuzzle(today(), saved.difficulty);
    }
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

// Load a specific date's puzzle (convention-based fallback)
async function loadWithDate(date, difficulty) {
    // Check for saved game for this specific puzzle
    const saved = loadSavedGame(date, difficulty);
    if (saved) {
        console.log('🔄 Resuming saved game for', date, difficulty);
        return resumeGame(saved);
    }
    return loadPuzzle(date, difficulty);
}

// ===== Date Navigation =====
function nextDay(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().split('T')[0];
}

function goToPrevDay() {
    if (!state.puzzle) return;
    const prevDate = yesterday(state.puzzle.date);
    loadWithDate(prevDate, state.difficulty);
}

function goToNextDay() {
    if (!state.puzzle) return;
    const next = nextDay(state.puzzle.date);
    if (next > today()) return; // Can't go to future
    loadWithDate(next, state.difficulty);
}

/**
 * Update date navigation button states based on available puzzles (convention-based)
 */
async function updateDateNav() {
    if (!state.puzzle) {
        console.log('[updateDateNav] No puzzle loaded');
        return;
    }
    
    const currentDate = state.puzzle.date;
    const todayDate = today();
    
    console.log('[updateDateNav] currentDate:', currentDate, 'today:', todayDate);
    
    // Convention-based: probe previous and next dates with HEAD requests
    const prevDate = yesterday(currentDate);
    const nextDate = nextDay(currentDate);
    
    // Check if previous puzzle exists
    const prevExists = await puzzleExists(prevDate, state.difficulty);
    console.log('[updateDateNav] prevDate:', prevDate, 'exists:', prevExists);
    el.prevDay.disabled = !prevExists;
    
    // Hide next if we're at today (no future puzzles exist)
    const isToday = currentDate === todayDate;
    console.log('[updateDateNav] nextDate:', nextDate, 'isToday:', isToday);
    el.nextDay.style.visibility = isToday ? 'hidden' : 'visible';
    
    // Check if next puzzle exists (only if not already at today)
    if (!isToday) {
        const nextExists = await puzzleExists(nextDate, state.difficulty);
        console.log('[updateDateNav] nextExists:', nextExists);
        el.nextDay.disabled = !nextExists;
    }
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
    if (state.revealed) return; // Can't edit after reveal
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
    saveGame();
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
    saveGame();
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
    saveGame();
}

function togglePencil() {
    state.pencilMode = !state.pencilMode;
    el.btnPencil.classList.toggle('active', state.pencilMode);
}

function hint() {
    if (state.revealed) return; // Can't use hint after reveal
    
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
    saveGame();
    
    // Animate hint cell
    const cells = el.grid.querySelectorAll('.cell');
    cells[row * 9 + col].classList.add('hint-reveal');
    
    // Animate hint button with glow effect
    el.btnHint.classList.add('hint-active');
    setTimeout(() => {
        el.btnHint.classList.remove('hint-active');
    }, 800);
    
    toast('💡 Hint revealed');
    checkWin();
}

// ===== Reveal Solution =====
function revealSolution() {
    // Already revealed or solved? Skip
    if (state.revealed) {
        toast('Solution already revealed');
        return;
    }
    
    // Check if already solved
    let solved = true;
    for (let r = 0; r < 9 && solved; r++) {
        for (let c = 0; c < 9 && solved; c++) {
            if (state.grid[r][c] !== state.puzzle.solution[r][c]) {
                solved = false;
            }
        }
    }
    if (solved) {
        toast('✓ Already solved!');
        return;
    }
    
    modal({
        icon: '👁️',
        title: 'See the Solution?',
        message: 'Sometimes stepping back helps us learn. Ready to reveal the answer?',
        confirm: 'Show Me',
        danger: false,
        onConfirm: doReveal,
    });
}

function doReveal() {
    state.revealed = true;
    state.selected = null;
    
    const cells = el.grid.querySelectorAll('.cell');
    const revealData = [];
    
    // Collect reveal info for each cell
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const idx = r * 9 + c;
            const isClue = state.puzzle.grid[r][c] !== 0;
            const userVal = state.grid[r][c];
            const solVal = state.puzzle.solution[r][c];
            
            if (!isClue) {
                const wasEmpty = userVal === 0;
                const wasIncorrect = userVal !== 0 && userVal !== solVal;
                revealData.push({ r, c, idx, wasEmpty, wasIncorrect });
            }
            
            // Fill with solution
            state.grid[r][c] = solVal;
        }
    }
    
    // Clear notes
    state.pencil = Array.from({ length: 9 }, () => 
        Array.from({ length: 9 }, () => new Set())
    );
    
    // Render the solved grid
    render();
    
    // Add revealed class to grid (disables interaction)
    el.grid.classList.add('revealed');
    
    // Staggered animation for revealed cells
    revealData.forEach(({ r, c, idx, wasEmpty, wasIncorrect }, i) => {
        setTimeout(() => {
            const cell = el.grid.querySelectorAll('.cell')[idx];
            cell.classList.add('revealed');
            if (wasEmpty) cell.classList.add('was-empty');
            if (wasIncorrect) cell.classList.add('was-incorrect');
        }, i * 20); // 20ms stagger
    });
    
    // Clear saved game state
    clearSavedGame();
    
    const incorrectCount = revealData.filter(d => d.wasIncorrect).length;
    if (incorrectCount > 0) {
        toast(`Solution revealed • ${incorrectCount} were incorrect`);
    } else {
        toast('Solution revealed ✨');
    }
}

function check() {
    if (state.revealed) return; // Can't check after reveal
    
    // Already solved? Quick exit
    let solved = true;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (state.grid[r][c] !== state.puzzle.solution[r][c]) {
                solved = false;
                break;
            }
        }
        if (!solved) break;
    }
    if (solved) {
        toast('✓ Already solved!');
        return;
    }
    
    let correct = 0, incorrect = 0, empty = 0;
    const cells = el.grid.querySelectorAll('.cell');
    const markedCells = [];
    
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (state.puzzle.grid[r][c] !== 0) continue;
            
            const val = state.grid[r][c];
            const sol = state.puzzle.solution[r][c];
            const cell = cells[r * 9 + c];
            
            if (val === 0) {
                empty++;
            } else if (val === sol) {
                correct++;
                // Only mark incorrect cells - don't reveal correct ones
            } else {
                incorrect++;
                cell.classList.add('incorrect');
                markedCells.push(cell);
            }
        }
    }
    
    // Remove incorrect markers after 2 seconds
    if (markedCells.length > 0) {
        setTimeout(() => {
            markedCells.forEach(cell => cell.classList.remove('incorrect'));
        }, 2000);
    }
    
    // Smart messaging
    if (incorrect === 0 && empty === 0) {
        // Puzzle complete - celebration handles this
    } else if (incorrect > 0) {
        toast(`${incorrect} incorrect`, 'error');
    } else if (correct === 0) {
        toast(`${empty} cells to go`);
    } else {
        toast(`Looking good! ${empty} left`);
    }
}

function checkWin() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (state.grid[r][c] !== state.puzzle.solution[r][c]) return;
        }
    }
    
    // 🎉 VICTORY! Trigger celebration
    clearSavedGame(); // Puzzle complete, clear saved state
    celebrateWin();
}

// ===== Celebration =====
function celebrateWin() {
    const cells = el.grid.querySelectorAll('.cell');
    
    // 1. Staggered green reveal for user-added cells
    let delay = 0;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = cells[r * 9 + c];
            const isUserCell = state.puzzle.grid[r][c] === 0;
            
            if (isUserCell) {
                setTimeout(() => {
                    cell.classList.add('victory');
                }, delay);
                delay += 30; // Staggered animation
            }
        }
    }
    
    // 2. Launch confetti
    setTimeout(() => {
        createConfetti();
    }, 200);
    
    // 3. Show victory modal after cells animate
    setTimeout(() => {
        showVictoryModal();
    }, delay + 500);
}

function createConfetti() {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);
    
    for (let i = 0; i < 150; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        
        // Random shapes
        if (Math.random() > 0.5) {
            confetti.style.borderRadius = '50%';
        }
        
        container.appendChild(confetti);
    }
    
    // Clean up after animation
    setTimeout(() => container.remove(), 6000);
}

function showVictoryModal() {
    // Calculate elapsed time
    const elapsed = state.startTime ? Date.now() - state.startTime : 0;
    const timeStr = formatElapsedTime(elapsed);
    const difficulty = state.difficulty.charAt(0).toUpperCase() + state.difficulty.slice(1);
    
    // Check if new best time
    const isNewBest = saveBestTime(state.difficulty, elapsed);
    const bestTime = getBestTime(state.difficulty);
    const bestStr = bestTime ? formatElapsedTime(bestTime) : timeStr;
    
    // Best time display
    const bestTimeHtml = isNewBest 
        ? '<div class="best-time new-best">⭐ New Best!</div>'
        : `<div class="best-time">Best: ${bestStr}</div>`;
    
    const content = `
        <div class="victory-content">
            <div class="victory-icon">🏆</div>
            <h2 class="victory-title">Puzzle Complete!</h2>
            <div class="victory-stats">
                <div class="stat stat-hero">
                    <span class="stat-value">${timeStr}</span>
                    <span class="stat-label">Time</span>
                    ${bestTimeHtml}
                </div>
                <div class="stat">
                    <span class="stat-value">${difficulty}</span>
                    <span class="stat-label">Difficulty</span>
                </div>
            </div>
            <button class="victory-btn" onclick="closeVictoryModal()">Continue</button>
        </div>
    `;
    
    const overlay = document.createElement('div');
    overlay.className = 'victory-overlay';
    overlay.id = 'victory-modal';
    overlay.innerHTML = content;
    document.body.appendChild(overlay);
    
    // Animate in
    requestAnimationFrame(() => {
        overlay.classList.add('visible');
    });
}

function closeVictoryModal() {
    const overlay = document.getElementById('victory-modal');
    if (overlay) {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 300);
    }
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
    state.startTime = Date.now();
    state.revealed = false;
    el.grid.classList.remove('revealed'); // Re-enable interaction
    clearSavedGame();
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
    // Clean up old puzzle saves (older than 7 days)
    cleanupOldSaves();
    
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
    el.btnReveal.onclick = revealSolution;
    el.btnUndo.onclick = undo;
    el.btnReset.onclick = reset;
    
    // Tooltip dismiss on click (fixes sticky tooltips on touch devices)
    document.querySelectorAll('.tool[data-tooltip]').forEach(tool => {
        tool.addEventListener('click', function() {
            const tooltip = this.dataset.tooltip;
            this.removeAttribute('data-tooltip');
            setTimeout(() => {
                this.dataset.tooltip = tooltip;
            }, 100);
        });
        
        // For touch devices, clear hover state
        tool.addEventListener('touchend', function() {
            this.blur();
        });
    });
    
    // Date navigation
    el.prevDay.onclick = goToPrevDay;
    el.nextDay.onclick = goToNextDay;
    
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
