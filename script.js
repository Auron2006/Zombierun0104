
// Game variables
let player = {
  width: 50,
  height: 80,
  laneIndex: 0 // 0 for left lane, 1 for right lane
};

// Zombie variables
let zombies = [];
let zombieSpeed = 3; // Pixels per frame
let zombieSpawnRate = 0.02; // Probability of spawning a zombie each frame

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
  
  // Set basic drawing properties
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
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
}

function draw() {
  // Clear the background on each frame
  background(50); // Dark gray background
  
  // Draw the lanes
  drawLanes();
  
  // Update and draw zombies
  updateZombies();
  
  // Draw the player
  drawPlayer();
  
  // Randomly spawn new zombies
  if (random() < zombieSpawnRate) {
    spawnZombie();
  }
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
}

function keyPressed() {
  // Handle lane switching with arrow keys (simulating swipe)
  if (keyCode === LEFT_ARROW) {
    player.laneIndex = 0; // Move to left lane
  } else if (keyCode === RIGHT_ARROW) {
    player.laneIndex = 1; // Move to right lane
  }
}

// Support touch for mobile devices (to simulate swipes)
function touchStarted() {
  // If touch is on left half of screen, go left lane
  // If touch is on right half of screen, go right lane
  if (mouseX < width/2) {
    player.laneIndex = 0; // Left lane

// Create a new zombie at the top of the screen in a random lane
function spawnZombie() {
  let zombie = {
    x: lanes[floor(random(2))], // Random lane (0 or 1)
    y: -50, // Start above the screen
    width: 40,
    height: 70,
    laneIndex: floor(random(2)) // Store the lane index (0 or 1)
  };
  
  zombies.push(zombie);
}

// Update all zombies and remove those that go off-screen
function updateZombies() {
  // Move zombies down and draw them
  for (let i = zombies.length - 1; i >= 0; i--) {
    // Move the zombie down
    zombies[i].y += zombieSpeed;
    
    // Draw the zombie
    drawZombie(zombies[i]);
    
    // Check if the zombie is off-screen
    if (zombies[i].y > height + 50) {
      // Remove this zombie from the array
      zombies.splice(i, 1);
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
  ellipse(zombie.x - 10, zombie.y - 15, 8, 8);
  ellipse(zombie.x + 10, zombie.y - 15, 8, 8);
  
  // Mouth
  rect(zombie.x, zombie.y + 5, 20, 5);
}

  } else {
    player.laneIndex = 1; // Right lane
  }
  
  // Prevent default behavior
  return false;
}
