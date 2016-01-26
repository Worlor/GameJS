// Inits
window.onload = function init() {
    var game;
    game = new GF();
    game.start();
};


// GAME FRAMEWORK STARTS HERE
var GF = function () {
    // Vars relative to the canvas
    var player;
    var canvas, ctx, winW, winH;
    var score = 0;
    var totalScore = 0;

    var playerImage;
    var ennemiImage;
    var fond;

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

    player = {
        dead: false,
        x: 10,
        y: 10,
        width: 50,
        height: 50,
        speed: 0,
        retardLaser: 0
    };

    // Lasers
    var laserTotal = 2, lasers = [], vitesseLasers = 800;

    // Ennemis
    var totalEnnemis = 5,ennemis = [],vitesseEnnemis = 30;

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

        ctx.drawImage(playerImage, x, y, winW / 10, winH / 10);

        // restore the context
        ctx.restore();
    }

    function testPlayerCollision() {
        var playerXW = player.x + player.width;
        var playerYH = player.y + player.height;
        for (var i = 0; i < ennemis.length; i++)
        {
            var ennemi = ennemis[i];
            if(player.x > ennemi.x && player.x < ennemi.x + ennemi.w && player.y > ennemi.y && player.y < ennemi.y + ennemi.h) {
                player.dead = true;
            }
            if(playerXW < ennemi.x + ennemi.w && playerXW > ennemi.x && player.y > ennemi.y && player.y < ennemi.y + ennemi.h) {
                player.dead = true;
            }
            if(playerYH > ennemi.y && playerYH < ennemi.y + ennemi.h && player.x > ennemi.x && player.x < ennemi.x + ennemi.w) {
                player.dead = true;
            }
            if(playerYH > ennemi.y && playerYH < ennemi.y + ennemi.h && playerXW < ennemi.x + ennemi.w && playerXW > ennemi.x) {
                player.dead = true;
            }
        }
    }

    function updatePlayerPosition(delta) {
        player.speedX = 0;
        player.speedY = 0;

        // check inputStates
        if(currentGameState != gameStates.nextLevel) {
            if (inputStates.left) {
                player.speedX = -player.speed;
            } else if (inputStates.right) {
                player.speedX = player.speed;
            }
            if (inputStates.down) {
                player.speedY = player.speed;
            } else if (inputStates.up) {
                player.speedY = -player.speed;
            }
            if (inputStates.space && lasers.length <= laserTotal && window.performance.now() > player.retardLaser) {
                lasers.push(new Laser(player.x + 5 + (player.width / 2), player.y - 20));
                player.retardLaser = window.performance.now() + 300;
            }
        }

        player.x += calcDistanceToMove(delta, player.speedX);
        player.y += calcDistanceToMove(delta, player.speedY);

        //Empeche le joueur de sortir de l'écran
        if(player.x < 0) {
            player.x = 0;
        }
        if(player.x > (winW - player.width)) {
            player.x = winW - player.width;
        }
        if(player.y < 0) {
            player.y =0;
        }
        if((player.y + player.height) > winH) {
            player.y = winH - player.height;
        }
    }

    //Lasers logique
    function Laser(x, y) {
        this.x = x;
        this.y = y;
        this.w = winW / 150;
        this.h = winH / 30;
        this.speed = vitesseLasers;

        this.draw = function () {
            ctx.fillStyle = '#f00';
            ctx.fillRect(this.x, this.y, this.w, this.h);
        };

        this.move = function(delta, laserIndex) {
            if(this.y > -11) {
                this.y -= calcDistanceToMove(delta, this.speed);
            }
            else if (this.y < -10) {
                lasers.splice(laserIndex, 1);
            }
        };

        this.hitTest = function (laserIndex){
            for (var i = 0; i < ennemis.length; i++) {
                var ennemi = ennemis[i];
                if(
                    this.y <= (ennemi.y + ennemi.h + 5) &&//Check hauteur + petit hack
                    this.y >= ennemi.y &&
                    this.x >= ennemi.x &&
                    this.x <= (ennemi.x + ennemi.w) &&
                    this.y ) {
                    ennemi.lives--;
                    if(ennemi.lives <= 0) {
                        ennemis.splice(i, 1);
                        score += 10;
                    }
                    lasers.splice(laserIndex, 1);
                    return ;
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
    function Ennemi(x, y, w, h, lives) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.lives = lives;
        this.speed = vitesseEnnemis;

        this.draw = function () {
            ctx.save();
            ctx.drawImage(ennemiImage,this.x,this.y,this.w, this.h);
            ctx.restore();
        };


        this.move = function (delta) {
            if(this.y < winH) {
                this.y += calcDistanceToMove(delta, this.speed);
            } else if (this.y > winH - 1) {
                this.y = -this.w;
            }
        };
    }

    function createEnnemis(nombre)
    {
        eX = winW/ 12;
        eY = - (winH / 12);
        eW = winW / 12;
        eH = winH / 12;
        console.log("live + "+Math.floor(currentLevel/5));
        for(var i = 0; i < nombre; i++) {
            ennemis.push(new Ennemi(eX,eY,eW,eH, 1 + Math.floor(currentLevel/5)));
            eX += eW + (winW / 10);
            if((i+1)%5 == 0) {//Tous les 5 ennemis, on ajoute un rang
                eY -= (winH / 6);
                eX = winW / 12;
            }
        }
    }

    function updateEnnemis(delta) {
        for (var i =0; i < ennemis.length; i++) {
            var ennemi = ennemis[i];
            ennemi.move(delta);
            ennemi.draw();
        }
    }

    // Fond logique
    function Fond() {
        this.image = new Image();
        this.image.src = 'graphics/background.png';
        this.x = 0;
        this.y = 0;
        this.y2 = - winH;

        this.drawFond = function() {
            ctx.drawImage(this.image, this.x, this.y, winW, winH);
            ctx.drawImage(this.image, this.x, this.y2, winW, winH);
            if(this.y > winH) {
                this.y = -winH + 1;
            }
            if(this.y2 > winH) {
                this.y2 = -winH + 1;
            }
            this.y++;
            this.y2++;
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

        if (ennemis.length < 1 && currentGameState != gameStates.nextLevel) {
            scoreTime = window.performance.now() + 2000;
            currentGameState = gameStates.nextLevel;
        }

        switch (currentGameState) {
            case gameStates.nextLevel:
                // dessine le fond
                fond.drawFond();

                // draw the player
                player.x = (winW / 2) - (player.width / 2);
                player.y =  winH - player.height;
                movePlayer(player.x, player.y);

                // Verifie si le joueur est touché
                testPlayerCollision();

                // Check inputs and move the player
                updatePlayerPosition(delta);

                displayFinLevel();

                if(window.performance.now() > scoreTime) {
                    goToNextLevel();
                    currentGameState = gameStates.gameRunning;
                }
                break;
            case gameStates.gameRunning:

                // dessine le fond
                fond.drawFond();

                // draw the player
                movePlayer(player.x, player.y);

                // Verifie si le joueur est touché
                testPlayerCollision();

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
                currentLevelTime -= delta;

                 if (currentLevelTime < 0) {
                    currentGameState = gameStates.gameOver;
                 }

                break;
            case gameStates.mainMenu:
                // TO DO !
                break;
            case gameStates.gameOver:
                ctx.font = 'bold 18px Inconsolata';
                ctx.fillText("GAME OVER", 50, 100);
                ctx.fillText("Score : " + (totalScore + score), 50, 150);
                ctx.fillText("Appuyer sur espace pour relancer", 50, 200);
                ctx.fillText("Déplacer vous avec les flêches, espace pour tirer", 50, 250);
                ctx.fillText("Tuer tout le monde et échappez vous pour le niveau suivant !", 50, 300);
                if (inputStates.space) {
                    startNewGame();
                }
                break;
        }

        // call the animation loop every 1/60th of second
        requestAnimationFrame(mainLoop);
    };

    function startNewGame() {
        player.dead = false;
        currentLevel = 1;
        score = 0;
        totalScore = 0;
        initialisation();
        currentGameState = gameStates.gameRunning;
    }

    function goToNextLevel() {
        // reset time available for next level
        // 5 seconds in this example
        lasers = [];
        totalScore += score + Math.round(currentLevelTime / 1000) * 1000;
        score = 0;
        currentLevelTime = 30000 + (currentLevel * 2000);
        currentLevel++;
        createEnnemis(totalEnnemis * currentLevel);
    }

    function displayScore() {
        ctx.save();
        ctx.fillStyle = 'Red';
        ctx.font = 'bold 20px Inconsolata';
        ctx.fillText("Niveau: " + currentLevel, winW - 120, 30);
        ctx.fillText("Score: " + score, winW - 120, 60);
        ctx.fillText("Temps : " + Math.round(currentLevelTime / 1000), winW - 120, 90);
        ctx.restore();
    }

    function displayFinLevel() {
        ctx.save();
        ctx.fillStyle = "Green";
        ctx.font = 'bold 40px Inconsolata';
        ctx.fillText("Niveau " + currentLevel + " terminé !",
            winW - (winW * 0.8), winH - (winH * 0.7));
        ctx.font = '20px Inconsolata';
        var total = score + Math.round(currentLevelTime / 1000) * 1000;
        ctx.fillText("Score du niveau : "+score,
            winW - (winW * 0.8), winH - (winH * 0.5));
        ctx.fillText("Bonus temps restant : "+Math.round(currentLevelTime / 1000)+ " x 1000 = "+Math.round(currentLevelTime /1000)*1000,
            winW - (winW * 0.8), winH - (winH * 0.4) );
        ctx.fillText("Score total : "+totalScore+" + "+ total + " = " + (totalScore+total),
            winW - (winW * 0.8), winH - (winH * 0.3));
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

    function initialisation()
    {
        //initialisation joueur
        player.x = (winW / 2) - (player.width / 2);
        player.y = winH - player.height;
        player.retardLaser = window.performance.now() + 200;

        currentLevelTime = 30000;


        // Créer ennemis
        ennemis = [];
        createEnnemis(totalEnnemis)
    }


    var start = function () {
        // adds a div for displaying the fps value
        fpsContainer = document.createElement('div');
        document.body.appendChild(fpsContainer);

        // Canvas, context etc.
        canvas = document.querySelector("#myCanvas");
        winW = canvas.width;
        winH = canvas.height;
        playerImage = new Image();
        playerImage.src = 'graphics/player.png';
        ennemiImage = new Image();
        ennemiImage.src = 'graphics/ennemi.png';
        fond = new Fond();

        player.speed = ((winW + winH) / 2 ) / 5;
        player.height = winH / 12;
        player.width = winW / 12;

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
        initialisation();
        // all assets (images, sounds) loaded, we can start the animation
        requestAnimationFrame(mainLoop);

    };

    //our GameFramework returns a public API visible from outside its scope
    return {
        start: start
    };
};


