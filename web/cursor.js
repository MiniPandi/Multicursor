document.addEventListener('DOMContentLoaded', () => {
    const ws = new WebSocket('ws://147.185.221.22:55615');
    const ownCursorDiv = document.createElement('div');
    ownCursorDiv.style.position = 'fixed';
    ownCursorDiv.style.backgroundColor = randomColor();
    ownCursorDiv.className = 'cursor';
    ownCursorDiv.id = "own";
    document.body.appendChild(ownCursorDiv);
    document.addEventListener('mousemove', e => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                x: e.clientX,
                y: e.clientY,
                width: window.innerWidth,
                height: window.innerHeight
            }));
        }
        ownCursorDiv.style.left = (e.clientX - (ownCursorDiv.offsetWidth / 2)) + 'px';
        ownCursorDiv.style.top = (e.clientY - (ownCursorDiv.offsetHeight / 2)) + 'px';
    });

    ws.onmessage = e => {
        const data = JSON.parse(e.data);

        if (data.type === 'add') {
            const div = document.createElement('div');
            div.style.position = 'fixed';
            div.style.backgroundColor = randomColor();
            div.className = 'cursor';
            div.id = data.id;
            document.body.appendChild(div);
        } else if (data.type === 'remove') {
            const div = document.getElementById(data.id);
            if (div) {
                div.remove();
            }
        } else if (data.type === 'update') {
            const div = document.getElementById(data.id);
            if (div) {
                var xPx = data.x / 100 * window.innerWidth;
                var yPx = data.y / 100 * window.innerHeight;
                xPx = xPx - (div.offsetWidth / 2)
                yPx = yPx - (div.offsetHeight / 2)
                div.style.left = xPx + 'px';
                div.style.top = yPx + 'px';
            }
        }
    };
});

function randomColor() {
    const h = Math.floor(Math.random() * 360);
    return `hsl(${h}, 100%, 50%)`;
}