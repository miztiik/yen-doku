/**
 * Pure game logic functions extracted from app.js for testing.
 * These are duplicated here for Node.js testability without a build step.
 * Source of truth: docs/app.js
 */

/**
 * Get yesterday's date from a date string.
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Yesterday's date in YYYY-MM-DD format
 */
function yesterday(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
}

/**
 * Get year from a date string.
 * @param {string} d - Date in YYYY-MM-DD format
 * @returns {string} Year as string
 */
function year(d) {
    return d.split('-')[0];
}

/**
 * Check if two cells are related (same row, column, or 3x3 box).
 * @param {number} r1 - Row of first cell
 * @param {number} c1 - Column of first cell
 * @param {number} r2 - Row of second cell
 * @param {number} c2 - Column of second cell
 * @returns {boolean} True if cells are related
 */
function isRelated(r1, c1, r2, c2) {
    if (r1 === r2) return true;
    if (c1 === c2) return true;
    return Math.floor(r1/3) === Math.floor(r2/3) && Math.floor(c1/3) === Math.floor(c2/3);
}

/**
 * Check if a value at a position conflicts with other cells.
 * @param {number[][]} grid - 9x9 grid
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @param {number} val - Value to check
 * @returns {boolean} True if there's a conflict
 */
function hasConflict(grid, row, col, val) {
    if (val === 0) return false;
    
    // Check row
    for (let c = 0; c < 9; c++) {
        if (c !== col && grid[row][c] === val) return true;
    }
    
    // Check column
    for (let r = 0; r < 9; r++) {
        if (r !== row && grid[r][col] === val) return true;
    }
    
    // Check 3x3 box
    const br = Math.floor(row/3) * 3;
    const bc = Math.floor(col/3) * 3;
    for (let r = br; r < br + 3; r++) {
        for (let c = bc; c < bc + 3; c++) {
            if ((r !== row || c !== col) && grid[r][c] === val) return true;
        }
    }
    
    return false;
}

/**
 * Validate puzzle JSON schema.
 * @param {Object} puzzle - The puzzle object to validate
 * @returns {boolean} True if valid
 * @throws {Error} If invalid
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
 * Format a date string for display.
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

/**
 * Check if puzzle is complete (all cells filled correctly).
 * @param {number[][]} grid - Current grid state
 * @param {number[][]} solution - Solution grid
 * @returns {boolean} True if complete
 */
function isPuzzleComplete(grid, solution) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (grid[r][c] !== solution[r][c]) return false;
        }
    }
    return true;
}

/**
 * Count filled cells in a grid.
 * @param {number[][]} grid - 9x9 grid
 * @returns {number} Count of non-zero cells
 */
function countFilledCells(grid) {
    let count = 0;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (grid[r][c] !== 0) count++;
        }
    }
    return count;
}

/**
 * Serialize pencil marks (Set) to array for storage.
 * @param {Set[][]} pencil - 9x9 array of Sets
 * @returns {number[][][]} Serialized pencil marks
 */
function serializePencil(pencil) {
    return pencil.map(row => row.map(set => [...set]));
}

/**
 * Deserialize pencil marks from storage.
 * @param {number[][][]} data - Serialized pencil marks
 * @returns {Set[][]} Restored pencil marks
 */
function deserializePencil(data) {
    return data.map(row => row.map(arr => new Set(arr)));
}

module.exports = {
    yesterday,
    year,
    isRelated,
    hasConflict,
    validatePuzzle,
    formatDate,
    isPuzzleComplete,
    countFilledCells,
    serializePencil,
    deserializePencil,
};
