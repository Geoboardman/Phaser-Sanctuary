Character = function (index, game, player) {
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

    this.Character = game.add.sprite(x, y, 'character');
	this.Character.scale.setTo(1.5,1.5);
    this.Character.anchor.set(0.5);

    this.Character.id = index;
    game.physics.enable(this.Character, Phaser.Physics.ARCADE);
    this.Character.body.immovable = false;
    this.Character.body.collideWorldBounds = true;
    this.Character.body.bounce.setTo(0, 0);

    this.Character.angle = 0;

    //game.physics.arcade.velocityFromRotation(this.Character.rotation, 0, this.Character.body.velocity);

};

Character.prototype.update = function() {
	
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
		if (this.Character.id == myId)
		{
			// send latest valid state to the server
			this.input.x = this.Character.x;
			this.input.y = this.Character.y;
			this.input.angle = this.Character.angle;
			
			
			eurecaServer.handleKeys(this.input);
			
		}
	}

	//cursor value is now updated by eurecaClient.exports.updateState method		
    if (this.cursor.left)
    {
        this.Character.animations.play('left');
		this.Character.body.velocity.x = -150;
    }
    else if (this.cursor.right)
    {
        this.Character.animations.play('right');
		this.Character.body.velocity.x = 150;
    }
	else
	{
		this.Character.body.velocity.x = 0;
		this.Character.animations.stop(null, true);
	}
    if (this.cursor.up)
    {
        this.Character.animations.play('up');
		this.Character.body.velocity.y = -150;
    }
    else if (this.cursor.down)
    {
        this.Character.animations.play('down');
		this.Character.body.velocity.y = 150;
    }
	else 
	{
		this.Character.body.velocity.y = 0;
		this.Character.animations.stop();
	}
};



Character.prototype.kill = function() {
	this.alive = false;
	this.Character.kill();
}