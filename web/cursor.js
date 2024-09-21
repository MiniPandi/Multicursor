document.addEventListener('DOMContentLoaded', () => {
    const ws = new WebSocket('ws://147.185.221.22:55615');
    document.addEventListener('mousemove', e => {
        if (e.clientX && e.clientY && window.innerWidth && window.innerHeight && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                x: e.clientX,
                y: e.clientY,
                width: window.innerWidth,
                height: window.innerHeight
            }));
        }
    });

    ws.onmessage = e => {
        const data = JSON.parse(e.data);

        if (data.type === 'add') {
            const div = document.createElement('div');
            div.style.position = 'absolute';
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
                const xPx = data.x / 100 * window.innerWidth;
                const yPx = data.y / 100 * window.innerHeight;
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