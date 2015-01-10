var myId=0;

var map;
var layer, layer2;
var Character;
var player;
var CharactersList;
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
		if (CharactersList[id]) {
			CharactersList[id].kill();
			console.log('killing ', id, CharactersList[id]);
		}
	}	
	
	eurecaClient.exports.spawnEnemy = function(i, x, y)
	{
		
		if (i == myId) return; //this is me
		
		console.log('SPAWN');
		var tnk = new Character(i, game, Character);
		CharactersList[i] = tnk;
	}
	
	eurecaClient.exports.updateState = function(id, state)
	{
		if (CharactersList[id])  {
			CharactersList[id].cursor = state;
			CharactersList[id].Character.x = state.x;
			CharactersList[id].Character.y = state.y;
			CharactersList[id].Character.angle = state.angle;
			CharactersList[id].update();
		}
	}
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
    
    CharactersList = {};
	
	player = new Character(myId, game, Character);
	CharactersList[myId] = player;
	Character = player.Character;
	Character.x=0;
	Character.y=0;
	Character.animations.add('left', [15, 16, 17], 10, true);
	Character.animations.add('right', [27, 28, 29], 10, true);
	Character.animations.add('up', [39, 40, 41], 10, true);
	Character.animations.add('down', [3, 4, 5], 10, true);

    Character.bringToTop();
		
    logo = game.add.sprite(0, 200, 'logo');
    logo.fixedToCamera = true;

    game.input.onDown.add(removeLogo, this);

    game.camera.follow(Character);
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

    game.physics.arcade.collide(this.Character, layer2);	
	
    for (var i in CharactersList)
    {
		if (!CharactersList[i]) continue;
		var curCharacter = CharactersList[i].Character;
		for (var j in CharactersList)
		{
			if (!CharactersList[j]) continue;
			if (CharactersList[j].alive)
			{
				CharactersList[j].update();
			}			
		}
    }
}

function render () {}

