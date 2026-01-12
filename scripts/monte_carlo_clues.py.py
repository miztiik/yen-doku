# Save as: scripts/monte_carlo_clues.py
# Run: python scripts/monte_carlo_clues.py -n 100

import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from generate import generate_puzzle
from difficulty import Difficulty

def run_simulation(n_puzzles=100):
    print(f"🎲 Monte Carlo: {n_puzzles} extreme puzzles")
    print("-" * 50)
    
    clue_counts = []
    
    for i in range(n_puzzles):
        fake_date = f"2099-{(i // 28) + 1:02d}-{(i % 28) + 1:02d}"
        puzzle = generate_puzzle(fake_date, Difficulty.EXTREME, max_attempts=20)
        
        if puzzle:
            clue_counts.append(puzzle['clueCount'])
            if (i + 1) % 10 == 0:
                print(f"  {i + 1}/{n_puzzles}...")
    
    # Stats
    mean = sum(clue_counts) / len(clue_counts)
    median = sorted(clue_counts)[len(clue_counts) // 2]
    
    print(f"\n📊 Results (n={len(clue_counts)}):")
    print(f"   Mean:   {mean:.1f}")
    print(f"   Median: {median}")
    print(f"   Range:  {min(clue_counts)} - {max(clue_counts)}")
    
    print("\n| Clues | Count | % |")
    print("|-------|-------|---|")
    counter = Counter(clue_counts)
    for c in range(17, 26):
        cnt = counter.get(c, 0)
        pct = cnt / len(clue_counts) * 100
        print(f"| {c} | {cnt} | {pct:.1f}% |")

if __name__ == "__main__":
    run_simulation(100)