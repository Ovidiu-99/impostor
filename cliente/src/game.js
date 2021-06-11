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
var capaTareas;
var teclaA;
var teclaV;
var teclaT;
var jugadores = {}; //colección de jugadores remotos
var crear;
var recursos = [{frame:0,sprite:"gabe"},{frame:3,sprite:"spidey"},{frame:6,sprite:"capucha"},{frame:48,sprite:"miles"},{frame:0,sprite:"gabe"},{frame:3,sprite:"spidey"},{frame:6,sprite:"capucha"},{frame:48,sprite:"miles"}]
let game;
var map;
var spawnPoint;
let showDebug = false;
var muertos;
var remotos;
var tareasOn = true;
var ataquesOn = true;
var final = false;
var musica;
var sonidoAtacar;
var sonidoGameOver;
var sonidoMuereInocente;

var progressBar;
var percentText;


function preload() {
  this.load.image("tiles", "cliente/assets/tilesets/tuxmon-sample-32px-extruded.png");
  this.load.tilemapTiledJSON("map", "cliente/assets/tilemaps/tuxemon-town.json");

  // An atlas is a way to pack multiple images together into one texture. I'm using it to load all
  // the player animations (walking left, walking right, etc.) in one image. For more info see:
  //  https://labs.phaser.io/view.html?src=src/animation/texture%20atlas%20animation.js
  // If you don't use an atlas, you can do the same thing with a spritesheet, see:
  //  https://labs.phaser.io/view.html?src=src/animation/single%20sprite%20sheet.js
  //this.load.atlas("atlas", "cliente/assets/atlas/atlas.png", "cliente/assets/atlas/atlas.json");
  this.load.spritesheet("varios","cliente/assets/images/CientosMorales.jpg",{frameWidth:48,frameHeight:48});
  this.load.spritesheet("muertos","cliente/assets/images/muertos.png",{frameWidth:48,frameHeight:48});
  //repetir por cada personaje o usar una con todos

  //Musica por DapperDan
  //https://dapperdan.itch.io/

  this.load.audio("musica", ["cliente/assets/sounds/music/No Quest.ogg"]);

  //Sonidos
  //Biblioteca FreeSFX por Kronbits 
  //https://kronbits.itch.io/freesfx

  this.load.audio("atacar", ["cliente/assets/sounds/atacar/Retro Weapon Laser 25.wav"]);
  this.load.audio("GameOver", ["cliente/assets/sounds/Game Over.wav"]);
  this.load.audio("muereInocente", ["cliente/assets/sounds/Retro Scream 01.wav"]);



}

function create() {
  crear = this;
  map = crear.make.tilemap({ key: "map" });

  // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
  // Phaser's cache (i.e. the name you used in preload)
  const tileset = map.addTilesetImage("tuxmon-sample-32px-extruded", "tiles");

  // Parameters: layer name (or index) from Tiled, tileset, x, y
  const belowLayer = map.createStaticLayer("Below Player", tileset, 0, 0);
  capaTareas = map.createStaticLayer("capaTareas", tileset, 0, 0);
  worldLayer = map.createStaticLayer("World", tileset, 0, 0);
  const aboveLayer = map.createStaticLayer("Above Player", tileset, 0, 0);

  worldLayer.setCollisionByProperty({ collides: true });
  capaTareas.setCollisionByProperty({ collides: true });

  // By default, everything gets depth sorted on the screen in the order we created things. Here, we
  // want the "Above Player" layer to sit on top of the player, so we explicitly give it a depth.
  // Higher depths will sit on top of lower depth objects.
  aboveLayer.setDepth(10);

  // Object layers in Tiled let you embed extra info into a map - like a spawn point or custom
  // collision shapes. In the tmx file, there's an object layer with a point named "Spawn Point"
  spawnPoint = map.findObject("Objects", obj => obj.name === "Spawn Point");

  //Crear música

  musica = crear.sound.add("musica");
  musica.loop = true;
  musica.play();

  //Crear sonidos

  sonidoAtacar = crear.sound.add("atacar");
  sonidoGameOver = crear.sound.add("GameOver");
  sonidoMuereInocente = crear.sound.add("muereInocente");

  // Create a sprite with physics enabled via the physics system. The image used for the sprite has
  // a bit of whitespace, so I'm using setSize & setOffset to control the size of the player's body.
  // player = this.physics.add


  // Create the player's walking animations from the texture atlas. These are stored in the global
  // animation manager so any sprite can access them.
  const anims = crear.anims;
  anims.create({
    key: "gabe-left-walk",
    frames: anims.generateFrameNames("varios", {
      start: 12,
      end: 14,
    }),
    repeat: -1
  });
  anims.create({
    key: "gabe-right-walk",
    frames: anims.generateFrameNames("varios", {
      start: 24,
      end: 26,
    }),
    repeat: -1
  });
  anims.create({
    key: "gabe-front-walk",
    frames: anims.generateFrameNames("varios", {
      start: 0,
      end: 2,
    }),
    repeat: -1
  });
  anims.create({
    key: "gabe-back-walk",
    frames: anims.generateFrameNames("varios", {
      start: 36,
      end: 38,
    }),
    repeat: -1
  });
  const anims2 = crear.anims;
  anims2.create({
    key: "spidey-left-walk",
    frames: anims.generateFrameNames("varios", {
      start: 15,
      end: 17,
    }),
    repeat: -1
  });
  anims2.create({
    key: "spidey-right-walk",
    frames: anims.generateFrameNames("varios", {
      start: 27,
      end: 29,
    }),
    repeat: -1
  });
  anims2.create({
    key: "spidey-front-walk",
    frames: anims.generateFrameNames("varios", {
      start: 3,
      end: 5,
    }),
    repeat: -1
  });
  anims2.create({
    key: "spidey-back-walk",
    frames: anims.generateFrameNames("varios", {
      start: 39,
      end: 41,
    }),
    repeat: -1
  });
  const anims3 = crear.anims;
  anims3.create({
    key: "capucha-left-walk",
    frames: anims.generateFrameNames("varios", {
      start: 18,
      end: 20,
    }),
    repeat: -1
  });
  anims3.create({
    key: "capucha-right-walk",
    frames: anims.generateFrameNames("varios", {
      start: 30,
      end: 32,
    }),
    repeat: -1
  });
  anims3.create({
    key: "capucha-front-walk",
    frames: anims.generateFrameNames("varios", {
      start: 6,
      end: 8,
    }),
    repeat: -1
  });
  anims3.create({
    key: "capucha-back-walk",
    frames: anims.generateFrameNames("varios", {
      start: 42,
      end: 44,
    }),
    repeat: -1
  });
  const anims4 = crear.anims;
  anims4.create({
    key: "miles-left-walk",
    frames: anims.generateFrameNames("varios", {
      start: 60,
      end: 62,
    }),
    repeat: -1
  });
  anims4.create({
    key: "miles-right-walk",
    frames: anims.generateFrameNames("varios", {
      start: 72,
      end: 74,
    }),
    repeat: -1
  });
  anims4.create({
    key: "miles-front-walk",
    frames: anims.generateFrameNames("varios", {
      start: 48,
      end: 50,
    }),
    repeat: -1
  });
  anims4.create({
    key: "miles-back-walk",
    frames: anims.generateFrameNames("varios", {
      start: 84,
      end: 86,
    }),
    repeat: -1
  });

  remotos = crear.add.group();
  muertos = crear.add.group();
  crearInputTeclas();

  dibujarBarraProgreso();
  lanzarJugador(ws.nick, ws.numJugador);
  ws.estoyDentro();
}

function crearInputTeclas(){
  cursors = crear.input.keyboard.createCursorKeys();
  teclaA = crear.input.keyboard.addKey('a');
  teclaV = crear.input.keyboard.addKey('v');
  teclaT = crear.input.keyboard.addKey('t');
}

function desactivarCapturaTeclas(){
  crear.input.keyboard.removeCapture('a');
  crear.input.keyboard.removeCapture('v');
  crear.input.keyboard.removeCapture('t');
  crear.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);
}

function crearColision(){
  if(crear && ws.impostor){
    crear.physics.add.overlap(player, remotos, kill,()=>{return ataquesOn});
  }
}

function kill(sprite, inocente){
  //dibujar el inocente muerto
  //avisar al servidor
  var nick = inocente.nick;
  if(teclaA.isDown){
    ataquesOn = false;
    //console.log("muere inocente");
    ws.atacar(nick);
    sonidoAtacar.play();
  }
}

function dibujarNickJugador(x, y, nick){
  var textNick = this.add.text(x, y, nick, { font: '"Press Start 2P"' });
}

function dibujarBarraProgreso() {
  progressBar = crear.add.graphics();
  var progressBox = crear.add.graphics();

  progressBox.fillStyle(0x222222, 0.8);
  progressBox.fillRect(240, 27, 320, 50);

  var width = crear.cameras.main.width;
  var height = crear.cameras.main.height;
  var tareaText = crear.make.text({
    x: width / 2,
    y: height / 10 - 45,
    text: 'Tareas realizadas: ',
    style: {
        font: '20px monospace',
        fill: '#ffffff'
    }
  });
  tareaText.setOrigin(0.5, 0.5);

  percentText = crear.make.text({
      x: width / 2,
      y: height / 10 - 5,
      text: '0%',
      style: {
          font: '18px monospace',
          fill: '#ffffff'
      }
  });
  percentText.setOrigin(0.5, 0.5);

  progressBar.setScrollFactor(0);
  progressBox.setScrollFactor(0);
  tareaText.setScrollFactor(0);
  percentText.setScrollFactor(0);

  progressBar.setDepth(11);
  progressBox.setDepth(10);
  tareaText.setDepth(10);
  percentText.setDepth(12);
}

function actualizarBarraProgreso(porcentaje){
  //Dibujar la barra de progreso actualizada
  console.log(porcentaje);
  progressBar.clear();
  progressBar.fillStyle(0x008f39, 1);
  progressBar.fillRect(250, 38, 3 * porcentaje, 30);

  percentText.setText(parseInt(porcentaje) + '%');

}


function dibujarMuereInocente(inocente){
  //dibujar el sprite tumbado o...
  //meter el sprite en el grupo muertos
  //crear la funciona que gestiona la colision
  var x = jugadores[inocente].x;
  var y = jugadores[inocente].y;
  var numJugador = jugadores[inocente].numJugador;
  var muerto = crear.physics.add.sprite(x, y,"muertos",recursos[numJugador].frame);
  muertos.add(muerto);
  sonidoMuereInocente.play();
  //otra opcion
  //jugadores[inocente].setTextura("muertos", recursos)
  //agregas jugadores[] inocente al grupo muertos

  crear.physics.add.overlap(player, muertos, votacion);
}

function votacion(sprite, muerto){

  //comprobar si jugador local pulsa la "v"
  //en ese caso,, llamamos al servidor para lanzar la votacion

  if(teclaV.isDown){
    ws.lanzarVotacion();
  }

}

function tareas(sprite, objeto){
  //puede realizar la tarea?
  //permitir realizar tarea
  //dibujar modal personalizado tarea
  //objeto.tarea = "jardines";
  if(ws.encargo == objeto.properties.tarea && teclaT.isDown){
    tareasOn = false;
    console.log("realizar tarea "+ws.encargo);
    ws.realizarTarea(ws.codigo, ws.nick);
    cw.mostrarModalTarea(ws.encargo);
  }
}

function lanzarJugador(nick, numJugador) {
  var x = spawnPoint.x+30*numJugador;
  var y = spawnPoint.y;
  player = crear.physics.add.sprite(x, y,"varios",recursos[numJugador].frame);    
  crear.physics.add.collider(player, worldLayer);
  crear.physics.add.collider(player, capaTareas, tareas, ()=>{return tareasOn});
  //crear.physics.add.collider(player2, worldLayer);

  jugadores[nick] = player;
  jugadores[nick].nick = nick;
  jugadores[nick].numJugador = numJugador;
  camera = crear.cameras.main;
  camera.startFollow(player);
  camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
}

function lanzarJugadorRemoto(nick, numJugador) {
  console.log("se lanza jugador remoto"+nick+" num: "+numJugador);
  var frame = recursos[numJugador].frame;
  jugadores[nick]=crear.physics.add.sprite(spawnPoint.x, spawnPoint.y,"varios",frame);   
  crear.physics.add.collider(player, worldLayer);
  jugadores[nick].nick = nick;
  jugadores[nick].numJugador = numJugador;
  remotos.add(jugadores[nick]);
}

function mover(datos) {
  var direccion = datos.direccion;
  var nick = datos.nick;
  var numJugador = datos.numJugador;
  var x = datos.x;
  var y = datos.y;
  var remoto = jugadores[nick];
  const speed = 175;
  //const prevVelocity = player.body.velocity.clone();
  const nombre = recursos[numJugador].sprite;

  if (remoto && !final) {

    //Mover nombre de los jugadores remotos

    if(!remoto.textNick){
      remoto.textNick = crear.add.text(x-24, y-40, nick,{fontFamily: 'Courier', fontSize: '16px', align: 'center'});

    }
    remoto.textNick.setX(x-24);
    remoto.textNick.setY(y-40);

    //Mover sprite jugador

    remoto.body.setVelocity(0);
    remoto.setX(x);
    remoto.setY(y);
    remoto.body.velocity.normalize().scale(speed);
    if (direccion == "left") {
      remoto.anims.play(nombre + "-left-walk", true);
    } else if (direccion == "right") {
      remoto.anims.play(nombre + "-right-walk", true);
    } else if (direccion == "up") {
      remoto.anims.play(nombre + "-back-walk", true);
    } else if (direccion == "down") {
      remoto.anims.play(nombre + "-front-walk", true);
    } else {
      remoto.anims.stop();
    }
  }
}

this.finPartida = function(data){
  final = true;
  musica.stop();
  sonidoGameOver.play();
  cw.mostrarModalSimple("Fin de la partida. "+data);
  //player.destroy();
}

function borrarJugador(nick){

  remotos.remove(jugadores[nick], true, true);
}

function update(time, delta) {
  var direccion="stop";
  const speed = 175;
  //const prevVelocity = player.body.velocity.clone();
  const nombre=recursos[ws.numJugador].sprite;

  // Stop any previous movement from the last frame
  if(!final){
    player.body.setVelocity(0);

    // Horizontal movement
    if (cursors.left.isDown) {
      player.body.setVelocityX(-speed);
      direccion="left";
    } else if (cursors.right.isDown) {
      player.body.setVelocityX(speed);
      direccion="right";
    }
  
    // Vertical movement
    if (cursors.up.isDown) {
      player.body.setVelocityY(-speed);
      direccion="up";
    } else if (cursors.down.isDown) {
      player.body.setVelocityY(speed);
      direccion="down";
    }
  
    // Normalize and scale the velocity so that player can't move faster along a diagonal
    player.body.velocity.normalize().scale(speed);
    ws.movimiento(direccion,player.x,player.y);
  
    // Update the animation last and give left/right animations precedence over up/down animations
    if (cursors.left.isDown) {
      player.anims.play(nombre+"-left-walk", true);
    } else if (cursors.right.isDown) {
      player.anims.play(nombre+"-right-walk", true);
    } else if (cursors.up.isDown) {
      player.anims.play(nombre+"-back-walk", true);
    } else if (cursors.down.isDown) {
      player.anims.play(nombre+"-front-walk", true);
    } else {
      player.anims.stop();
    }
    // If we were moving, pick and idle frame to use
    // if (prevVelocity.x < 0) player.setTexture("gabe", "gabe-left-walk");
    // else if (prevVelocity.x > 0) player.setTexture("gabe", "gabe-right-walk");
    // else if (prevVelocity.y < 0) player.setTexture("gabe", "gabe-back-walk");
    // else if (prevVelocity.y > 0) player.setTexture("gabe", "gabe-front-walk");
  }
}
