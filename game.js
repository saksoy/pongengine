var config = {
  FIELD_HEIGHT: 500,
  FIELD_WIDTH: 500,

  BALL_RADIUS: 5,

  PADDLE_HEIGHT: 80,
  PADDLE_WIDTH: 10,
  PADDLE_STEP: 20,
  ACCELORATOR: 10,
  ACCELORATE_PER_ROUND: 0.0001,

  TIME_QUANTUM: 10,
  INITIAL_BALL_SPEED: 2,
  WAIT_BEFORE_START: 1000,

  // these canstants determine, how many paddle moves are allowed in which
  // number of steps
  NUMBER_OF_PADDLE_MOVES: 10,
  NUMBER_OF_STEPS: 10,

  SCORE_TO_WIN: 10,
};

var STATUS_LOGIN = 'login';
var STATUS_READY = 'ready';
var STATUS_STARTED = 'started';
var STATUS_FINISHED = 'finished';

function random(value) {
  var direction = Math.random() < 0.5 ? -1 : 1;
  return direction * (Math.random() * value / 2 + value / 2);
}

// thanks stack overflow
// see http://stackoverflow.com/questions/1349404
function createSecret(length) {
    length = length || 5;
    var secret = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for(var i = 0; i < length; i++) {
        secret += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return secret;
}

var Game = function Game(customConfig) {
  this.ball = [config.FIELD_WIDTH / 2, config.FIELD_HEIGHT /2];
  this.ballDelta = [0, 0];
  this.paddleLeft = config.FIELD_HEIGHT / 2;
  this.paddleRight = config.FIELD_HEIGHT / 2;
  this.players = {'left': null, 'right': null};
  this.status = STATUS_LOGIN;
  this.autoStart = true;
  this.leftMoveCounter = 0;
  this.rightMoveCounter = 0;
  this.scoreLeft = 0;
  this.scoreRight = 0;
};

Game.prototype.resetBall = function resetBall() {
  this.ball = [config.FIELD_WIDTH / 2, config.FIELD_HEIGHT /2];
  this.ballDelta = [random(config.INITIAL_BALL_SPEED), random(config.INITIAL_BALL_SPEED)];
}

Game.prototype.start = function start() {
  this.status = STATUS_STARTED;
  this.resetBall();
  this.run();
  return this;
};

Game.prototype.checkWinner = function checkWinner() {
  if (this.scoreLeft >= config.SCORE_TO_WIN) {
    this.status = STATUS_FINISHED;
    this.winner = 'left';
  }
  if (this.scoreRight >= config.SCORE_TO_WIN) {
    this.status = STATUS_FINISHED;
    this.winner = 'right';
  }
}
Game.prototype.step = function step() {
  var allowedMovesPerStep; 
  if (this.ball[0] >= config.FIELD_WIDTH - config.BALL_RADIUS - config.PADDLE_WIDTH) {
    if (this.ball[1] > this.paddleRight - config.PADDLE_HEIGHT/2 &&
        this.ball[1] < this.paddleRight + config.PADDLE_HEIGHT/2)
    {
      this.ballDelta[0] *= -1;
      this.ballDelta[1] += (this.ball[1] - this.paddleRight) / config.ACCELORATOR;
    } else {
      this.resetBall();
      this.scoreLeft += 1;
      this.checkWinner();
      return this;
    }
  }
  if (this.ball[0] <= config.BALL_RADIUS + config.PADDLE_WIDTH) {
    if (this.ball[1] > this.paddleLeft - config.PADDLE_HEIGHT/2 &&
        this.ball[1] < this.paddleLeft + config.PADDLE_HEIGHT/2) 
    {
      this.ballDelta[0] *= -1;
      this.ballDelta[1] += (this.ball[1] - this.paddleLeft) / config.ACCELORATOR;
    } else {
      this.resetBall();
      this.scoreRight += 1;
      this.checkWinner();
      return this;
    }
  }

  if (this.ball[1] >= config.FIELD_HEIGHT - config.BALL_RADIUS || 
      this.ball[1] <= config.BALL_RADIUS) {
        this.ballDelta[1] *= -1;
      }
  this.ball[0] += this.ballDelta[0];
  this.ball[1] += this.ballDelta[1];
  this.ballDelta[0] *= 1 + config.ACCELORATE_PER_ROUND;
  this.ballDelta[1] *= 1 + config.ACCELORATE_PER_ROUND;

  allowedMovesPerStep = config.NUMBER_OF_PADDLE_MOVES/config.NUMBER_OF_STEPS
  this.leftMoveCounter = Math.max(this.leftMoveCounter - allowedMovesPerStep, 0);
  this.rightMoveCounter = Math.max(this.rightMoveCounter - allowedMovesPerStep, 0);
  return this;
}

Game.prototype.run = function run() {
  this.step();
  setTimeout(this.run.bind(this), config.TIME_QUANTUM);
  return this;
};

Game.prototype.loginPlayer = function loginPlayer(playername) {
  if (this.players.right) {
    throw Error('game full');
  }
  var player = {
    'name': playername,
    'secret': createSecret()
  };
  if (this.players.left) {
    this.players.right = player;
    if (this.autoStart) {
      this.status = STATUS_READY;
      setTimeout(this.start.bind(this), config.WAIT_BEFORE_START);
    }
  } else {
    this.players.left = player;
  }
  return player;
};

Game.prototype.moveDown = function moveDown(playername, secret) {
  this.move(playername, secret, config.PADDLE_STEP);
};

Game.prototype.moveUp = function moveUp(playername, secret) {
  this.move(playername, secret, -config.PADDLE_STEP);
};

Game.prototype.move = function move(playername, secret, distance) {
  if (this.players.left.name === playername && 
      this.players.left.secret === secret) {
        if (this.leftMoveCounter >= this.config.NUMBER_OF_PADDLE_MOVES) {
          throw Error('too many moves');
        }
        this.paddleLeft += distance;
        this.leftMoveCounter += 1;
        return;
      }
  if (this.players.right.name === playername &&
      this.players.right.secret === secret) {
        if (this.rightMoveCounter >= this.config.NUMBER_OF_PADDLE_MOVES) {
          throw Error('too many moves');
        }
        this.paddleRight += distance;
        this.rightMoveCounter += 1;
        return;
      }
  throw Error('not your game');
};

Game.prototype.getStatus = function getStatus() {
  return {
    'ball': this.ball,
    'ballDelta': this.ballDelta,
    'paddleLeft': this.paddleLeft,
    'paddleRight': this.paddleRight,
    'players': {
      'left': this.players.left ? this.players.left.name : null,
      'right': this.players.right ? this.players.right.name : null,
    },
    'status': this.status,
    'autoStart': this.autoStart,
    'leftMoveCounter': this.leftMoveCounter,
    'rightMoveCounter': this.rightMoveCounter,
    'scoreLeft': this.scoreLeft,
    'scoreRight': this.scoreRight,
  }
}

Game.prototype.config = config;

module.exports = Game;
