const debug = false;

// todo: stop multiple intervals being set if a right click then a left click is pressed at the start

const board = document.getElementById('board');
const btnStart = document.getElementById('btn-start');
const statusMsg = document.getElementById('status-message');

const difficultySelect = document.getElementById('difficulty-select');

let boardCells = [];
let minesRemaining;

const Game = {
  state: '',
  cells: [],
  mines: [],
  time: 0,
  minesRemaining: 0,
  cellsRemaining: 0,
  board: {
    rows: 8,
    columns: 10,
    length() {
      return this.rows * this.columns;
    },
  },
};

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

// need to redo flood fill
function revealCell(index) {
  const boundingCells = getBounds(index);
  console.log('testing cell ' + index);
  if (
    Game.cells[index] === 0 &&
    !boardCells[index].classList.contains('revealed')
  ) {
    boardCells[index].classList.add('revealed');
    if (Game.cells[index] !== 0) {
      boardCells[index].innerHTML = `<span>${Game.cells[index]}</span>`;
      console.log(boardCells[index]);
      // boardCells[index].dataset.number = index;
    }

    Game.cellsRemaining -= 1;
    boundingCells.forEach((cell) => {
      revealCell(cell);
    });
  } else if (!boardCells[index].classList.contains('revealed')) {
    boardCells[index].classList.add('revealed');
    if (Game.cells[index] !== 0) {
      // boardCells[index].innerHTML = `<span>${Game.cells[index]}</span>`;
      boardCells[index].dataset.number = Game.cells[index];
    }

    Game.cellsRemaining -= 1;
    return;
  }
}

// New Game
function newGame(difficulty = Difficulty.Easy) {
  // set game settings
  stopTimer();
  Game.time = 0;
  document.getElementById('time-count').innerText = formatTime(Game.time, 3);
  Game.board.columns = difficulty.columns;
  Game.board.rows = difficulty.rows;

  console.log('start', Game.cellsRemaining);

  console.log('len', Game.board.length());
  // Initialize cells array
  Game.cells = Array(Game.board.length()).fill(0);

  // create array of random mine cell numbers
  Game.mines = [];
  while (Game.mines.length < difficulty.mines) {
    const mine = Math.floor(Math.random() * Game.board.length());
    if (!Game.mines.includes(mine)) {
      Game.mines.push(mine);
    }
  }

  Game.cellsRemaining = Game.board.length() - Game.mines.length;
  Game.minesRemaining = Game.mines.length;
  document.getElementById('banana-count').innerText = Game.minesRemaining;

  console.log('mines', Game.mines);

  // add mine and increment neighbouring indicator numbers on board array
  Game.mines.forEach((mine) => {
    // incremend adjacent cells
    getBounds(mine).forEach((cell) => {
      console.log('bounds', cell);
      Game.cells[cell] += 1;
    });

    // set mine cell
    Game.cells[mine] = 9;
  });

  // render board
  board.dataset.cols = Game.board.columns;
  board.innerHTML = '';
  Game.cells.forEach((_, index) => {
    board.insertAdjacentHTML(
      'beforeend',
      `<div class="cell ${
        isCheckered(index) ? 'fill' : ''
      }" data-index="${index}"></div>`
    );
  });

  // get array of board cell divs
  boardCells = Array.from(document.querySelectorAll('.cell'));

  // show mine outlines in debug mode
  if (debug) {
    Game.mines.forEach((mine) => {
      boardCells[mine].classList.add('banana');
    });
  }

  Game.state = 'ready';
}

let gameTimer;
function startTimer() {
  gameTimer = setInterval(() => {
    Game.time += 1;
    document.getElementById('time-count').innerText = formatTime(Game.time, 3);
  }, 1000);
}

function stopTimer() {
  clearInterval(gameTimer);
}

/**
 * Gets the bounding cells of a given cell index.
 *
 * @param {number} index
 * @returns {Array<number>}
 */
function getBounds(index) {
  // get 2D row / col position from index
  let mineRow = Math.floor(index / Game.board.columns);
  let mineCol = index % Game.board.columns;
  let cells = [];
  // loop through each cell in a 3x3 grid around the cell index parameter
  // and push a valid cell index to cells array
  for (let row = mineRow - 1; row <= mineRow + 1; row++) {
    for (let col = mineCol - 1; col <= mineCol + 1; col++) {
      const cell = row * Game.board.columns + col;
      if (
        cell >= 0 &&
        cell < Game.board.length() &&
        Math.floor(cell / Game.board.columns) === row
      )
        cells.push(cell);
    }
  }
  return cells;
}

function gameOver() {
  stopTimer();
  Game.state = 'end';
  Game.mines.forEach((mine) => {
    boardCells[mine].classList.add('mine');
    delete boardCells[mine].dataset.marked;
    boardCells[mine].innerHTML = `<span>&#127820;</span>`;
  });
  btnStart.innerText = 'Try Again';
  btnStart.hidden = false;
  console.log('game over');
}

function win() {
  stopTimer();
  Game.state = 'end';
  btnStart.innerText = 'Play Again';
  btnStart.hidden = false;
  console.log('win');
}

/**
 * HELPER FUNCTIONS
 */

function isCheckered(index) {
  let num = index % (Game.board.columns * 2);
  console.log(num);
  if (num < Game.board.columns) {
    return index % 2 === 0;
  } else {
    return index % 2 === 1;
  }
}

const formatTime = (time, digits) => {
  let timeString = time.toString();
  while (timeString.length < digits) {
    timeString = '0' + timeString;
  }
  return timeString;
};

/**
 * EVENT LISTENERS
 */

// Right-click (Mark / Unmark cell)
board.addEventListener('contextmenu', (e) => {
  e.preventDefault();

  if (!e.target.classList.contains('cell')) return;

  console.log(e);

  // todo: check for cell click only

  if (Game.state === 'ready') {
    Game.state = 'playing';
    startTimer();
  }

  if (Game.state !== 'playing') return;

  let index = boardCells.indexOf(e.target);
  console.log(index);

  const cell = boardCells[index];
  if (cell.classList.contains('revealed')) return;

  if (cell.hasAttribute('data-marked')) {
    delete cell.dataset.marked;
    Game.minesRemaining += 1;
  } else {
    cell.setAttribute('data-marked', '');
    Game.minesRemaining -= 1;
  }

  document.getElementById('banana-count').innerText = Game.minesRemaining;
  // Array.from(boardButtons)[index].classList.add('marked');
});

// Left-click (Reveal Cell)
board.addEventListener('click', (e) => {
  // todo: check for cell click only
  if (!e.target.classList.contains('cell')) return;

  console.log(e.target);

  if (Game.state === 'ready') {
    Game.state = 'playing';
    startTimer();
  }

  if (Game.state !== 'playing') return;

  if (
    e.target.dataset.cell === 'revealed' ||
    e.target.dataset.cell === 'marked' ||
    e.target.hasAttribute('data-marked')
  )
    return;

  let index = boardCells.indexOf(e.target);
  console.log(index);

  // check for gameOver
  if (Game.cells[index] >= 9) {
    gameOver();
    return;
  }

  revealCell(index);
  console.log('remaining', Game.cellsRemaining);
  // check for Win
  if (Game.cellsRemaining === 0) {
    win();
  }

  // console.log('cells', revealedCells.length);
  // if (clearCells === 0) {
  //   console.log('WIN');
  // }
});

// Play Again
btnStart.addEventListener('click', (e) => {
  const setting = difficultySelect.value;
  newGame(Difficulty[setting]);
  btnStart.hidden = true;
});

// Change Difficulty
difficultySelect.addEventListener('change', (e) => {
  const setting = e.target.value;
  newGame(Difficulty[setting]);
  difficultySelect.blur();
});

newGame(Difficulty.Easy);
