const debug = false;

// todo: Add banana mine counter updating on mark/unmark
// change text on button win/gameover and change status bar bg colour
// checker pattern
// save high scores
// refactor again

const btnStart = document.getElementById('btn-start');
const statusMsg = document.getElementById('status-message');
const timeDisplay = document.getElementById('time-display');

const difficultySelect = document.getElementById('difficulty-select');

const Difficulty = {
  Easy: {
    mines: 10,
    rows: 8,
    columns: 10,
  },
  Medium: {
    mines: 40,
    rows: 14,
    columns: 18,
  },
  Hard: {
    mines: 99,
    rows: 20,
    columns: 24,
  },
};

// IIFE to create the game object and run newGame with default settings
const Game = (function () {
  // setup
  let timer;
  let time = 0;

  function newGame(settings = Difficulty.Easy) {
    console.log('creating new game');
    // reset timer function ?
    btnStart.hidden = true;
    stopTimer();
    timeDisplay.innerHTML = '000';
    this.board = new Board(
      document.getElementById('test-board'),
      settings.rows,
      settings.columns,
      settings.mines
    );
    this.state = 'ready';
    // startTimer();
  }

  function startTimer() {
    time = 0;
    timer = setInterval(updateTimer, 1000);
    this.state = 'playing';
  }

  function stopTimer() {
    clearInterval(timer);
    this.state = 'end';
  }

  function updateTimer() {
    time += 1;
    let formatted = time.toString();
    while (formatted.length < 3) {
      formatted = '0' + formatted;
    }
    timeDisplay.innerHTML = formatted;
  }

  function gameOver(cell) {
    stopTimer();
    Game.state = 'end';
    console.log(this.board.mines);
    this.board.getMines().forEach((mine) => mine.element.classList.add('mine'));
    cell.element.classList.add('mine--clicked');
    btnStart.hidden = false;
  }

  function win() {
    console.log('game win');
    stopTimer();
    Game.state = 'end';
    btnStart.hidden = false;
  }

  newGame();
  // expose newGame function publicly
  return {
    newGame,
    startTimer,
    stopTimer,
    gameOver,
    win,
  };
})();

Game.newGame();

function Cell(parent, i) {
  this.index = i;
  this.adjacentMines = 0;
  this.isMarked = false;
  this.hasMine = false;
  this.isCleared = false;

  parent.insertAdjacentHTML(
    'beforeend',
    `<div class="cell" data-index="${this.index}"></div>`
  );
  this.element = parent.querySelector(`.cell[data-index="${this.index}"]`);
}

Cell.prototype.toggleMarked = function () {
  this.isMarked = !this.isMarked;
  if (this.isMarked) {
    this.element.classList.add('marked');
  } else {
    this.element.classList.remove('marked');
  }
};

function Board(element, rows, columns, numMines) {
  element.innerHTML = '';
  element.dataset.columns = columns;
  element.addEventListener('click', handleClick);
  element.addEventListener('contextmenu', handleRightClick);
  const cells = [];
  let cellsToClear = rows * columns - numMines;

  while (cells.length < rows * columns) {
    cells.push(new Cell(element, cells.length));
  }

  // refactor placing mines and incrementing in one go
  const mines = [];
  while (mines.length < numMines) {
    const mine = Math.floor(Math.random() * cells.length);
    if (!mines.includes(mine)) {
      mines.push(mine);
    }
  }

  mines.forEach((mine) => {
    cells[mine].hasMine = true;

    // debug show mine
    cells[mine].element.classList.add('banana');
    // increment neighbour mine count
    getNeighbors(mine).forEach((cell) => {
      if (cell.hasMine) {
        cell.adjacentMines = null;
      } else {
        cell.adjacentMines += 1;
      }
      // debug draw numbers
    });
    cells[mine].adjacentMines = null;
  });

  function getNeighbors(index) {
    // array index to 2D row/column coordinates
    const getCoords = (index) => ({
      row: Math.floor(index / columns),
      column: index % columns,
    });

    const neighbors = [];
    const cell = getCoords(index);

    for (let row = cell.row - 1; row <= cell.row + 1; row++) {
      for (let col = cell.column - 1; col <= cell.column + 1; col++) {
        const neighbor = row * columns + col;
        if (
          neighbor >= 0 &&
          neighbor < cells.length &&
          neighbor !== index &&
          getCoords(neighbor).row === row
        ) {
          neighbors.push(cells[neighbor]);
        }
      }
    }
    return neighbors;
  }

  console.log('Board.cells', cells);

  return {
    getCellByIndex(index) {
      return cells[index];
    },
    clearCell(cell) {
      if (cell.isMine || cell.isCleared) return;

      cell.isCleared = true;

      if (cell.adjacentMines === 0) {
        getNeighbors(cell.index).forEach((cell) => this.clearCell(cell));
      }
      cell.element.classList.add('revealed');
      cell.element.dataset.number = cell.adjacentMines || '';
      cell.element.classList.remove('marked');
      cell.isMarked = false;

      cellsToClear -= 1;
      if (cellsToClear === 0) Game.win();
    },
    getMines() {
      return mines.map((mine) => cells[mine]);
    },
  };
}

// const testBoard = new Board(document.getElementById('test-board'), 8, 10, 10);

function handleClick(e) {
  if (!e.target.classList.contains('cell')) return;

  console.log('click', e.target);
  if (Game.state === 'ready') Game.startTimer();
  if (Game.state !== 'playing') return;

  const cell = Game.board.getCellByIndex(e.target.dataset.index);
  if (cell.isMarked || cell.isCleared) return;
  if (cell.hasMine) return Game.gameOver(cell);

  Game.board.clearCell(cell);
}

function handleRightClick(e) {
  e.preventDefault();
  if (!e.target.classList.contains('cell')) return;

  console.log('right-click', e.target);
  if (Game.state === 'ready') Game.startTimer();
  if (Game.state !== 'playing') return;

  const cell = Game.board.getCellByIndex(e.target.dataset.index);
  console.log('try mark', cell);
  if (!cell.isCleared) cell.toggleMarked();
}

difficultySelect.addEventListener('change', (e) => {
  Game.newGame(Difficulty[e.target.value]);
  e.target.blur();
});

btnStart.addEventListener('click', () => {
  Game.newGame(Difficulty[difficultySelect.value]);
});
