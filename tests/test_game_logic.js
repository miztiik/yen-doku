/**
 * Tests for game logic functions.
 * Run with: node --test tests/test_game_logic.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

const {
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
} = require('./game-logic.js');

// ===== Test Data =====
const EMPTY_GRID = Array.from({ length: 9 }, () => Array(9).fill(0));

const VALID_PUZZLE = {
    date: '2026-01-11',
    difficulty: 'extreme',
    grid: [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ],
    solution: [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ],
};

// ===== yesterday() =====
describe('yesterday()', () => {
    it('returns previous day', () => {
        assert.strictEqual(yesterday('2026-01-11'), '2026-01-10');
    });
    
    it('handles month boundary', () => {
        assert.strictEqual(yesterday('2026-02-01'), '2026-01-31');
    });
    
    it('handles year boundary', () => {
        assert.strictEqual(yesterday('2026-01-01'), '2025-12-31');
    });
    
    it('handles leap year', () => {
        assert.strictEqual(yesterday('2024-03-01'), '2024-02-29');
    });
});

// ===== year() =====
describe('year()', () => {
    it('extracts year from date string', () => {
        assert.strictEqual(year('2026-01-11'), '2026');
    });
    
    it('works with any valid date', () => {
        assert.strictEqual(year('1999-12-31'), '1999');
    });
});

// ===== isRelated() =====
describe('isRelated()', () => {
    it('same row is related', () => {
        assert.strictEqual(isRelated(0, 0, 0, 8), true);
    });
    
    it('same column is related', () => {
        assert.strictEqual(isRelated(0, 0, 8, 0), true);
    });
    
    it('same 3x3 box is related', () => {
        assert.strictEqual(isRelated(0, 0, 2, 2), true);
        assert.strictEqual(isRelated(3, 3, 5, 5), true);
    });
    
    it('different box, row, column is not related', () => {
        assert.strictEqual(isRelated(0, 0, 3, 3), false);
        assert.strictEqual(isRelated(0, 0, 8, 8), false);
    });
    
    it('same cell is related to itself', () => {
        assert.strictEqual(isRelated(4, 4, 4, 4), true);
    });
});

// ===== hasConflict() =====
describe('hasConflict()', () => {
    it('empty cell has no conflict', () => {
        const grid = EMPTY_GRID.map(r => [...r]);
        assert.strictEqual(hasConflict(grid, 0, 0, 0), false);
    });
    
    it('detects row conflict', () => {
        const grid = EMPTY_GRID.map(r => [...r]);
        grid[0][0] = 5;
        grid[0][5] = 5;
        assert.strictEqual(hasConflict(grid, 0, 0, 5), true);
    });
    
    it('detects column conflict', () => {
        const grid = EMPTY_GRID.map(r => [...r]);
        grid[0][0] = 7;
        grid[5][0] = 7;
        assert.strictEqual(hasConflict(grid, 0, 0, 7), true);
    });
    
    it('detects box conflict', () => {
        const grid = EMPTY_GRID.map(r => [...r]);
        grid[0][0] = 3;
        grid[2][2] = 3;
        assert.strictEqual(hasConflict(grid, 0, 0, 3), true);
    });
    
    it('no conflict when value is unique', () => {
        const grid = EMPTY_GRID.map(r => [...r]);
        grid[0][0] = 5;
        assert.strictEqual(hasConflict(grid, 0, 0, 5), false);
    });
    
    it('same value in different box/row/col is not conflict', () => {
        const grid = EMPTY_GRID.map(r => [...r]);
        grid[0][0] = 5;
        grid[4][4] = 5; // Different row, col, and box
        assert.strictEqual(hasConflict(grid, 0, 0, 5), false);
    });
});

// ===== validatePuzzle() =====
describe('validatePuzzle()', () => {
    it('accepts valid puzzle', () => {
        assert.strictEqual(validatePuzzle(VALID_PUZZLE), true);
    });
    
    it('rejects missing date', () => {
        const puzzle = { ...VALID_PUZZLE };
        delete puzzle.date;
        assert.throws(() => validatePuzzle(puzzle), /Missing required field: date/);
    });
    
    it('rejects missing difficulty', () => {
        const puzzle = { ...VALID_PUZZLE };
        delete puzzle.difficulty;
        assert.throws(() => validatePuzzle(puzzle), /Missing required field: difficulty/);
    });
    
    it('rejects missing grid', () => {
        const puzzle = { ...VALID_PUZZLE };
        delete puzzle.grid;
        assert.throws(() => validatePuzzle(puzzle), /Missing required field: grid/);
    });
    
    it('rejects missing solution', () => {
        const puzzle = { ...VALID_PUZZLE };
        delete puzzle.solution;
        assert.throws(() => validatePuzzle(puzzle), /Missing required field: solution/);
    });
    
    it('rejects wrong grid dimensions', () => {
        const puzzle = { ...VALID_PUZZLE, grid: [[1, 2, 3]] };
        assert.throws(() => validatePuzzle(puzzle), /Invalid grid/);
    });
    
    it('rejects invalid grid values', () => {
        const puzzle = {
            ...VALID_PUZZLE,
            grid: VALID_PUZZLE.grid.map((r, i) => 
                i === 0 ? [10, ...r.slice(1)] : [...r]
            ),
        };
        assert.throws(() => validatePuzzle(puzzle), /Invalid grid value/);
    });
    
    it('rejects solution with zeros', () => {
        const puzzle = {
            ...VALID_PUZZLE,
            solution: VALID_PUZZLE.solution.map((r, i) => 
                i === 0 ? [0, ...r.slice(1)] : [...r]
            ),
        };
        assert.throws(() => validatePuzzle(puzzle), /Invalid solution value/);
    });
});

// ===== formatDate() =====
describe('formatDate()', () => {
    it('formats date correctly', () => {
        const result = formatDate('2026-01-11');
        assert.ok(result.includes('Saturday') || result.includes('Jan') || result.includes('11'));
    });
    
    it('handles different months', () => {
        const result = formatDate('2026-12-25');
        assert.ok(result.includes('Dec') || result.includes('25'));
    });
});

// ===== isPuzzleComplete() =====
describe('isPuzzleComplete()', () => {
    it('returns true when grid matches solution', () => {
        assert.strictEqual(
            isPuzzleComplete(VALID_PUZZLE.solution, VALID_PUZZLE.solution),
            true
        );
    });
    
    it('returns false when grid differs from solution', () => {
        assert.strictEqual(
            isPuzzleComplete(VALID_PUZZLE.grid, VALID_PUZZLE.solution),
            false
        );
    });
    
    it('returns false with single wrong cell', () => {
        const almostComplete = VALID_PUZZLE.solution.map(r => [...r]);
        almostComplete[0][0] = 9; // Wrong value
        assert.strictEqual(isPuzzleComplete(almostComplete, VALID_PUZZLE.solution), false);
    });
});

// ===== countFilledCells() =====
describe('countFilledCells()', () => {
    it('counts zero for empty grid', () => {
        assert.strictEqual(countFilledCells(EMPTY_GRID), 0);
    });
    
    it('counts 81 for full grid', () => {
        assert.strictEqual(countFilledCells(VALID_PUZZLE.solution), 81);
    });
    
    it('counts partial grid correctly', () => {
        const grid = EMPTY_GRID.map(r => [...r]);
        grid[0][0] = 1;
        grid[0][1] = 2;
        grid[0][2] = 3;
        assert.strictEqual(countFilledCells(grid), 3);
    });
});

// ===== serializePencil() / deserializePencil() =====
describe('pencil serialization', () => {
    it('serializes empty pencil marks', () => {
        const pencil = Array.from({ length: 9 }, () => 
            Array.from({ length: 9 }, () => new Set())
        );
        const serialized = serializePencil(pencil);
        assert.strictEqual(serialized[0][0].length, 0);
    });
    
    it('serializes pencil marks with values', () => {
        const pencil = Array.from({ length: 9 }, () => 
            Array.from({ length: 9 }, () => new Set())
        );
        pencil[0][0].add(1);
        pencil[0][0].add(5);
        pencil[0][0].add(9);
        
        const serialized = serializePencil(pencil);
        assert.deepStrictEqual(serialized[0][0].sort(), [1, 5, 9]);
    });
    
    it('deserializes back to Sets', () => {
        const data = Array.from({ length: 9 }, () => 
            Array.from({ length: 9 }, () => [])
        );
        data[0][0] = [1, 5, 9];
        
        const pencil = deserializePencil(data);
        assert.ok(pencil[0][0] instanceof Set);
        assert.strictEqual(pencil[0][0].has(1), true);
        assert.strictEqual(pencil[0][0].has(5), true);
        assert.strictEqual(pencil[0][0].has(9), true);
        assert.strictEqual(pencil[0][0].has(2), false);
    });
    
    it('roundtrip preserves data', () => {
        const pencil = Array.from({ length: 9 }, () => 
            Array.from({ length: 9 }, () => new Set())
        );
        pencil[4][4].add(3);
        pencil[4][4].add(7);
        
        const restored = deserializePencil(serializePencil(pencil));
        assert.strictEqual(restored[4][4].has(3), true);
        assert.strictEqual(restored[4][4].has(7), true);
        assert.strictEqual(restored[4][4].size, 2);
    });
});

console.log('Running game logic tests...');
