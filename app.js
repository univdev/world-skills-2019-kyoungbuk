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
            var ctx = target.getContext('2d');

            for (var rect of rects) {
                var type = rect.type;
                ctx.beginPath();
                switch (type) {
                    case 'box':
                        var coords = rect.coords || {};
                        var startX = coords.startX;
                        var startY = coords.startY;
                        var endX = coords.endX;
                        var endY = coords.endY;
                        var width = endX - startX;
                        var height = endY - startY;
                        var border = rect.border;
                        var color = rect.color;
                        var textSize = rect.textSize;

                        ctx.fillStyle = color;
                        ctx.fontSize = textSize;
                        ctx.lineWidth = border;
                        ctx.fillRect(startX, startY, width, height);
                        break;
                }
                ctx.closePath();
            }
        },
    };

    var triggerCanvas = document.getElementById('triggerCanvas');
    var videoPosters = document.querySelectorAll('img[data-video]');
    var playButton = (document.getElementsByClassName('play-btn') || [])[0];

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
        console.log(e);
        coords = [[e.offsetX, e.offsetY]];
    });
    triggerCanvas.addEventListener('mousemove', (e) => {
        if (!flag) return;
        coords.push([e.offsetX, e.offsetY]);
    });
    triggerCanvas.addEventListener('mouseup', (e) => {
        coords.push([e.offsetX, e.offsetY]);
        var firstCoords = coords[0] || [];
        var lastCoords = coords[coords.length - 1] || [];
        var startX = firstCoords[0] || 0;
        var startY = firstCoords[1] || 0;
        var endX = lastCoords[0] || 0;
        var endY = lastCoords[1] || 0;
        var type = currentOption.type || 'box';
        var border = currentOption.border || '3px';
        var textSize = currentOption.textSize || '16px';
        var temp;
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
        console.log(rects);
    });
})()