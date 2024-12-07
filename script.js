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
    const wordPositions = []; // Store the positions of the word letters

    if (dictionary.includes(word)) {
        wordBox.forEach(item => {
            const tile = grid[item.x][item.y];
            tile.isPink = false;
            tile.isYellow = true;
            tile.used = true;
            wordPositions.push({ x: item.x, y: item.y }); // Store positions
        });
        recentWords.unshift({ word: word, positions: wordPositions }); // Store the word and its positions
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
        const wordWithLength = `${wordData.word} (${wordData.word.length})`; // Add word length in brackets
        li.textContent = wordWithLength;

        // Create the "X" button for removal
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
    recentWords.splice(index, 1); // Remove the word from recentWords array

    // Reset the grid for the specific word's letters
    wordData.positions.forEach(position => {
        const tile = grid[position.x][position.y];
        tile.isYellow = false;
        tile.isPink = false;
        tile.used = false;
    });

    // Update the board, stats, and recent words list
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
    
    // Update the score to reflect word removal
    document.getElementById('totalScore').textContent = lettersUsed - wordsCreated;
}


if (!document.getElementById('clearButton')) {
    // Create clearButton
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.id = 'clearButton'; // Ensure the button has this ID
    clearButton.style.margin = '15px';
    clearButton.style.padding = '10px 20px';
    clearButton.style.fontSize = '16px';
    document.body.appendChild(clearButton);

    clearButton.addEventListener('click', () => {
        grid.flat().forEach(tile => tile.isPink = false);
        wordBox = [];
        drawBoard();
        updateWordBox();
    });
}

// Create Reset Button
const resetButton = document.createElement('button');
resetButton.textContent = 'Reset';
resetButton.style.margin = '15px';
resetButton.style.padding = '10px 20px';
resetButton.style.fontSize = '16px';
resetButton.style.backgroundColor = 'red';
resetButton.style.color = 'white';
resetButton.style.border = 'none';
resetButton.style.borderRadius = '5px';
document.body.appendChild(resetButton);

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

// Create Check Button
const checkButton = document.createElement('button');
checkButton.textContent = 'Check';
checkButton.style.margin = '15px';
checkButton.style.padding = '10px 20px';
checkButton.style.fontSize = '16px';
checkButton.style.backgroundColor = 'darkgreen';
checkButton.style.color = 'white';
checkButton.style.border = 'none';
checkButton.style.borderRadius = '5px';
document.body.appendChild(checkButton);

checkButton.addEventListener('click', checkWord);

// Add spacing between buttons
// Add spacing between buttons
const buttonsContainer = document.createElement('div');
buttonsContainer.style.textAlign = 'center';
buttonsContainer.style.marginTop = '20px';

// Append Reset first, then Clear, followed by Check
buttonsContainer.append(resetButton, clearButton, checkButton);
document.body.appendChild(buttonsContainer);



const wordBoxDiv = document.createElement('div');
wordBoxDiv.innerHTML = '<strong>Word Box:</strong> <span id="wordBox"></span>';
document.body.appendChild(wordBoxDiv);
  


// Create a Practice Mode Button
const practiceModeButton = document.createElement('button');
practiceModeButton.textContent = 'Practice Mode';
practiceModeButton.style.position = 'absolute';
practiceModeButton.style.top = '10px';
practiceModeButton.style.left = '10px';
practiceModeButton.style.marginBottom = '10px';
practiceModeButton.style.padding = '10px 20px';
practiceModeButton.style.fontSize = '16px';
document.body.appendChild(practiceModeButton);

// Add event listener for toggling the button text
let isPracticeMode = false; // Track practice mode state
practiceModeButton.addEventListener('click', () => {
    isPracticeMode = !isPracticeMode; // Toggle state
   
    if (isPracticeMode) {
        // Reset recent words and score when practice mode is activated
        recentWords = [];
        updateRecentWordsList();
        updateStats();
    }
   
    reloadGrid(isPracticeMode); // Call reloadGrid function
    // Hide or show dateDiv based on practice mode
    dateDiv.style.display = isPracticeMode ? 'none' : 'block';  // Hide if practice mode, show if not
});



function reloadGrid(isPracticeMode) {
    if (isPracticeMode) {
        // Generate a frequency-based grid
        grid = generateFrequencyBasedGrid(rows, cols);
    } else {
        // Fetch daily grid
        fetchDailyGrid()
            .then(fetchedGrid => {
                grid = fetchedGrid;
                drawBoard();  // Redraw board after grid change
            })
            .catch(error => console.error("Error fetching daily grid:", error));
    }
    drawBoard();  // Redraw board after grid change
}

function generateFrequencyBasedGrid(rows, cols) {
    const letterFrequencies = {
        'A': 9, 'B': 2, 'C': 2, 'D': 4, 'E': 12, 'F': 2, 'G': 3, 'H': 3,
        'I': 9, 'J': 1, 'K': 1, 'L': 4, 'M': 2, 'N': 6, 'O': 8, 'P': 2, 
        'Q': 1, 'R': 6, 'S': 6, 'T': 9, 'U': 4, 'V': 2, 'W': 2, 'X': 1, 
        'Y': 2, 'Z': 1
    };

    const grid = [];
    const letters = Object.keys(letterFrequencies);
    let letterPool = [];

    letters.forEach(letter => {
        for (let i = 0; i < letterFrequencies[letter]; i++) {
            letterPool.push(letter);
        }
    });

    for (let x = 0; x < cols; x++) {
        grid[x] = [];
        for (let y = 0; y < rows; y++) {
            const randomLetter = letterPool[Math.floor(Math.random() * letterPool.length)];
            grid[x][y] = {
                letter: randomLetter,
                isPink: false,
                isYellow: false,
                used: false
            };
        }
    }

    return grid;
}

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
