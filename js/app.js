// Enemies Class (player must avoid)
class Enemy {
	constructor(row = getRandomInt(4), side = getRandomInt(2), speed = getRandomInt(100)) {
		// Limit only to 2 bugs per row after lvl 5  3 per row
		while((game.level <= 5 && game.enemyRows[row] >= 2) ||
			(game.level > 5 && game.enemyRows[row] >= 3) ) {
			row = getRandomInt(4);
		}

		// Enemy movment
		this.y = (row * 83) + 62; // row 62 + row * 83
		this.leftSpawn = side === 1? true: false;
		this.leftSpawn ? this.x = -90: this.x = 500;
		this.speed = 100 + speed;

		// managment variables
		this.row = row;
		game.enemyRows[row]++;
		// The image/sprite for our enemies, based on enemy orijentation
		this.sprite = this.leftSpawn ? 'images/enemy-bug.png': 'images/enemy-bug-left.png';
	}

	// Update the enemy's position and checks colision
	update(dt) {
		// handle enemy moving and despawn
		if (this.leftSpawn) {
			if(this.x < 500)
				this.x += this.speed * dt;
			else {
				game.enemyRows[this.row]--;
				allEnemies.splice(allEnemies.indexOf(this), 1);
			}
		} else {
			if(this.x > -100)
				this.x -= this.speed * dt;
			else {
				game.enemyRows[this.row]--;
				allEnemies.splice(allEnemies.indexOf(this), 1);
			}
		}
		// check colision with player
		game.checkPlayerColision(this.x, this.y);
	}

	// Draw the enemy on the screen
	render() {
		ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
	}
}

// Player Class
class Player {
	constructor() {
		// player relative states in game
		this.ready = false;
		this.alive = true;

		this.x = 202;
		this.y = 380;
		this.swiming = false;
		this.inWater = 0; // timer

		this.sprite = 'images/char-boy.png';
		this.setSkin(Number(localStorage.skin));
	}

	update() {
	}

	// Draw player on screen
	render() {
		ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
	}

	// check if player wanted skin is unlocked and select it.
	setSkin(skin) {
		if(Number(localStorage.unlocks) >= skin) localStorage.skin = skin.toString();
		switch (skin) {
			case 0:
				if(Number(localStorage.unlocks) >= 3) this.sprite = 'images/char-horn-girl.png';
				break;
			case 1:
				if(Number(localStorage.unlocks) >= 1) this.sprite = 'images/char-cat-girl.png';
				break;
			case 3:
				if(Number(localStorage.unlocks) >= 2) this.sprite = 'images/char-pink-girl.png';
				break;
			case 4:
				if(Number(localStorage.unlocks) === 4) this.sprite = 'images/char-princess-girl.png';
				break;
			default:
				this.sprite = 'images/char-boy.png';
		}
	}

	//player input fuction
	handleInput(key) {
		if (key != undefined ) {
			if(this.alive && !game.gameWin) {
				// handle moving
				if(key === "up" && this.y > 0 && this.ready) this.y -= 83;
				else if (key === "down" && this.y < 380) this.y += 83;
				else if (key === "left" && this.x > 0) this.x -= 101;
				else if (key === "right" && this.x < 400) this.x += 101;

				// remove pause when is active
				if(!this.ready && key === "space") this.ready = true;

				// selecting characters
				if (!this.ready && key === "down") this.setSkin(this.x / 101);

				//pickup handler
				game.checkPlayerPickup(this.x, this.y);
				// managing player water behavior
				this.inWater = 0;
				if(this.y === -35) this.swiming = true;
				else  this.swiming = false;
			} else if(!game.gameWin) {
				if(key === "space" && !game.gameOver) player.respawn();
				else if(key === "space" && game.gameOver) game.restartGame();
			} else if(key === "space" && game.gameWin) game.nextLevel();
		}
	}

	// respawn player in game
	respawn() {
		this.x = 202;
		this.y = 380;
		this.alive = true;
		this.swiming = false;
	}
}

// Game class
class Game {
	constructor() {
		// use to count number of enemys inside a row
		this.enemyRows = [0, 0, 0, 0];
		// game state
		this.gameOver = false;
		this.gameWin = false;
		// pickups state
		this.activeObject = false;
		this.lifePickup = false;
		this.endObj = false;
		this.objective = 0;
		this.objSprite = "images/Gem Green.png";
		this.setReward();
		// player meta
		this.life = 3;
		this.level = 1;
		this.score = 0;
		this.delay = 0;
	}

	update(dt) {
		/* Enemy and spawn object handler
		. checking enemys number and if is needed spawn one
		. if enemy cannot be sapwn check if there is any game objective if is not spawn one */
		const enemys = allEnemies.length;
		if(this.delay >= 100){
			if(player.ready && enemys < (3 + this.level) && !this.gameWin) allEnemies.push(new Enemy());
			else if (!player.ready  && enemys < 3 && !this.gameWin ) allEnemies.push(new Enemy(getRandomInt(3)));
			else if (!this.activeObject && player.ready && !this.gameWin) this.spawnObj(this.objective);
			this.delay -= 100;
		} else if(this.level > 5) this.delay += dt * 300;
		else this.delay += dt * 200;

		// player swiming handler
		if(player.swiming && !this.gameWin){
			player.inWater += dt;
			if(player.inWater > 0.5) player.respawn();
		}
	}

	render() {
		// game - Health Level Score UI
		if(!game.gameWin) {
			this.drawnText("Life:",20,45,"black",25);
			this.drawnText("Level: " + this.level,200,45,"black",25);
			this.drawnText("Score: " + this.score,375,45,"black",25);

			if(this.life >= 1) ctx.drawImage(Resources.get("images/Heart.png"), 70, 10, 30,47);
			if(this.life >= 2) ctx.drawImage(Resources.get("images/Heart.png"), 100, 10, 30,47);
			if(this.life === 3) ctx.drawImage(Resources.get("images/Heart.png"), 130, 10, 30,47);
			if(this.life > 3) this.life = 0;
		}

		if(this.endObj) ctx.drawImage(Resources.get("images/Selector.png"), this.objx, this.objy - 40);
		if(this.activeObject) ctx.drawImage(Resources.get(this.objSprite), this.objx + 25, this.objy + 35, 50,79);
	}

	// show level pass tect on screen
	renderWin() {
		this.drawnText("Level " + this.level + " passed!",95,190);
		this.drawnText("Bonus:",40,270);
		this.drawnText("+1 on collectibles",90,350);
		if(localStorage.unlocks != "4") {
			this.drawnText("New character: ",90,440);
			ctx.drawImage(Resources.get(this.rewardSptite), 390, 311);
		}
		this.drawnText("Press \"space\" for next!",25,520);
	}

	// show information on game score after losing all lives
	renderOver() {
		this.drawnText("GAME OVER",115,110,"black");
		this.drawnText("Press \"space\" to restart!",15,520);

		if(this.score >= (Number(localStorage.topScore))) {
			this.drawnText("NEW HIGH SCORE!",50,190);
			localStorage.topScore = this.score.toString();
		} else this.drawnText(`Top High Score: ${localStorage.topScore}`,60,190);

		this.drawnText(`Your Score: ${this.score}`,100,270);


	}

	// show text when player got hit from bug
	renderHit() {
		this.drawnText("Something hit you!",65,85,"red");
		this.drawnText("You lost one!",90,130);
		ctx.drawImage(Resources.get("images/Heart.png"), 360, 70, 50,79);
		this.drawnText("Press \"space\" to retry!",40,520);
	}

	// diplay game tutorial and character selector
	renderMenu() {
		this.drawnText("Collect:",40,110);
		ctx.drawImage(Resources.get("images/Gem Green.png"), 227, 40, 50, 79);
		ctx.drawImage(Resources.get("images/Gem Orange.png"), 328, 40, 50, 79);
		ctx.drawImage(Resources.get("images/Gem Blue.png"), 429, 40, 50, 79);
		this.drawnText("To get",40,190);
		ctx.drawImage(Resources.get("images/Key.png"), 155, 60);
		this.drawnText("for end",250,190);
		ctx.drawImage(Resources.get("images/Star.png"), 404, 60);
		if(localStorage.unlocks != "4") {
			this.drawnText("and get new ",100,270);
			ctx.drawImage(Resources.get(this.rewardSptite), 339, 143);
		}
		this.drawnText("Move with arrow keys.",40,350);
		this.drawnText("Don't get hit by",40,440, "red");
		ctx.drawImage(Resources.get("images/enemy-bug.png"), 355, 311);
		this.drawnText("Press \"space\" to start!",40,520);

		// diplay selectable characters
		ctx.drawImage(Resources.get("images/char-horn-girl.png"), 20, 521, 60, 95);
		ctx.drawImage(Resources.get("images/char-cat-girl.png"), 121, 521, 60, 95);
		ctx.drawImage(Resources.get("images/char-boy.png"), 222, 521, 60, 95);
		ctx.drawImage(Resources.get("images/char-pink-girl.png"), 323, 521, 60, 95);
		ctx.drawImage(Resources.get("images/char-princess-girl.png"), 424, 521, 60, 95);

		switch (localStorage.unlocks) {
			case "0": ctx.drawImage(Resources.get("images/Rock.png"), 111, 501, 80, 110);
			case "1": ctx.drawImage(Resources.get("images/Rock.png"), 313, 501, 80, 110);
			case "2": ctx.drawImage(Resources.get("images/Rock.png"), 10, 501, 80, 110);
			case "3": ctx.drawImage(Resources.get("images/Rock.png"), 414, 501, 80, 110);
			case "4": break;
			default: console.log("ERROR with local storage  maximum number 4");
		}
	}

	// drawn text with black outline
	drawnText(text = "-*NoTEXT*-", x = 0, y = 0, color = "white", size = 45, font = "Arial") {
		// set text overlay
		ctx.font = `${size}px ${font}`;
		ctx.fillStyle = color;
		ctx.fillText(text, x, y);

		ctx.fillStyle = "black";
		ctx.strokeText(text, x, y);
	}

	setReward() {
		switch (localStorage.unlocks) {
			case "0":
				this.rewardSptite = "images/char-cat-girl.png";
				break;
			case "1":
				this.rewardSptite = "images/char-pink-girl.png";
				break;
			case "2":
				this.rewardSptite = "images/char-horn-girl.png";
				break;
			case "3":
				this.rewardSptite = "images/char-princess-girl.png";
				break;
			case "4":
				this.rewardSptite = "images/char-boy.png";
				break;
			default:
				console.log("SetReward error:", localStorage.unlocks);
				this.rewardSptite = "images/char-boy.png";
		}
	}

	/* Spawn game pickups
	. spawn game objective based on game state
	. if player is damaged there is chance to get health pickup
 	. manage minimun one block space betwen pickup and a player*/
	spawnObj(objective, row = getRandomInt(3), column = getRandomInt(5)) {
		if(objective === 0) row = getRandomInt(2);
		if(objective === 0) this.objSprite = "images/Gem Green.png";
		else if (objective === 1) this.objSprite = "images/Gem Orange.png";
		else if (objective === 2) this.objSprite = "images/Gem Blue.png";
		// console.log("Obj: " + objective + " row: " + row + " column: " + column);
		this.objy = 83 + 83 * row;
		this.objx = 101 * column;

		if (objective === 3) {
			this.objSprite = "images/Key.png";
		// decide if health pickup will spawn
		} else if((this.life != 3 && getRandomInt(4) > this.life  && getRandomInt(2) > 0 && objective != 4) ||
				(player.swiming && objective === 4 && this.life != 3)) {
			this.lifePickup = true;
		} else if (objective === 4) {
			this.objSprite = "images/Star.png";
			this.objy = 0;
			this.endObj = true;
		}

		// check distance betwen player and pickup  and corect if is needed
		while (!((this.objx != player.x && this.objx != player.x + 101 && this.objx != player.x -101 ) ||
			((this.objy - 35) != player.y && (this.objy - 35) != player.y + 83 && (this.objy - 35) != player.y - 83 ) )) {

			if(objective != 4) this.objy = 83 + 83 * getRandomInt(3);
			this.objx = 101 *  getRandomInt(5);
		}

		if(this.lifePickup) this.objSprite = "images/Heart.png";
		this.activeObject = true;
	}

	nextLevel() {
		this.objective = 0;
		this.endObj = false;
		player.respawn();
		this.level++;
		this.gameWin = false;
		if(localStorage.unlocks != "4") localStorage.unlocks = ((Number(localStorage.unlocks) + 1).toString());
		this.setReward();
	}

	// set game state to beggining
	restartGame() {
		this.gameOver = false;
		player.respawn();
		this.objective = 0;
		this.lifePickup = false;
		this.endObj = false;
		this.life = 3;
		this.level = 1;
		this.score = 0;
		player.ready = false;
		this.activeObject = false;
		this.setReward();
	}

	// check if payer pickuped a pickup
	checkPlayerPickup(x, y)	{
		if(this.objx === x && this.objy - 35 === y) {
			if(this.lifePickup){
				this.lifePickup = false;
				this.life++;
			} else this.objective++;
			this.score += this.level;
			this.activeObject = false;
			if(this.objective === 5) this.gameWin = true;
		}
	}

	// check if player and enemy got in touch
	checkPlayerColision(x, y) {
		if(player.y === y - 14) {
			const plx = player.x + 35;
			if ((x <= plx && plx <= (x + 100)) || (x <= (plx + 30) && (plx + 30) <= (x + 100))) { //
				if(this.life === 0) this.gameOver = true;
				else this.life--;
				player.alive = false;
				this.activeObject = false;
			}
		}
	}
}

// local storage
if (typeof(Storage) !== "undefined") {
	//set defaults
	if (!localStorage.topScore) localStorage.topScore = "0";
	if (!localStorage.unlocks) localStorage.unlocks = "0";
	if (!localStorage.skin) localStorage.skin = "0";
} else {
	// emulate local storage
	this.localStorage = {
		topScore: "0",
		unlocks: "0",
		skin: "0"
	}
}

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player

var allEnemies = [];
var player = new Player();
var game = new Game();

// This listens for key presses and sends the keys to your player class
document.addEventListener('keydown', function(e) {
	var allowedKeys = {
		32: 'space',
		37: 'left',
		38: 'up',
		39: 'right',
		40: 'down',
		// WASD gamer style controlling a Player
		65: 'left',
		87: 'up',
		68: 'right',
		83: 'down'
	};

	player.handleInput(allowedKeys[e.keyCode]);
});

// Generate random Integer
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(max) {
	return Math.floor(Math.random(new Date().getTime()) * Math.floor(max));
}
