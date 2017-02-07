var canvas = document.getElementById("myCanvas");
canvas.width = 600;
canvas.height = 600;
var grid = new Grid(canvas);
canvas.addEventListener('click',onClick);
var context = canvas.getContext("2d");
var fpsTracker = new FpsTracker();

setUp();

function setUp(){
  tick();
  // fpsTracker.printFPS(1000);
}

window.onkeydown = keyDown;
window.onkeyup = keyUp;

var keys = {};
function keyDown(e){
  if(!keys[e.keyCode]){
      handleSingleClicks(e);
  }
  keys[e.keyCode] = true;
}
function keyUp(e){
  keys[e.keyCode] = false
}
function handleSingleClicks(e){
  if(e.keyCode == 13)
    startPathFinding();
}

function startPathFinding(){
  grid.clearPath();
  grid.draw(context);
  console.log("Starting Path Finding Algorithm");
  var shortColor = "yellow";
  var longColor = "orange";

  var start = new Vector(0,0);
  var end = new Vector(29,29);
  var current = new Vector(0,0);


  var fails = 0;
  calcNextMove(current,0);

  function calcNextMove(curr, move){
    //console.log(curr.x, curr.y);
    grid.array[curr.x][curr.y].path = true;

    if(curr.equals(end)){
      console.log("complete");
      return 100;
    }
    let moves = [];
    for(var i = -1; i < 2; i++){
      for(var j = -1; j < 2; j++){
        if(!(i == 0 && j==0)){
        var v = new Vector(curr.x+i, curr.y+j);
        moves.push({x: i, y: j, open: testLocation(v.x,v.y), score: v.subtract(end).length});
        }
      }
    }
    moves = moves.filter(function(a){
      return a.open != 0 && !a.deadend;
    });
    var m = moves.filter(function(a){
      return a.open == 2;
    });
    if(m.length == 0){
      return 50;
    }
    moves = moves.sort(function(a,b){
      return b.open-a.open || a.score-b.score;
    });
    console.log(curr.x, curr.y, moves)

    function testLocation(x, y){
      if( x < 0 || x > grid.array.length-1 || y < 0 || y > grid.array[0].length-1){
        return 0;
      } else {
        var unit = grid.array[x][y];
        if(unit.blocked || unit.deadend){
          return 0;
        }
        if(unit.path)
          return 1;
        unit.tested = true;
          return 2;
      }
    }
        for(var i = 0; i < moves.length; i++){
          var tmp = curr.add(moves[i].x, moves[i].y);
          var code = calcNextMove(tmp);
          if(code == 100){
            console.log("completed");
            return 100;
          } else if(code == 50){
            console.log("dead end");
            grid.array[curr.x][curr.y].deadend = true;
          }
          console.log('i',i)
        }

  }

}

function Vector(x,y){
  this.typeof = "Vector";
  this.x = x;
  this.y = y;

  this.add = function(v, y){
    if(v.typeof == "Vector"){
      return new Vector(
        this.x + v.x,
        this.y + v.y
      );
    } else {
      return new Vector(
        this.x + (v ? v : 0),
        this.y + (y ? y : 0)
      );
    }
  }

  this.subtract = function(v, y){
    var z;
    if(v.typeof == "Vector"){
      z = new Vector(
         v.x - this.x,
         v.y - this.y);
    } else {
      var z = new Vector(
          v - this.x ,
          y - this.y
      );
    }
            return z;
  }

  this.calcDeg = function(v){
    if(v && v.typeof == "Vector")
      return  180 * Math.acos((v.x-this.x)/this.hyp(v)) / Math.PI;
    return 180 * Math.acos(this.x/this.hyp()) / Math.PI;
  };

  this.hyp = function(v){
    if(v && v.typeof == "Vector")
      return  Math.sqrt(Math.pow(v.x-this.x,2) + Math.pow(v.y-this.y,2))
    return  Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2))
  }

  this.distance = function(v){
    if(v && v.typeof == "Vector"){
      var d = Math.sqrt(Math.pow((v.x - this.x),2) + Math.pow((v.y - this.y),2));
      return d;
    }
  }

  this.equals = function(v){
    return v.x == this.x && v.y == this.y;
  }

  this.calcUnitVector = function(v){
      if(v && v.typeof == "Vector"){
        var tmp = new Vector(v.x-this.x, v.x-this.y);
        return tmp;
      }
      return {x:this.x/this.length, y: this.y/this.length};
  }

  this.rotate = function(deg){
    function degToRad(deg){
      return (deg/180) * Math.PI;
    }
    var v = new Vector(
      Math.cos(degToRad(this.deg + deg)),
      Math.sin(degToRad(this.deg + deg))
    );
    return v;
  }

  this.length = this.hyp();
  this.deg = this.calcDeg();
  this.unitVector = this.calcUnitVector();
}

function drawScene(){
  context.clearRect(0,0,canvas.width, canvas.height);
  grid.draw(context);
}

function tick(){
  var elapsed = 0;
  requestAnimationFrame(function(timestamp){
      elapsed = fpsTracker.updateFrame(timestamp);

      tick();
  });
  drawScene();

}



//gridboard
function Grid(canvas){
  this.scale = 20;
  this.width = canvas.width/this.scale;
  this.height = canvas.height/this.scale;
  this.array = new Array(this.width);
  for(var i = 0; i < this.width; i++){
    this.array[i] = new Array(this.height);
  }
  for(var i = 0; i < this.width; i++){
    for(var j = 0; j < this.height; j++){
      this.array[i][j] = {
        blocked: false,
        start: false,
        end: false,
        path:false,
        tested:false
      };
    }
  }
  this.array[0][0].start = true;
  this.array[29][29].end = true;

  this.draw = function(context){
    for(var i = 0; i < this.width; i++){
      for(var j = 0; j < this.height; j++){
        var unit = this.array[i][j];
        if(unit.blocked){
          context.fillStyle="black";
          context.fillRect(i*this.scale, j*this.scale, this.scale, this.scale);
        } else if(unit.start){
          context.fillStyle="red";
          context.fillRect(i*this.scale, j*this.scale, this.scale, this.scale);
        }else if(unit.end){
          context.fillStyle="green";
          context.fillRect(i*this.scale, j*this.scale, this.scale, this.scale);
        }else if(unit.deadend){
          context.fillStyle="orange";
          context.fillRect(i*this.scale, j*this.scale, this.scale, this.scale);
        } else if(unit.path){
          context.fillStyle="blue";
          context.fillRect(i*this.scale, j*this.scale, this.scale, this.scale);
        } else if(unit.tested){
          context.fillStyle="yellow";
          context.fillRect(i*this.scale, j*this.scale, this.scale, this.scale);
        } else {
          context.fillStyle="black";
          context.strokeRect(i*this.scale, j*this.scale, this.scale, this.scale);
        }
      }
    }
  }

  this.handleClick = function(pos){
    if(!this.array[pos.x][pos.y].start && !this.array[pos.x][pos.y].end )
      this.array[pos.x][pos.y].blocked = !this.array[pos.x][pos.y].blocked;
  }

  this.clearPath = function(){
      for(var i = 0; i < this.width; i++){
        for(var j = 0; j < this.height; j++){
            this.array[i][j].tested = false;
            this.array[i][j].path = false;
        }
      }
  }
}

//pointer handler
function onClick(e){
  var x = parseInt((e.offsetX/canvas.width) * (canvas.width/grid.scale));
  var y = parseInt((e.offsetY/canvas.height) * (canvas.height/grid.scale));
  console.log("xpos=%d ypos=%d",x, y);
  grid.handleClick({x,y});
}


//**************************** FPS Tracker
function FpsTracker(){
  this.idx = 0;
  this.frames = [10];
  this.printToConsole = false;
  this.avgFPS = 0;
  this.interval;
  this.prev = 0;
  this.elapsed = 0;


  this.updateFrame = function(timestamp){
    this.elapsed = timestamp - this.prev;
    this.prev = timestamp;
    this.frames[this.idx] = 1000/this.elapsed;
    this.idx++;
    if(this.idx == 10){
      this.idx = 0;
    }
    var fps = 0;
    this.frames.forEach(function(val, i){
        fps += val;
    });

    this.avgFPS = (fps) / (this.frames.length);
    return this.elapsed;
  }

  this.printFPS = function(wait){
    var logFPS = function(){
      console.log('FPS: ' + parseInt(this.avgFPS));
    }
    this.interval = setInterval(logFPS.bind(this), wait);
  }
  this.stopFPS = function(){
    clearInterval(this.interval);
    this.interval = 0;
  }
}
