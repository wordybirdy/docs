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
                    console.warn("No grid found for today's date. Generating random grid.");
                    return generateRandomGrid(rows, cols);
                }
            })
            .catch(error => {
                console.error("Error fetching daily grid:", error);
                return generateRandomGrid(rows, cols);
            });
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
            .catch(error => {
                console.error("Error initializing board:", error);
            });
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

    canvas.addEventListener('click', (event) => {
        const x = Math.floor(event.offsetX / tileSize);
        const y = Math.floor(event.offsetY / tileSize);
        const tile = grid[x][y];

        if (!tile.isYellow && !tile.used) {
            tile.isPink = !tile.isPink;

            if (tile.isPink) {
                wordBox.push({ letter: tile.letter, x, y });
            } else {
                wordBox = wordBox.filter(item => item.x !== x || item.y !== y);
            }
            drawBoard();
        }
    });

    function updateWordBox() {
        const wordBoxElement = document.getElementById('wordBox');
        wordBoxElement.textContent = wordBox.map(item => item.letter).join('');
    }

    function checkWord() {
        const word = wordBox.map(item => item.letter).join('');
        const wordPositions = [];

        if (dictionary.includes(word)) {
            wordBox.forEach(item => {
                const tile = grid[item.x][item.y];
                tile.isPink = false;
                tile.isYellow = true;
                tile.used = true;
                wordPositions.push({ x: item.x, y: item.y });
            });
            recentWords.unshift({ word: word, positions: wordPositions });
            updateRecentWordsList();
        } else {
            wordBox.forEach(item => {
                grid[item.x][item.y].isPink = false;
            });
        }
        wordBox = [];
        drawBoard();
    }

    function updateRecentWordsList() {
        const recentWordsList = document.getElementById('recentWordsList');
        recentWordsList.innerHTML = '';
        recentWords.forEach((wordData, index) => {
            const li = document.createElement('li');
            const wordWithLength = `${wordData.word} (${wordData.word.length})`;
            li.textContent = wordWithLength;

            const removeButton = document.createElement('button');
            removeButton.textContent = 'X';
            removeButton.style.marginLeft = '10px';
            removeButton.addEventListener('click', () => removeWord(index));

            li.appendChild(removeButton);
            recentWordsList.appendChild(li);
        });

        updateStats();
    }

    function removeWord(index) {
        const wordData = recentWords[index];
        recentWords.splice(index, 1);

        wordData.positions.forEach(position => {
            const tile = grid[position.x][position.y];
            tile.isYellow = false;
            tile.isPink = false;
            tile.used = false;
        });

        drawBoard();
        updateRecentWordsList();
        updateStats();
    }

    function updateStats() {
        const lettersUsed = grid.flat().filter(tile => tile.isYellow).length;
        const wordsCreated = recentWords.length;
        const remainingLetters = grid.flat().filter(tile => !tile.isYellow).length;

        document.getElementById('lettersUsed').textContent = lettersUsed;
        document.getElementById('wordsCreated').textContent = wordsCreated;
        document.getElementById('remainingLetters').textContent = remainingLetters;

        document.getElementById('totalScore').textContent = lettersUsed - wordsCreated;
    }

    const buttonsContainer = document.createElement('div');
    buttonsContainer.id = 'buttonsContainer';  // Set an ID for reference
    buttonsContainer.style.textAlign = 'center';
    buttonsContainer.style.marginTop = '20px';

    // Create and append Clear Button
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.style.margin = '15px';
    clearButton.style.padding = '10px 20px';
    clearButton.style.fontSize = '16px';
    clearButton.addEventListener('click', () => {
        grid.flat().forEach(tile => tile.isPink = false);
        wordBox = [];
        drawBoard();
        updateWordBox();
    });
    buttonsContainer.appendChild(clearButton);

    // Create and append Reset Button
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset';
    resetButton.style.margin = '15px';
    resetButton.style.padding = '10px 20px';
    resetButton.style.fontSize = '16px';
    resetButton.style.backgroundColor = 'red';
    resetButton.style.color = 'white';
    resetButton.style.border = 'none';
    resetButton.style.borderRadius = '5px';
    resetButton.addEventListener('click', () => {
        grid.flat().forEach(tile => {
            tile.isPink = false;
            tile.isYellow = false;
            tile.used = false;
        });
        recentWords = [];
        wordBox = [];
        updateRecentWordsList();
        updateStats();
        drawBoard();
    });
    buttonsContainer.appendChild(resetButton);

    // Create and append Check Button
    const checkButton = document.createElement('button');
    checkButton.textContent = 'Check';
    checkButton.style.margin = '15px';
    checkButton.style.padding = '10px 20px';
    checkButton.style.fontSize = '16px';
    checkButton.style.backgroundColor = 'darkgreen';
    checkButton.style.color = 'white';
    checkButton.style.border = 'none';
    checkButton.style.borderRadius = '5px';
    checkButton.addEventListener('click', checkWord);
    buttonsContainer.appendChild(checkButton);

    // Append the button container div to the document body
    document.body.appendChild(buttonsContainer);

    const wordBoxDiv = document.createElement('div');
    wordBoxDiv.innerHTML = '<strong>Word Box:</strong> <span id="wordBox"></span>';
    document.body.appendChild(wordBoxDiv);


    // Create Daily Challenge Button
const dailyChallengeButton = document.createElement('button');
dailyChallengeButton.textContent = 'Daily Challenge';
dailyChallengeButton.style.position = 'absolute';
dailyChallengeButton.style.top = '60px'; // Positioned just below Practice Mode
dailyChallengeButton.style.left = '10px';
dailyChallengeButton.style.marginBottom = '10px';
dailyChallengeButton.style.padding = '10px 20px';
dailyChallengeButton.style.fontSize = '16px';
dailyChallengeButton.style.backgroundColor = '#007BFF';
dailyChallengeButton.style.color = 'white';
dailyChallengeButton.style.border = 'none';
dailyChallengeButton.style.borderRadius = '5px';
document.body.appendChild(dailyChallengeButton);

// Add event listener for the Daily Challenge button
dailyChallengeButton.addEventListener('click', () => {
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
            drawBoard(); // Redraw the board with the daily challenge grid
        })
        .catch(error => console.error("Error loading daily challenge grid:", error));
  
  // Show the dateDiv again when Daily Challenge button is clicked
    dateDiv.style.display = 'block';
    
});

  


    // Create a div for the date
const dateDiv = document.createElement('div');
dateDiv.style.position = 'absolute';
dateDiv.style.top = '110px';
dateDiv.style.left = '10px';
dateDiv.style.fontSize = '16px';
dateDiv.style.color = 'black';

// Format today's date as DD,MM,YY
const today = new Date();
const formattedDate = `${today.getDate().toString().padStart(2, '0')},${(today.getMonth() + 1).toString().padStart(2, '0')},${today.getFullYear().toString().slice(-2)}`;

// Set the text content
dateDiv.textContent = `Daily Challenge: ${formattedDate}`;

// Add the div to the body
document.body.appendChild(dateDiv);

    initBoard();
});
