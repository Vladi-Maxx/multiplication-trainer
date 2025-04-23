// Инициализиране на връзка със Supabase
const SUPABASE_URL = '***REMOVED***';
let supabaseClient = null;
let userData = null;

// Функция за инициализиране на дашборда
async function initDashboard() {
    const connectionStatus = document.getElementById('connectionStatus');
    const loginButton = document.getElementById('loginButton');
    
    try {
        // Хардкодваме анонимния ключ за тестове
        const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiYnJneW9obndveXJzZXFjaXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTM4MzkxNjcsImV4cCI6MjAyOTQxNTE2N30.Kf1WnOzUwfzXX8pP0BXuOjpvY2Fpb68c5EdlipB4sWE';
        
        // Създаваме връзка със Supabase
        supabaseClient = supabase.createClient(SUPABASE_URL, anonKey);
        
        // Автоматично влизаме за тестове
        connectionStatus.textContent = 'Влизаме в системата...';
        
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: '***REMOVED***',
            password: '***REMOVED***',
        });
        
        if (error) {
            throw error;
        }
        
        // Запазваме потребителските данни
        userData = data.user;
        connectionStatus.textContent = `Влезли сте като: ${userData.email}`;
        connectionStatus.classList.add('text-green-500');
        loginButton.textContent = 'Излез';
        loginButton.addEventListener('click', handleLogout);
        
        // Зареждаме статистиките
        loadDashboardData();
        
    } catch (error) {
        console.error('Грешка при свързване със Supabase:', error);
        connectionStatus.textContent = 'Грешка при свързване с базата данни. Моля, опитайте отново.';
        connectionStatus.classList.add('text-red-500');
    }
}

// Функция за влизане
async function handleLogin() {
    // Тук ще имплементираме влизане с имейл и парола
    // За момента ще ползваме фиксираните данни
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: '***REMOVED***',
            password: '***REMOVED***',
        });
        
        if (error) throw error;
        
        location.reload(); // Презареждаме страницата след успешно влизане
    } catch (error) {
        console.error('Грешка при влизане:', error);
        alert('Не може да влезете в системата: ' + error.message);
    }
}

// Функция за излизане
async function handleLogout() {
    try {
        await supabaseClient.auth.signOut();
        location.reload(); // Презареждаме страницата след излизане
    } catch (error) {
        console.error('Грешка при излизане:', error);
    }
}

// Функция за зареждане на данните за дашборда
async function loadDashboardData() {
    if (!userData) return;
    
    await Promise.all([
        loadBasicStats(),
        loadTimeStats(),
        loadHeatmap(),
        loadProblemAreas()
    ]);
}

// Зареждане на основни статистики
async function loadBasicStats() {
    try {
        // Извличаме всички сесии на потребителя
        const { data: sessions, error: sessionsError } = await supabaseClient
            .from('sessions')
            .select('*')
            .eq('user_id', userData.id);
        
        if (sessionsError) throw sessionsError;
        
        // Извличаме всички факти на потребителя
        const { data: facts, error: factsError } = await supabaseClient
            .from('user_facts')
            .select('*')
            .eq('user_id', userData.id);
        
        if (factsError) throw factsError;
        
        // Изчисляваме статистиките
        const totalProblems = sessions.reduce((sum, session) => sum + session.fact_count, 0);
        
        const correctAnswers = sessions.reduce((sum, session) => sum + session.correct_count, 0);
        const accuracy = totalProblems > 0 ? Math.round((correctAnswers / totalProblems) * 100) : 0;
        
        const totalTime = sessions.reduce((sum, session) => sum + session.duration_seconds, 0);
        const avgTime = totalProblems > 0 ? (totalTime / totalProblems).toFixed(2) : 0;
        
        const masteredFacts = facts.filter(fact => fact.box >= 5 && fact.streak >= 3).length;
        
        // Обновяваме UI
        document.getElementById('totalProblems').textContent = totalProblems;
        document.getElementById('avgAccuracy').textContent = `${accuracy}%`;
        document.getElementById('avgTime').textContent = `${avgTime}s`;
        document.getElementById('masteredFacts').textContent = `${masteredFacts}/100`;
        
    } catch (error) {
        console.error('Грешка при зареждане на основни статистики:', error);
    }
}

// Зареждане на статистики във времето и създаване на графики
async function loadTimeStats() {
    try {
        // Извличаме всички сесии на потребителя, сортирани по дата
        const { data: sessions, error } = await supabaseClient
            .from('sessions')
            .select('*')
            .eq('user_id', userData.id)
            .order('start_time', { ascending: true });
        
        if (error) throw error;
        
        // Обработваме данните за графиката на сесиите
        const sessionsByDate = sessions.reduce((acc, session) => {
            const date = new Date(session.start_time).toLocaleDateString();
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});
        
        // Обработваме данните за графиката на точността
        const accuracyByDate = sessions.reduce((acc, session) => {
            const date = new Date(session.start_time).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = {
                    correct: 0,
                    total: 0
                };
            }
            acc[date].correct += session.correct_count;
            acc[date].total += session.fact_count;
            return acc;
        }, {});
        
        // Създаваме графика за сесиите
        const sessionsCtx = document.getElementById('sessionsChart').getContext('2d');
        new Chart(sessionsCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(sessionsByDate),
                datasets: [{
                    label: 'Брой сесии',
                    data: Object.values(sessionsByDate),
                    backgroundColor: 'rgba(139, 92, 246, 0.7)',
                    borderColor: 'rgba(139, 92, 246, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        precision: 0
                    }
                }
            }
        });
        
        // Създаваме графика за точността
        const accuracyCtx = document.getElementById('accuracyChart').getContext('2d');
        new Chart(accuracyCtx, {
            type: 'line',
            data: {
                labels: Object.keys(accuracyByDate),
                datasets: [{
                    label: 'Точност (%)',
                    data: Object.entries(accuracyByDate).map(([date, data]) => 
                        data.total > 0 ? (data.correct / data.total) * 100 : 0
                    ),
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '%'
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Грешка при зареждане на времеви статистики:', error);
    }
}

// Зареждане на топлинна карта
async function loadHeatmap() {
    try {
        // Извличаме всички факти на потребителя
        const { data: userFacts, error: factsError } = await supabaseClient
            .from('user_facts')
            .select('*, facts(*)')
            .eq('user_id', userData.id);
        
        if (factsError) throw factsError;
        
        // Извличаме всички факти от таблицата за умножение (базови данни)
        const { data: allFacts, error: allFactsError } = await supabaseClient
            .from('facts')
            .select('*')
            .lte('multiplicand', 10)
            .lte('multiplier', 10);
        
        if (allFactsError) throw allFactsError;
        
        // Подготвяме данните за топлинната карта
        const heatmapContainer = document.getElementById('heatmapContainer');
        heatmapContainer.innerHTML = ''; // Изчистваме съдържанието
        
        // Създаваме контейнер за топлинната карта
        const heatmapTable = document.createElement('div');
        heatmapTable.className = 'heatmap-grid';
        
        // Добавяме CSS за топлинната карта
        const style = document.createElement('style');
        style.textContent = `
            .heatmap-grid {
                display: grid;
                grid-template-columns: repeat(11, 1fr);
                gap: 4px;
                max-width: 100%;
                overflow-x: auto;
            }
            .heatmap-cell {
                aspect-ratio: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
                font-weight: 500;
                transition: transform 0.2s, box-shadow 0.2s;
                cursor: help;
            }
            .heatmap-cell:hover {
                transform: scale(1.1);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10;
            }
            .heatmap-header {
                background-color: #f3e8ff;
                color: #6b21a8;
                font-weight: bold;
            }
            .fact-result {
                font-size: 1.2rem;
            }
            .fact-accuracy {
                font-size: 0.7rem;
                margin-top: 4px;
            }
        `;
        document.head.appendChild(style);
        
        // Добавяме горен ред със заглавия за колоните
        // Празна клетка в ъгъла
        const cornerCell = document.createElement('div');
        cornerCell.className = 'heatmap-cell heatmap-header';
        heatmapTable.appendChild(cornerCell);
        
        // Добавяме заглавия на колоните (1-10)
        for (let j = 1; j <= 10; j++) {
            const headerCell = document.createElement('div');
            headerCell.className = 'heatmap-cell heatmap-header';
            headerCell.textContent = j;
            heatmapTable.appendChild(headerCell);
        }
        
        // Генерираме клетките на топлинната карта
        for (let i = 1; i <= 10; i++) {
            // Добавяме заглавие на ред
            const rowHeader = document.createElement('div');
            rowHeader.className = 'heatmap-cell heatmap-header';
            rowHeader.textContent = i;
            heatmapTable.appendChild(rowHeader);
            
            // Добавяме клетките за този ред
            for (let j = 1; j <= 10; j++) {
                const cell = document.createElement('div');
                cell.className = 'heatmap-cell';
                
                // Намираме факта от базата данни
                const fact = allFacts.find(f => f.multiplicand === i && f.multiplier === j);
                
                if (!fact) continue;
                
                // Намираме потребителския факт, ако съществува
                const userFact = userFacts.find(uf => uf.fact_id === fact.id);
                
                // Определяме цвета базиран на точността
                let backgroundColor = '#f0f0f0'; // Сиво по подразбиране за неопитани факти
                let textColor = 'rgba(0, 0, 0, 0.7)';
                
                if (userFact) {
                    const attempts = userFact.attempts || 0;
                    const correct = userFact.correct_count || 0;
                    const accuracy = attempts > 0 ? correct / attempts : 0;
                    
                    if (accuracy >= 0.8) {
                        // Зелено за добро представяне
                        backgroundColor = `rgba(0, 200, 83, ${Math.min(0.3 + accuracy * 0.7, 1)})`;
                    } else if (accuracy >= 0.5) {
                        // Жълто за средно представяне
                        backgroundColor = `rgba(255, 193, 7, ${Math.min(0.3 + accuracy * 0.7, 1)})`;
                    } else if (attempts > 0) {
                        // Червено за слабо представяне
                        backgroundColor = `rgba(244, 67, 54, ${Math.min(0.3 + (1 - accuracy) * 0.7, 1)})`;
                        textColor = 'rgba(255, 255, 255, 0.87)';
                    }
                    
                    // Добавяме tooltip с информация
                    cell.title = `${i}×${j}=${i*j}\nОпити: ${attempts}, Верни: ${correct}\nТочност: ${Math.round(accuracy * 100)}%`;
                    
                    // Добавяме съдържание
                    const resultDiv = document.createElement('div');
                    resultDiv.className = 'fact-result';
                    resultDiv.textContent = i * j;
                    cell.appendChild(resultDiv);
                    
                    const accuracyDiv = document.createElement('div');
                    accuracyDiv.className = 'fact-accuracy';
                    accuracyDiv.textContent = `${Math.round(accuracy * 100)}%`;
                    cell.appendChild(accuracyDiv);
                } else {
                    // За неопитани факти
                    cell.title = `${i}×${j}=${i*j}\nНеопитан факт`;
                    
                    const resultDiv = document.createElement('div');
                    resultDiv.className = 'fact-result';
                    resultDiv.textContent = i * j;
                    cell.appendChild(resultDiv);
                }
                
                // Прилагаме стиловете
                cell.style.backgroundColor = backgroundColor;
                cell.style.color = textColor;
                
                // Добавяме клетката в таблицата
                heatmapTable.appendChild(cell);
            }
        }
        
        // Добавяме таблицата към контейнера
        heatmapContainer.appendChild(heatmapTable);
        
    } catch (error) {
        console.error('Грешка при зареждане на топлинна карта:', error);
        document.getElementById('heatmapContainer').innerHTML = 
            '<div class="text-center py-10 text-red-500">Грешка при зареждане на данните.</div>';
    }
}

// Зареждане на проблемни области
async function loadProblemAreas() {
    try {
        // Извличаме всички потребителски факти, сортирани по точност
        const { data: userFacts, error } = await supabaseClient
            .from('user_facts')
            .select('*, facts(*)')
            .eq('user_id', userData.id)
            .gt('attempts', 0) // Само факти, които са опитвани
            .order('accuracy', { ascending: true }); // Най-ниска точност първо
        
        if (error) throw error;
        
        // Изчисляваме точността за всеки факт
        const factsWithAccuracy = userFacts.map(uf => {
            const accuracy = uf.attempts > 0 ? uf.correct_count / uf.attempts : 0;
            return {
                ...uf,
                accuracyPercent: Math.round(accuracy * 100)
            };
        });
        
        // Взимаме най-проблемните 10 факта
        const problemFacts = factsWithAccuracy.slice(0, 10);
        
        // Генерираме HTML за проблемните области
        const container = document.getElementById('problemAreasContainer');
        container.innerHTML = ''; // Изчистваме съдържанието
        
        if (problemFacts.length === 0) {
            container.innerHTML = '<div class="text-center py-10">Няма достатъчно данни.</div>';
            return;
        }
        
        // Създаваме таблица с проблемните факти
        const table = document.createElement('table');
        table.className = 'min-w-full border-collapse';
        
        // Създаваме заглавния ред
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr class="bg-gray-100">
                <th class="px-4 py-2 text-left">Факт</th>
                <th class="px-4 py-2 text-left">Опити</th>
                <th class="px-4 py-2 text-left">Верни</th>
                <th class="px-4 py-2 text-left">Точност</th>
                <th class="px-4 py-2 text-left">Средно време</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Създаваме редовете с данни
        const tbody = document.createElement('tbody');
        problemFacts.forEach((fact, index) => {
            const row = document.createElement('tr');
            row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            
            row.innerHTML = `
                <td class="px-4 py-3 font-medium">
                    ${fact.facts.multiplicand} × ${fact.facts.multiplier} = ${fact.facts.multiplicand * fact.facts.multiplier}
                </td>
                <td class="px-4 py-3">${fact.attempts}</td>
                <td class="px-4 py-3">${fact.correct_count}</td>
                <td class="px-4 py-3">
                    <div class="flex items-center">
                        <div class="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                            <div class="h-2.5 rounded-full ${getColorClass(fact.accuracyPercent)}" style="width: ${fact.accuracyPercent}%"></div>
                        </div>
                        <span>${fact.accuracyPercent}%</span>
                    </div>
                </td>
                <td class="px-4 py-3">${fact.avg_time ? fact.avg_time.toFixed(2) : '0.00'} сек.</td>
            `;
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        container.appendChild(table);
        
    } catch (error) {
        console.error('Грешка при зареждане на проблемни области:', error);
        document.getElementById('problemAreasContainer').innerHTML = 
            '<div class="text-center py-10 text-red-500">Грешка при зареждане на данните.</div>';
    }
}

// Помощна функция за определяне на клас за цвят на точността
function getColorClass(accuracy) {
    if (accuracy >= 80) return 'bg-green-500';
    if (accuracy >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
}

// Инициализиране на дашборда при зареждане на страницата
document.addEventListener('DOMContentLoaded', initDashboard);
