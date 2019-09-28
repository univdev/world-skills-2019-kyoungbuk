(() => {

    var currentOption = {
        tool: 'box',
        border: 3,
        font: 18,
        selectedObject: null,
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
        setTime(time) {
            var video = document.getElementById('player');
            video.currentTime = time;
        },
        visibleRects(currentTime, rects) {
            var rects = rects.filter((obj) => obj.time.start <= currentTime && obj.time.end >= currentTime);
            RectManager.init(rects);
        },
        getTimeByPosition(video, left, width) {
            var duration = video.duration;
            var part = duration / 100;
            var start = part * left;
            var end = part * width + start;
            return { start, end };
        },
    };

    var RectManager = {
        init(rects) {
            rects = this.sortByFloor(rects || []);
            var target = document.getElementById('drawCanvas');
            this.clear(target);
            for (var rect of rects) {
                var tool = rect.tool;
                var coords = rect.coords || {};
                var startX = coords.startX;
                var startY = coords.startY;
                var endX = coords.endX;
                var endY = coords.endY;
                var color = rect.color || 'yellow';
                var border = rect.border;
                var font = rect.font;
                var canvas = document.getElementById('drawCanvas');
                var active = rect.active || false;
                switch (tool) {
                    case 'box':
                        this.square(canvas, color, startX, startY, endX, endY, active);
                        break;
                    case 'line':
                        this.line(canvas, coords, color, border, active);
                        break;
                }
            }
        },
        square(canvas, color, startX, startY, endX, endY, active) {
            var ctx = canvas.getContext('2d');
            ctx.beginPath();
            if (active) {
                ctx.fillStyle = 'skyblue';
                ctx.fillRect(startX - 2, startY - 2, (endX - startX) + 4, (endY - startY) + 4);
            }
            ctx.fillStyle = color;
            ctx.fillRect(startX, startY, endX - startX, endY - startY);
            ctx.closePath();
        },
        line(canvas, coords, color, border, active) {
            var ctx = canvas.getContext('2d');
            var start = CoordsManager.start(coords);

            if (active) {
                ctx.beginPath();
                ctx.lineWidth = (border * 1) + 5;
                ctx.strokeStyle = 'skyblue';
                ctx.moveTo(start[0], start[1]);
                for (var i = 1; i < coords.length; i += 1) {
                    var coord = CoordsManager.get(coords, i) || [];
                    ctx.lineTo(coord[0], coord[1]);
                }
                ctx.stroke();
                ctx.closePath();
            }

            ctx.beginPath();
            ctx.lineWidth = border;
            ctx.strokeStyle = color;
            ctx.moveTo(start[0], start[1]);
            for (var i = 1; i < coords.length; i += 1) {
                var coord = CoordsManager.get(coords, i) || [];
                ctx.lineTo(coord[0], coord[1]);
            }
            ctx.stroke();
            ctx.closePath();
        },
        clear(canvas) {
            var width = canvas.width;
            var height = canvas.height;
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, width, height);
        },
        changeTime(rects, index, start, end) {
            index *= 1;
            var target = rects.filter((obj) => obj.index === index)[0];
            var time = target.time
            time.start = start;
            time.end = end;
        },
        getMaxIndex(rects) {
            var max = -1;
            for (var rect of rects) {
                max = max < rect.index ? rect.index : max;
            }
            return max;
        },
        push(rects, options) {
            var index = this.getMaxIndex(rects) + 1;
            options.index = index;
            options.floor = rects.length + 1;
            options.active = false;
            rects.push(options);
        },
        sortByFloor(rects) {
            return (rects || []).sort((a, b) => a.floor > b.floor ? 1 : a.floor < b.floor ? -1 : 0);
        },
        check(rects, x, y) {
            rects = this.sortByFloor(rects);
            for (var rect of rects) {
                var coords = rect.coords;
                switch (rect.tool) {
                    case 'box':
                        var startX = coords.startX;
                        var startY = coords.startY;
                        var endX = coords.endX;
                        var endY = coords.endY;
                        if (this.checkBox(startX, startY, endX, endY, x, y)) return rect;
                        break;
                    case 'line':
                        if (this.checkLine(coords, rect.border, x, y)) return rect;
                        break;
                }
            }
            return false;
        },
        checkBox(startX, startY, endX, endY, x, y) {
            return (startX <= x && endX >= x) && (startY <= y && endY >= y);
        },
        checkLine(coords, range, x, y) {
            range *= 1;
            for (var coord of coords) {
                var targetX = coord[0];
                var targetY = coord[1];
                var startX = targetX - range;
                var startY = targetY - range;
                var endX = targetX + range;
                var endY = targetY + range;
                if ((startX <= x && endX >= x) && (startY <= y && endY >= y)) return true;
            }
        },
        clearActive() {
            return rects.map((item) => {
                item.active = false;
                return item;
            });
        },
        movement(rect, vector) {
            var tool = rect.tool;
            switch (tool) {
                case 'box':
                    this.moveBox(rect, vector);
                    break;
                case 'line':
                    this.moveLine(rect, vector);
                    break;
            }
        },
        moveBox(rect, vector) {
            var vectorX = vector[0];
            var vectorY = vector[1];
            var coords = rect.coords;
            coords.startX += vectorX;
            coords.startY += vectorY;
            coords.endX += vectorX;
            coords.endY += vectorY;
        },
        moveLine(rect, vector) {
            var x = vector[0];
            var y = vector[1];
            var coords = rect.coords;
            coords.map((item) => {
                item[0] = item[0] + x;
                item[1] = item[1] + y;
                return item;
            });
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

    var LayerManager = {
        init(rects) {
            this.clear();
            var items = RectManager.sortByFloor(rects || []);
            var player = document.getElementById('player');
            var container = $('.layer');
            for (var rect of items) {
                var time = rect.time || {};
                var startTime = time.start || 0;
                var endTime = time.end || 20;
                var left = (startTime / player.duration * 100);
                var width = (endTime / player.duration * 100) - left;
                var index = rect.index || 0;
                this.createLayerProgress(index, left, width);
            }
            var layerProgresses = $('.layer__progress');
            container.sortable({
                containment: '.layer',
                update(e) {
                    var items = $('.layer__row');
                    var player = document.getElementById('player');
                    var currentTime = player.currentTime || 0;
                    items.each(function() {
                        var idx = $(this).data('idx');
                        var floor = items.length - $(this).index();
                        var rect = rects[idx];
                        rect.floor = floor;
                    });
                    VideoManager.visibleRects(currentTime, rects);
                },
            });
            layerProgresses.resizable({
                containment: '.layer__row',
                handles: 'e',
                minHeight: 32,
                resize: function() {
                    var item = $(this);
                    var parent = item.parent();
                    var width = item.width() / parent.width() * 100;
                    var left = item.position().left / parent.width() * 100;
                    var video = document.getElementById('player');
                    var currentTime = video.currentTime || 0;
                    var time = VideoManager.getTimeByPosition(video, left, width);
                    var index = item.data('idx');
                    RectManager.changeTime(rects, index, time.start, time.end);
                    VideoManager.visibleRects(currentTime, rects);
                },
            });
            layerProgresses.draggable({
                containment: '.layer__row',
                axis: 'x',
                drag: function() {
                    var item = $(this);
                    var index = item.attr('data-idx');
                    var left = item.position().left / item.parent().width() * 100;
                    var width = item.width() / item.parent().width() * 100;
                    var time = VideoManager.getTimeByPosition(player, left, width) || {};
                    var currentTime = player.currentTime || 0;
                    RectManager.changeTime(rects, index, time.start, time.end);
                    VideoManager.visibleRects(currentTime, rects);
                },
            });
        },
        createLayerProgress(index, left, width) {
            var container = $('.layer');
            var layerRow = $('<div class="layer__row"></div>');
            var layerProgress = $('<div class="layer__progress"></div>');
            layerRow.append(layerProgress);
            layerRow.attr('data-idx', index);
            container.prepend(layerRow);
            layerProgress.css('left', `${left}%`);
            layerProgress.css('width', `${width}%`);
            layerProgress.attr('data-idx', index);
        },
        clear() {
            var container = $('.layer');
            container.find('.layer__row').remove();
        },
    };

    var TriggerManager = {
        canvas: document.getElementById('triggerCanvas'),
        box(startX, startY, endX, endY) {
            var width = endX - startX;
            var height = endY - startY;
            RectManager.square(this.canvas, 'rgba(255, 255, 0, .2)', startX, startY, width, height);
        },
        clear() {
            RectManager.clear(this.canvas);
        },
    };

    var triggerCanvas = document.getElementById('triggerCanvas');
    var videoPosters = (document.querySelectorAll('img[data-video]') || []);
    var playButton = (document.getElementsByClassName('play-btn') || [])[0];
    var allClearButton = (document.getElementsByClassName('all-delete-btn') || [])[0];
    var pauseButton = (document.getElementsByClassName('pause-btn') || [])[0];
    var selectButton = document.getElementsByClassName('select-btn')[0];
    var video = document.getElementById('player');
    var timeline = document.getElementsByClassName('layer__timeline')[0];
    var ableTimelineMove = true;
    var colorComboBox = document.getElementById('color');
    var lineComboBox = document.getElementById('line');
    var fontSizeComboBox = document.getElementById('fontSize');
    var selectDeleteButton = document.getElementsByClassName('select-delete-btn')[0];

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
        switch (currentOption.tool) {
            case 'select':
                currentOption.selectedObject = RectManager.check(rects, e.offsetX, e.offsetY);
                RectManager.clearActive();
                if (!currentOption.selectedObject) {
                    RectManager.clearActive();
                } else {
                    currentOption.selectedObject.active = true;
                }

                VideoManager.visibleRects(video.currentTime, rects);
                break;
        }
    });
    triggerCanvas.addEventListener('mousemove', (e) => {
        if (!flag) return;
        coords.push([e.offsetX, e.offsetY]);

        var startCoords = CoordsManager.start(coords);
        var endCoords = CoordsManager.end(coords);
        TriggerManager.clear();
        switch (currentOption.tool) {
            case 'box':
                TriggerManager.box(startCoords[0], startCoords[1], endCoords[0], endCoords[1]);
                break;
            case 'select':
                if (!currentOption.selectedObject) return;
                var lastCoords = CoordsManager.get(coords, coords.length - 2);
                var startX = lastCoords[0];
                var startY = lastCoords[1];
                var currentX = e.offsetX;
                var currentY = e.offsetY;
                var vector = [currentX - startX, currentY - startY];
                RectManager.movement(currentOption.selectedObject, vector);
                break;
        }
        VideoManager.visibleRects(video.currentTime, rects);
    });
    triggerCanvas.addEventListener('mouseup', (e) => {
        flag = false;
        coords.push([e.offsetX, e.offsetY]);
        var player = document.getElementById('player');
        var triggerCanvas = document.getElementById('triggerCanvas');
        var firstCoords = CoordsManager.start(coords) || [];
        var lastCoords = CoordsManager.end(coords) || [];
        var startX = firstCoords[0] || 0;
        var startY = firstCoords[1] || 0;
        var endX = lastCoords[0] || 0;
        var endY = lastCoords[1] || 0;
        var tool = currentOption.tool || 'box';
        var color = currentOption.color || 'gray';
        var border = currentOption.border || '3px';
        var font = currentOption.font || '16px';
        var currentTime = player.currentTime;
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
        var time = { start: currentTime, end: currentTime + 5 };
        switch (currentOption.tool) {
            case 'box':
                RectManager.push(rects, { tool, border, font, coords: data, time, color });
                break;
            case 'line':
                RectManager.push(rects, { tool, border, font, coords, time, color });
                break;
        }
        VideoManager.visibleRects(currentTime, rects);
        LayerManager.init(rects);
        TriggerManager.clear();
    });
    allClearButton.addEventListener('click', () => {
        var canvas = document.getElementById('drawCanvas');
        rects = [];
        RectManager.init(rects);
        LayerManager.clear();
    });
    pauseButton.addEventListener('click', () => {
        VideoManager.play(false);
    });
    selectButton.addEventListener('click', () => {
        currentOption.tool = 'select';
    });
    video.addEventListener('timeupdate', () => {
        if (!ableTimelineMove) return;
        var currentTime = video.currentTime;
        var videoLength = video.duration;
        var left = currentTime / videoLength * 100;
        var timeline = document.getElementsByClassName('layer__timeline')[0];
        VideoManager.visibleRects(currentTime, rects);
        timeline.style.left = `${left}%`;
    });
    $(timeline).draggable({
        containment: '.layer',
        axios: 'x',
        drag: function() {
            var item = $(this);
            var left = $(timeline).position().left;
            var maxWidth = $('.layer').width();
            var currentTime = video.duration / maxWidth * left;
            var player = document.getElementById('player');
            ableTimelineMove = false;
            VideoManager.setTime(currentTime);
            VideoManager.visibleRects(currentTime, rects);
        },
        stop() {
            ableTimelineMove = true;
        },
    });
    colorComboBox.addEventListener('change', () => {
        var color = colorComboBox.value;
        currentOption.color = color;
    });
    lineComboBox.addEventListener('change', () => {
        var line = lineComboBox.value;
        currentOption.border = line;
    });
    fontSizeComboBox.addEventListener('change', () => {
        var fontSize = fontSizeComboBox.value;
        currentOption.font = fontSize;
    });
    $(document).on('click', '.draw-btn', function() {
        var type = $(this).data('class');
        currentOption.tool = type;
    });
    selectDeleteButton.addEventListener('click', () => {
        if (!currentOption.selectedObject) {
            alert('선택된 오브젝트가 없습니다.');
            return;
        }
        rects = rects.filter(item => item.index !== currentOption.selectedObject.index);
        VideoManager.visibleRects(video.currentTime, rects);
        LayerManager.init(rects);
    });
})()