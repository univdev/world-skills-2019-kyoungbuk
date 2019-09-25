(() => {

    var currentOption = {
        tool: 'box',
        border: '3px',
        textSize: '18px',
    };

    var rects = [];
    var mouseCoords = [];
    
    var VideoManager = {
        directory: '/common',
        init(name) {
            var path = `${this.directory}/${name}`;
            var target = document.getElementById('player');
            var warning = document.getElementById('noVideo');
            target.setAttribute('src', path);
            warning.setAttribute('hidden', name ? true : false);
        },
        play(flag) {
            var target = document.getElementById('player');
            var video = target.getAttribute('src');
            if (!video) return;
            flag ? target.play() : target.pause();
        },
    };

    var RectManager = {
        init(rects) {
            var target = document.getElementById('drawCanvas');

            this.clear(target);
            for (var rect of rects) {
                var type = rect.type;
                switch (type) {
                    case 'box':
                        var coords = rect.coords || {};
                        var startX = coords.startX;
                        var startY = coords.startY;
                        var endX = coords.endX;
                        var endY = coords.endY;
                        console.log(startX, startY);
                        var color = rect.color || 'yellow';
                        var canvas = document.getElementById('drawCanvas');
                        this.square(canvas, color, startX, startY, endX, endY);
                        break;
                }
            }
        },
        square(canvas, color, startX, startY, endX, endY) {
            var ctx = canvas.getContext('2d');
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.fillRect(startX, startY, endX - startX, endY - startY);
            ctx.closePath();
        },
        clear(canvas) {
            var width = canvas.width;
            var height = canvas.height;
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, width, height);
        },
    };

    var CoordsManager = {
        start(coords) {
            return (coords || [])[0] || null;
        },
        end(coords) {
            var length = coords.length || 0;
            return (coords || [])[length - 1] || null;
        },
        get(coords, index) {
            return (coords || [])[index] || null;
        },
    };

    var triggerCanvas = document.getElementById('triggerCanvas');
    var videoPosters = document.querySelectorAll('img[data-video]');
    var playButton = (document.getElementsByClassName('play-btn') || [])[0];
    var allClearButton = (document.getElementsByClassName('all-delete-btn') || [])[0];
    var pauseButton = (document.getElementsByClassName('pause-btn') || [])[0];

    playButton.addEventListener('click', () => VideoManager.play(true));

    for (var poster of videoPosters) {
        poster.addEventListener('click', function() {
            var video = this.getAttribute('data-video');
            VideoManager.init(video);
        });
    }
    var coords = [];
    var flag = false;

    triggerCanvas.addEventListener('mousedown', (e) => {
        flag = true;
        coords = [[e.offsetX, e.offsetY]];
    });
    triggerCanvas.addEventListener('mousemove', (e) => {
        if (!flag) return;
        coords.push([e.offsetX, e.offsetY]);

        var canvas = document.getElementById('triggerCanvas');
        var startCoords = CoordsManager.start(coords);
        var endCoords = CoordsManager.end(coords);
        RectManager.clear(canvas);
        RectManager.square(canvas, 'rgba(255, 255, 0, .2)', startCoords[0], startCoords[1], endCoords[0], endCoords[1]);
    });
    triggerCanvas.addEventListener('mouseup', (e) => {
        flag = false;
        coords.push([e.offsetX, e.offsetY]);
        var triggerCanvas = document.getElementById('triggerCanvas');
        var firstCoords = CoordsManager.start(coords) || [];
        var lastCoords = CoordsManager.end(coords) || [];
        var startX = firstCoords[0] || 0;
        var startY = firstCoords[1] || 0;
        var endX = lastCoords[0] || 0;
        var endY = lastCoords[1] || 0;
        var type = currentOption.type || 'box';
        var border = currentOption.border || '3px';
        var textSize = currentOption.textSize || '16px';
        var temp;

        RectManager.clear(triggerCanvas);
        if (startX > endX) {
            temp = startX;
            startX = endX;
            endX = temp;
        }
        if (startY > endY) {
            temp = startY;
            startX = endY;
            endY = temp;
        }
        var data = { startX, startY, endX, endY };
        rects.push({ type, border, textSize, coords: data });
        RectManager.init(rects);
    });
    allClearButton.addEventListener('click', () => {
        var canvas = document.getElementById('drawCanvas');
        RectManager.clear(canvas);
    });
    pauseButton.addEventListener('click', () => {
        VideoManager.play(false);
    });
})()