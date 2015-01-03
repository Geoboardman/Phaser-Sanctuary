var myId=0;

var map;
var layer, layer2;
var tank;
var player;
var tanksList;
var logo;
var cursors;

var ready = false;
var eurecaServer;
//this function will handle client communication with the server
var eurecaClientSetup = function() {
	//create an instance of eureca.io client
	var eurecaClient = new Eureca.Client();
	
	eurecaClient.ready(function (proxy) {		
		eurecaServer = proxy;
	});
	
	
	//methods defined under "exports" namespace become available in the server side
	
	eurecaClient.exports.setId = function(id) 
	{
		//create() is moved here to make sure nothing is created before uniq id assignation
		myId = id;
		create();
		eurecaServer.handshake();
		ready = true;
	}	
	
	eurecaClient.exports.kill = function(id)
	{	
		if (tanksList[id]) {
			tanksList[id].kill();
			console.log('killing ', id, tanksList[id]);
		}
	}	
	
	eurecaClient.exports.spawnEnemy = function(i, x, y)
	{
		
		if (i == myId) return; //this is me
		
		console.log('SPAWN');
		var tnk = new Tank(i, game, tank);
		tanksList[i] = tnk;
	}
	
	eurecaClient.exports.updateState = function(id, state)
	{
		if (tanksList[id])  {
			tanksList[id].cursor = state;
			tanksList[id].tank.x = state.x;
			tanksList[id].tank.y = state.y;
			tanksList[id].tank.angle = state.angle;
			tanksList[id].update();
		}
	}
}


Tank = function (index, game, player) {
	this.cursor = {
		left:false,
		right:false,
		up:false,
		down:false,
		fire:false		
	}

	this.input = {
		left:false,
		right:false,
		up:false,
		down:false,
		fire:false
	}

    var x = 0;
    var y = 0;

    this.game = game;
    this.health = 30;
    this.player = player;
	
	
	this.currentSpeed =0;
    this.fireRate = 500;
    this.nextFire = 0;
    this.alive = true;

    this.tank = game.add.sprite(x, y, 'character');
	this.tank.scale.setTo(1.5,1.5);
    this.tank.anchor.set(0.5);

    this.tank.id = index;
    game.physics.enable(this.tank, Phaser.Physics.ARCADE);
    this.tank.body.immovable = false;
    this.tank.body.collideWorldBounds = true;
    this.tank.body.bounce.setTo(0, 0);

    this.tank.angle = 0;

    //game.physics.arcade.velocityFromRotation(this.tank.rotation, 0, this.tank.body.velocity);

};

Tank.prototype.update = function() {
	
	var inputChanged = (
		this.cursor.left != this.input.left ||
		this.cursor.right != this.input.right ||
		this.cursor.up != this.input.up ||
		this.cursor.down != this.input.down ||
		this.cursor.fire != this.input.fire
	);
	
	
	if (inputChanged)
	{
		//Handle input change here
		//send new values to the server		
		if (this.tank.id == myId)
		{
			// send latest valid state to the server
			this.input.x = this.tank.x;
			this.input.y = this.tank.y;
			this.input.angle = this.tank.angle;
			
			
			eurecaServer.handleKeys(this.input);
			
		}
	}

	//cursor value is now updated by eurecaClient.exports.updateState method		
    if (this.cursor.left)
    {
        this.tank.animations.play('left');
		this.tank.body.velocity.x = -150;
    }
    else if (this.cursor.right)
    {
        this.tank.animations.play('right');
		this.tank.body.velocity.x = 150;
    }
	else
	{
		this.tank.body.velocity.x = 0;
		this.tank.animations.stop(null, true);
	}
    if (this.cursor.up)
    {
        this.tank.animations.play('up');
		this.tank.body.velocity.y = -150;
    }
    else if (this.cursor.down)
    {
        this.tank.animations.play('down');
		this.tank.body.velocity.y = 150;
    }
	else 
	{
		this.tank.body.velocity.y = 0;
		this.tank.animations.stop();
	}
};



Tank.prototype.kill = function() {
	this.alive = false;
	this.tank.kill();
}

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload: preload, create: eurecaClientSetup, update: update, render: render });

function preload () {

	//Load the tilemap file
	game.load.tilemap('map1', 'assets/Maps/ForestTest1.json', null, Phaser.Tilemap.TILED_JSON);
	//Load the spritesheet for the tilemap
	game.load.image('tiles', 'assets/light_forest_tileset_0.png');
	game.load.spritesheet('character', 'assets/characters_1.png',16,16,96);
    game.load.image('logo', 'assets/logo.png');   
}

function create () {

    map = game.add.tilemap('map1');
	//'ground' is the name of the spritesheet inside of Tiled Map Editor
    map.addTilesetImage('Forestt', 'tiles');
	//'Grass 1' is the name of a layer inside of Tiled Map Editor
    map.setCollision(545);
	layer = map.createLayer('Ground');
    layer.resizeWorld();
    layer2 = map.createLayer('Foliage');
    layer2.resizeWorld();	
	
	
    //  Resize our game world to be a 2000 x 2000 square
    game.world.setBounds(0, 0, 1600, 1600);
	game.stage.disableVisibilityChange  = true;
	
    //  Our tiled scrolling background
    //land = game.add.tileSprite(0, 0, 800, 600, 'earth');
    //	land.fixedToCamera = true;
    
    tanksList = {};
	
	player = new Tank(myId, game, tank);
	tanksList[myId] = player;
	tank = player.tank;
	//turret = player.turret;
	tank.x=0;
	tank.y=0;
	tank.animations.add('left', [15, 16, 17], 10, true);
	tank.animations.add('right', [27, 28, 29], 10, true);
	tank.animations.add('up', [39, 40, 41], 10, true);
	tank.animations.add('down', [3, 4, 5], 10, true);

    tank.bringToTop();
		
    logo = game.add.sprite(0, 200, 'logo');
    logo.fixedToCamera = true;

    game.input.onDown.add(removeLogo, this);

    game.camera.follow(tank);
    game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300);
    game.camera.focusOnXY(0, 0);

    cursors = game.input.keyboard.createCursorKeys();
	
	setTimeout(removeLogo, 1000);
	
}

function removeLogo () {
    game.input.onDown.remove(removeLogo, this);
    logo.kill();
}

function update () {
	//do not update if client not ready
	if (!ready) return;
	
	player.input.left = cursors.left.isDown;
	player.input.down = cursors.down.isDown;
	player.input.right = cursors.right.isDown;
	player.input.up = cursors.up.isDown;
	player.input.fire = game.input.activePointer.isDown;
	player.input.tx = game.input.x+ game.camera.x;
	player.input.ty = game.input.y+ game.camera.y;
	
	
    //land.tilePosition.x = -game.camera.x;
    //land.tilePosition.y = -game.camera.y;

    game.physics.arcade.collide(this.tank, layer2);	
	
    for (var i in tanksList)
    {
		if (!tanksList[i]) continue;
		var curTank = tanksList[i].tank;
		for (var j in tanksList)
		{
			if (!tanksList[j]) continue;
			if (tanksList[j].alive)
			{
				tanksList[j].update();
			}			
		}
    }
}

function render () {}

