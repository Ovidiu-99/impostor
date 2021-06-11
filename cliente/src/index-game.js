/**
 * Author: Michael Hadley, mikewesthad.com
 * Asset Credits:
 *  - Tuxemon, https://github.com/Tuxemon/Tuxemon
 */

function lanzarJuego(){
  game = new Phaser.Game(config);
}


const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

let cursors;
let player;
let player2;
var worldLayer;
var jugadores = {}; //colección de jugadores remotos
var crear;
var recursos = [{sprite:"miles",frame:0},{sprite:"spidey",frame:3}]
let game;
var map;
var spawnPoint;
let showDebug = false;

function preload() {
  this.load.image("tiles", "cliente/assets/tilesets/tuxmon-sample-32px-extruded.png");
  this.load.tilemapTiledJSON("map", "cliente/assets/tilemaps/tuxemon-town.json");

  // An atlas is a way to pack multiple images together into one texture. I'm using it to load all
  // the player animations (walking left, walking right, etc.) in one image. For more info see:
  //  https://labs.phaser.io/view.html?src=src/animation/texture%20atlas%20animation.js
  // If you don't use an atlas, you can do the same thing with a spritesheet, see:
  //  https://labs.phaser.io/view.html?src=src/animation/single%20sprite%20sheet.js
  //this.load.atlas("atlas", "cliente/assets/atlas/atlas.png", "cliente/assets/atlas/atlas.json");
  this.load.spritesheet("gabe","cliente/assets/images/CientosMorales.jpg",{frameWidth:48,frameHeight:48});
  //repetir por cada personaje o usar una con todos
}

function create() {
  crear = this;
  map = this.make.tilemap({ key: "map" });

  // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
  // Phaser's cache (i.e. the name you used in preload)
  const tileset = map.addTilesetImage("tuxmon-sample-32px-extruded", "tiles");

  // Parameters: layer name (or index) from Tiled, tileset, x, y
  const belowLayer = map.createStaticLayer("Below Player", tileset, 0, 0);
  const worldLayer = map.createStaticLayer("World", tileset, 0, 0);
  const aboveLayer = map.createStaticLayer("Above Player", tileset, 0, 0);

  worldLayer.setCollisionByProperty({ collides: true });

  // By default, everything gets depth sorted on the screen in the order we created things. Here, we
  // want the "Above Player" layer to sit on top of the player, so we explicitly give it a depth.
  // Higher depths will sit on top of lower depth objects.
  aboveLayer.setDepth(10);

  // Object layers in Tiled let you embed extra info into a map - like a spawn point or custom
  // collision shapes. In the tmx file, there's an object layer with a point named "Spawn Point"
  spawnPoint = map.findObject("Objects", obj => obj.name === "Spawn Point");

  // Create a sprite with physics enabled via the physics system. The image used for the sprite has
  // a bit of whitespace, so I'm using setSize & setOffset to control the size of the player's body.
  // player = this.physics.add


  // Create the player's walking animations from the texture atlas. These are stored in the global
  // animation manager so any sprite can access them.
  let nombre = recursos[0].sprite;
  const anims = this.anims;
  anims.create({
    key: "gabe-left-walk",
    frames: anims.generateFrameNames("gabe", {
      //prefix: "misa-left-walk.",
      start: 3,
      end: 5,
      //zeroPad: 3
    }),
    //frameRate: 10,
    repeat: -1
  });
  anims.create({
    key: "gabe-right-walk",
    frames: anims.generateFrameNames("gabe", {
      //prefix: "misa-left-walk.",
      start: 6,
      end: 8,
      //zeroPad: 3
    }),
    //frameRate: 10,
    repeat: -1
  });
  anims.create({
    key: "gabe-front-walk",
    frames: anims.generateFrameNames("gabe", {
      //prefix: "misa-left-walk.",
      start: 0,
      end: 2,
      //zeroPad: 3
    }),
    //frameRate: 10,
    repeat: -1
  });
  anims.create({
    key: "gabe-back-walk",
    frames: anims.generateFrameNames("gabe", {
      //prefix: "misa-left-walk.",
      start: 9,
      end: 11,
      //zeroPad: 3
    }),
    //frameRate: 10,
    repeat: -1
  });

  cursors = crear.input.keyboard.createCursorKeys();
  //lanzarJugador(ws.numJugador);
  //ws.estoyDentro();
}

function lanzarJugador(numJugador) {
  player = crear.physics.add.sprite(spawnPoint.x, spawnPoint.y,"varios",recursos[numJugador].frame);    
  crear.physics.add.collider(player, worldLayer);
  //crear.physics.add.collider(player2, worldLayer);
  camera = crear.cameras.main;
  camera.startFollow(player);
  camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
}

function lanzarJugadorRemoto(nick, numJugador) {
  var frame = recursos[numJugador].frame;
  jugadores[nick] = crear.physics.add.sprite(spawnPoint.x + 15*numJugador, spawnPoint.y,"varios",frame);    
  crear.physics.add.collider(player, worldLayer);
}

function moverRemoto(direccion,nick,numJugador){
  var remoto = jugadores[nick];

  if(direccion == "left"){
    remoto.body.setVelocityX(-speed);
  }
}

function update(time, delta) {
  const speed = 175;
  const prevVelocity = player.body.velocity.clone();

  // Stop any previous movement from the last frame
  player.body.setVelocity(0);

  // Horizontal movement
  if (cursors.left.isDown) {
    player.body.setVelocityX(-speed);
    ws.movimiento("left");
  } else if (cursors.right.isDown) {
    player.body.setVelocityX(speed);
  }

  // Vertical movement
  if (cursors.up.isDown) {
    player.body.setVelocityY(-speed);
  } else if (cursors.down.isDown) {
    player.body.setVelocityY(speed);
  }

  // Normalize and scale the velocity so that player can't move faster along a diagonal
  player.body.velocity.normalize().scale(speed);

  // Update the animation last and give left/right animations precedence over up/down animations
  if (cursors.left.isDown) {
    player.anims.play("gabe-left-walk", true);
  } else if (cursors.right.isDown) {
    player.anims.play("gabe-right-walk", true);
  } else if (cursors.up.isDown) {
    player.anims.play("gabe-back-walk", true);
  } else if (cursors.down.isDown) {
    player.anims.play("gabe-front-walk", true);
  } else {
    player.anims.stop();

    // If we were moving, pick and idle frame to use
    // if (prevVelocity.x < 0) player.setTexture("gabe", "gabe-left-walk");
    // else if (prevVelocity.x > 0) player.setTexture("gabe", "gabe-right-walk");
    // else if (prevVelocity.y < 0) player.setTexture("gabe", "gabe-back-walk");
    // else if (prevVelocity.y > 0) player.setTexture("gabe", "gabe-front-walk");
  }
}
