// Inits
window.onload = function init() {
    var game = new GF();
    game.start();
};


// GAME FRAMEWORK STARTS HERE
var GF = function () {
    // Vars relative to the canvas
    var canvas, ctx, winW, winH;

    var playerImage;
    var ennemiImage;
    // vars for counting frames/s, used by the measureFPS function
    var frameCount = 0;
    var lastTime;
    var fpsContainer;
    var fps;
    // for time based animation
    var delta, oldTime = 0;

    // vars for handling inputs
    var inputStates = {};

    // game states
    var gameStates = {
        mainMenu: 0,
        gameRunning: 1,
        gameOver: 2
    };
    var currentGameState = gameStates.gameRunning;
    var currentLevel = 1;
    var TIME_BETWEEN_LEVELS = 0;
    var currentLevelTime = TIME_BETWEEN_LEVELS;

    var player = {
        dead: false,
        x: 10,
        y: 10,
        width: 50,
        height: 50,
        speed: 100
    };

    //lasers
    var laserTotal = 2, lasers = [];

    // Ennemis
    var totalEnnemis = 5;
    var ennemis = [];

    // We want the object to move at speed pixels/s (there are 60 frames in a second)
    // If we are really running at 60 frames/s, the delay between frames should be 1/60
    // = 16.66 ms, so the number of pixels to move = (speed * del)/1000. If the delay is twice
    // longer, the formula works : let's move the rectangle twice longer!
    var calcDistanceToMove = function (delta, speed) {
        //console.log("#delta = " + delta + " speed = " + speed);
        return (speed * delta) / 1000;
    };

    // Player logic
    function movePlayer(x, y) {
        // draw a big player !
        // save the context
        ctx.save();

        ctx.drawImage(playerImage,x,y,winW / 10, winH / 10);

        // restore the context
        ctx.restore();
    }

    function updatePlayerPosition(delta) {
        player.speedX = 0;
        player.speedY = 0;
        // check inputStates
        if (inputStates.left) {
            player.speedX = -player.speed;
        }
        else if (inputStates.right) {
            player.speedX = player.speed;
        }
        if (inputStates.down) {
            player.speedY = player.speed;
        }
        else if (inputStates.up) {
            player.speedY = -player.speed;
        }
        if (inputStates.space && lasers.length <= laserTotal) {
            lasers.push(new Laser(player.x + 25, player.y - 20));
        }
        /*if (inputStates.mousePos) {
        }
        if (inputStates.mousedown) {
        player.speed = 500;
        } else {
        // mouse up
        player.speed = 100;
        }*/

        // collision avec obstacles
        /*for(var i=0; i < obstacles.length; i++) {
         var o = obstacles[i];
         if(rectsOverlap(o.x, o.y, o.winW, o.winH,
         player.x, player.y, player.width, player.height)) {
         console.log("collision");
         //player.x = 10;
         //player.y = 10;
         player.speed = 30;
         }
         }*/
        // Compute the incX and inY in pixels depending
        // on the time elasped since last redraw
        player.x += calcDistanceToMove(delta, player.speedX);
        player.y += calcDistanceToMove(delta, player.speedY);

        //Empeche le joueur de sortir de l'écran
        if(player.x < 0)
        {
            player.x = 0;
        }
        if(player.x > ( winW - player.width))
        {
            player.x = winW - player.width;
        }
        if(player.y < 0)
        {
            player.y =0;
        }
        if((player.y + player.height) > winH)
        {
            player.y = winH - player.height;
        }
    }

    //Lasers logique
    function Laser(x,y) {
        this.x = x;
        this.y = y;
        this.w = 4;
        this.h = 20;
        this.speed = 10;

        this.draw = function() {
            ctx.fillStyle = '#f00';
            ctx.fillRect(this.x,this.y,this.w,this.h);
        };

        this.move = function (delta, laserIndex) {
            if(this.y > -11) {
                this.y -= this.speed;
            }
            else if (this.y < -10) {
                lasers.splice(laserIndex, 1);
            }
        };

        this.hitTest = function (laserIndex){
            for(var i = 0; i < ennemis.length; i++) {
                ennemi = ennemis[i];
                if(
                    this.y <= (ennemi.y + ennemi.h) &&//Check hauteur
                    this.y >= ennemi.y &&
                    this.x >= ennemi.x &&
                    this.x <= (ennemi.x + ennemi.w) &&
                    this.y ) {
                    console.log("touché "+ennemi.x+" / "+ennemi.y+" / "+this.x+" / "+this.y);
                    lasers.splice(laserIndex, 1);
                    ennemis.splice(i,1);
                }

            }
        };
    }

    function updateLasers(delta) {
        for (var i =0; i < lasers.length; i++) {
            var laser = lasers[i];
            laser.move(delta,i);
            laser.hitTest(i);
            laser.draw();
        }
    }


    //Ennemis logique
    function Ennemi(x, y, w, h, speed) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.speed = speed;

        this.draw = function () {
            ctx.save();
            ctx.drawImage(ennemiImage,this.x,this.y,this.w, this.h);
            ctx.restore();
        };


        this.move = function (delta) {
            if(this.y < winH) {
                this.y += calcDistanceToMove(delta, this.w / 2);
            } else if (this.y > winH - 1) {
                this.y = -this.w;
            }
        };
    }

    function createEnnemis()
    {
        eX = winW/ 12;
        eY = - (winH / 12);
        eW = winW / 12;
        eH = winH / 12;
        eS = 20;
        for(var i = 0; i < totalEnnemis; i++) {
            ennemis.push(new Ennemi(eX,eY,eW,eH,eS));
            eX += eW + (winW / 10);
        }
    }

    function updateEnnemis(delta) {
        for (var i =0; i < ennemis.length; i++) {
            var ennemi = ennemis[i];
            ennemi.move(delta);
            ennemi.draw();
        }
    }
    // Game logic
    var measureFPS = function (newTime) {

        // test for the very first invocation
        if (lastTime === undefined) {
            lastTime = newTime;
            return;
        }

        //calculate the difference between last & current frame
        var diffTime = newTime - lastTime;

        if (diffTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastTime = newTime;
        }

        //and display it in an element we appended to the
        // document in the start() function
        fpsContainer.innerHTML = 'FPS: ' + fps;
        frameCount++;
    };

    // clears the canvas content
    function clearCanvas() {
        ctx.clearRect(0,0, winW, winH);
    }

    function timer(currentTime) {
        var delta = currentTime - oldTime;
        oldTime = currentTime;
        return delta;
    }
    function getMousePos(evt) {
        // necessary to take into account CSS boudaries
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }
    var mainLoop = function (time) {
        //main function, called each frame
        measureFPS(time);

        // number of ms since last frame draw
        delta = timer(time);

        // Clear the canvas
        clearCanvas();

        if (player.dead) {
            currentGameState = gameStates.gameOver;
        }

        switch (currentGameState) {
            case gameStates.gameRunning:

                // draw the player
                movePlayer(player.x, player.y);

                // Check inputs and move the player
                updatePlayerPosition(delta);

                //Deplacement des ennemis
                updateEnnemis(delta);

                //Deplacement des lasers
                updateLasers(delta);

                // display Score
                displayScore();

                // decrease currentLevelTime.
                // When < 0 go to next level
                currentLevelTime += delta;

                /* if (currentLevelTime < 0) {
                 goToNextLevel();
                 }*/

                break;
            case gameStates.mainMenu:
                // TO DO !
                break;
            case gameStates.gameOver:
                ctx.fillText("GAME OVER", 50, 100);
                ctx.fillText("Press SPACE to start again", 50, 150);
                ctx.fillText("Move with arrow keys", 50, 200);
                ctx.fillText("Survive 5 seconds for next level", 50, 250);
                if (inputStates.space) {
                    this.startNewGame();
                }
                break;
        }

        // call the animation loop every 1/60th of second
        requestAnimationFrame(mainLoop);
    };

    function startNewGame() {
        player.dead = false;
        currentLevelTime = 5000;
        currentLevel = 1;
        currentGameState = gameStates.gameRunning;
    }

    function goToNextLevel() {
        // reset time available for next level
        // 5 seconds in this example
        currentLevelTime = 5000;
        currentLevel++;
    }

    function displayScore() {
        ctx.save();
        ctx.fillStyle = 'Green';
        ctx.fillText("Level: " + currentLevel, 300, 30);
        ctx.fillText("Time: " + (currentLevelTime / 1000).toFixed(1), 300, 60);
        ctx.restore();
    }

    function loadAssets(callback) {
        // here we should load the souds, the sprite sheets etc.
        // then at the end call the callback function

        // simple example that loads a sound and then calls the callback. We used the howler.js WebAudio lib here.
        // Load sounds asynchronously using howler.js
        plopSound = new Howl({
            urls: ['http://mainline.i3s.unice.fr/mooc/plop.mp3'],
            autoplay: false,
            volume: 1,
            onload: function () {
                console.log("all sounds loaded");
                // We're done!
                callback();
            }
        });
    }


    var start = function () {
        // adds a div for displaying the fps value
        fpsContainer = document.createElement('div');
        document.body.appendChild(fpsContainer);

        // Canvas, context etc.
        canvas = document.querySelector("#myCanvas");
        playerImage = new Image();
        playerImage.src = 'graphics/player.png';
        ennemiImage = new Image();
        ennemiImage.src = 'graphics/ennemi.png';

        // often useful
        winW = canvas.width;
        winH = canvas.height;

        // important, we will draw with this object
        ctx = canvas.getContext('2d');
        // default police for text
        ctx.font = "20px Arial";

        //add the listener to the main, window object, and update the states
        window.addEventListener('keydown', function (event) {
            if (event.keyCode === 37) {
                inputStates.left = true;
            } else if (event.keyCode === 38) {
                inputStates.up = true;
            } else if (event.keyCode === 39) {
                inputStates.right = true;
            } else if (event.keyCode === 40) {
                inputStates.down = true;
            } else if (event.keyCode === 32) {
                inputStates.space = true;
            }
        }, false);

        //if the key will be released, change the states object
        window.addEventListener('keyup', function (event) {
            if (event.keyCode === 37) {
                inputStates.left = false;
            } else if (event.keyCode === 38) {
                inputStates.up = false;
            } else if (event.keyCode === 39) {
                inputStates.right = false;
            } else if (event.keyCode === 40) {
                inputStates.down = false;
            } else if (event.keyCode === 32) {
                inputStates.space = false;
            }
        }, false);

        // Mouse event listeners
        canvas.addEventListener('mousemove', function (evt) {
            inputStates.mousePos = getMousePos(evt);
        }, false);

        canvas.addEventListener('mousedown', function (evt) {
            inputStates.mousedown = true;
            inputStates.mouseButton = evt.button;
        }, false);

        canvas.addEventListener('mouseup', function (evt) {
            inputStates.mousedown = false;
        }, false);

        player.x = (winW / 2) - (player.width / 2);
        player.y = winH - player.height;

        // Créer ennemis
        createEnnemis();

        //creerObstacles();
        //creerPiste();

        // all assets (images, sounds) loaded, we can start the animation
        requestAnimationFrame(mainLoop);

    };

    //our GameFramework returns a public API visible from outside its scope
    return {
        start: start
    };
};


