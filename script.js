document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const rows = 6;
    const cols = 6;
    const tileSize = canvas.width / cols;

    let dictionary = [];
    let grid = [];
    let wordBox = [];
    let recentWords = [];

    const dictionaryUrl = 'https://raw.githubusercontent.com/wordybirdy/docs/main/dictionary.json';
    fetch(dictionaryUrl)
        .then(response => response.json())
        .then(data => {
            dictionary = data.words;
            initBoard();
        })
        .catch(error => console.error('Error loading dictionary:', error));

    function initBoard() {
        fetchDailyGrid()
            .then(fetchedGrid => {
                grid = [];
                for (let x = 0; x < cols; x++) {
                    grid[x] = [];
                    for (let y = 0; y < rows; y++) {
                        grid[x][y] = {
                            letter: fetchedGrid[x][y],
                            isPink: false,
                            isYellow: false,
                            used: false
                        };
                    }
                }
                drawBoard();
                createUI();
            })
            .catch(error => console.error("Error initializing board:", error));
    }

    function fetchDailyGrid() {
        const today = new Date().toISOString().slice(0, 10);
        const gridUrl = 'https://raw.githubusercontent.com/wordybirdy/docs/main/grids.json';

        return fetch(gridUrl)
            .then(response => response.json())
            .then(data => {
                const dailyGrid = data[today];
                if (dailyGrid && dailyGrid.grid) {
                    return dailyGrid.grid;
                } else {
                    return generateRandomGrid(rows, cols);
                }
            })
            .catch(() => generateRandomGrid(rows, cols));
    }

    function generateRandomGrid(rows, cols) {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const grid = [];
        for (let x = 0; x < cols; x++) {
            grid[x] = [];
            for (let y = 0; y < rows; y++) {
                const randomLetter = letters[Math.floor(Math.random() * letters.length)];
                grid[x][y] = randomLetter;
            }
        }
        return grid;
    }

    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                drawGem(x, y, grid[x][y].letter, grid[x][y].isPink, grid[x][y].isYellow);
            }
        }
        updateWordBox();
    }

    function drawGem(x, y, letter, isPink, isYellow) {
        ctx.fillStyle = isYellow ? 'yellow' : isPink ? 'pink' : '#000';
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);

        ctx.fillStyle = 'white';
        ctx.font = `${tileSize / 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, x * tileSize + tileSize / 2, y * tileSize + tileSize / 2);
    }

    // CSS Styling via JavaScript
    const style = document.createElement('style');
    style.innerHTML = `
        body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 0;
        }

        #gameCanvas {
            border: 2px solid black;
            margin-bottom: 20px;
        }

        #buttonsContainer {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px;
        }

        button {
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
        }

        button:focus {
            outline: none;
        }

        #dateDiv {
            margin-bottom: 10px;
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }
    `;
    document.head.appendChild(style);

    // Add buttons and UI elements
    const buttonsContainer = document.createElement('div');
    buttonsContainer.id = 'buttonsContainer';

    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.addEventListener('click', () => {
        grid.flat().forEach(tile => (tile.isPink = false));
        wordBox = [];
        drawBoard();
    });

    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset';
    resetButton.addEventListener('click', () => {
        grid.flat().forEach(tile => {
            tile.isPink = false;
            tile.isYellow = false;
            tile.used = false;
        });
        wordBox = [];
        drawBoard();
    });

    const dailyChallengeButton = document.createElement('button');
    dailyChallengeButton.textContent = 'Daily Challenge';
    dailyChallengeButton.addEventListener('click', () => {
        fetchDailyGrid().then(fetchedGrid => {
            grid = [];
            for (let x = 0; x < cols; x++) {
                grid[x] = [];
                for (let y = 0; y < rows; y++) {
                    grid[x][y] = {
                        letter: fetchedGrid[x][y],
                        isPink: false,
                        isYellow: false,
                        used: false
                    };
                }
            }
            drawBoard();
        });
    });

    buttonsContainer.appendChild(clearButton);
    buttonsContainer.appendChild(resetButton);
    buttonsContainer.appendChild(dailyChallengeButton);

    const dateDiv = document.createElement('div');
    dateDiv.id = 'dateDiv';
    const today = new Date();
    dateDiv.textContent = `Daily Challenge: ${today.toDateString()}`;

    document.body.appendChild(dateDiv);
    document.body.appendChild(canvas);
    document.body.appendChild(buttonsContainer);

    initBoard();
});
