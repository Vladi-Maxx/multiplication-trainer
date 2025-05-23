**Име на проекта:** Multiplication Trainer (геймифицирано интерактивно уеб приложение)

### Цел
Да помогне на деца (~8 г.) да автоматизират таблицата за умножение 1 – 9 чрез флашкарти, адаптивен алгоритъм и колекционерски награди‑пъзели.

### Основни функционалности
1. Flash‑карти с адаптивно тегло (Leitner + време за отговор).
2. Game‑loop с точки, combo‑бонус и целеви резултат.
3. Колекционерски карти‑пъзели, които се разкриват при успешни сесии.
4. Прогрес‑бар и визуална heat‑map таблица 9×9.
5. (Plus‑Ultra) гласови похвали, родителски панел, социален „семеен дуел“.

### Тех‑стек
* **Frontend:** React + Vite 5, TypeScript, TailwindCSS, Framer Motion.
* **Данни:** localStorage (MVP) → IndexedDB или облак при разширение.
* **CI/Deploy:** GitHub Pages / Netlify.
