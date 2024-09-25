'use strict'

const ROCK_SPEED = 300
const INTERVAL_ROCK_FREQ = 3000

let gIntervalAliens
let gIntervalRock = null
let gIntervalAliensShoot

let gAliensDirection
let gAliensTopRowIdx
let gAliensBottomRowIdx
let gIsAlienFreeze
let gIsShiftingAliens
let gAlienNums

function createAliens(board) {
    const { rowLength, rowCount } = getLevelOptions() 
    
    gGame.alienCount = 0
    gAliensTopRowIdx = 0
    gAliensBottomRowIdx = rowCount - 1
    const columnOffset = (BOARD_SIZE - rowLength) / 2

    
    
    for (let i = gAliensTopRowIdx; i < rowCount; i++) {
        const alienType = `ALIEN${i+1}`
        for (let j = columnOffset; j < BOARD_SIZE - columnOffset; j++) {
            board[i][j].gameObject = GAME_OBJECTS[alienType]
            gGame.alienCount++
        }
    }
}

function handleAlienHit(pos) {
    updateAndRenderCell(pos)
    gGame.alienCount--
    gGame.score += 10

    // addEffectToAlienHit(pos)
    renderScore()
    renderAliensCount()

    if (isAllAliensCleared()) {
        handlePlayerVictory()
        return
    }

    if (isAlienBottomRowCleared(pos)) gAliensBottomRowIdx--
}

function moveAliens() {
    if (!gGame.isOn || gIsAlienFreeze || gIsShiftingAliens) return
    gIsShiftingAliens = true // might need to use for some functions

    if (isAlienAtEdge()) {
        shiftAliensDown()
        updateDirectionAndAliensIdx()

        if (isAliensReachedHero()) {
            handleAliensReachedHero()
            return
        }
    } else {
        if (isAliensShiftingRight()) {
            shiftAliensRight()
        } else {
            shiftAliensLeft()
        }
    }

    renderBoard(gBoard)
    gIsShiftingAliens = false
}

function shiftAliensRight() {
    for (let i = gAliensBottomRowIdx; i >= gAliensTopRowIdx; i--) {
        for (let j = BOARD_SIZE -1; j > 0; j--) {
            const toPos = {i, j}
            const fromPos = {i, j: j - 1}

            if (isAlien(fromPos)) {
                if (isLaser(toPos) && !gIsLaserHit) {
                    handleAlienLaserCollision(fromPos, toPos)
                } else {
                    if (isBunker(toPos)) handleBunkerHit(toPos)
                    shiftAlien(fromPos, toPos)
                } 
            }
        }
    }
}

function shiftAliensLeft() {
    for (let i = gAliensBottomRowIdx; i >= gAliensTopRowIdx; i--) {
        for (let j = 0; j < BOARD_SIZE - 1; j++) {
            const toPos = {i, j}
            const fromPos = {i, j: j + 1}

            if (isAlien(fromPos)) {
                if (isLaser(toPos) && !gIsLaserHit) {
                    handleAlienLaserCollision(fromPos, toPos)
                } else {
                    if (isBunker(toPos)) handleBunkerHit(toPos)
                    shiftAlien(fromPos, toPos)
                } 
            }
        }
    }
}

function shiftAliensDown() {
    for (let i = gAliensBottomRowIdx + 1; i > gAliensTopRowIdx; i--) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            const toPos = {i, j}
            const fromPos = {i: i - 1, j } 

            if (isAlien(fromPos)) {
                if (isLaser(toPos) && !gIsLaserHit) {
                    handleAlienLaserCollision(fromPos, toPos)
                } else {
                    if (isBunker(toPos)) handleBunkerHit(toPos)
                    shiftAlien(fromPos, toPos)
                } 
            }
        }
    }
}

function shiftAlien(fromPos, toPos) {
    const alienType = getGameObject(fromPos)
    updateCell(toPos, alienType)
    updateCell(fromPos)
}

function handleAlienLaserCollision(fromPos, toPos) {
    clearInterval(gIntervalLaser)
    gIsLaserHit = true
    console.log('Alien colliding with laser during movement')

    handleAlienHit(toPos)
    updateCell(fromPos)
    
    gHero.isShoot = false
    gHero.isShoot2 = false
    gIsLaserHit = false
}

function handleBunkerHit(pos) {
    updateType(pos)
    getElCell(pos).classList.remove('BUNKER')
    getElCell(pos).classList.add('SKY')  
}

function isAlienBottomRowCleared(pos) {
    for (let j = 0; j < BOARD_SIZE; j++) {
        if (isAlien({i: pos.i, j})) return false
    }
    return true
}

function startAlienMovement() {
    gIntervalAliens = setInterval(moveAliens, getAlienSpeed())
}

function isAlienAtEdge() {
    const edgeColumn = gAliensDirection === 1 ? BOARD_SIZE - 1 : 0
    for (let i = gAliensTopRowIdx; i <= gAliensBottomRowIdx; i++) {
        if (isAlien({i, j: edgeColumn})) return true
    }
    return false
}

function updateDirectionAndAliensIdx() {
    gAliensTopRowIdx++
    gAliensBottomRowIdx++
    gAliensDirection *= -1
}

function isAliensReachedHero() { 

    for (let j = 0; j < BOARD_SIZE; j++) {
        if (isAlien({ i: gHero.pos.i, j})) return true
    }
    return false
}

function handleAliensReachedHero() {

    renderBoard(gBoard)
    gameOver(false)
}

function getAlienSpeed() {
    return gDifficultyLevels[gGame.difficulty].speed
}

function throwRock() {
    if (!gGame.isOn || gIntervalRock) return

    const rockPos = getAlienPosToThrowRock()
    if (!rockPos) return
    
    rockPos.i++

    gIntervalRock = setInterval(() => {
        if (rockPos.i >= BOARD_SIZE || isAlien(rockPos) || isRock(rockPos)) {
            clearRockInterval()
            return
        }

        if (isElLaser(rockPos) || isLaser(rockPos)) {
            onRockHitLaser(rockPos)
            return
        }

        if (isBunker(rockPos)) {
            onRockHitBunker(rockPos)
            return
        }

        if (isHero(rockPos)) {
            onRockHitHero()
            return
        }

        blinkRock({...rockPos})
        rockPos.i++
    },ROCK_SPEED)
}


function blinkRock(pos) {
    if (!isEmpty(pos)) {
        console.log('Trying to place rock in an occupied cell', getGameObject(pos))
        return
    }

    if (isElAlien(pos) || isAlien(pos)) return
    updateAndRenderCell(pos, GAME_OBJECTS.ROCK)

    gTimeoutBlink = setTimeout(() => {
        if (isRock(pos)) updateAndRenderCell(pos)
        else console.log('Trying to clear rock but game object is:', getGameObject(pos))
    },ROCK_SPEED)
}

function onRockHitLaser() {
    clearInterval(gIntervalLaser)
    clearRockInterval()
    console.log('Rock hit a laser')
    gHero.isShoot = false
    gHero.isShoot2 = false

}

function onRockHitBunker(pos) {
    clearRockInterval()
    console.log('Rock hit a bunker')
    handleBunkerHit(pos)
}

function onRockHitHero() {
    clearRockInterval()
    console.log('Rock hit Hero')
    if (!gHero.isShield) handleHeroHit()
}