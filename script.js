
// Game variables
let player = {
  width: 50,
  height: 80,
  laneIndex: 0 // 0 for left lane, 1 for right lane
};

// Score tracking
let score = 0;
let zombiesDestroyed = 0;

// Zombie variables
let zombies = [];
let zombieSpeed = 3; // Pixels per frame
let lastSpawnTime = 0; // Track when we last spawned a zombie
let minSpawnInterval = 1000; // Minimum time between spawns (milliseconds)
let laneLastZombieY = []; // Will be initialized in setup

// Bullet variables
let bullets = [];
let bulletSpeed = 5; // Pixels per frame
let lastShotTime = 0; // Track when the player last fired
let shotInterval = 500; // Time between shots (milliseconds) - 0.5 seconds

// Debug variables
let debugMode = true;
let frameCounter = 0;

// Will be calculated in setup
let lanes = []; 
let playerYPosition; 
let laneWidth;

function setup() {
  // Create responsive canvas sized for mobile
  let screenWidth = min(windowWidth, 414); // iPhone-like width max
  let screenHeight = min(windowHeight, 896); // iPhone-like height max
  let canvas = createCanvas(screenWidth, screenHeight);
  canvas.parent('game-container');
  
  // Calculate responsive values
  laneWidth = screenWidth / 2;
  lanes = [laneWidth/2, laneWidth + laneWidth/2]; // Center of each lane
  playerYPosition = screenHeight * 0.8; // Position at bottom 20%
  
  // Initialize lane Y positions to allow zombies to spawn immediately
  laneLastZombieY = [screenHeight + 100, screenHeight + 100];
  
  // Set basic drawing properties
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  
  if (debugMode) {
    console.log("Game initialized");
    console.log("Canvas size:", screenWidth, "x", screenHeight);
    console.log("Lane positions:", lanes);
    console.log("Player Y position:", playerYPosition);
  }
}

// Ensure the game resizes properly when window size changes
function windowResized() {
  let screenWidth = min(windowWidth, 414); // iPhone-like width max
  let screenHeight = min(windowHeight, 896); // iPhone-like height max
  resizeCanvas(screenWidth, screenHeight);
  
  // Recalculate responsive values
  laneWidth = screenWidth / 2;
  lanes = [laneWidth/2, laneWidth + laneWidth/2]; // Center of each lane
  playerYPosition = screenHeight * 0.8;
  
  if (debugMode) {
    console.log("Window resized");
    console.log("New canvas size:", screenWidth, "x", screenHeight);
    console.log("New lane positions:", lanes);
  }
}

function draw() {
  // Clear the background on each frame
  background(50); // Dark gray background
  
  // Increment frame counter for debugging
  frameCounter++;
  if (debugMode && frameCounter % 60 === 0) { // Log every 60 frames (approx 1 second)
    console.log("Frame:", frameCounter);
    console.log("Player position:", lanes[player.laneIndex], playerYPosition);
    console.log("Active zombies:", zombies.length);
  }
  
  // Draw the lanes
  drawLanes();
  
  // Update and draw zombies
  updateZombies();
  
  // Draw the player
  drawPlayer();
  
  // Check if it's time to spawn a new zombie
  controlledZombieSpawn();
  
  // Update and draw bullets
  updateBullets();
  
  // Auto-fire bullets at regular intervals
  autoFireBullet();
  
  // Show debug info on screen
  if (debugMode) {
    displayDebugInfo();
  }
}

// Auto-fire bullets at regular intervals
function autoFireBullet() {
  let currentTime = millis();
  
  // Check if enough time has passed since the last shot
  if (currentTime - lastShotTime >= shotInterval) {
    // Create a new bullet at the player's position
    let bullet = {
      x: lanes[player.laneIndex],
      y: playerYPosition - player.height/2, // Start at top of player
      width: 10,
      height: 20,
      laneIndex: player.laneIndex
    };
    
    // Add bullet to the array
    bullets.push(bullet);
    lastShotTime = currentTime;
    
    if (debugMode) console.log("Player fired bullet in lane", player.laneIndex);
  }
}

// Update all bullets and remove those that go off-screen or hit zombies
function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    // Move the bullet up
    bullets[i].y -= bulletSpeed;
    
    // Draw the bullet
    drawBullet(bullets[i]);
    
    // Check for collisions with zombies
    let bulletHitZombie = checkBulletZombieCollision(bullets[i]);
    
    // Check if the bullet is off-screen or hit a zombie
    if (bullets[i].y < -bullets[i].height || bulletHitZombie) {
      // Remove this bullet from the array
      if (bullets[i].y < -bullets[i].height && debugMode) {
        console.log("Removed bullet that went off-screen");
      }
      bullets.splice(i, 1);
    }
  }
}

// Check if a bullet collides with any zombie
function checkBulletZombieCollision(bullet) {
  for (let i = zombies.length - 1; i >= 0; i--) {
    let zombie = zombies[i];
    
    // Only check collisions in the same lane
    if (zombie.laneIndex === bullet.laneIndex) {
      // Calculate collision based on rectangle overlap
      if (
        bullet.y - bullet.height/2 < zombie.y + zombie.height/2 && 
        bullet.y + bullet.height/2 > zombie.y - zombie.height/2
      ) {
        // Collision detected! Destroy the zombie
        if (debugMode) console.log("Bullet hit zombie in lane", zombie.laneIndex);
        
        // Increment score and zombies destroyed count
        score += 10;
        zombiesDestroyed++;
        
        // Remove the zombie
        zombies.splice(i, 1);
        
        // Return true to indicate collision occurred
        return true;
      }
    }
  }
  
  // No collision detected
  return false;
}

// Draw a single bullet
function drawBullet(bullet) {
  // Draw the bullet (yellow)
  fill(255, 255, 0); // Yellow color
  noStroke();
  rect(bullet.x, bullet.y, bullet.width, bullet.height);
}

function drawLanes() {
  // Draw a road with 2 lanes that fill the screen width
  
  // Fill the road
  fill(70); // Dark gray for road background
  noStroke();
  rect(width/2, height/2, width, height);
  
  // Draw center divider between lanes
  stroke(255, 255, 0); // Yellow
  strokeWeight(10);
  setLineDash([30, 20]); // Dashed line
  line(width/2, 0, width/2, height);
  setLineDash([]); // Reset to solid line
  
  // Draw outer lane borders
  stroke(255); // White
  strokeWeight(5);
  // Left edge
  line(0, 0, 0, height);
  // Right edge
  line(width, 0, width, height);
}

// Helper function to create dashed lines
function setLineDash(list) {
  drawingContext.setLineDash(list);
}

function drawPlayer() {
  // Draw the player at the correct lane position
  fill(0, 150, 255); // Blue player
  noStroke();
  
  // Position player at the current lane
  rect(lanes[player.laneIndex], playerYPosition, player.width, player.height);
  
  if (debugMode) {
    // Show player bounds
    stroke(255, 0, 0);
    strokeWeight(2);
    noFill();
    rect(lanes[player.laneIndex], playerYPosition, player.width, player.height);
  }
}

function keyPressed() {
  // Handle lane switching with arrow keys (simulating swipe)
  if (keyCode === LEFT_ARROW) {
    player.laneIndex = 0; // Move to left lane
    if (debugMode) console.log("Player moved to left lane via keyboard");
  } else if (keyCode === RIGHT_ARROW) {
    player.laneIndex = 1; // Move to right lane
    if (debugMode) console.log("Player moved to right lane via keyboard");
  }
}

// Support touch for mobile devices (to simulate swipes)
function touchStarted() {
  // If touch is on left half of screen, go left lane
  // If touch is on right half of screen, go right lane
  if (mouseX < width/2) {
    player.laneIndex = 0; // Left lane
    if (debugMode) console.log("Player moved to left lane via touch");
  } else {
    player.laneIndex = 1; // Right lane
    if (debugMode) console.log("Player moved to right lane via touch");
  }
  
  // Prevent default behavior
  return false;
}

// Control zombie spawning to ensure player has enough reaction time
function controlledZombieSpawn() {
  let currentTime = millis();
  
  // Check if minimum time has passed since last spawn
  if (currentTime - lastSpawnTime < minSpawnInterval) {
    return;
  }
  
  // Determine which lane to spawn in (or if we should spawn at all)
  let lane0Clear = isLaneClearForSpawn(0);
  let lane1Clear = isLaneClearForSpawn(1);
  
  // If both lanes are occupied with zombies too close to the top, don't spawn
  if (!lane0Clear && !lane1Clear) {
    return;
  }
  
  // Choose a lane that's clear for spawning
  let laneIndex;
  if (lane0Clear && lane1Clear) {
    // Both lanes clear, choose randomly
    laneIndex = floor(random(2));
  } else {
    // Only one lane is clear, choose that one
    laneIndex = lane0Clear ? 0 : 1;
  }
  
  // Spawn the zombie
  spawnZombieInLane(laneIndex);
  lastSpawnTime = currentTime;
}

// Check if a lane is clear enough to spawn a new zombie
function isLaneClearForSpawn(laneIndex) {
  // If no zombies in lane, or all zombies are below halfway mark, we can spawn
  if (laneLastZombieY[laneIndex] >= height * 0.5 || laneLastZombieY[laneIndex] > height) {
    return true;
  }
  
  // If zombies exist but are still near top, don't spawn in this lane
  return false;
}

// Create a new zombie at the top of the screen in the specified lane
function spawnZombieInLane(laneIndex) {
  let zombie = {
    x: lanes[laneIndex],
    y: -50, // Start above the screen
    width: 40,
    height: 70,
    laneIndex: laneIndex // Store the lane index (0 or 1)
  };
  
  zombies.push(zombie);
  laneLastZombieY[laneIndex] = zombie.y; // Update the Y position tracker
  
  if (debugMode) console.log("Spawned zombie in lane", laneIndex);
}

// Update all zombies and remove those that go off-screen
function updateZombies() {
  // First update each lane's furthest zombie Y position
  updateLaneYPositions();
  
  // Move zombies down and draw them
  for (let i = zombies.length - 1; i >= 0; i--) {
    // Move the zombie down
    zombies[i].y += zombieSpeed;
    
    // Draw the zombie
    drawZombie(zombies[i]);
    
    // Check if the zombie is off-screen
    if (zombies[i].y > height + 50) {
      // Remove this zombie from the array
      if (debugMode) console.log("Removed zombie that went off-screen");
      zombies.splice(i, 1);
    }
  }
}

// Update the tracking of which zombie is furthest down in each lane
function updateLaneYPositions() {
  // Reset lane Y positions if no zombies are in that lane
  laneLastZombieY = [height + 100, height + 100]; 
  
  // Find the furthest down zombie in each lane
  for (let i = 0; i < zombies.length; i++) {
    let laneIdx = zombies[i].laneIndex;
    // If this zombie is above the screen, it's the closest to spawning position
    if (zombies[i].y < 0) {
      laneLastZombieY[laneIdx] = zombies[i].y;
    }
    // If this zombie is on screen and closer to top than current tracker value
    else if (zombies[i].y < laneLastZombieY[laneIdx] && zombies[i].y >= 0) {
      laneLastZombieY[laneIdx] = zombies[i].y;
    }
  }
}

// Draw a single zombie
function drawZombie(zombie) {
  // Draw the zombie body (green)
  fill(50, 200, 50); // Green color
  noStroke();
  rect(zombie.x, zombie.y, zombie.width, zombie.height);
  
  // Draw zombie features (dark spots)
  fill(30, 130, 30);
  // Eyes
  ellipse(zombie.x - 10, zombie.y + 15, 8, 8);
  ellipse(zombie.x + 10, zombie.y + 15, 8, 8);
  
  // Mouth
  rect(zombie.x, zombie.y + 30, 20, 5);
}

// Display debug information on screen
function displayDebugInfo() {
  fill(255);
  noStroke();
  textSize(12);
  textAlign(LEFT, TOP);
  text("Debug Mode: ON", 10, 10);
  text("Frame: " + frameCounter, 10, 30);
  text("Player Lane: " + player.laneIndex, 10, 50);
  text("Zombies: " + zombies.length, 10, 70);
  text("Bullets: " + bullets.length, 10, 90);
  text("Score: " + score, 10, 110);
  text("Zombies Destroyed: " + zombiesDestroyed, 10, 130);
  text("Last Spawn: " + (millis() - lastSpawnTime) + "ms ago", 10, 150);
  text("Last Shot: " + (millis() - lastShotTime) + "ms ago", 10, 170);
  text("Lane 0 Last Y: " + int(laneLastZombieY[0]), 10, 190);
  text("Lane 1 Last Y: " + int(laneLastZombieY[1]), 10, 210);
  
  // Reset text alignment
  textAlign(CENTER, CENTER);
}
