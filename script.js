document.addEventListener('DOMContentLoaded', () => {
    const wheel = document.getElementById('wheel');
    const spinButton = document.getElementById('spin');
    const stopSpinButton = document.getElementById('stopSpin');
    const acceptResultButton = document.getElementById('acceptResult');
    const gameInput = document.getElementById('gameInput');
    const addGameButton = document.getElementById('addGame');
    const gamesList = document.getElementById('gamesList');
    const resultDiv = document.getElementById('result');
    const timerDiv = document.getElementById('timer');
    const winsTableBody = document.querySelector('#winsTable tbody');
    const playerInput = document.getElementById('playerInput');
    const addPlayerButton = document.getElementById('addPlayer');
    const editPlayerButton = document.getElementById('editPlayer');
    const deletePlayerButton = document.getElementById('deletePlayer');
    const playerSelect = document.getElementById('playerSelect');
    const spinDurationInput = document.getElementById('spinDuration');
    const rulesModal = document.getElementById('rulesModal');
    const rulesButton = document.getElementById('rulesButton');
    const closeButton = document.querySelector('.close');
    const rulesContent = document.getElementById('rulesContent');
    const downloadTableButton = document.getElementById('downloadTable');
    const uploadTableButton = document.getElementById('uploadTable');
    const fileInput = document.getElementById('fileInput');

    if (!wheel || !spinButton || !stopSpinButton || !acceptResultButton || !gameInput ||
        !addGameButton || !gamesList || !resultDiv || !timerDiv || !winsTableBody ||
        !playerInput || !addPlayerButton || !editPlayerButton || !deletePlayerButton ||
        !playerSelect || !spinDurationInput || !rulesModal || !rulesButton || !closeButton ||
        !rulesContent || !downloadTableButton || !uploadTableButton || !fileInput) {
        console.error('Не все элементы найдены в DOM!');
        return;
    }

    let players = [];
    let currentPlayerIndex = -1;
    let rotationAngle = 0;
    const colors = ['#FFB6C1', '#ADD8E6', '#90EE90', '#FFD700', '#FFA07A', '#20B2AA', '#FF69B4', '#87CEFA', '#32CD32', '#FF4500'];
    let currentWinningGame = null;
    let spinInterval = null;
    let isSpinning = false;
    let isResultPending = false;

    // Делаем правила прокручиваемыми
    rulesContent.style.overflowY = 'auto';
    rulesContent.style.maxHeight = '300px';

    // Функция для создания ссылки на игру в Steam
    function createSteamLink(gameName) {
        const encodedGameName = encodeURIComponent(gameName.trim());
        return `https://store.steampowered.com/search/?term=${encodedGameName}`;
    }

    // Функция для создания сектора колеса
    function createSector(index, totalSectors) {
        const startAngle = (index / totalSectors) * 360;
        const endAngle = ((index + 1) / totalSectors) * 360;
        const startX = Math.cos((startAngle - 90) * Math.PI / 180);
        const startY = Math.sin((startAngle - 90) * Math.PI / 180);
        const endX = Math.cos((endAngle - 90) * Math.PI / 180);
        const endY = Math.sin((endAngle - 90) * Math.PI / 180);
        const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
        const pathData = `
            M 0 0
            L ${startX} ${startY}
            A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}
            Z
        `;
        const sector = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        sector.setAttribute('d', pathData);
        sector.setAttribute('fill', colors[index % colors.length]);
        return sector;
    }

    // Функция для обновления колеса
    function updateWheel(gamesToDisplay) {
        wheel.innerHTML = '';
        if (gamesToDisplay.length > 0) {
            gamesToDisplay.forEach((_, index) => {
                const sector = createSector(index, gamesToDisplay.length);
                wheel.appendChild(sector);
            });
            gamesToDisplay.forEach((game, index) => {
                const angle = ((index + 0.5) / gamesToDisplay.length) * 360 - 90;
                const x = Math.cos(angle * Math.PI / 180) * 0.7;
                const y = Math.sin(angle * Math.PI / 180) * 0.7;
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', x);
                text.setAttribute('y', y);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'middle');
                text.setAttribute('font-size', '0.1');
                text.textContent = game;
                wheel.appendChild(text);
            });
        }
    }

    // Функция для получения игр других игроков
    function getOtherPlayersGames(currentPlayer) {
        const otherGames = [];
        players.forEach(player => {
            if (player !== currentPlayer) {
                otherGames.push(...player.games);
            }
        });
        return otherGames;
    }

    // Функция для кручения колеса
    function spinWheel() {
        if (currentPlayerIndex === -1) {
            alert('Выберите игрока!');
            return;
        }
        const currentPlayer = players[currentPlayerIndex];
        const otherGames = getOtherPlayersGames(currentPlayer);
        if (otherGames.length === 0) {
            alert('Нет доступных игр для кручения!');
            return;
        }
        spinButton.disabled = true;
        stopSpinButton.style.display = 'inline-block';
        isSpinning = true;
        isResultPending = true;
        resultDiv.textContent = 'Колесо крутится...';
        const randomIndex = Math.floor(Math.random() * otherGames.length);
        currentWinningGame = otherGames[otherGames.length - randomIndex - 1];
        const duration = parseInt(spinDurationInput.value) * 1000;
        const sectorSize = 360 / otherGames.length;
        const targetAngle = (randomIndex * sectorSize + sectorSize / 2) % 360;
        const currentRotation = rotationAngle % 360;
        const additionalSpins = 720;
        const finalRotation = rotationAngle + additionalSpins + ((targetAngle - currentRotation + 360) % 360);
        wheel.style.transition = `transform ${duration}ms ease-out`;
        wheel.style.transform = `rotate(${finalRotation}deg)`;
        let remainingTime = duration / 1000;
        timerDiv.textContent = `Осталось времени: ${remainingTime} сек`;
        spinInterval = setInterval(() => {
            remainingTime--;
            timerDiv.textContent = `Осталось времени: ${remainingTime} сек`;
            if (remainingTime <= 0) {
                clearInterval(spinInterval);
                timerDiv.textContent = 'Осталось времени: 0 сек';
            }
        }, 1000);
        setTimeout(() => {
            if (isSpinning) {
                resultDiv.textContent = `Вы выиграли: ${currentWinningGame}`;
                acceptResultButton.style.display = 'inline-block';
                wheel.style.transition = 'none';
                wheel.style.transform = `rotate(${finalRotation}deg)`;
                spinButton.disabled = false;
                stopSpinButton.style.display = 'none';
                isSpinning = false;
                rotationAngle = finalRotation;
            }
        }, duration);
    }

    // Функция для остановки колеса без выбора игры
    function stopWheel() {
        if (!isSpinning) return;
        clearInterval(spinInterval);
        wheel.style.transition = 'none';
        wheel.style.transform = `rotate(${rotationAngle}deg)`;
        timerDiv.textContent = 'Осталось времени: 0 сек';
        resultDiv.textContent = '';
        stopSpinButton.style.display = 'none';
        spinButton.disabled = false;
        isSpinning = false;
        currentWinningGame = null;
        isResultPending = false;
    }

    // Функция для принятия результата
    function acceptResult() {
        if (currentWinningGame === null) {
            alert('Нет активного результата для принятия!');
            return;
        }
        const currentPlayer = players[currentPlayerIndex];
        updateWinsTable(currentPlayer.name, currentWinningGame);
        players.forEach(player => {
            const gameIndex = player.games.indexOf(currentWinningGame);
            if (gameIndex !== -1) {
                player.games.splice(gameIndex, 1);
            }
        });
        currentWinningGame = null;
        resultDiv.textContent = '';
        acceptResultButton.style.display = 'none';
        updateGamesList();
        updateWheel(getOtherPlayersGames(currentPlayer));
        isResultPending = false;
    }

    // Функция для добавления игрока
    function addPlayer() {
        const playerName = playerInput.value.trim();
        if (playerName) {
            players.push({ name: playerName, games: [] });
            updatePlayerSelect();
            addPlayerToWinsTable(playerName);
            playerInput.value = '';
        } else {
            alert('Введите имя игрока!');
        }
    }

    // Функция для редактирования имени игрока
    function editPlayer() {
        if (currentPlayerIndex === -1) {
            alert('Выберите игрока для редактирования!');
            return;
        }
        const newPlayerName = prompt('Введите новое имя игрока:');
        if (newPlayerName && newPlayerName.trim()) {
            const oldPlayerName = players[currentPlayerIndex].name;
            players[currentPlayerIndex].name = newPlayerName.trim();
            updatePlayerSelect();
            updateWinsTableAfterEdit(oldPlayerName, newPlayerName.trim());
        }
    }

    // Функция для удаления игрока
    function deletePlayer() {
        if (currentPlayerIndex === -1) {
            alert('Выберите игрока для удаления!');
            return;
        }
        const confirmDelete = confirm('Вы уверены, что хотите удалить игрока?');
        if (confirmDelete) {
            players.splice(currentPlayerIndex, 1);
            updatePlayerSelect();
            if (players.length === 0) {
                currentPlayerIndex = -1;
                gamesList.innerHTML = '';
                resultDiv.textContent = '';
                acceptResultButton.style.display = 'none';
                updateWheel([]);
            } else {
                currentPlayerIndex = 0;
                playerSelect.selectedIndex = 0;
                updateGamesList();
                updateWheel(getOtherPlayersGames(players[currentPlayerIndex]));
            }
        }
    }

    // Функция для обновления списка игроков
    function updatePlayerSelect() {
        playerSelect.innerHTML = '';
        players.forEach((player, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = player.name;
            playerSelect.appendChild(option);
        });
        if (players.length > 0) {
            currentPlayerIndex = 0;
            playerSelect.selectedIndex = 0;
            updateGamesList();
        } else {
            currentPlayerIndex = -1;
            gamesList.innerHTML = '';
        }
    }

    // Функция для добавления игры
    function addGame() {
        if (currentPlayerIndex === -1) {
            alert('Выберите игрока!');
            return;
        }
        const gameName = gameInput.value.trim();
        if (gameName) {
            const currentPlayer = players[currentPlayerIndex];
            currentPlayer.games.push(gameName);
            updateGamesList();
            gameInput.value = '';
        } else {
            alert('Введите название игры!');
        }
    }

    // Функция для обновления списка игр
    function updateGamesList() {
        gamesList.innerHTML = '';
        if (currentPlayerIndex !== -1) {
            const currentPlayer = players[currentPlayerIndex];
            currentPlayer.games.forEach((game, index) => {
                const li = document.createElement('li');
                const steamLink = createSteamLink(game);
                li.innerHTML = `
                    <span>${game}</span>
                    <a href="${steamLink}" target="_blank" style="margin-left: 10px; color: blue; text-decoration: underline;">Steam</a>
                    <span class="delete-game" style="color: red; margin-left: 10px; cursor: pointer;">Удалить</span>
                `;
                const deleteButton = li.querySelector('.delete-game');
                deleteButton.addEventListener('click', () => {
                    currentPlayer.games.splice(index, 1);
                    updateGamesList();
                });
                gamesList.appendChild(li);
            });
        }
    }

    // Функция для добавления игрока в таблицу выигрышей
    function addPlayerToWinsTable(playerName) {
        const row = document.createElement('tr');
        row.dataset.playerName = playerName;
        const nameCell = document.createElement('td');
        nameCell.textContent = playerName;
        const winCell = document.createElement('td');
        winCell.textContent = '-';
        row.appendChild(nameCell);
        row.appendChild(winCell);
        winsTableBody.appendChild(row);
    }

    // Функция для обновления таблицы выигрышей после редактирования имени
    function updateWinsTableAfterEdit(oldPlayerName, newPlayerName) {
        const rows = Array.from(winsTableBody.querySelectorAll('tr'));
        const playerRow = rows.find(row => row.dataset.playerName === oldPlayerName);
        if (playerRow) {
            playerRow.dataset.playerName = newPlayerName;
            playerRow.querySelector('td:first-child').textContent = newPlayerName;
        }
    }

    // Функция для обновления таблицы выигрышей
    function updateWinsTable(playerName, winningGame) {
        const rows = Array.from(winsTableBody.querySelectorAll('tr'));
        const playerRow = rows.find(row => row.dataset.playerName === playerName);
        if (playerRow) {
            const winCell = playerRow.querySelector('td:last-child');
            winCell.textContent = winningGame;
        }
    }

function downloadTable() {
        const csv = ['Имя игрока,Выигранные игры,Оставшиеся игры'];
        players.forEach(player => {
            const wonGames = winsTableBody.querySelector(tr[data-player-name="${player.name}"] td:last-child).textContent;
            const remainingGames = player.games.join(';');
            csv.push(${player.name},${wonGames},${remainingGames});
        });
        const csvString = csv.join('\n');
        const json = JSON.stringify(players)
        const result = ${window.location.origin}/csv#${encodeURIComponent(json)}
        console.log(result)
        navigator.clipboard.writeText(result)

        // const blob = new Blob([csvString], { type: 'text/csv' });
        // const url = URL.createObjectURL(blob);
        // const a = document.createElement('a');
        // a.href = url;
        // a.download = 'game_data.csv';
        // a.click();
        // URL.revokeObjectURL(url);
    }

    // Функция для загрузки таблицы
    function uploadTable(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            const content = e.target.result;
            const rows = content.split('\n');
            players = [];
            winsTableBody.innerHTML = '';
            rows.forEach((row, rowIndex) => {
                if (row.trim() === '' || rowIndex === 0) return;
                const [playerName, wonGames, remainingGames] = row.split(',');
                const player = {
                    name: playerName.trim(),
                    games: remainingGames.trim().split(';').filter(game => game.trim() !== '')
                };
                players.push(player);
                const tableRow = document.createElement('tr');
                tableRow.dataset.playerName = playerName.trim();
                const nameCell = document.createElement('td');
                nameCell.textContent = playerName.trim();
                tableRow.appendChild(nameCell);
                const winCell = document.createElement('td');
                winCell.textContent = wonGames.trim() || '-';
                tableRow.appendChild(winCell);
                winsTableBody.appendChild(tableRow);
            });
            updatePlayerSelect();
            updateGamesList();
            updateWheel(getOtherPlayersGames(players[currentPlayerIndex]));
        };
        reader.readAsText(file);
    }

    // Блокировка переключения между игроками при непринятом результате
    playerSelect.addEventListener('change', () => {
        if (isResultPending) {
            alert('Сначала примите результат текущего игрока!');
            playerSelect.value = currentPlayerIndex;
            return;
        }
        currentPlayerIndex = playerSelect.value;
        updateGamesList();
        updateWheel(getOtherPlayersGames(players[currentPlayerIndex]));
    });

    // Обработчики событий
    spinButton.addEventListener('click', spinWheel);
    stopSpinButton.addEventListener('click', stopWheel);
    acceptResultButton.addEventListener('click', acceptResult);
    addPlayerButton.addEventListener('click', addPlayer);
    editPlayerButton.addEventListener('click', editPlayer);
    deletePlayerButton.addEventListener('click', deletePlayer);
    addGameButton.addEventListener('click', addGame);
    downloadTableButton.addEventListener('click', downloadTable);
    uploadTableButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', uploadTable);
    rulesButton.addEventListener('click', () => rulesModal.style.display = 'block');
    closeButton.addEventListener('click', () => rulesModal.style.display = 'none');
});