let player;
let mapImage;
let resourceImages = {};
let resources = [];
const worldWidth = 3000;
const worldHeight = 2000;

function preload() {

  mapImage = loadImage('assets/map.png');
  resourceImages['player'] = loadImage('assets/player.png');
  resourceImages['wood'] = loadImage('assets/wood.png'); // .html
  resourceImages['seamoss'] = loadImage('assets/seamoss.png'); // .css
  resourceImages['egg'] = loadImage('assets/egg.png'); // .js
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER); 

  player = new Player(worldWidth / 2, worldHeight / 2);

  // Spawn some initial resources randomly
  for (let i = 0; i < 20; i++) {
    resources.push(new Resource('wood', random(worldWidth), random(worldHeight)));
    resources.push(new Resource('seamoss', random(worldWidth), random(worldHeight)));
    resources.push(new Resource('egg', random(worldWidth), random(worldHeight)));
  }
}

function draw() {
  background(100, 150, 200); // Ocean blue color

  // Translate the world to keep the player in the center of the screen
  let camX = -player.x + width / 2;
  let camY = -player.y + height / 2;
  translate(camX, camY);

  image(mapImage, worldWidth / 2, worldHeight / 2, worldWidth, worldHeight);

  for (let r of resources) {
    r.draw();
  }
  player.update();
  player.draw();
  resetMatrix(); 
  drawUI();
}


class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 50;
    this.img = resourceImages['player'];
    this.inventory = [];
  }

  update() {
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) this.x -= this.speed; // 65 is 'A'
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) this.x += this.speed; // 68 is 'D'
    if (keyIsDown(UP_ARROW) || keyIsDown(87)) this.y -= this.speed; // 87 is 'W'
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) this.y += this.speed; // 83 is 'S'

    // World boundaries
    this.x = constrain(this.x, 0, worldWidth);
    this.y = constrain(this.y, 0, worldHeight);

    // Collision & Collection
    for (let i = resources.length - 1; i >= 0; i--) {
      let r = resources[i];
      if (dist(this.x, this.y, r.x, r.y) < 32) { // 32 is collision radius
        this.inventory.push(r.type);
        resources.splice(i, 1); // Remove resource from the world
        console.log("Collected:", r.type, "Inventory:", this.inventory);
      }
    }
  }

  draw() {
    image(this.img, this.x, this.y, 50, 50);
  }
}

class Resource {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.img = resourceImages[type];
  }

  draw() {
    image(this.img, this.x, this.y, 40, 40);
  }
}


function drawUI() {
  // Inventory Bar
  fill(0, 0, 0, 150); // Semi-transparent black
  rect(10, height - 60, width - 20, 50); // Background bar
  
  // Draw collected items in the inventory
  for (let i = 0; i < player.inventory.length; i++) {
    let itemType = player.inventory[i];
    let itemImg = resourceImages[itemType];
    image(itemImg, 35 + i * 45, height - 35, 40, 40);
  }

  // Mission Text (Hardcoded for now)
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  text("Mission: Explore the island and gather materials!", 15, 15);
}


// Your idea for the recipe structure is great. We'll build this next.
const recipes = [
  "wood, seamoss, egg --> website",
  "wood, wood --> automation_script"
];

function parseRecipe(recipeString) {
  const parts = recipeString.split('-->');
  const ingredients = parts[0].split(',').map(item => item.trim());
  const output = parts[1].trim();
  return { ingredients, output };
}
