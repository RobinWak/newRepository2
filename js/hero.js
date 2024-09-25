// const LASER_SPEED = 30
const SHIELD_DURATION = 5000
const SUPER_LASER_DURATION = 3000

let gHero
let gIntervalLaser
let gTimeoutBlink
let gLasers = []
let gLaserPos


let gIsLaserHit = false
let gIsBlowingUp // cool down for blow up negs function

const gLaserSpeeds = {
    normal: 80,
    super: 50
}

// creates the hero and place it on board
function createHero(board) {
    gHero = {
        pos: {
            i: BOARD_SIZE - 2, 
            j: BOARD_SIZE / 2
        }, 
        lives: 3,
        isShoot: false,
        isSuper: false,
        superLaserCount: 3,
        isShield: false,
        shieldCount: 3
    }
    board[gHero.pos.i][gHero.pos.j].gameObject = GAME_OBJECTS.HERO
}

// Handle game keys
function onKeyDown(ev) {
    // start the game only if game restarted and ready
    if (ev.code === 'Enter' && !gGame.isOn) {
        handleOnStartGame()
        return
    }

    // These can be accessed when game is off
    handleKeyShortcuts(ev.code)

    if (!gGame.isOn) return

    handleGameControls(ev.code) 
}

function handleKeyShortcuts(keyCode) {
    switch (keyCode) {
        case 'Digit1':
            setDifficultyLevel('easy')
            break
        case 'Digit2':
            setDifficultyLevel('normal')
            break
        case 'Digit3':
            setDifficultyLevel('hard')
            break
        case 'Digit4':
            setDifficultyLevel('extreme')
            break
        case 'KeyR':
            init()
            break;
        case 'KeyB':
            toggleBunkers()
            break;
        case 'KeyF':
            handleOnAlienFreeze()
            break;
        case 'KeyM':
            toggleSound()
            break;
    }
}

function handleGameControls(keyCode) {
    switch (keyCode) {
        case 'ArrowRight':
            moveHero(1)
            break
        case 'ArrowLeft':
            moveHero(-1)
            break
        case 'Space':
            shoot()
            break
        case 'KeyN':
            blowUpNeighbours()
            break
        case 'KeyX':
            enableSuperLaser()
            break
        case 'KeyZ':
            enableHeroShield()
            break
    }
}

// Move the hero right (1) or left (-1)
function moveHero(dir) {
    if (!gGame.isOn) return

    updateAndRenderCell(gHero.pos)

    gHero.pos.j = getHeroNextPosColumn(dir)
    updateAndRenderCell(gHero.pos, getHeroGameObject())

    
}

function shoot() {
    if (!gGame.isOn || gHero.isShoot && !gHero.isSuper) return

    gHero.isShoot = true 
    gLaserPos = null 

    const laserPos = { i: gHero.pos.i - 1, j: gHero.pos.j }
    const laser = setInterval(() => {
        if (laserPos.i < 0) {
            clearInterval(laser)
            onLaserOutOfRange()
            return
        }

        checkAndHandleLaserHits(laser,{...laserPos})

        gIntervalLaser = laser
        gLaserPos = {...laserPos}
        blinkLaser({...laserPos})
        laserPos.i--
    }, getLaserSpeed()) 
    gLasers.push({ interval: laser, pos: {...laserPos}})
}

function checkAndHandleLaserHits(laser, laserPos) {
        if (isElLaser(laserPos) || isLaser(laserPos)) {
            clearInterval(laser)
            onLaserHitLaser()
            return
        }

        if (isElAlien(laserPos) || isAlien(laserPos)) {
            clearInterval(laser)
            onLaserHitAlien(laserPos)
            return
        }

        if (isBunker(laserPos)) {
            clearInterval(laser)
            onLaserHitBunker(laserPos)
        } else if (isElRock(laserPos) || isRock(laserPos)) {
            clearInterval(laser)
            onLaserHitRock()
        } else if (isSpaceCandy(laserPos)) {
            clearInterval(laser)
            onLaserHitSpaceCandy()
        }
}

function blinkLaser(pos) {
    if (!isEmpty(pos) && !isSpaceCandy(pos)) {
        console.log('Trying to place laser an occupied cell', gBoard[pos.i][pos.j].gameObject)
        return
    }

    updateAndRenderCell(pos, getLaserGameObject())
    
    gTimeoutBlink = setTimeout(() => {
        if (isElBlowUpImg(pos)) updateCell(pos)
        else if (isLaser(pos)) updateAndRenderCell(pos)
    }, getLaserSpeed())
}

function onLaserHitAlien(pos) {
     
    if (gIsLaserHit) {
        gHero.isShoot = false
        return
    }

    gIsLaserHit = true
    console.log('Laser hit an alien')
    handleAlienHit(pos)
    gHero.isShoot = false
    gIsLaserHit = false
}

function onLaserHitBunker(pos) {
    console.log('Laser hit a bunker')
    handleBunkerHit(pos)
    gHero.isShoot = false
}

function onLaserHitLaser() {
    console.log('Laser colliding with another laser')
    gHero.isShoot = false
}

function onLaserHitRock() {
    console.log('Laser hit rock')
    clearRockInterval()
    gHero.isShoot = false
}

function onLaserHitSpaceCandy() {
    console.log('Laser hit a space candy')
    handleSpaceCandyHit()
    gHero.isShoot = false
}

function onLaserOutOfRange() {
    gHero.isShoot = false
}

 
function blowUpNeighbours() {
    if (!gGame.isOn || !gLaserPos || !gHero.isShoot || gIsBlowingUp) return

    clearInterval(gIntervalLaser)
    gIsBlowingUp = true // blow up cooldown
    setTimeout(() => {  
        gIsBlowingUp = false
    },1000)

    if (isElAlien(gLaserPos) || isAlien(gLaserPos)) {
        console.log('Note: Should not be happening')
    }

    const negs = getNegs(gLaserPos)
    for (let i = 0; i < negs.length; i++) {
        handleBlowUpNeighbour(negs[i])
    }
    blowUpNeighbour(gLaserPos, true)
    gHero.isShoot = false
}

function handleBlowUpNeighbour(pos) {
    if (isElAlien(pos) || isAlien(pos)) {
        handleAlienHit(pos)
        blowUpNeighbour(pos)
    } else if (isElRock(pos) || isRock(pos)) {
        clearRockInterval()
        updateCell(pos)
        blowUpNeighbour(pos)
    } else if (isSpaceCandy(pos)) {

        updateCell(pos) 
        handleSpaceCandyHit()
        blowUpNeighbour(pos)
    }
}

function blowUpNeighbour(pos, isExplode = null) {
    const img = isExplode ? gameImages.explosion : gameImages.flames
    renderCell(pos, img)

    setTimeout(() => {
        
        if (isElBlowUpImg(pos)) renderCell(pos)
    },3000)
}


function enableHeroShield() {
    if (!gGame.isOn || gHero.isShield || !gHero.shieldCount) return

    gHero.isShield = true
    gHero.shieldCount--
    renderShields()

    updateAndRenderCell(gHero.pos, getHeroGameObject())

    setTimeout(() => {
		if (!gGame.isOn) return
		
        gHero.isShield = false
        updateAndRenderCell(gHero.pos, GAME_OBJECTS.HERO)
    }, SHIELD_DURATION)
}


function enableSuperLaser() {
    if (!gGame.isOn || gHero.isSuper || !gHero.superLaserCount) return

    clearAllLaserIntervals()

    gHero.isSuper = true
    gHero.isShoot = false
    gHero.superLaserCount--
    renderSuperLasers()
    
    setTimeout(() => {
        clearAllLaserIntervals()

        gHero.isSuper = false
        gHero.isShoot = false // for safety
    }, SUPER_LASER_DURATION)
}


function handleHeroHit() {
    gHero.lives--
    renderLives()

    if (isHeroOutOfLives()) {
        gameOver(true)
        return
    }
    
    phaseOutHero()
}

function phaseOutHero() {
    gGame.isOn = false
    renderCell(gHero.pos)
    const emojis = ['💥', '😵‍💫',  '💥',  '😵‍💫', '💥', '😵‍💫', '💥']

    for (let i = 0; i < emojis.length; i++) {
        const emoji = emojis[i]
        setTimeout((idx) => {
            renderCell(gHero.pos, emoji) 
        },i * 200,i)
    }

    setTimeout(() => {
        renderCell(gHero.pos, GAME_OBJECTS.HERO)
        gGame.isOn = true
    },emojis.length * 200 + 20)

}

function handlePlayerVictory() {
    clearAllIntervals()
    gGame.isOn = false
    
    const elModal = getEl('.win-modal')
    const elMsg = getEl('.modal-message');
    elMsg.textContent = 'Victory! All aliens cleared!\n' + 'Make sure to try all difficulties!'
    toggleModal()
}