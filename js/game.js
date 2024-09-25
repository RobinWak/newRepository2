'use strict'

const BOARD_SIZE = 14

const GAME_OBJECTS = {
    HERO: '<img src="img/hero.png">',
    HERO_SHIELD: '<img src="img/hero_shield.png">',
    ALIEN1: '<img src="img/alien1.png">',
    ALIEN2: '<img src="img/alien2.png">',
    ALIEN3: '<img src="img/alien3.png">',
    ALIEN4: '<img src="img/alien4.png">',
    ALIEN5: '<img src="img/alien5.png">',
    LASER: '<img src="img/laser.png">',
    LASER_SUPER: '<img src="img/laser_super.png">',
    CANDY: '<img src="img/candy.png">',
    ROCK: '<img src="img/rock.png">'
}


const GAME_TYPES = {
    SKY: 'SKY',
    BUNKER: 'BUNKER',
    GROUND: 'GROUND',
    HERO_GROUND: 'HERO_GROUND'
}

const gDifficultyLevels = {
    easy: { rowLength: 8, rowCount: 3, speed: 500 },
    normal: { rowLength: 8, rowCount: 4, speed: 450 },
    hard: { rowLength: 10, rowCount: 5, speed: 400 },
    extreme: { rowLength: 12, rowCount: 5, speed: 400 }
}

const gameImages = {
    // explosion: '💥',
    // flames: '🔥'
    explosion: '<img src="img/explosion.png">',
    flames: '<img src="img/flames.png">',
    rip: `<img src="img/rip.png">`
}

const SPACE_CANDY_DURATION = 5000
const SPACE_CANDY_INTERVAL_FREQ = 10000
const FREEZE_ALIENS_DURATION = 5000

// Matrix of cell objects. e.g.: {type: SKY, gameObject: ALIEN}
let gBoard
let gGame = {
    isOn: false,
    alienCount: 0,
    score: 0,
    isAudioOn: true,
    difficulty: 'normal',
    isBunkers: true
}
let gIntervalSpaceCandy
let gTimeoutSpaceCandy
// let gTimeoutAliensFreeze
let gCurrentBackground = 1

// Called when game loads
function init() {
    gGame.isOn = false
    clearAllIntervals()
    resetAliensConfig()
    gGame.score = 0
    gIsLaserHit = false
    
    gBoard = createBoard()
    renderBoard(gBoard)
    enableStartButton()
    renderGameStats()
}

function startGame() {
    gGame.isOn = true
    startAlienMovement()
    startSpaceCandyInterval()
    startAliensThrowingRocksInterval()
}

function createBoard() {
    const board = []
    for (let i = 0; i < BOARD_SIZE; i++) {
        board.push([])
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (isBoardHeroGround(i)) {
                board[i][j] = createCell(GAME_TYPES.HERO_GROUND)
            } else if (isBoardGround(i)) {
                board[i][j] = createCell(GAME_TYPES.GROUND)
            } else board[i][j] = createCell()
        }
    }
    if (gGame.isBunkers) createBunkers(board)
    createHero(board)
    createAliens(board)
    return board
}

// Render the board as a <table> to the page
function renderBoard(board) {
    const elBoard = document.querySelector('.board')
    let strHTML = ''
    for (let i = 0; i < BOARD_SIZE; i++) {
        strHTML += '<tr>'
        for (let j = 0; j < BOARD_SIZE; j++) {
            const cell = board[i][j]
            const cellContent = cell.gameObject ? cell.gameObject : ''
            const className = getClassName(i, j)
            strHTML += `<td 
                            data-i="${i}" data-j="${j}"
                            class="${className}">
                            ${cellContent}
                        </td>`
        }
        strHTML += '</tr>'
    }
    elBoard.innerHTML = strHTML
}

function gameOver(isHeroHit = false) {

    gGame.isOn = false
    clearAllIntervals()    
    renderCell({...gHero.pos}, gameImages.rip)

    const elModal = getEl('.win-modal')
    const elMsg = getEl('.modal-message');
    const msg = isHeroHit ? `Try to avoid rocks!` : `Don't let them reach you!`
    elMsg.textContent = 'You lost!\n' + msg
    toggleModal()

}

function handleSpaceCandyHit() {
    gGame.score += 50
    gIsAlienFreeze = true

    renderScore()
    renderFreeze()

    setTimeout(() => {
        gIsAlienFreeze = false
        renderFreeze()
    },FREEZE_ALIENS_DURATION)
}

function addSpaceCandy() {
    if (!gGame.isOn) return
    
    const cellPos = getRndEmptyCandyPos()
    if (!cellPos) return

    updateAndRenderCell(cellPos, GAME_OBJECTS.CANDY)

    gTimeoutSpaceCandy = setTimeout(() => removeSpaceCandy(cellPos), SPACE_CANDY_DURATION)
}

function removeSpaceCandy(pos) {
    if (!isSpaceCandy(pos) || !gGame.isOn) return

    updateAndRenderCell(pos)
}

// Returns a new cell object. e.g.: {type: SKY, gameObject: ALIEN}
function createCell(type = GAME_TYPES.SKY, gameObject = null) {
    return {
        type,
        gameObject
    }
}

// position such as: {i: 2, j: 7}
function updateAndRenderCell(pos, gameObject = null) {
    gBoard[pos.i][pos.j].gameObject = gameObject
    const elCell = getElCell(pos)
    elCell.innerHTML = gameObject || ''
}

function updateCell(pos, gameObject = null) {
    gBoard[pos.i][pos.j].gameObject = gameObject
}

function updateType(pos, type = GAME_TYPES.SKY) {
    gBoard[pos.i][pos.j].type = type
}






