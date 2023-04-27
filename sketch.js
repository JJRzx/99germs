let p;
let germ = [];
let bullets = [];
let keyLeft, keyRight, keyUp, keyDown
let numGerms = 5;
let screen = 0;
let lives = 3;
let squareSize = 40;
let wave = 1;

let germSprite;
let wormSprite;
let slimeSprite;
let heartSprite;

let isHit = false;
let isInvulnerable = false;
let invulnerableDuration = 2;
let invulnerableTimer = 0;

const bulletSpeed = 20;
let spawnX, spawnY;

class Click {
  constructor(x, y, sizex, sizey) {
    this.x = x;
    this.y = y;
    this.sizex = sizex;
    this.sizey = sizey;
  }

  isClick() {
    return mouseX > this.x && mouseX < this.x + this.sizex && mouseY > this.y && mouseY < this.y + this.sizey;
  }
}

class Button extends Click {
  constructor(x, y, sizex, sizey, t) {
    super(x, y, sizex, sizey);
    this.title = t;
    this.color = color(51,51,51); // Edit Button Color
    this.shadowColor = color(21); // Edit Shadow Color
    this.shadowSize = 5; // Shadow size
  }

  render() {
    fill(this.shadowColor);
    rect(this.x + this.shadowSize, this.y + this.shadowSize, this.sizex, this.sizey);

    if (this.isClick()) {
      fill(red(this.color) - 20, green(this.color) - 20, blue(this.color) - 20); // Darken the button when it's clicked
    } else {
      fill(this.color);
    }
    noStroke();
    rect(this.x, this.y, this.sizex, this.sizey);
    fill(255);
    textFont("VT323")
    textSize(80);
    textAlign(CENTER, CENTER);
    text(this.title, this.x + this.sizex / 2, this.y + this.sizey / 2);
  }
}

class Movement {
  constructor(x,y) {
    this.x = x;
    this.y = y;
    this.sx = 0;
    this.sy = 0;
    this.pos = createVector(x, y);
    this.vel = createVector();
    this.acc = createVector();
  }
}

class Player extends Movement {
  constructor(){
    super(width/2, height/2);
    this.size = 50;
    this.sx *= 0;
    this.sy *= 0;
  }
  render() {
    fill(0);
    ellipse(this.x, this.y, this.size, this.size);
  }
  
}

class Bullets extends Movement {
  constructor(x1, y1, x2, y2) {
    super(x1, y1);
    const hyp = dist(x1, y1, x2, y2);
    const dx = x2 - x1;
    const dy = y2 - y1;
    this.sx = bulletSpeed * dx / hyp;
    this.sy = bulletSpeed * dy / hyp;
  }
  render() {
    this.x += this.sx;
    this.y += this.sy;
    fill(0);
    ellipse(this.x, this.y, 10, 10);
  }
}

class Germ extends Movement {
  constructor(x,y) {
    super(x,y);
    this.acceleration = createVector(0,0);
    this.velocity = createVector(0,0);
    this.location = createVector(x,y);
    this.r = 3.0;
    this.maxspeed = 2;
    this.maxforce = 0.1;
    this.sprite = random([germSprite, wormSprite, slimeSprite]);
  }
  update(){
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxspeed);
    this.location.add(this.velocity);
    this.acceleration.mult(0);
  }
  applyForce(force) {
    this.acceleration.add(force);
  }
  seek(target) {
    const desired = p5.Vector.sub(target, this.location);
    desired.normalize();
    desired.mult(this.maxspeed);
    const steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce);
    this.applyForce(steer);
  }
  render() {
    fill(175);
    stroke(0);
    push();
    translate(this.location.x, this.location.y);
    const angle = atan2(p.y - this.location.y, p.x - this.location.x);
    rotate(angle);
    imageMode(CENTER);
    rectMode(CENTER);
    //rect(0, 0, 31,21);
    image(this.sprite,0,0)
    pop();
  }
}

function preload(){
  germSprite = loadImage('germSprite.gif');
  wormSprite = loadImage('wormSprite.gif');
  slimeSprite = loadImage('slimeSprite.gif');
  heartSprite = loadImage('heartSprite.gif');
}

function setup() {
  var canvas = createCanvas(800,800);
  canvas.parent('canvas-container');
  //might be unnesscary, remove later if has no effect
  spawnX = random(width);
  spawnY = random(height);

  for (let i = 0; i < numGerms; i++){
    let x, y;
    let side = int(random(4)); // randomly choose a side (0 = left, 1 = right, 2 = top, 3 = bottom)
    if (side === 0) { // left
      x = random(-200, -100);
      y = random(height);
    } else if (side === 1) { // right
      x = random(width + 100, width + 200);
      y = random(height);
    } else if (side === 2) { // top
      x = random(width);
      y = random(-200, -100);
    } else { // bottom
      x = random(width);
      y = random(height + 100, height + 200);
    }
    germ.push(new Germ(x, y));
  }
  
  p = new Player();

  button = new Button(width / 2 - 150, height / 2, 300, 100, "START");
}

function draw() {
  background(220);

  if (screen == 0){
    homeScreen();
    button.render();
  } else if (screen == 1){
    gameScreen();
  } else if (screen == 2){
    endScreen();
  }


countSpeed();
changePosition();
spawnNewGerms();
}

//MAIN GAME
function gameScreen(){
    //Draws the Player
    let player = createVector(p.x, p.y);
    p.render();
  
  
  //Draws Bullets
  if (bullets && bullets.length > 0) {
    for (let i = 0; i < bullets.length; i++){
      bullets[i].render();
      if (bullets[i].x < 0 || bullets[i].x > width || bullets[i].y < 0 || bullets[i].y > height) {
        bullets.splice(i, 1);
      }
    }
  }
  
  if (germ && germ.length > 0) {
    for (let j = 0; j < germ.length; j++){
      germ[j].seek(player);
      germ[j].update();
      germ[j].render();

      let collide = dist(germ[j].location.x, germ[j].location.y, player.x, player.y);
      if (collide < 50){
        isHit = true;
      } else {
        isHit = false;
      }
    }
  }
  
  if (bullets && germ && bullets.length > 0 && germ.length > 0) {
    for (let i = bullets.length - 1; i >= 0; i--){
      for (let j = germ.length - 1; j >= 0; j--){   
        let collide = dist(germ[j].location.x, germ[j].location.y, bullets[i].x, bullets[i].y);
        if (collide < 25) {
          germ.splice(j, 1);
        } 
      }
    }
  }

  //Extras
  //Is Player Hit?
  if (isHit && !isInvulnerable){
    lives = lives -1;
    isInvulnerable = true;
    invulnerableTimer = 0;
  }

  if (isInvulnerable){
    invulnerableTimer += deltaTime / 1000;
    if (invulnerableTimer >= invulnerableDuration){
      isInvulnerable = false;
    }
  }

  //Heart Display
  noStroke();
  for (let i = 0; i < lives; i++) {
    image(heartSprite,i * (squareSize + 10)+ 25, 10, squareSize, squareSize);
  }

  //Germs Killed Counter
  fill(0);
  rect(width/2-400/2,10, 400,40);

  //Wave Counter
  rect(width-140 -25 ,10, 140,40);
  textSize(32);
  fill(255);
  text("Wave: " + wave, width-110, 28);

} //###############################################################
  //################# END OF GAME CODE ############################
  //###############################################################


  //HOME SCREEN
function homeScreen(){

}

//END SCREEN (Out of Lives)
function endScreen(){

}

const MAX_SPEED = 5;
function countSpeed() {
  if (keyLeft) {
    p.sx -= 0.1;
  } else {
    if (p.sx < 0) {
      p.sx += 0.1;
    }
    if (Math.abs(p.sx) < 0.1) {
      p.sx = 0;
    }
  }
  if (keyRight) {
    p.sx += 0.1;
  } else {
    if (p.sx > 0) {
      p.sx -= 0.1;
    }
    if (Math.abs(p.sx) < 0.1) {
      p.sx = 0;
    }
  }
  if (keyUp) {
    p.sy -= 0.1;
  } else {
    if (p.sy < 0) {
      p.sy += 0.1;
    }
    if (Math.abs(p.sy) < 0.1) {
      p.sy = 0;
    }
  }
  if (keyDown) {
    p.sy += 0.1;
  } else {
    if (p.sy > 0) {
      p.sy -= 0.1;
    }
    if (Math.abs(p.sy) < 0.1) {
      p.sy = 0;
    }
  }

  //Limit Speed
  const speed = Math.sqrt(p.sx * p.sx + p.sy * p.sy);
  if (speed > MAX_SPEED) {
    p.sx = (p.sx / speed) * MAX_SPEED;
    p.sy = (p.sy / speed) * MAX_SPEED;
  }
}


function changePosition(){
  p.x += p.sx;
  p.y += p.sy;
}

function keyPressed(){
  if (keyCode == 87) {
    keyUp = true;
  }
  if (keyCode == 83) {
    keyDown = true;
  }
  if (keyCode == 65) {
    keyLeft = true;
  }
  if (keyCode == 68){
    keyRight = true;
  }
}

function keyReleased(){
  if (keyCode == 87) {
    keyUp = false;
  }
  if (keyCode == 83) {
    keyDown = false;
  }
  if (keyCode == 65) {
    keyLeft = false;
  }
  if (keyCode == 68){
    keyRight = false;
  }
}

function mouseClicked() {
  if (screen == 0){
    if (button.isClick()){
      screen = 1;
    }
  } else if (screen == 1){
  bullets.push(new Bullets(p.x, p.y, mouseX, mouseY)); 
  }
}

function spawnNewGerms() {
  if (germ.length === 0) { // if all germs are dead
    wave++;
    numGerms += 5; // increase the number of germs to spawn
    for (let i = 0; i < numGerms; i++) {
      let x, y;
      let side = int(random(4));
      switch (side) {
        case 0: // left
          x = -squareSize/2;
          y = random(height);
          break;
        case 1: // right
          x = width + squareSize/2;
          y = random(height);
          break;
        case 2: // top
          x = random(width);
          y = -squareSize/2;
          break;
        case 3: // bottom
          x = random(width);
          y = height + squareSize/2;
          break;
      }
      germ.push(new Germ(x, y));
    }
  }
}



