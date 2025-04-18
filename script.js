// Game variables
let player = {
  width: 50,
  height: 80,
  laneIndex: 0 // 0 for left lane, 1 for right lane
};

// Score tracking
let score = 0;
let zombiesDestroyed = 0;

// Boss zombie variables
let lastBossSpawnTime = 0;
let bossSpawnInterval = 45000; // Spawn a boss every 45 seconds (45000ms)
let bossZombieHealth = 10; // Boss takes 10 hits to destroy (doubled from 5)

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

// Survivor variables
let survivors = [];
let survivorSpawnChance = 0.01; // 1% chance to spawn a survivor (similar to boss frequency)
let maxFollowers = 3;
let followers = [];

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

  // Spawn a boss zombie immediately for debugging
  spawnBossZombie();
  
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

  // Check if it's time to spawn a new zombie or survivor
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
    // Player fires
    fireBulletFrom(lanes[player.laneIndex], playerYPosition - player.height/2, player.laneIndex);
    
    // Followers also fire bullets
    for (let i = 0; i < followers.length; i++) {
      let follower = followers[i];
      fireBulletFrom(follower.x, follower.y - follower.height/2, follower.laneIndex);
    }
    
    lastShotTime = currentTime;
  }
}

// Create and fire a bullet from a specific position
function fireBulletFrom(x, y, laneIndex) {
  // Create a new bullet
  let bullet = {
    x: x,
    y: y,
    width: 10,
    height: 20,
    laneIndex: laneIndex
  };

  // Add bullet to the array
  bullets.push(bullet);
  
  if (debugMode && bullets.length % 5 === 0) {
    console.log("Total bullets in flight:", bullets.length);
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
        // Collision detected! 
        if (debugMode) console.log("Bullet hit zombie in lane", zombie.laneIndex);

        if (zombie.isBoss) {
          // Reduce boss health
          zombie.health--;
          
          if (zombie.health <= 0) {
            // Boss defeated!
            if (debugMode) console.log("Boss zombie defeated!");
            
            // Increment score with bonus for boss and zombies destroyed count
            score += 50; // Boss is worth more points
            zombiesDestroyed++;

            // Spawn a survivor as a reward
            if (random() < 0.7) { // 70% chance of survivor from boss
              spawnSurvivorInLane(zombie.laneIndex);
              if (debugMode) console.log("Boss dropped a survivor!");
            }
            
            // Remove the zombie
            zombies.splice(i, 1);
          }
        } else {
          // Regular zombie - now takes 2 hits to destroy
          zombie.health--;
          
          if (zombie.health <= 0) {
            score += 10;
            zombiesDestroyed++;
            // Remove the zombie
            zombies.splice(i, 1);
          }
        }

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

  // Draw followers behind the player
  drawFollowers();

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

  // Decide whether to spawn a zombie or a survivor
  if (random() < survivorSpawnChance) {
    // Spawn a survivor pickup
    spawnSurvivorInLane(laneIndex);
    if (debugMode) console.log("Spawned survivor pickup in lane", laneIndex);
  } else {
    // Spawn a zombie
    spawnZombieInLane(laneIndex);
  }
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
function spawnZombieInLane(laneIndex, isBoss = false) {
  let zombie = {
    x: lanes[laneIndex],
    y: -50, // Start above the screen
    width: isBoss ? 60 : 40, // Boss zombies are bigger
    height: isBoss ? 100 : 70,
    laneIndex: laneIndex, // Store the lane index (0 or 1)
    isBoss: isBoss,
    health: isBoss ? bossZombieHealth : 2, // Regular zombies now have 2 health, boss has 10
    speed: isBoss ? zombieSpeed * 0.7 : zombieSpeed // Boss zombies are slower
  };

  zombies.push(zombie);
  laneLastZombieY[laneIndex] = zombie.y; // Update the Y position tracker

  if (debugMode) console.log(isBoss ? "Spawned BOSS zombie in lane" : "Spawned zombie in lane", laneIndex);
}

// Spawn a boss zombie
function spawnBossZombie() {
  // Choose a random lane
  let laneIndex = floor(random(2));
  spawnZombieInLane(laneIndex, true);
  lastBossSpawnTime = millis();
}

// Spawn a survivor pickup
function spawnSurvivorInLane(laneIndex) {
  let survivor = {
    x: lanes[laneIndex],
    y: -50, // Start above the screen
    width: 30,
    height: 60,
    laneIndex: laneIndex,
    collected: false
  };
  survivors.push(survivor);
  if (debugMode) console.log("Survivor spawned in lane:", laneIndex);
}


// Update all zombies and remove those that go off-screen
function updateZombies() {
  // First update each lane's furthest zombie Y position
  updateLaneYPositions();

  // Move zombies down and draw them
  for (let i = zombies.length - 1; i >= 0; i--) {
    // Move the zombie down (using its own speed if set)
    zombies[i].y += zombies[i].speed || zombieSpeed;
    
    // For boss zombies, try to slowly move toward player's lane
    if (zombies[i].isBoss && zombies[i].y > height * 0.3) {
      // Only start chasing once boss is partway down screen
      let targetLane = player.laneIndex;
      if (zombies[i].laneIndex !== targetLane) {
        // Gradually shift towards player's lane (visual effect only)
        let targetX = lanes[targetLane];
        zombies[i].x = lerp(zombies[i].x, targetX, 0.003);
      }
    }

    // Draw the zombie
    drawZombie(zombies[i]);

    // Check if the zombie is off-screen
    if (zombies[i].y > height + 50) {
      // Remove this zombie from the array
      if (debugMode) console.log(zombies[i].isBoss ? "Boss zombie left screen" : "Removed zombie that went off-screen");
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
  if (zombie.isBoss) {
    // Draw the boss zombie (red/orange)
    fill(200, 80, 20); // Dark red/orange for boss
    noStroke();
    rect(zombie.x, zombie.y, zombie.width, zombie.height);

    // Draw boss zombie features
    fill(150, 40, 10); // Darker red for features
    // Eyes
    ellipse(zombie.x - 15, zombie.y + 20, 12, 12);
    ellipse(zombie.x + 15, zombie.y + 20, 12, 12);

    // Mouth
    rect(zombie.x, zombie.y + 40, 30, 8);
    
    // Health bar
    drawZombieHealthBar(zombie);
  } else {
    // Draw the regular zombie body (green)
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
    
    // Health bar for regular zombies
    drawRegularZombieHealthBar(zombie);
  }
}

// Draw health bar for boss zombies
function drawZombieHealthBar(zombie) {
  let barWidth = zombie.width * 1.2;
  let barHeight = 8;
  let healthPercentage = zombie.health / bossZombieHealth;
  
  // Health bar background
  fill(100);
  rect(zombie.x, zombie.y - zombie.height/2 - 15, barWidth, barHeight);
  
  // Health remaining
  fill(255, 0, 0);
  rect(zombie.x - barWidth/2 + (barWidth * healthPercentage)/2, 
       zombie.y - zombie.height/2 - 15, 
       barWidth * healthPercentage, 
       barHeight);
}

// Draw health bar for regular zombies
function drawRegularZombieHealthBar(zombie) {
  let barWidth = zombie.width * 1.1;
  let barHeight = 6;
  // Regular zombies start with 2 health
  let healthPercentage = zombie.health / 2;
  
  // Health bar background
  fill(100);
  rect(zombie.x, zombie.y - zombie.height/2 - 10, barWidth, barHeight);
  
  // Health remaining
  fill(0, 255, 0); // Green for regular zombies
  rect(zombie.x - barWidth/2 + (barWidth * healthPercentage)/2, 
       zombie.y - zombie.height/2 - 10, 
       barWidth * healthPercentage, 
       barHeight);
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
  text("Followers: " + followers.length, 10, 230);
  text("Next Boss: " + int((bossSpawnInterval - (millis() - lastBossSpawnTime))/1000) + "s", 10, 250);
  
  // Count active boss zombies
  let bossCount = zombies.filter(z => z.isBoss).length;
  if (bossCount > 0) {
    text("Boss Zombies: " + bossCount, 10, 270);
  }

  // Reset text alignment
  textAlign(CENTER, CENTER);
}

function drawSurvivor(survivor) {
  fill(255, 255, 0); // Yellow
  noStroke();
  rect(survivor.x, survivor.y, survivor.width, survivor.height);
  
  if (debugMode && frameCounter % 60 === 0) {
    console.log("Survivor position:", survivor.x, survivor.y, "in lane", survivor.laneIndex);
  }
}

function updateSurvivors() {
  for (let i = survivors.length - 1; i >= 0; i--) {
    let survivor = survivors[i];
    survivor.y += zombieSpeed;
    drawSurvivor(survivor);
    
    // Create a player object with current position for collision checking
    let playerObj = {
      x: lanes[player.laneIndex],
      y: playerYPosition,
      width: player.width,
      height: player.height
    };
    
    // Check for collision with player
    if (checkCollision(playerObj, survivor)) {
      if (debugMode) console.log("Survivor collected! Lane:", survivor.laneIndex);
      addFollower();
      survivors.splice(i, 1);
      continue;
    }
    
    // Remove survivors that go off-screen
    if (survivor.y > height + 50) {
      if (debugMode) console.log("Survivor left the screen without being collected");
      survivors.splice(i, 1);
    }
  }
}

function checkCollision(rect1, rect2) {
    // Calculate centers
    let r1CenterX = rect1.x;
    let r1CenterY = rect1.y;
    let r2CenterX = rect2.x;
    let r2CenterY = rect2.y;
    
    // Calculate half dimensions
    let r1HalfWidth = rect1.width / 2;
    let r1HalfHeight = rect1.height / 2;
    let r2HalfWidth = rect2.width / 2;
    let r2HalfHeight = rect2.height / 2;
    
    // Calculate distance between centers
    let dx = Math.abs(r1CenterX - r2CenterX);
    let dy = Math.abs(r1CenterY - r2CenterY);
    
    // Calculate overlap thresholds
    let widthOverlap = r1HalfWidth + r2HalfWidth;
    let heightOverlap = r1HalfHeight + r2HalfHeight;
    
    // Debug visualization if needed
    if (debugMode && frameCounter % 60 === 0) {
        if (dx < widthOverlap && dy < heightOverlap) {
            console.log("Potential collision detected, dx:", dx, "dy:", dy);
            console.log("Overlap thresholds - width:", widthOverlap, "height:", heightOverlap);
        }
    }
    
    // Check if objects overlap on both axes
    return (dx < widthOverlap && dy < heightOverlap);
}

function addFollower() {
    if (followers.length < maxFollowers) {
        // Add a new follower
        followers.push({
            x: lanes[player.laneIndex],
            y: playerYPosition + 60, // Position behind the player
            width: 30,
            height: 60,
            laneIndex: player.laneIndex
        });
        
        if (debugMode) console.log("Added follower! Total followers:", followers.length);
    } else {
        if (debugMode) console.log("Max followers reached:", maxFollowers);
    }
}

function drawFollowers() {
    // First update follower positions to follow the player
    updateFollowerPositions();
    
    // Then draw all followers
    for (let i = 0; i < followers.length; i++) {
        let follower = followers[i];
        fill(255, 200, 0); // Bright yellow follower
        noStroke();
        rect(follower.x, follower.y, follower.width, follower.height);
        
        // Draw a simple face to distinguish from regular survivors
        fill(0);
        ellipse(follower.x - 7, follower.y - 10, 5, 5); // Left eye
        ellipse(follower.x + 7, follower.y - 10, 5, 5); // Right eye
        arc(follower.x, follower.y, 12, 8, 0, PI); // Smile
    }
}

function updateFollowerPositions() {
    for (let i = 0; i < followers.length; i++) {
        // Target position based on formation
        let targetX = lanes[player.laneIndex];
        let targetY = playerYPosition + 60 + (i * 40); // Stack followers behind player
        
        // Gradually move followers toward their target positions
        followers[i].x = lerp(followers[i].x, targetX, 0.1);
        followers[i].y = lerp(followers[i].y, targetY, 0.1);
        
        // Update follower's lane index to match player
        followers[i].laneIndex = player.laneIndex;
    }
}

// Linear interpolation helper
function lerp(start, end, amt) {
    return start * (1 - amt) + end * amt;
}


function draw() {
  // Clear the background
  background(50);
  
  // Increment frame counter for debugging
  frameCounter++;
  
  // Draw game elements
  drawLanes();
  updateZombies();
  updateSurvivors();
  drawPlayer();
  
  // Handle game logic
  controlledZombieSpawn();
  checkBossZombieSpawn();
  updateBullets();
  autoFireBullet();
  
  // Display debug info if enabled
  if (debugMode) {
    displayDebugInfo();
    
    // Periodically log game state
    if (frameCounter % 300 === 0) { // Every 5 seconds approximately
      console.log("Game state - Score:", score, "Zombies:", zombies.length, 
                 "Survivors:", survivors.length, "Followers:", followers.length);
    }
  }
}

// Check if it's time to spawn a boss zombie
function checkBossZombieSpawn() {
  let currentTime = millis();
  if (currentTime - lastBossSpawnTime >= bossSpawnInterval) {
    spawnBossZombie();
    if (debugMode) console.log("Boss zombie spawned at time:", currentTime);
  }
}