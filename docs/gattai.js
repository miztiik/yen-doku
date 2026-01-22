/**
 * Gattai - Multi-Grid Sudoku (Samurai & Twin variants)
 * Yen-Doku Extension
 */

// ===== Mode Definitions (from data-model.md) =====
const GATTAI_MODES = {
    'samurai': {
        id: 'samurai',
        displayName: 'Samurai',
        gridCount: 5,
        logicalSize: { rows: 21, cols: 21 },
        gridPositions: {
            center: { row: 6, col: 6 },
            nw: { row: 0, col: 0 },
            ne: { row: 0, col: 12 },
            sw: { row: 12, col: 0 },
            se: { row: 12, col: 12 }
        },
        overlaps: [
            { grid1: 'center', grid2: 'nw', box1: 0, box2: 8 },
            { grid1: 'center', grid2: 'ne', box1: 2, box2: 6 },
            { grid1: 'center', grid2: 'sw', box1: 6, box2: 2 },
            { grid1: 'center', grid2: 'se', box1: 8, box2: 0 }
        ],
        gridOrder: ['nw', 'ne', 'center', 'sw', 'se']
    },
    'twin-nw': {
        id: 'twin-nw',
        displayName: 'Horizon',
        gridCount: 2,
        logicalSize: { rows: 15, cols: 15 },
        gridPositions: {
            primary: { row: 0, col: 0 },
            secondary: { row: 6, col: 6 }
        },
        overlaps: [
            { grid1: 'primary', grid2: 'secondary', box1: 8, box2: 0 }
        ],
        gridOrder: ['primary', 'secondary']
    },
    'twin-ne': {
        id: 'twin-ne',
        displayName: 'Sunrise',
        gridCount: 2,
        logicalSize: { rows: 15, cols: 15 },
        gridPositions: {
            primary: { row: 0, col: 6 },
            secondary: { row: 6, col: 0 }
        },
        overlaps: [
            { grid1: 'primary', grid2: 'secondary', box1: 6, box2: 2 }
        ],
        gridOrder: ['primary', 'secondary']
    },
    'twin-sw': {
        id: 'twin-sw',
        displayName: 'Sunset',
        gridCount: 2,
        logicalSize: { rows: 15, cols: 15 },
        gridPositions: {
            primary: { row: 6, col: 0 },
            secondary: { row: 0, col: 6 }
        },
        overlaps: [
            { grid1: 'primary', grid2: 'secondary', box1: 2, box2: 6 }
        ],
        gridOrder: ['primary', 'secondary']
    },
    'twin-se': {
        id: 'twin-se',
        displayName: 'Eclipse',
        gridCount: 2,
        logicalSize: { rows: 15, cols: 15 },
        gridPositions: {
            primary: { row: 6, col: 6 },
            secondary: { row: 0, col: 0 }
        },
        overlaps: [
            { grid1: 'primary', grid2: 'secondary', box1: 0, box2: 8 }
        ],
        gridOrder: ['primary', 'secondary']
    }
};

// ===== State =====
const state = {
    puzzle: null,
    currentGrids: {},      // Map<gridId, int[9][9]> - user's current values
    pencilMarks: {},       // Map<gridId, Set[9][9]> - pencil marks per cell
    history: [],           // Move[] - undo stack (max 50)
    selectedCell: null,    // { gridId, row, col } | null
    selectedGrid: null,    // string | null - active grid for highlighting
    pencilMode: false,
    mode: 'twin-nw',
    difficulty: 'easy',
    date: null,
    startTime: null,
    elapsedBeforePause: 0,
    revealed: false,
    timerInterval: null,
};

// ===== Constants =====
const STORAGE_PREFIX = 'yen-doku-gattai-';
const STORAGE_RETENTION_DAYS = 7;
const MAX_HISTORY = 50;
// T035: Best times and completion storage key prefixes for gattai
const BEST_TIMES_PREFIX = 'yen-doku-gattai-best-times-';
const COMPLETION_PREFIX = 'yen-doku-gattai-completed-';
// T035: Completion records are cleaned up after 30 days
const COMPLETION_RETENTION_DAYS = 30;

// ===== DOM Helpers =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const el = {
    container: null,
    date: null,
    prevDay: null,
    nextDay: null,
    error: null,
    toast: null,
    timer: null,
    modeTabs: null,
    difficultyTabs: null,
    btnPencil: null,
    btnErase: null,
    btnHint: null,
    btnCheck: null,
    btnReveal: null,
    btnUndo: null,
    btnReset: null,
    nums: null,
    modal: null,
    modalTitle: null,
    modalMessage: null,
    modalCancel: null,
    modalConfirm: null,
};

// ===== Utility Functions =====

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 */
function today() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get year from date string
 */
function year(dateStr) {
    return dateStr.split('-')[0];
}

/**
 * Get yesterday's date
 */
function yesterday(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().split('T')[0];
}

/**
 * Get tomorrow's date
 */
function tomorrow(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() + 1);
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

/**
 * Format date for display
 */
function formatDate(dateStr) {
    const [y, m, d] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
}

/**
 * Deep clone a 2D array
 */
function cloneGrid(grid) {
    return grid.map(row => [...row]);
}

/**
 * Get storage key for game state
 */
function getStorageKey(date, mode, difficulty) {
    return `${STORAGE_PREFIX}${date}-${mode}-${difficulty}`;
}

/**
 * Get best time storage key (legacy - single value)
 */
function getBestTimeKey(mode, difficulty) {
    return `${STORAGE_PREFIX}best-${mode}-${difficulty}`;
}

// ===== Best Times Functions (T038) =====

/**
 * T038: Get the localStorage key for best times array
 */
function getBestTimesKey(mode, difficulty) {
    return `${BEST_TIMES_PREFIX}${mode}-${difficulty}`;
}

/**
 * T038: Get top 3 best times for a mode/difficulty
 * @returns {Array<{ms: number, date: string|null}>}
 */
function getBestTimes(mode, difficulty) {
    try {
        const key = getBestTimesKey(mode, difficulty);
        const saved = localStorage.getItem(key);
        if (!saved) return [];
        const times = JSON.parse(saved);
        return Array.isArray(times) ? times : [];
    } catch (e) {
        return [];
    }
}

/**
 * T038: Save a new best time, keeping top 3 only
 * @returns {number|null} Rank (1, 2, or 3) if made leaderboard, null otherwise
 */
function saveBestTime(mode, difficulty, ms, date = null) {
    try {
        const key = getBestTimesKey(mode, difficulty);
        const times = getBestTimes(mode, difficulty);
        
        // Add new time
        times.push({ ms, date: date || state.date || null });
        
        // Sort by time ascending (fastest first)
        times.sort((a, b) => a.ms - b.ms);
        
        // Keep only top 3
        const top3 = times.slice(0, 3);
        
        // Find rank of the new time
        const rank = top3.findIndex(t => t.ms === ms && t.date === (date || state.date || null));
        
        localStorage.setItem(key, JSON.stringify(top3));
        
        // Return rank (1-indexed) if in top 3, null otherwise
        return rank !== -1 ? rank + 1 : null;
    } catch (e) {
        // T050: Handle localStorage quota exceeded
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.error('localStorage quota exceeded:', e);
            showToast('Storage full - best time not saved');
        } else {
            console.warn('Failed to save best time:', e);
        }
        return null;
    }
}

/**
 * T038: Get single best time for backward compatibility
 * @returns {number|null} Best time in ms, or null if no times recorded
 */
function getBestTime(mode, difficulty) {
    const times = getBestTimes(mode, difficulty);
    return times.length > 0 ? times[0].ms : null;
}

// ===== Completion Functions (T040) =====

/**
 * T040: Get the localStorage key for a completion record
 */
function getCompletionKey(date, mode, difficulty) {
    return `${COMPLETION_PREFIX}${date}-${mode}-${difficulty}`;
}

/**
 * T040: Save a completion record
 */
function saveCompletion(date, mode, difficulty, timeMs) {
    try {
        const key = getCompletionKey(date, mode, difficulty);
        const record = {
            date,
            mode,
            difficulty,
            timeMs,
            completedAt: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(record));
        console.log('🏆 Saved completion:', key);
    } catch (e) {
        // T050: Handle localStorage quota exceeded
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.error('localStorage quota exceeded:', e);
            showToast('Storage full - completion not saved');
        } else {
            console.warn('Failed to save completion:', e);
        }
    }
}

/**
 * T040: Get a completion record
 */
function getCompletion(date, mode, difficulty) {
    try {
        const key = getCompletionKey(date, mode, difficulty);
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        return null;
    }
}

/**
 * T040: Clear a completion record (for Play Again)
 */
function clearCompletion(date, mode, difficulty) {
    try {
        const key = getCompletionKey(date, mode, difficulty);
        localStorage.removeItem(key);
        console.log('🗑️ Cleared completion:', key);
    } catch (e) {
        console.warn('Failed to clear completion:', e);
    }
}

/**
 * T040: Check if a puzzle is completed
 */
function isCompleted(date, mode, difficulty) {
    return getCompletion(date, mode, difficulty) !== null;
}

// ===== URL Parameter Parsing =====

/**
 * Parse URL parameters for mode, difficulty, and date
 */
function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        mode: params.get('mode') || 'twin-nw',
        difficulty: params.get('difficulty') || 'easy',
        date: params.get('date') || today(),
        debug: params.get('debug') === 'true'
    };
}

/**
 * Update URL without page reload
 */
function updateUrl(mode, difficulty, date) {
    const url = new URL(window.location);
    url.searchParams.set('mode', mode);
    url.searchParams.set('difficulty', difficulty);
    url.searchParams.set('date', date);
    window.history.replaceState({}, '', url);
}

// ===== Overlap Utilities =====

/**
 * Get box index for a cell (0-8)
 */
function getBoxIndex(row, col) {
    return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

/**
 * Get cells in a box by box index
 */
function getBoxCells(boxIndex) {
    const boxRow = Math.floor(boxIndex / 3) * 3;
    const boxCol = (boxIndex % 3) * 3;
    const cells = [];
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            cells.push({ row: boxRow + r, col: boxCol + c });
        }
    }
    return cells;
}

/**
 * Get all overlapping cells for a mode
 * Returns Map<"gridId-row-col", { canonicalGrid, canonicalRow, canonicalCol }>
 */
function getOverlappingCells(modeId) {
    const mode = GATTAI_MODES[modeId];
    const overlapMap = new Map();
    
    for (const overlap of mode.overlaps) {
        const box1Cells = getBoxCells(overlap.box1);
        const box2Cells = getBoxCells(overlap.box2);
        
        // Map grid2's cells to grid1 (grid1 is canonical)
        for (let i = 0; i < 9; i++) {
            const cell1 = box1Cells[i];
            const cell2 = box2Cells[i];
            
            // grid1's cell is canonical
            const key1 = `${overlap.grid1}-${cell1.row}-${cell1.col}`;
            const key2 = `${overlap.grid2}-${cell2.row}-${cell2.col}`;
            
            overlapMap.set(key1, {
                isCanonical: true,
                pairedGrid: overlap.grid2,
                pairedRow: cell2.row,
                pairedCol: cell2.col
            });
            
            overlapMap.set(key2, {
                isCanonical: false,
                canonicalGrid: overlap.grid1,
                canonicalRow: cell1.row,
                canonicalCol: cell1.col
            });
        }
    }
    
    return overlapMap;
}

/**
 * Check if a cell is in an overlapping region
 */
function isOverlappingCell(modeId, gridId, row, col) {
    const overlapMap = getOverlappingCells(modeId);
    return overlapMap.has(`${gridId}-${row}-${col}`);
}

// ===== Puzzle Loading =====

/**
 * Check if a puzzle exists for a given date/mode/difficulty (HEAD request)
 */
async function puzzleExists(date, mode, difficulty) {
    const yr = year(date);
    const url = `puzzles/${yr}/gattai/${mode}/${difficulty}/${date}-001.json`;
    try {
        const res = await fetch(url, { method: 'HEAD' });
        return res.ok;
    } catch (e) {
        return false;
    }
}

/**
 * Find the most recent available puzzle by probing backwards
 */
async function findLatestPuzzle(startDate, mode, difficulty, maxDays = 7) {
    let date = startDate;
    for (let i = 0; i < maxDays; i++) {
        if (await puzzleExists(date, mode, difficulty)) {
            return date;
        }
        date = yesterday(date);
    }
    return null;
}

/**
 * Load a Gattai puzzle from the server
 */
async function loadGattaiPuzzle(date, mode, difficulty) {
    const yr = year(date);
    const url = `puzzles/${yr}/gattai/${mode}/${difficulty}/${date}-001.json`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Puzzle not found: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to load puzzle:', error);
        throw error;
    }
}

// ===== Grid Rendering =====

/**
 * Create a single 9×9 grid element
 */
function createGridElement(gridId, gridData, position, modeId) {
    const gridEl = document.createElement('div');
    gridEl.className = 'gattai-grid';
    gridEl.dataset.gridId = gridId;
    gridEl.style.setProperty('--grid-row', position.row);
    gridEl.style.setProperty('--grid-col', position.col);
    
    const overlapMap = getOverlappingCells(modeId);
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            // Check if this is a non-canonical overlapping cell (duplicate)
            const cellKey = `${gridId}-${row}-${col}`;
            const overlapInfo = overlapMap.get(cellKey);
            
            // Skip non-canonical overlap cells entirely - use empty placeholder
            if (overlapInfo && !overlapInfo.isCanonical) {
                const placeholder = document.createElement('div');
                placeholder.className = 'cell-placeholder';
                gridEl.appendChild(placeholder);
                continue;
            }
            
            const cellEl = document.createElement('div');
            cellEl.className = 'cell';
            cellEl.dataset.gridId = gridId;
            cellEl.dataset.row = row;
            cellEl.dataset.col = col;
            
            const value = gridData.grid[row][col];
            const isGiven = value !== 0;
            
            if (isGiven) {
                cellEl.classList.add('given');
                cellEl.textContent = value;
            }
            
            // Mark canonical overlap cells as shared
            if (overlapInfo && overlapInfo.isCanonical) {
                cellEl.classList.add('shared');
            }
            
            // Add box border classes
            if (row % 3 === 0) cellEl.classList.add('box-top');
            if (col % 3 === 0) cellEl.classList.add('box-left');
            if (row % 3 === 2) cellEl.classList.add('box-bottom');
            if (col % 3 === 2) cellEl.classList.add('box-right');
            
            // ARIA attributes
            cellEl.setAttribute('role', 'gridcell');
            cellEl.setAttribute('tabindex', '-1');
            cellEl.setAttribute('aria-label', `Grid ${gridId}, Row ${row + 1}, Column ${col + 1}${isGiven ? `, value ${value}` : ', empty'}`);
            
            gridEl.appendChild(cellEl);
        }
    }
    
    return gridEl;
}

/**
 * Render the complete Gattai puzzle
 */
function renderGattaiPuzzle(puzzle) {
    const container = el.container;
    container.innerHTML = '';
    
    const mode = GATTAI_MODES[puzzle.mode];
    container.className = `gattai-container mode-${puzzle.mode}`;
    container.style.setProperty('--logical-rows', mode.logicalSize.rows);
    container.style.setProperty('--logical-cols', mode.logicalSize.cols);
    
    // Create grids in order
    for (const gridId of mode.gridOrder) {
        const gridData = puzzle.grids[gridId];
        const position = mode.gridPositions[gridId];
        
        if (gridData && position) {
            const gridEl = createGridElement(gridId, gridData, position, puzzle.mode);
            container.appendChild(gridEl);
        }
    }
    
    // Initialize current grids from puzzle
    initializeCurrentGrids(puzzle);
}

/**
 * Initialize currentGrids state from puzzle
 */
function initializeCurrentGrids(puzzle) {
    state.currentGrids = {};
    state.pencilMarks = {};
    
    for (const [gridId, gridData] of Object.entries(puzzle.grids)) {
        state.currentGrids[gridId] = cloneGrid(gridData.grid);
        state.pencilMarks[gridId] = Array(9).fill(null).map(() => 
            Array(9).fill(null).map(() => new Set())
        );
    }
}

/**
 * Update a cell's display
 */
function updateCellDisplay(gridId, row, col) {
    const cellEl = $(`.cell[data-grid-id="${gridId}"][data-row="${row}"][data-col="${col}"]`);
    if (!cellEl) return;
    
    const value = state.currentGrids[gridId][row][col];
    const isGiven = state.puzzle.grids[gridId].grid[row][col] !== 0;
    const pencilMarks = state.pencilMarks[gridId][row][col];
    
    // Clear previous content
    cellEl.textContent = '';
    cellEl.classList.remove('user', 'has-pencil');
    
    if (isGiven) {
        cellEl.textContent = value;
    } else if (value !== 0) {
        cellEl.textContent = value;
        cellEl.classList.add('user');
    } else if (pencilMarks.size > 0) {
        cellEl.classList.add('has-pencil');
        const pencilEl = document.createElement('div');
        pencilEl.className = 'pencil-marks';
        for (let n = 1; n <= 9; n++) {
            const markEl = document.createElement('span');
            markEl.className = 'pencil-mark';
            markEl.textContent = pencilMarks.has(n) ? n : '';
            pencilEl.appendChild(markEl);
        }
        cellEl.appendChild(pencilEl);
    }
    
    // Update ARIA
    const label = isGiven 
        ? `Grid ${gridId}, Row ${row + 1}, Column ${col + 1}, given value ${value}`
        : value !== 0 
            ? `Grid ${gridId}, Row ${row + 1}, Column ${col + 1}, value ${value}`
            : `Grid ${gridId}, Row ${row + 1}, Column ${col + 1}, empty`;
    cellEl.setAttribute('aria-label', label);
}

// ===== Cell Selection =====

/**
 * Select a cell
 */
function selectCell(gridId, row, col) {
    // Clear previous selection
    $$('.cell.selected').forEach(c => c.classList.remove('selected'));
    $$('.cell.related').forEach(c => c.classList.remove('related'));
    $$('.gattai-grid.active').forEach(g => g.classList.remove('active'));
    
    if (gridId === null) {
        state.selectedCell = null;
        state.selectedGrid = null;
        return;
    }
    
    state.selectedCell = { gridId, row, col };
    state.selectedGrid = gridId;
    
    // Highlight selected cell
    const selectedEl = $(`.cell[data-grid-id="${gridId}"][data-row="${row}"][data-col="${col}"]`);
    if (selectedEl) {
        selectedEl.classList.add('selected');
        selectedEl.focus();
    }
    
    // Highlight active grid
    const gridEl = $(`.gattai-grid[data-grid-id="${gridId}"]`);
    if (gridEl) {
        gridEl.classList.add('active');
    }
    
    // Highlight related cells (same row, column, box in this grid)
    highlightRelatedCells(gridId, row, col);
}

/**
 * Highlight cells in same row, column, and box
 */
function highlightRelatedCells(gridId, row, col) {
    const gridEl = $(`.gattai-grid[data-grid-id="${gridId}"]`);
    if (!gridEl) return;
    
    const cells = gridEl.querySelectorAll('.cell');
    const box = getBoxIndex(row, col);
    
    cells.forEach(cellEl => {
        const r = parseInt(cellEl.dataset.row, 10);
        const c = parseInt(cellEl.dataset.col, 10);
        const cellBox = getBoxIndex(r, c);
        
        if (r === row || c === col || cellBox === box) {
            cellEl.classList.add('related');
        }
    });
}

// ===== Conflict Detection =====

/**
 * Check for conflicts in a single grid
 */
function checkConflicts(gridId, row, col, value) {
    if (value === 0) return [];
    
    const conflicts = [];
    const grid = state.currentGrids[gridId];
    
    // Check row
    for (let c = 0; c < 9; c++) {
        if (c !== col && grid[row][c] === value) {
            conflicts.push({ gridId, row, col: c });
        }
    }
    
    // Check column
    for (let r = 0; r < 9; r++) {
        if (r !== row && grid[r][col] === value) {
            conflicts.push({ gridId, row: r, col });
        }
    }
    
    // Check box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
            if ((r !== row || c !== col) && grid[r][c] === value) {
                conflicts.push({ gridId, row: r, col: c });
            }
        }
    }
    
    return conflicts;
}

/**
 * Check conflicts across overlapping cells
 */
function checkOverlapConflicts(gridId, row, col, value) {
    if (value === 0) return [];
    
    const overlapMap = getOverlappingCells(state.mode);
    const cellKey = `${gridId}-${row}-${col}`;
    const overlapInfo = overlapMap.get(cellKey);
    
    if (!overlapInfo) return [];
    
    // Get the paired cell
    let pairedGridId, pairedRow, pairedCol;
    if (overlapInfo.isCanonical) {
        pairedGridId = overlapInfo.pairedGrid;
        pairedRow = overlapInfo.pairedRow;
        pairedCol = overlapInfo.pairedCol;
    } else {
        pairedGridId = overlapInfo.canonicalGrid;
        pairedRow = overlapInfo.canonicalRow;
        pairedCol = overlapInfo.canonicalCol;
    }
    
    // Check conflicts in the paired grid
    return checkConflicts(pairedGridId, pairedRow, pairedCol, value);
}

/**
 * Update all conflict highlighting
 */
function updateConflictDisplay() {
    // Clear all conflicts
    $$('.cell.conflict').forEach(c => c.classList.remove('conflict'));
    
    // Check each cell
    for (const [gridId, grid] of Object.entries(state.currentGrids)) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = grid[row][col];
                if (value === 0) continue;
                
                const conflicts = [
                    ...checkConflicts(gridId, row, col, value),
                    ...checkOverlapConflicts(gridId, row, col, value)
                ];
                
                if (conflicts.length > 0) {
                    // Mark this cell and all conflicting cells
                    const cellEl = $(`.cell[data-grid-id="${gridId}"][data-row="${row}"][data-col="${col}"]`);
                    if (cellEl) cellEl.classList.add('conflict');
                    
                    conflicts.forEach(c => {
                        const conflictEl = $(`.cell[data-grid-id="${c.gridId}"][data-row="${c.row}"][data-col="${c.col}"]`);
                        if (conflictEl) conflictEl.classList.add('conflict');
                    });
                }
            }
        }
    }
}

// ===== Input Handling =====

/**
 * Handle number input
 */
function handleNumberInput(value) {
    if (!state.selectedCell) return;
    if (state.revealed) return;
    
    const { gridId, row, col } = state.selectedCell;
    
    // Can't modify given cells
    if (state.puzzle.grids[gridId].grid[row][col] !== 0) return;
    
    if (state.pencilMode) {
        handlePencilInput(gridId, row, col, value);
    } else {
        handleValueInput(gridId, row, col, value);
    }
}

/**
 * Handle value input (not pencil mode)
 */
function handleValueInput(gridId, row, col, value) {
    const prevValue = state.currentGrids[gridId][row][col];
    const prevPencil = [...state.pencilMarks[gridId][row][col]];
    
    // Push to history
    pushHistory({
        type: 'enter',
        gridId,
        row,
        col,
        prevValue,
        prevPencil,
        newValue: value,
        newPencil: []
    });
    
    // Set value
    state.currentGrids[gridId][row][col] = value;
    state.pencilMarks[gridId][row][col].clear();
    
    // Sync overlapping cells
    syncOverlappingCell(gridId, row, col, value);
    
    // Update display
    updateCellDisplay(gridId, row, col);
    updateConflictDisplay();
    saveGameState();
    
    // Check for victory
    checkVictory();
}

/**
 * Handle pencil input
 */
function handlePencilInput(gridId, row, col, value) {
    const prevPencil = [...state.pencilMarks[gridId][row][col]];
    const marks = state.pencilMarks[gridId][row][col];
    
    if (marks.has(value)) {
        marks.delete(value);
    } else {
        marks.add(value);
    }
    
    // Push to history
    pushHistory({
        type: 'pencil',
        gridId,
        row,
        col,
        prevValue: 0,
        prevPencil,
        newValue: 0,
        newPencil: [...marks]
    });
    
    // Sync overlapping cells
    syncOverlappingPencil(gridId, row, col);
    
    // Update display
    updateCellDisplay(gridId, row, col);
    saveGameState();
}

/**
 * Erase current cell
 */
function eraseCell() {
    if (!state.selectedCell) return;
    if (state.revealed) return;
    
    const { gridId, row, col } = state.selectedCell;
    
    // Can't erase given cells
    if (state.puzzle.grids[gridId].grid[row][col] !== 0) return;
    
    const prevValue = state.currentGrids[gridId][row][col];
    const prevPencil = [...state.pencilMarks[gridId][row][col]];
    
    if (prevValue === 0 && prevPencil.length === 0) return;
    
    // Push to history
    pushHistory({
        type: 'erase',
        gridId,
        row,
        col,
        prevValue,
        prevPencil,
        newValue: 0,
        newPencil: []
    });
    
    // Clear cell
    state.currentGrids[gridId][row][col] = 0;
    state.pencilMarks[gridId][row][col].clear();
    
    // Sync overlapping cells
    syncOverlappingCell(gridId, row, col, 0);
    
    // Update display
    updateCellDisplay(gridId, row, col);
    updateConflictDisplay();
    saveGameState();
}

/**
 * Sync value to overlapping cell
 */
function syncOverlappingCell(gridId, row, col, value) {
    const overlapMap = getOverlappingCells(state.mode);
    const cellKey = `${gridId}-${row}-${col}`;
    const overlapInfo = overlapMap.get(cellKey);
    
    if (!overlapInfo) return;
    
    let pairedGridId, pairedRow, pairedCol;
    if (overlapInfo.isCanonical) {
        pairedGridId = overlapInfo.pairedGrid;
        pairedRow = overlapInfo.pairedRow;
        pairedCol = overlapInfo.pairedCol;
    } else {
        pairedGridId = overlapInfo.canonicalGrid;
        pairedRow = overlapInfo.canonicalRow;
        pairedCol = overlapInfo.canonicalCol;
    }
    
    state.currentGrids[pairedGridId][pairedRow][pairedCol] = value;
    state.pencilMarks[pairedGridId][pairedRow][pairedCol].clear();
    updateCellDisplay(pairedGridId, pairedRow, pairedCol);
}

/**
 * Sync pencil marks to overlapping cell
 */
function syncOverlappingPencil(gridId, row, col) {
    const overlapMap = getOverlappingCells(state.mode);
    const cellKey = `${gridId}-${row}-${col}`;
    const overlapInfo = overlapMap.get(cellKey);
    
    if (!overlapInfo) return;
    
    let pairedGridId, pairedRow, pairedCol;
    if (overlapInfo.isCanonical) {
        pairedGridId = overlapInfo.pairedGrid;
        pairedRow = overlapInfo.pairedRow;
        pairedCol = overlapInfo.pairedCol;
    } else {
        pairedGridId = overlapInfo.canonicalGrid;
        pairedRow = overlapInfo.canonicalRow;
        pairedCol = overlapInfo.canonicalCol;
    }
    
    // Copy pencil marks
    const marks = state.pencilMarks[gridId][row][col];
    state.pencilMarks[pairedGridId][pairedRow][pairedCol] = new Set(marks);
    updateCellDisplay(pairedGridId, pairedRow, pairedCol);
}

// ===== History / Undo =====

/**
 * Push move to history
 */
function pushHistory(move) {
    state.history.push(move);
    if (state.history.length > MAX_HISTORY) {
        state.history.shift();
    }
    updateUndoButton();
}

/**
 * Undo last move
 */
function undo() {
    if (state.history.length === 0) return;
    if (state.revealed) return;
    
    const move = state.history.pop();
    
    // Restore previous state
    state.currentGrids[move.gridId][move.row][move.col] = move.prevValue;
    state.pencilMarks[move.gridId][move.row][move.col] = new Set(move.prevPencil);
    
    // Sync overlapping cells
    syncOverlappingCell(move.gridId, move.row, move.col, move.prevValue);
    if (move.prevPencil.length > 0) {
        syncOverlappingPencil(move.gridId, move.row, move.col);
    }
    
    // Update display
    updateCellDisplay(move.gridId, move.row, move.col);
    updateConflictDisplay();
    updateUndoButton();
    saveGameState();
}

/**
 * Update undo button state
 */
function updateUndoButton() {
    if (el.btnUndo) {
        el.btnUndo.disabled = state.history.length === 0 || state.revealed;
    }
}

// ===== Timer =====

/**
 * Start the timer
 */
function startTimer() {
    if (state.timerInterval) return;
    
    if (!state.startTime) {
        state.startTime = Date.now();
    }
    
    state.timerInterval = setInterval(updateTimerDisplay, 1000);
    updateTimerDisplay();
}

/**
 * Stop the timer
 */
function stopTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
}

/**
 * T036: Pause the timer - accumulate elapsed time and clear startTime
 */
function pauseTimer() {
    if (!state.startTime) return; // Already paused
    
    // Accumulate elapsed time
    state.elapsedBeforePause = getElapsedTime();
    state.startTime = null;
    
    // Stop the display interval
    stopTimer();
    
    console.log('⏸️ Timer paused at', formatElapsedTime(state.elapsedBeforePause));
}

/**
 * T036: Resume the timer - set a new startTime to continue from
 */
function resumeTimer() {
    if (state.startTime) return; // Already running
    if (state.revealed) return; // Don't resume if puzzle is revealed
    
    state.startTime = Date.now();
    
    // Restart the display interval
    if (!state.timerInterval) {
        state.timerInterval = setInterval(updateTimerDisplay, 1000);
    }
    updateTimerDisplay();
    
    console.log('▶️ Timer resumed');
}

/**
 * T037: Handle visibility change events for automatic pause/resume
 */
function handleVisibilityChange() {
    if (document.hidden) {
        pauseTimer();
        saveGameState(); // Save state when tab is hidden
    } else {
        // Only resume if we have an active puzzle and it's not completed/revealed
        if (state.puzzle && !state.revealed) {
            resumeTimer();
        }
    }
}

/**
 * Update timer display
 */
function updateTimerDisplay() {
    if (!el.timer || !state.startTime) return;
    
    const elapsed = state.elapsedBeforePause + (Date.now() - state.startTime);
    el.timer.textContent = formatElapsedTime(elapsed);
}

/**
 * Get current elapsed time
 */
function getElapsedTime() {
    if (!state.startTime) return state.elapsedBeforePause;
    return state.elapsedBeforePause + (Date.now() - state.startTime);
}

// ===== Game State Persistence =====

/**
 * Save game state to localStorage
 */
function saveGameState() {
    if (!state.puzzle) return;
    
    const key = getStorageKey(state.date, state.mode, state.difficulty);
    const data = {
        date: state.date,
        mode: state.mode,
        difficulty: state.difficulty,
        currentGrids: {},
        pencilMarks: {},
        startTime: state.startTime,
        elapsedBeforePause: state.elapsedBeforePause,
        history: state.history,
        revealed: state.revealed
    };
    
    // Serialize grids
    for (const [gridId, grid] of Object.entries(state.currentGrids)) {
        data.currentGrids[gridId] = grid;
    }
    
    // Serialize pencil marks (Sets to arrays)
    for (const [gridId, gridMarks] of Object.entries(state.pencilMarks)) {
        data.pencilMarks[gridId] = gridMarks.map(row => 
            row.map(cell => [...cell])
        );
    }
    
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save game state:', e);
    }
}

/**
 * Load game state from localStorage
 */
function loadGameState() {
    const key = getStorageKey(state.date, state.mode, state.difficulty);
    
    try {
        const saved = localStorage.getItem(key);
        if (!saved) return false;
        
        const data = JSON.parse(saved);
        
        // Restore grids
        for (const [gridId, grid] of Object.entries(data.currentGrids)) {
            if (state.currentGrids[gridId]) {
                state.currentGrids[gridId] = grid;
            }
        }
        
        // Restore pencil marks (arrays to Sets)
        for (const [gridId, gridMarks] of Object.entries(data.pencilMarks)) {
            if (state.pencilMarks[gridId]) {
                state.pencilMarks[gridId] = gridMarks.map(row =>
                    row.map(cell => new Set(cell))
                );
            }
        }
        
        state.history = data.history || [];
        state.revealed = data.revealed || false;
        state.startTime = data.startTime || null;
        state.elapsedBeforePause = data.elapsedBeforePause || 0;
        
        return true;
    } catch (e) {
        console.error('Failed to load game state:', e);
        return false;
    }
}

/**
 * Clean up old saves
 */
function cleanupOldSaves() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - STORAGE_RETENTION_DAYS);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX) && !key.includes('-best-')) {
            const match = key.match(/yen-doku-gattai-(\d{4}-\d{2}-\d{2})/);
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
}

/**
 * T043: Migrate old best time format (single value) to new format (array of top 3)
 */
function migrateBestTimes() {
    const OLD_BEST_PREFIX = 'yen-doku-gattai-best-';
    const modes = Object.keys(GATTAI_MODES);
    const difficulties = ['easy', 'medium', 'hard', 'extreme'];
    
    for (const mode of modes) {
        for (const difficulty of difficulties) {
            const oldKey = `${OLD_BEST_PREFIX}${mode}-${difficulty}`;
            const newKey = getBestTimesKey(mode, difficulty);
            
            try {
                const oldValue = localStorage.getItem(oldKey);
                const newValue = localStorage.getItem(newKey);
                
                // Only migrate if old key exists and new key doesn't
                if (oldValue && !newValue) {
                    const ms = parseInt(oldValue, 10);
                    if (!isNaN(ms)) {
                        const migrated = [{ ms, date: null }];
                        localStorage.setItem(newKey, JSON.stringify(migrated));
                        localStorage.removeItem(oldKey);
                        console.log(`🔄 Migrated best time for ${mode}/${difficulty}: ${ms}ms`);
                    }
                }
            } catch (e) {
                console.warn(`Failed to migrate best time for ${mode}/${difficulty}:`, e);
            }
        }
    }
}

/**
 * T043: Clean up completion records older than COMPLETION_RETENTION_DAYS
 */
function cleanupOldCompletions() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - COMPLETION_RETENTION_DAYS);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(COMPLETION_PREFIX)) {
            const match = key.match(/yen-doku-gattai-completed-(\d{4}-\d{2}-\d{2})/);
            if (match) {
                const completionDate = match[1];
                if (completionDate < cutoffStr) {
                    keysToRemove.push(key);
                }
            }
        }
    }
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('🗑️ Cleaned up old completion:', key);
    });
    
    if (keysToRemove.length > 0) {
        console.log(`🧹 Cleaned up ${keysToRemove.length} old completion records`);
    }
}

// ===== Victory Detection =====

/**
 * Check if the puzzle is complete and correct
 */
function checkVictory() {
    if (state.revealed) return;
    
    // Check all cells are filled and no conflicts
    for (const [gridId, grid] of Object.entries(state.currentGrids)) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) return;
                
                const conflicts = checkConflicts(gridId, row, col, grid[row][col]);
                if (conflicts.length > 0) return;
            }
        }
    }
    
    // Check against solution
    for (const [gridId, grid] of Object.entries(state.currentGrids)) {
        const solution = state.puzzle.grids[gridId].solution;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] !== solution[row][col]) return;
            }
        }
    }
    
    // Victory!
    celebrateWin();
}

/**
 * Celebrate victory with animations
 */
function celebrateWin() {
    stopTimer();
    
    // 1. Staggered green reveal for user-added cells
    let delay = 0;
    for (const [gridId, gridData] of Object.entries(state.puzzle.grids)) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const isUserCell = gridData.grid[row][col] === 0;
                
                if (isUserCell) {
                    const cellEl = $(`.cell[data-grid-id="${gridId}"][data-row="${row}"][data-col="${col}"]`);
                    if (cellEl) {
                        setTimeout(() => {
                            cellEl.classList.add('victory');
                        }, delay);
                        delay += 20; // Staggered animation
                    }
                }
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

/**
 * Create confetti animation
 */
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

/**
 * Show victory modal with stats (T039: Updated with rank display)
 */
function showVictoryModal() {
    const elapsed = getElapsedTime();
    const timeStr = formatElapsedTime(elapsed);
    const modeName = GATTAI_MODES[state.mode].displayName;
    const difficulty = state.difficulty.charAt(0).toUpperCase() + state.difficulty.slice(1);
    
    // T039: Save best time and get rank
    const rank = saveBestTime(state.mode, state.difficulty, elapsed);
    const bestTimes = getBestTimes(state.mode, state.difficulty);
    
    // T039: Rank badge emoji
    const rankBadges = { 1: '🥇', 2: '🥈', 3: '🥉' };
    const rankBadge = rank ? rankBadges[rank] : null;
    
    // T039: Rank display
    const rankHtml = rankBadge 
        ? `<div class="rank-badge">${rankBadge} ${rank === 1 ? 'New Record!' : `#${rank} Best Time!`}</div>`
        : '';
    
    // T039: Mini leaderboard HTML
    const leaderboardHtml = bestTimes.length > 0 ? `
        <div class="best-times-list">
            <div class="best-times-title">Best Times</div>
            ${bestTimes.map((t, i) => `
                <div class="best-time-row ${t.ms === elapsed ? 'current' : ''}">
                    <span class="best-time-rank">${rankBadges[i + 1] || '#' + (i + 1)}</span>
                    <span class="best-time-value">${formatElapsedTime(t.ms)}</span>
                </div>
            `).join('')}
        </div>
    ` : '';
    
    // Clear saved game
    const key = getStorageKey(state.date, state.mode, state.difficulty);
    localStorage.removeItem(key);
    
    // Save completion record
    saveCompletion(state.date, state.mode, state.difficulty, elapsed);
    
    const content = `
        <div class="victory-content">
            <div class="victory-icon">🏆</div>
            <h2 class="victory-title">Puzzle Complete!</h2>
            ${rankHtml}
            <div class="victory-stats">
                <div class="stat stat-hero">
                    <span class="stat-value">${timeStr}</span>
                    <span class="stat-label">Time</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${modeName}</span>
                    <span class="stat-label">${difficulty}</span>
                </div>
            </div>
            ${leaderboardHtml}
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

/**
 * Close victory modal
 */
function closeVictoryModal() {
    const overlay = document.getElementById('victory-modal');
    if (overlay) {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 300);
    }
}

// Make closeVictoryModal available globally for onclick
window.closeVictoryModal = closeVictoryModal;

// ===== Completion UI Functions (T042) =====

/**
 * T042: Show a completed puzzle with solution and badge
 */
async function showCompletedPuzzle(completion) {
    try {
        const puzzle = await loadGattaiPuzzle(state.date, state.mode, state.difficulty);
        state.puzzle = puzzle;
        
        // Initialize grids with solution
        state.currentGrids = {};
        state.pencilMarks = {};
        for (const [gridId, gridData] of Object.entries(puzzle.grids)) {
            state.currentGrids[gridId] = gridData.solution.map(row => [...row]);
            state.pencilMarks[gridId] = Array.from({ length: 9 }, () =>
                Array.from({ length: 9 }, () => new Set())
            );
        }
        
        state.history = [];
        state.selectedCell = null;
        state.selectedGrid = null;
        state.elapsedBeforePause = completion.timeMs;
        state.startTime = null; // Timer stopped
        state.revealed = false; // Not "revealed" - completed
        
        // Render puzzle
        renderGattaiPuzzle(puzzle);
        
        // Update displays
        for (const gridId of Object.keys(state.puzzle.grids)) {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    updateCellDisplay(gridId, row, col);
                }
            }
        }
        
        // Update UI
        el.date.textContent = formatDate(state.date);
        el.container.classList.add('completed'); // Mark as completed
        updateUndoButton();
        
        // Show completion badge and next challenge
        showCompletionBadge(completion.timeMs);
        showNextChallengeSuggestion();
        
    } catch (e) {
        console.error('Failed to show completed puzzle:', e);
        // Fallback: clear the invalid completion and load fresh
        clearCompletion(state.date, state.mode, state.difficulty);
        loadPuzzle();
    }
}

/**
 * T042: Show the completion badge
 */
function showCompletionBadge(timeMs) {
    // Remove any existing badge
    hideCompletionBadge();
    
    const badge = document.createElement('div');
    badge.className = 'completion-badge';
    badge.id = 'completion-badge';
    badge.innerHTML = `
        <span class="badge-icon">✓</span>
        <span class="badge-text">Completed in ${formatElapsedTime(timeMs)}</span>
    `;
    
    // Insert after the container
    el.container.parentNode.insertBefore(badge, el.container.nextSibling);
}

/**
 * T042: Hide the completion badge
 */
function hideCompletionBadge() {
    const badge = document.getElementById('completion-badge');
    if (badge) badge.remove();
}

/**
 * T042: Show next challenge suggestion
 */
function showNextChallengeSuggestion() {
    // Remove any existing suggestion
    hideNextChallengeSuggestion();
    
    const difficulties = ['easy', 'medium', 'hard', 'extreme'];
    const currentIndex = difficulties.indexOf(state.difficulty);
    const nextDifficulty = currentIndex < difficulties.length - 1 
        ? difficulties[currentIndex + 1] 
        : null;
    
    const suggestion = document.createElement('div');
    suggestion.className = 'next-challenge';
    suggestion.id = 'next-challenge';
    
    let nextHtml = `<button class="btn-play-again" onclick="playAgain()">Play Again</button>`;
    if (nextDifficulty) {
        const nextLabel = nextDifficulty.charAt(0).toUpperCase() + nextDifficulty.slice(1);
        nextHtml += `<button class="btn-next-difficulty" onclick="switchDifficulty('${nextDifficulty}')">Try ${nextLabel}</button>`;
    }
    
    suggestion.innerHTML = nextHtml;
    
    // Insert after the completion badge or container
    const badge = document.getElementById('completion-badge');
    const insertAfter = badge || el.container;
    insertAfter.parentNode.insertBefore(suggestion, insertAfter.nextSibling);
}

/**
 * T042: Hide next challenge suggestion
 */
function hideNextChallengeSuggestion() {
    const suggestion = document.getElementById('next-challenge');
    if (suggestion) suggestion.remove();
}

/**
 * T042: Play Again - clear completion and reset puzzle
 */
function playAgain() {
    // Clear the completion record
    clearCompletion(state.date, state.mode, state.difficulty);
    
    // Hide completion UI
    hideCompletionBadge();
    hideNextChallengeSuggestion();
    
    // Remove completed class
    el.container.classList.remove('completed');
    
    // Reset the puzzle state
    doReset();
}

// Make playAgain available globally for onclick
window.playAgain = playAgain;

// ===== Hint =====

/**
 * Provide a hint for the selected cell
 */
function giveHint() {
    if (state.revealed) return;
    
    // Find all empty cells across all grids
    const emptyCells = [];
    for (const [gridId, gridData] of Object.entries(state.puzzle.grids)) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                // Cell is empty if: original is 0 AND current is 0
                if (gridData.grid[row][col] === 0 && state.currentGrids[gridId][row][col] === 0) {
                    emptyCells.push({ gridId, row, col });
                }
            }
        }
    }
    
    if (emptyCells.length === 0) {
        showToast('No empty cells');
        return;
    }
    
    // Pick a random empty cell
    const { gridId, row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    
    // Get solution value
    const solution = state.puzzle.grids[gridId].solution[row][col];
    
    // Select and fill the cell
    selectCell(gridId, row, col);
    handleValueInput(gridId, row, col, solution);
    
    // Animate hint cell
    const cellEl = $(`.cell[data-grid-id="${gridId}"][data-row="${row}"][data-col="${col}"]`);
    if (cellEl) {
        cellEl.classList.add('hint-reveal');
        setTimeout(() => cellEl.classList.remove('hint-reveal'), 800);
    }
    
    showToast('💡 Hint revealed');
}

// ===== Check Solution =====

/**
 * Check if current solution is correct and show feedback
 */
function checkSolution() {
    if (state.revealed) {
        showToast('Solution already revealed');
        return;
    }
    
    let errors = 0;
    let empty = 0;
    
    // Check all cells against solution
    for (const [gridId, grid] of Object.entries(state.currentGrids)) {
        const solution = state.puzzle.grids[gridId].solution;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = grid[row][col];
                if (value === 0) {
                    empty++;
                } else if (value !== solution[row][col]) {
                    errors++;
                    // Highlight error cell
                    const cellEl = $(`.cell[data-grid-id="${gridId}"][data-row="${row}"][data-col="${col}"]`);
                    if (cellEl) {
                        cellEl.classList.add('check-error');
                        setTimeout(() => cellEl.classList.remove('check-error'), 2000);
                    }
                }
            }
        }
    }
    
    if (errors === 0 && empty === 0) {
        // All correct!
        checkVictory();
    } else if (errors === 0) {
        showToast(`Looking good! ${empty} cells left`);
    } else {
        showToast(`Found ${errors} error${errors > 1 ? 's' : ''}`);
    }
}

// ===== Reveal Solution =====

/**
 * Reveal the complete solution
 */
function revealSolution() {
    showModal({
        icon: '👁️',
        title: 'Reveal Solution?',
        message: 'This will show the complete solution and end your game.',
        confirmText: 'Reveal',
        cancelText: 'Cancel',
        onConfirm: () => {
            state.revealed = true;
            stopTimer();
            
            // Fill in all cells with solution
            for (const [gridId, gridData] of Object.entries(state.puzzle.grids)) {
                for (let row = 0; row < 9; row++) {
                    for (let col = 0; col < 9; col++) {
                        state.currentGrids[gridId][row][col] = gridData.solution[row][col];
                        state.pencilMarks[gridId][row][col].clear();
                        updateCellDisplay(gridId, row, col);
                    }
                }
            }
            
            updateConflictDisplay();
            
            // Clear saved game
            const key = getStorageKey(state.date, state.mode, state.difficulty);
            localStorage.removeItem(key);
        }
    });
}

// ===== Reset =====

/**
 * Actual reset logic - used by both resetPuzzle and playAgain
 */
function doReset() {
    // Clear completion record if puzzle was completed
    if (isCompleted(state.date, state.mode, state.difficulty)) {
        clearCompletion(state.date, state.mode, state.difficulty);
        hideCompletionBadge();
        hideNextChallengeSuggestion();
        el.container.classList.remove('completed');
    }
    
    initializeCurrentGrids(state.puzzle);
    state.history = [];
    state.revealed = false;
    state.startTime = Date.now();
    state.elapsedBeforePause = 0;
    
    // Re-render all cells
    for (const gridId of Object.keys(state.puzzle.grids)) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                updateCellDisplay(gridId, row, col);
            }
        }
    }
    
    updateConflictDisplay();
    updateUndoButton();
    startTimer();
    saveGameState();
    selectCell(null, null, null);
    showToast('Puzzle reset');
}

/**
 * Reset the puzzle to initial state
 */
function resetPuzzle() {
    showModal({
        icon: '🔄',
        title: 'Reset Puzzle?',
        message: 'This will clear all your progress.',
        confirmText: 'Reset',
        cancelText: 'Cancel',
        onConfirm: doReset
    });
}

// ===== Modal =====

/**
 * Show modal dialog
 */
function showModal({ icon, title, message, confirmText, cancelText, showCancel = true, onConfirm, onCancel }) {
    if (!el.modal || !el.modalTitle || !el.modalMessage || !el.modalConfirm || !el.modalCancel) {
        // Fall back to confirm dialog
        if (confirm(`${title}\n\n${message}`)) {
            if (onConfirm) onConfirm();
        } else {
            if (onCancel) onCancel();
        }
        return;
    }
    
    const iconEl = el.modal.querySelector('#modal-icon');
    if (iconEl) iconEl.textContent = icon || '';
    el.modalTitle.textContent = title;
    el.modalMessage.textContent = message;
    el.modalConfirm.textContent = confirmText || 'OK';
    
    if (showCancel) {
        el.modalCancel.textContent = cancelText || 'Cancel';
        el.modalCancel.classList.remove('hidden');
    } else {
        el.modalCancel.classList.add('hidden');
    }
    
    // Remove old listeners
    const newConfirm = el.modalConfirm.cloneNode(true);
    const newCancel = el.modalCancel.cloneNode(true);
    el.modalConfirm.replaceWith(newConfirm);
    el.modalCancel.replaceWith(newCancel);
    el.modalConfirm = newConfirm;
    el.modalCancel = newCancel;
    
    // Add new listeners
    el.modalConfirm.addEventListener('click', () => {
        el.modal.classList.add('hidden');
        if (onConfirm) onConfirm();
    });
    
    el.modalCancel.addEventListener('click', () => {
        el.modal.classList.add('hidden');
        if (onCancel) onCancel();
    });
    
    el.modal.classList.remove('hidden');
}

// ===== Toast =====

/**
 * Show toast notification
 */
function showToast(message, duration = 2000) {
    if (!el.toast) return;
    
    el.toast.textContent = message;
    el.toast.classList.remove('hidden');
    
    setTimeout(() => {
        el.toast.classList.add('hidden');
    }, duration);
}

// ===== Error Display =====

/**
 * Show error message
 */
function showError(message) {
    if (!el.error) return;
    
    el.error.textContent = message;
    el.error.classList.remove('hidden');
}

/**
 * Hide error message
 */
function hideError() {
    if (!el.error) return;
    el.error.classList.add('hidden');
}

// ===== Event Handlers =====

/**
 * Handle cell click
 */
function handleCellClick(e) {
    const cellEl = e.target.closest('.cell');
    if (!cellEl) return;
    
    const gridId = cellEl.dataset.gridId;
    const row = parseInt(cellEl.dataset.row, 10);
    const col = parseInt(cellEl.dataset.col, 10);
    
    selectCell(gridId, row, col);
}

/**
 * Handle keyboard input
 */
function handleKeydown(e) {
    // Number keys 1-9
    if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        handleNumberInput(parseInt(e.key, 10));
        return;
    }
    
    // Delete/Backspace
    if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        eraseCell();
        return;
    }
    
    // Undo
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
    }
    
    // Toggle pencil mode
    if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePencilMode();
        return;
    }
    
    // Hint
    if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        giveHint();
        return;
    }
    
    // Arrow key navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        handleArrowKey(e.key);
        return;
    }
    
    // Escape to deselect
    if (e.key === 'Escape') {
        selectCell(null, null, null);
        return;
    }
}

/**
 * Handle arrow key navigation
 */
function handleArrowKey(key) {
    if (!state.selectedCell) {
        // Select first cell of first grid
        const mode = GATTAI_MODES[state.mode];
        const firstGrid = mode.gridOrder[0];
        selectCell(firstGrid, 0, 0);
        return;
    }
    
    let { gridId, row, col } = state.selectedCell;
    
    switch (key) {
        case 'ArrowUp':
            row = row > 0 ? row - 1 : 8;
            break;
        case 'ArrowDown':
            row = row < 8 ? row + 1 : 0;
            break;
        case 'ArrowLeft':
            col = col > 0 ? col - 1 : 8;
            break;
        case 'ArrowRight':
            col = col < 8 ? col + 1 : 0;
            break;
    }
    
    selectCell(gridId, row, col);
}

/**
 * Toggle pencil mode
 */
function togglePencilMode() {
    state.pencilMode = !state.pencilMode;
    el.btnPencil.classList.toggle('active', state.pencilMode);
}

/**
 * Handle mode tab click
 */
function handleModeClick(e) {
    const tab = e.target.closest('.mode-tab');
    if (!tab) return;
    
    const mode = tab.dataset.mode;
    if (mode === state.mode) return;
    
    // Update tabs
    el.modeTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    
    // Load new puzzle
    state.mode = mode;
    updateUrl(state.mode, state.difficulty, state.date);
    loadPuzzle();
}

/**
 * Handle difficulty tab click
 */
function handleDifficultyClick(e) {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    
    const difficulty = tab.dataset.difficulty;
    if (difficulty === state.difficulty) return;
    
    // Update tabs
    el.difficultyTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    
    // Load new puzzle
    state.difficulty = difficulty;
    updateUrl(state.mode, state.difficulty, state.date);
    loadPuzzle();
}

/**
 * Handle date navigation
 */
function handleDateNav(direction) {
    const newDate = direction === -1 ? yesterday(state.date) : tomorrow(state.date);
    
    // Don't allow future dates
    if (newDate > today()) return;
    
    state.date = newDate;
    updateUrl(state.mode, state.difficulty, state.date);
    loadPuzzle();
}

// ===== Initialization =====

/**
 * Load and display a puzzle (T041: Updated with completion check)
 */
async function loadPuzzle() {
    hideError();
    selectCell(null, null, null);
    stopTimer();
    
    // T041: Check if puzzle is already completed
    const completion = getCompletion(state.date, state.mode, state.difficulty);
    if (completion) {
        console.log('🏆 Loading completed puzzle:', state.date, state.mode, state.difficulty);
        return showCompletedPuzzle(completion);
    }
    
    try {
        const puzzle = await loadGattaiPuzzle(state.date, state.mode, state.difficulty);
        state.puzzle = puzzle;
        
        // Render puzzle
        renderGattaiPuzzle(puzzle);
        
        // Try to load saved state
        const hasState = loadGameState();
        
        if (hasState) {
            // Restore display from state
            for (const gridId of Object.keys(state.puzzle.grids)) {
                for (let row = 0; row < 9; row++) {
                    for (let col = 0; col < 9; col++) {
                        updateCellDisplay(gridId, row, col);
                    }
                }
            }
        }
        
        // Update UI
        el.date.textContent = formatDate(state.date);
        updateConflictDisplay();
        updateUndoButton();
        
        // Update next button state
        el.nextDay.disabled = state.date >= today();
        
        // Start timer
        if (!state.revealed) {
            if (!state.startTime) {
                state.startTime = Date.now();
            }
            startTimer();
        }
        
    } catch (error) {
        console.error('loadPuzzle error:', error);
        console.error('State:', { date: state.date, mode: state.mode, difficulty: state.difficulty });
        
        // Smart fallback: try to find the most recent available puzzle
        const latestDate = await findLatestPuzzle(yesterday(state.date), state.mode, state.difficulty);
        if (latestDate) {
            state.date = latestDate;
            updateUrl(state.mode, state.difficulty, state.date);
            return loadPuzzle(); // Retry with fallback date
        }
        
        el.container.innerHTML = ''; // Clear any partial render
        showError(`No ${GATTAI_MODES[state.mode].displayName} puzzles available`);
    }
}

/**
 * Initialize DOM references
 */
function initDomRefs() {
    el.container = $('#gattai-container');
    el.date = $('#puzzle-date');
    el.prevDay = $('#btn-prev-day');
    el.nextDay = $('#btn-next-day');
    el.error = $('#error-message');
    el.toast = $('#toast');
    el.timer = $('#timer');
    el.modeTabs = $$('.mode-tab');
    el.difficultyTabs = $$('.difficulty-tabs .tab');
    el.btnPencil = $('#btn-pencil');
    el.btnErase = $('#btn-erase');
    el.btnHint = $('#btn-hint');
    el.btnCheck = $('#btn-check');
    el.btnReveal = $('#btn-reveal');
    el.btnUndo = $('#btn-undo');
    el.btnReset = $('#btn-reset');
    el.nums = $$('.num');
    el.modal = $('#modal');
    el.modalTitle = $('#modal-title');
    el.modalMessage = $('#modal-message');
    el.modalCancel = $('#modal-cancel');
    el.modalConfirm = $('#modal-confirm');
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Grid clicks
    if (el.container) el.container.addEventListener('click', handleCellClick);
    
    // Keyboard
    document.addEventListener('keydown', handleKeydown);
    
    // Mode tabs
    const modeTabs = document.querySelector('.mode-tabs');
    if (modeTabs) modeTabs.addEventListener('click', handleModeClick);
    
    // Difficulty tabs
    const diffTabs = document.querySelector('.difficulty-tabs');
    if (diffTabs) diffTabs.addEventListener('click', handleDifficultyClick);
    
    // Date navigation
    if (el.prevDay) el.prevDay.addEventListener('click', () => handleDateNav(-1));
    if (el.nextDay) el.nextDay.addEventListener('click', () => handleDateNav(1));
    
    // Toolbar buttons
    if (el.btnPencil) el.btnPencil.addEventListener('click', togglePencilMode);
    if (el.btnErase) el.btnErase.addEventListener('click', eraseCell);
    if (el.btnHint) el.btnHint.addEventListener('click', giveHint);
    if (el.btnCheck) el.btnCheck.addEventListener('click', checkSolution);
    if (el.btnReveal) el.btnReveal.addEventListener('click', revealSolution);
    if (el.btnUndo) el.btnUndo.addEventListener('click', undo);
    if (el.btnReset) el.btnReset.addEventListener('click', resetPuzzle);
    
    // Number pad
    el.nums.forEach(btn => {
        btn.addEventListener('click', () => {
            handleNumberInput(parseInt(btn.dataset.num, 10));
        });
    });
}

/**
 * Initialize the app
 */
function init() {
    // Initialize DOM references
    initDomRefs();
    
    // Parse URL parameters
    const params = parseUrlParams();
    state.mode = params.mode;
    state.difficulty = params.difficulty;
    state.date = params.date;
    
    // Update tabs to match URL
    el.modeTabs.forEach(tab => {
        const isActive = tab.dataset.mode === state.mode;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive.toString());
    });
    
    el.difficultyTabs.forEach(tab => {
        const isActive = tab.dataset.difficulty === state.difficulty;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive.toString());
    });
    
    // Setup event listeners
    setupEventListeners();
    
    // Clean up old saves
    cleanupOldSaves();
    
    // T043: Migration and cleanup for new features
    migrateBestTimes();
    cleanupOldCompletions();
    
    // T049: Graceful fallback for Page Visibility API
    // T037: Page Visibility API for timer pause/resume
    if (typeof document.hidden !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityChange);
    } else {
        console.log('⚠️ Page Visibility API not supported - timer will continue when tab is hidden');
    }
    
    // Load puzzle
    loadPuzzle();
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
