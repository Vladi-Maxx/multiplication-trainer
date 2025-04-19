### Feature: Adaptive Flashcards (core)
1. Изчисли `weight` = 1 – accuracy + recentMistakeBoost.
2. Избери случайно с вероятност ~ weight.
3. Логни време за отговор; апдейтни `avgTime`.

### Feature: Combo Bonus
* Ако `streak ≥ 5` ➜ +5 точки.

### Feature: Puzzle Card Reward
* При завършена сесия добави `pieces = ceil(score / TARGET_SCORE * totalPieces)`.
