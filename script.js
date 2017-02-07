//get reference to the canvas from index.html
var canvas = document.getElementById("myCanvas");

var s = document.querySelector("#status");

//set up cnvas
canvas.width = 600;
canvas.height = 600;
//listen for events
canvas.addEventListener('click', onClick);
//get reference to canvas context which is required to draw
var context = canvas.getContext("2d");

//set up my grid
var grid = new Grid(canvas);

//start up the frame rate tracker
var fpsTracker = new FpsTracker();

setUp();
//start having the browser calling for refresh as required
function setUp() {
    tick();
}

//handle key presses
window.onkeydown = keyDown;
window.onkeyup = keyUp;
var keys = {};
function keyDown(e) {
    if (!keys[e.keyCode]) {
        handleSingleClicks(e);
    }
    keys[e.keyCode] = true;
}
function keyUp(e) {
    keys[e.keyCode] = false
}
function handleSingleClicks(e) {
    if (e.keyCode == 13)
        startPathFinding();
}


//this is where all thr work happens.
function startPathFinding() {
    s.innerHTML = "Status: waiting to get started...;"
    grid.clearPath();
    drawScene();
    console.log("Starting Path Finding Algorithm");

    var end = new Vector(29, 29);
    var current = new Vector(0, 0);

    if(calcNextMove(current) == 100){
      console.log("completed");
      s.innerHTML = "Path found!"
    } else {
      console.log("cannot complete");
      s.innerHTML = "I give up, you win."
    }

    //calcNextMove is a recursive function that takes one parameter, the new location to be tested
    function calcNextMove(curr) {
        //record that we have tried this location
        grid.array[curr.x][curr.y].path = true;
        grid.draw(context);

        //check for completion and exit recursion
        if (curr.equals(end)) {
            return 100;
        }

        //store all possible moves from this location in an array
        //We want to rank each move here to get an idea of which move is best
        let moves = [];
        for (var i = -1; i < 2; i++) {
            for (var j = -1; j < 2; j++) {
                if (!(i == 0 && j == 0)) {
                    var v = new Vector(curr.x + i, curr.y + j);
                    moves.push({
                        x: i,
                        y: j,
                        open: testLocation(v.x, v.y), //is the location blocked or already tested?
                        score: v.subtract(end).length //whats the distance from the end? we want to move forward as much as possible
                    });
                }
            }
        }

        //filter out any dead ends
        moves = moves.filter(function(a) {
            return a.open != 0 && !a.deadend;
        });
        //filter for tiles that have had all location visited before
        var m = moves.filter(function(a) {
            return a.open == 2;
        });
        //if all location have been visited, this is a dead end, exit recursion
        if (m.length == 0) {
            return 50;
        }
        //sort moves to prefer going towards target and not backtracking
        moves = moves.sort(function(a, b) {
            return b.open - a.open || a.score - b.score;
        });

        //just a helper funttion to make sure the array isnt out of bounds and not blocked
        function testLocation(x, y) {
            if (x < 0 || x > grid.array.length - 1 || y < 0 || y > grid.array[0].length - 1) {
                return 0;
            } else {
                var unit = grid.array[x][y];
                if (unit.blocked || unit.deadend) {
                    return 0;
                }
                if (unit.path)
                    return 1;
                unit.tested = true;
                return 2;
            }
        }

        //this is where we enter recursion
        for (var i = 0; i < moves.length; i++) {
            //new temp location passed into same function
            var tmp = curr.add(moves[i].x, moves[i].y);
            //return 100 if complete, 50 i dead end
            var code = calcNextMove(tmp);
            //gtfo, we're done
            if (code == 100) {
                return 100;
            } else if (code == 50) {
                console.log("dead end"); //jeesus, dead end, gtfo
                grid.array[curr.x][curr.y].deadend = true;
            }
        }
    }
}

//A vector class that I created to handle vector math... good for dealing with unit vectors etc
//loads of trigonomety.
//Not really required for the final way that i solved the problem.

function Vector(x, y) {
    this.typeof = "Vector";
    this.x = x;
    this.y = y;

    this.add = function(v, y) {
        if (v.typeof == "Vector") {
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

    this.subtract = function(v, y) {
        var z;
        if (v.typeof == "Vector") {
            z = new Vector(
                v.x - this.x,
                v.y - this.y);
        } else {
            var z = new Vector(
                v - this.x,
                y - this.y
            );
        }
        return z;
    }

    this.calcDeg = function(v) {
        if (v && v.typeof == "Vector")
            return 180 * Math.acos((v.x - this.x) / this.hyp(v)) / Math.PI;
        return 180 * Math.acos(this.x / this.hyp()) / Math.PI;
    };

    this.hyp = function(v) {
        if (v && v.typeof == "Vector")
            return Math.sqrt(Math.pow(v.x - this.x, 2) + Math.pow(v.y - this.y, 2))
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2))
    }

    this.distance = function(v) {
        if (v && v.typeof == "Vector") {
            var d = Math.sqrt(Math.pow((v.x - this.x), 2) + Math.pow((v.y - this.y), 2));
            return d;
        }
    }

    this.equals = function(v) {
        return v.x == this.x && v.y == this.y;
    }

    this.calcUnitVector = function(v) {
        if (v && v.typeof == "Vector") {
            var tmp = new Vector(v.x - this.x, v.x - this.y);
            return tmp;
        }
        return {
            x: this.x / this.length,
            y: this.y / this.length
        };
    }

    this.rotate = function(deg) {
        function degToRad(deg) {
            return (deg / 180) * Math.PI;
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

function drawScene() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    grid.draw(context);
}

function tick() {
    var elapsed = 0;
    requestAnimationFrame(function(timestamp) {
        elapsed = fpsTracker.updateFrame(timestamp);
        tick();
    });
    drawScene();
}



//gridboard class
//this draws the board each frame and holds the data
function Grid(canvas) {
    this.scale = 20;
    this.width = canvas.width / this.scale;
    this.height = canvas.height / this.scale;
    this.array = new Array(this.width);
    for (var i = 0; i < this.width; i++) {
        this.array[i] = new Array(this.height);
    }
    for (var i = 0; i < this.width; i++) {
        for (var j = 0; j < this.height; j++) {
            this.array[i][j] = {
                blocked: false,
                start: false,
                end: false,
                path: false,
                tested: false
            };
        }
    }
    this.array[0][0].start = true;
    this.array[29][29].end = true;

    this.draw = function(context) {
        for (var i = 0; i < this.width; i++) {
            for (var j = 0; j < this.height; j++) {
                var unit = this.array[i][j];
                if (unit.blocked) {
                    context.fillStyle = "black";
                    context.fillRect(i * this.scale, j * this.scale, this.scale, this.scale);
                } else if (unit.start) {
                    context.fillStyle = "red";
                    context.fillRect(i * this.scale, j * this.scale, this.scale, this.scale);
                } else if (unit.end) {
                    context.fillStyle = "green";
                    context.fillRect(i * this.scale, j * this.scale, this.scale, this.scale);
                } else if (unit.deadend) {
                    context.fillStyle = "orange";
                    context.fillRect(i * this.scale, j * this.scale, this.scale, this.scale);
                } else if (unit.path) {
                    context.fillStyle = "blue";
                    context.fillRect(i * this.scale, j * this.scale, this.scale, this.scale);
                } else if (unit.tested) {
                    context.fillStyle = "yellow";
                    context.fillRect(i * this.scale, j * this.scale, this.scale, this.scale);
                } else {
                    context.fillStyle = "black";
                    context.strokeRect(i * this.scale, j * this.scale, this.scale, this.scale);
                }
            }
        }
    }

    this.handleClick = function(pos) {
        if (!this.array[pos.x][pos.y].start && !this.array[pos.x][pos.y].end)
            this.array[pos.x][pos.y].blocked = !this.array[pos.x][pos.y].blocked;
            s.innerHTML = "Waiting to start...";
    }

    this.clearPath = function() {
        for (var i = 0; i < this.width; i++) {
            for (var j = 0; j < this.height; j++) {
                this.array[i][j].tested = false;
                this.array[i][j].path = false;
                this.array[i][j].deadend = false;
            }
        }
    }
}

//pointer handler
//simple clock handler to modify the board data when the user clicks
function onClick(e) {
    var x = parseInt((e.offsetX / canvas.width) * (canvas.width / grid.scale));
    var y = parseInt((e.offsetY / canvas.height) * (canvas.height / grid.scale));
    console.log("xpos=%d ypos=%d", x, y);
    grid.handleClick({
        x,
        y
    });
}


//**************************** FPS Tracker
//didnt really use this, may use it in future
function FpsTracker() {
    this.idx = 0;
    this.frames = [10];
    this.printToConsole = false;
    this.avgFPS = 0;
    this.interval;
    this.prev = 0;
    this.elapsed = 0;


    this.updateFrame = function(timestamp) {
        this.elapsed = timestamp - this.prev;
        this.prev = timestamp;
        this.frames[this.idx] = 1000 / this.elapsed;
        this.idx++;
        if (this.idx == 10) {
            this.idx = 0;
        }
        var fps = 0;
        this.frames.forEach(function(val, i) {
            fps += val;
        });

        this.avgFPS = (fps) / (this.frames.length);
        return this.elapsed;
    }

    this.printFPS = function(wait) {
        var logFPS = function() {
            console.log('FPS: ' + parseInt(this.avgFPS));
        }
        this.interval = setInterval(logFPS.bind(this), wait);
    }
    this.stopFPS = function() {
        clearInterval(this.interval);
        this.interval = 0;
    }
}
