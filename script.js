
// Game variables
let player = {
  width: 50,
  height: 80,
  laneIndex: 0 // 0 for left lane, 1 for right lane
};

// Lane positions (horizontal)
const lanes = [100, 250]; // Left and right lane x-positions
const playerYPosition = 500; // Fixed vertical position near the bottom

function setup() {
  // Create canvas and place it in the game-container
  let canvas = createCanvas(400, 600);
  canvas.parent('game-container');
  
  // Set basic drawing properties
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
}

function draw() {
  // Clear the background on each frame
  background(50); // Dark gray background
  
  // Draw the lanes
  drawLanes();
  
  // Draw the player
  drawPlayer();
}

function drawLanes() {
  // Draw lane markers or guides
  stroke(255, 255, 255, 100); // Semi-transparent white
  strokeWeight(2);
  
  // Left lane line
  line(lanes[0] - 40, 0, lanes[0] - 40, height);
  line(lanes[0] + 40, 0, lanes[0] + 40, height);
  
  // Right lane line
  line(lanes[1] - 40, 0, lanes[1] - 40, height);
  line(lanes[1] + 40, 0, lanes[1] + 40, height);
}

function drawPlayer() {
  // Draw the player at the correct lane position
  fill(0, 150, 255); // Blue player
  noStroke();
  
  // Position player at the current lane
  rect(lanes[player.laneIndex], playerYPosition, player.width, player.height);
}

function keyPressed() {
  // Handle lane switching with arrow keys
  if (keyCode === LEFT_ARROW && player.laneIndex > 0) {
    player.laneIndex--;
  } else if (keyCode === RIGHT_ARROW && player.laneIndex < lanes.length - 1) {
    player.laneIndex++;
  }
}
