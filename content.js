let mouseDown;
let mouseEnter;
let mouseX, mouseY;
let addX = 0, addY = 0;
let dollX = 0, dollY = 0;
let dollVX = 0, dollVY = 0;
let dollDire = 0;
let winWidMult;
let winHeiMult;

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = chrome.runtime.getURL('style.css');
document.head.appendChild(link);

let div = document.createElement("div");
let body = document.createElement("img");
let hand = document.createElement("img");
window.onload = (() => {
    mouseX = 0, mouseY = window.innerHeight / 2;
    mouseDown = false;
    mouseEnter = false;
    updateDoll(false);
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateDoll(typ){
    if(!document.getElementById("doll")) {
        div.id = "doll";
        div.className = "doll";
        div.draggable  = false;
        document.body.appendChild(div);
        
        body.src = chrome.runtime.getURL("img/body.svg");
        body.className = "dollBody";
        body.draggable  = false;
        div.appendChild(body);
        
        hand.src = chrome.runtime.getURL("img/hand.svg");
        hand.className = "dollHand";
        hand.draggable  = false;
        div.appendChild(hand);
    }
    if(!typ) {
        dollX = mouseX - addX;
        dollY = mouseY - addY;
    }
    div.style.left = `calc(${dollX}px)`;
    div.style.top = `calc(${dollY}px)`;

    winWidMult = dollX / window.innerWidth;
    winHeiMult = dollY / window.innerHeight;
}

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX, mouseY = e.clientY;
    if(mouseDown) {
        updateDoll(false);
    }
});

div.addEventListener('mousedown', (e) => {
    mouseDown = true;
    body.src = chrome.runtime.getURL("img/dragBody.svg");
    hand.src = chrome.runtime.getURL("img/dragTail.svg");
    hand.style.left = "-75px";
    hand.style.top = "30px";
    hand.style.transformOrigin = "50% 0";
    addX = mouseX - div.offsetLeft;
    addY = mouseY - div.offsetTop;
});
div.addEventListener('mouseup', async function (e) {
    mouseDown = false;
    body.src = chrome.runtime.getURL("img/body.svg");
    hand.src = chrome.runtime.getURL("img/hand.svg");
    hand.style.left = "-60px";
    hand.style.top = "-10px";
    hand.style.transformOrigin = "left bottom";
    if(div.offsetLeft > window.innerWidth / 2) dollDire = 1;
    else dollDire = -1;
    div.style.transform = `translate(${-(50 + dollDire * 50)}%, -50%) scaleX(${-dollDire})`;
    while(!mouseDown && !(dollX === 0 || dollX === window.innerWidth)) {
        dollVX += 2 * dollDire;
        dollX += dollVX;
        if(dollX < 0 && dollDire === -1) {
            dollVX = 0;
            dollX = 0;
        }
        if(dollX > window.innerWidth && dollDire === 1) {
            dollVX = 0;
            dollX = window.innerWidth;
        }
        updateDoll(true);
        await sleep(10);
    }
});


div.addEventListener('mouseenter', async function (e) {
    mouseEnter = true;
    let oldTime = Date.now();
    let rad;
    while(mouseEnter || Math.abs(rad) > 0.03) {
        rad = Math.sin((Date.now() - oldTime) * 0.3 * Math.PI / 180) * 0.3;
        hand.style.transform = `rotate(${rad}rad)`;
        await sleep(10);
    }
    hand.style.transform = `rotate(0rad)`;
});
div.addEventListener('mouseleave', async function (e) {
    mouseEnter = false;
});

window.addEventListener("resize", () => {
    dollX = window.innerWidth * winWidMult;
    dollY = window.innerHeight * winHeiMult;
    updateDoll(true);
})

const observer = new MutationObserver(updateDoll(false));
observer.observe(document.body, {
	childList: true,
	subtree: true,
	attributes: true,
	attributeFilter: ['style']
});
