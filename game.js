const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load images
const playerImg = new Image();
playerImg.src = 'spaceship.png';

const enemyImg = new Image();
enemyImg.src = 'enemy.png';

const powerupImg = new Image();
powerupImg.src = 'powerup.png';

const websiteImg = new Image();
websiteImg.src = 'website.png';

const xImg = new Image();
xImg.src = 'x.png';

const pumpfunImg = new Image();
pumpfunImg.src = 'pumpfun.png';

// Load sounds
const bgMusic = new Audio('bgmusic.wav');
bgMusic.loop = true;
bgMusic.volume = 0.5;

// Game variables
let player = {
    x: 438,
    y: 676,
    width: 124,
    height: 124,
    speed: 5
};

let enemies = [];
let bullets = [];
let powerups = [];
let score = 0;
let bulletCount = 1;
let gameState = 'start';

let keys = {};

let lastShotTime = 0;
const shotCooldown = 500;

const enemySpawnInterval = 1000;
const powerupSpawnInterval = 10000;
let lastEnemySpawn = 0;
let lastPowerupSpawn = 0;

// ASCII title
const asciiTitle = `
  ________   ______     _____ _    _  ____   ____ _______ ______ _____  
 |  ____\\ \\ / / __ \\   / ____| |  | |/ __ \\ / __ \\__   __|  ____|  __ \\ 
 | |__   \\ V / |  | | | (___ | |__| | |  | | |  | | | |  | |__  | |__) |
 |  __|   > <| |  | |  \\___ \\|  __  | |  | | |  | | | |  |  __| |  _  / 
 | |____ / . \\ |__| |  ____) | |  | | |__| | |__| | | |  | |____| | \\ \\ 
 |______/_/ \\_\\____/  |_____/|_|  |_|\\____/ \\____/  |_|  |______|_|  \\_\\ 
`;

const creditText = "made by Grok 3";

// Links for icons (replace with your actual URLs)
const websiteLink = "https://yourwebsite.com"; // Replace with your site
const xLink = "https://x.com/exoshootersol"; // Replace with your X profile
const pumpfunLink = "https://exoshooter.gitbook.io/exo-shooter"; // Replace with your Pump.fun link

// Input handling
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (gameState === 'start' && e.key === ' ') {
        gameState = 'playing';
        bgMusic.play();
    }
    if (gameState !== 'playing' && e.key.toLowerCase() === 'r' && (gameState === 'gameover' || gameState === 'win')) {
        restartGame();
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Click handling for icons
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const iconY = 50;
    const websiteX = 400;
    const xIconX = 500;
    const pumpfunX = 600;
    const iconSize = 40;

    if (clickX >= websiteX - iconSize / 2 && clickX <= websiteX + iconSize / 2 &&
        clickY >= iconY - iconSize / 2 && clickY <= iconY + iconSize / 2) {
        window.open(websiteLink, '_blank');
    }
    if (clickX >= xIconX - iconSize / 2 && clickX <= xIconX + iconSize / 2 &&
        clickY >= iconY - iconSize / 2 && clickY <= iconY + iconSize / 2) {
        window.open(xLink, '_blank');
    }
    if (clickX >= pumpfunX - iconSize / 2 && clickX <= pumpfunX + iconSize / 2 &&
        clickY >= iconY - iconSize / 2 && clickY <= iconY + iconSize / 2) {
        window.open(pumpfunLink, '_blank');
    }
});

// Game loop
function gameLoop(timestamp) {
    if (gameState === 'playing') {
        update(timestamp);
        render();
    } else if (gameState === 'start') {
        renderStartScreen();
    } else {
        renderGameOver();
    }
    requestAnimationFrame(gameLoop);
}

function update(timestamp) {
    if (keys['ArrowLeft'] || keys['a']) {
        player.x -= player.speed;
        if (player.x < 0) player.x = 0;
    }
    if (keys['ArrowRight'] || keys['d']) {
        player.x += player.speed;
        if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
    }
    if (keys['ArrowUp'] || keys['w']) {
        player.y -= player.speed;
        if (player.y < 0) player.y = 0;
    }
    if (keys['ArrowDown'] || keys['s']) {
        player.y += player.speed;
        if (player.y > canvas.height - player.height) player.y = canvas.height - player.height;
    }

    if (keys[' '] && timestamp - lastShotTime > shotCooldown) {
        shootBullets();
        lastShotTime = timestamp;
    }

    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) {
            bullets.splice(index, 1);
        }
    });

    enemies.forEach((enemy, index) => {
        enemy.y += enemy.speed;
        if (enemy.y > canvas.height) {
            gameState = 'gameover';
        }
    });

    powerups.forEach((powerup, index) => {
        powerup.y += powerup.speed;
        if (powerup.y > canvas.height) {
            powerups.splice(index, 1);
        }
    });

    checkCollisions();

    if (timestamp - lastEnemySpawn > enemySpawnInterval) {
        spawnEnemy();
        lastEnemySpawn = timestamp;
    }

    if (timestamp - lastPowerupSpawn > powerupSpawnInterval) {
        spawnPowerup();
        lastPowerupSpawn = timestamp;
    }
}

function shootBullets() {
    const bulletWidth = 5;
    const bulletHeight = 10;
    const bulletSpeed = 10;
    const spacing = 10;

    const totalWidth = (bulletCount - 1) * spacing;
    const startX = player.x + player.width / 2 - totalWidth / 2;

    for (let i = 0; i < bulletCount; i++) {
        const bullet = {
            x: startX + i * spacing,
            y: player.y,
            width: bulletWidth,
            height: bulletHeight,
            speed: bulletSpeed
        };
        bullets.push(bullet);
    }
    const newShootSound = new Audio('shoot.wav');
    newShootSound.play();
}

function spawnEnemy() {
    const enemy = {
        x: Math.random() * (canvas.width - 124),
        y: 0,
        width: 124,
        height: 124,
        speed: 1
    };
    enemies.push(enemy);
}

function spawnPowerup() {
    const powerup = {
        x: Math.random() * (canvas.width - 60),
        y: 0,
        width: 60,
        height: 60,
        speed: 1
    };
    powerups.push(powerup);
}

function checkCollisions() {
    bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (isColliding(bullet, enemy)) {
                bullets.splice(bIndex, 1);
                enemies.splice(eIndex, 1);
                score += 1000000000;
                if (score >= 1000000000000) {
                    gameState = 'win';
                }
            }
        });
    });

    enemies.forEach((enemy) => {
        if (isColliding(player, enemy)) {
            gameState = 'gameover';
        }
    });

    powerups.forEach((powerup, index) => {
        if (isColliding(player, powerup)) {
            powerups.splice(index, 1);
            if (bulletCount < 5) {
                bulletCount++;
            }
        }
    });
}

function isColliding(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function drawIcons() {
    const iconY = 50;
    const iconSize = 40;

    // Website icon
    if (websiteImg.complete && websiteImg.naturalWidth !== 0) {
        ctx.drawImage(websiteImg, 400 - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize);
    }

    // X icon
    if (xImg.complete && xImg.naturalWidth !== 0) {
        ctx.drawImage(xImg, 500 - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize);
    }

    // Pump.fun icon
    if (pumpfunImg.complete && pumpfunImg.naturalWidth !== 0) {
        ctx.drawImage(pumpfunImg, 600 - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize);
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    enemies.forEach((enemy) => {
        ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
    });

    bullets.forEach((bullet) => {
        ctx.fillStyle = 'white';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    powerups.forEach((powerup) => {
        ctx.drawImage(powerupImg, powerup.x, powerup.y, powerup.width, powerup.height);
    });

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: $${score.toLocaleString('en-US')}`, 10, 100);

    const centerX = canvas.width - 100;
    const centerY = 120;
    const radius = 20;
    const progress = Math.min(score / 1000000000000, 1);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'gray';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, (-Math.PI / 2) + (2 * Math.PI * progress));
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'green';
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(progress * 100)}%`, centerX, centerY + 5);

    ctx.font = '12px Arial';
    ctx.fillText('of becoming a trillionaire', centerX, centerY + 25);

    drawIcons();
}

function renderStartScreen() {
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    const lines = asciiTitle.trim().split('\n');
    lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, 150 + index * 18);
    });
    ctx.font = '20px Arial';
    ctx.fillText(creditText, canvas.width / 2, 300);
    ctx.fillText('Press Space to Start', canvas.width / 2, 500);

    drawIcons();
}

function renderGameOver() {
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    const lines = asciiTitle.trim().split('\n');
    lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, 150 + index * 18);
    });
    ctx.font = '20px Arial';
    ctx.fillText(creditText, canvas.width / 2, 300);

    ctx.font = '40px Arial';
    if (gameState === 'gameover') {
        ctx.fillText('Game Over', canvas.width / 2, 500);
    } else if (gameState === 'win') {
        ctx.fillText('You Win!', canvas.width / 2, 500);
    }
    ctx.font = '20px Arial';
    ctx.fillText('Press R to Restart', canvas.width / 2, 550);

    drawIcons();
}

function restartGame() {
    player.x = 438;
    player.y = 676;
    enemies = [];
    bullets = [];
    powerups = [];
    score = 0;
    bulletCount = 1;
    gameState = 'playing';
    lastEnemySpawn = 0;
    lastPowerupSpawn = 0;
    lastShotTime = 0;
    bgMusic.play();
}

let assetsLoaded = 0;
const totalAssets = 6; // Increased to 6 for website.png and x.png

function assetLoaded() {
    assetsLoaded++;
    console.log(`Asset loaded. Total: ${assetsLoaded}/${totalAssets}`);
    if (assetsLoaded === totalAssets) {
        console.log('All assets loaded. Starting game...');
        startGame();
    }
}

function assetError(err) {
    console.error('Failed to load an asset:', err.target.src);
    assetsLoaded++; // Continue even if an asset fails
    if (assetsLoaded === totalAssets) {
        console.log('All assets processed (with errors). Starting game...');
        startGame();
    }
}

playerImg.onload = assetLoaded;
playerImg.onerror = assetError;
enemyImg.onload = assetLoaded;
enemyImg.onerror = assetError;
powerupImg.onload = assetLoaded;
powerupImg.onerror = assetError;
websiteImg.onload = assetLoaded;
websiteImg.onerror = assetError;
xImg.onload = assetLoaded;
xImg.onerror = assetError;
pumpfunImg.onload = assetLoaded;
pumpfunImg.onerror = assetError;

bgMusic.load();

function startGame() {
    requestAnimationFrame(gameLoop);
}