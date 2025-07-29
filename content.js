let furryName = "xxbDark";

let imgUrls;
let oldImgUrls;


let mouseDown = false;
let mouseEnter = false;
let lastMouseX = 0, lastMouseY = 0;
let mouseX, mouseY;
let mouseStartX, mouseStartY;
let falling = false;
let grabbing = false;
let addX = 0, addY = 0;
let dollX = 0, dollY = 0;
let dollVX = 0, dollVY = 0;
let dollDire = -1;
let winWidMult;
let winHeiMult;
let dollDeg = 0;
let dollVD = 0;
let userAcc = 0;
let tailRad = 0;

let divHeight = 100;

let errInfo;

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = chrome.runtime.getURL('style.css');
document.head.appendChild(link);

let div = document.createElement("div");
let body = document.createElement("img");
let hand = document.createElement("img");

updateImgUrls();
oldImgUrls = imgUrls;

chrome.runtime.sendMessage({
    type: 'updatePopup',
    imgUrl: imgUrls.bottomBody,
    name: furryName
});

async function tryChangeFurry() {
    chrome.storage.local.get(["fileName"], async (data) => {
        if(!data.fileName) return false;
        if(furryName === data.fileName) return true;
        furryName = data.fileName;
        if(!(await updateImgUrls())) {
            chrome.runtime.sendMessage({
                type: 'updateError',
                err: errInfo
            });
            return false;
        }
        else {
            chrome.runtime.sendMessage({
                type: 'updatePopup',
                imgUrl: imgUrls.bottomBody,
                name: data.fileName
            });
        }
        const allImages = div.querySelectorAll("img");
        for (let i = 0; i < allImages.length; i++) {
            const newSrc = arrayMapReplace(allImages[i].src, oldImgUrls, imgUrls);
            allImages[i].src = newSrc;
        }
        oldImgUrls = imgUrls;// 备份用
        updateDoll(false);
        return true;
    });
}

function getAllImages(container) {
    const images = [];
    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_ELEMENT,
        {
            acceptNode: function(node) {
                return node.tagName === 'IMG' 
                    ? NodeFilter.FILTER_ACCEPT 
                    : NodeFilter.FILTER_SKIP;
            }
        },
        false
    );
    
    while(walker.nextNode()) {
        images.push(walker.currentNode);
    }
    return images;
}

function arrayMapReplace(target, objA, objB) {
    const mapA = new Map(Object.entries(objA));
    const mapB = new Map(Object.entries(objB));
    
    for (let [key, value] of mapA.entries()) {
        if (value === target) {
            return mapB.get(key) || target;
        }
    }
    return target;
}

async function updateImgUrls() {
    imgUrls = {
        body: chrome.runtime.getURL(`img/${furryName}/body.svg`),
        hand: chrome.runtime.getURL(`img/${furryName}/hand.svg`),
        fallBodyOuch: chrome.runtime.getURL(`img/${furryName}/fallBodyOuch.svg`),
        dragBody: chrome.runtime.getURL(`img/${furryName}/dragBody.svg`),
        dragTail: chrome.runtime.getURL(`img/${furryName}/dragTail.svg`),
        bottomBodyHappy: chrome.runtime.getURL(`img/${furryName}/bottomBodyHappy.svg`),
        bottomBody: chrome.runtime.getURL(`img/${furryName}/bottomBody.svg`),
        bodyHappy: chrome.runtime.getURL(`img/${furryName}/bodyHappy.svg`),
        bottomTail: chrome.runtime.getURL(`img/${furryName}/bottomTail.svg`),
        fallBody: chrome.runtime.getURL(`img/${furryName}/fallBody.svg`)
    };
    const checkPromises = Object.entries(imgUrls).map(async ([key, url]) => {
        try {
            const res = await fetch(url, { method: 'HEAD' });
            return res.ok ? null : key; // 返回缺失的资源键名
        } catch {
            return key;
        }
    });

    const missingKeys = (await Promise.all(checkPromises)).filter(Boolean);
    if (missingKeys.length) {
        imgUrls = oldImgUrls;
        errInfo = `ERR: 缺失资源文件: ${missingKeys.join(', ')}`
        return false;
    }
    return true;
}
let intervalId;
intervalId = setInterval(() => {
    tryChangeFurry()
}, 50);

window.onload = (() => {
    mouseX = 0, mouseY = document.documentElement.clientHeight / 2;
    mouseDown = false;
    mouseEnter = false;
    updateDoll(false);
    async function animateDoll(lastTime) {
        const damping = 0.88;// 阻尼
        const gravity = 0.05;// 重力
        let now;
        
        if(Date.now() - lastTime >= 10) {
            if(mouseDown || mouseEnter) userAcc = (mouseX - lastMouseX) * 0.015 * Math.PI / 180;
            else userAcc = 0;
            lastMouseX = mouseX, lastMouseY = mouseY;
            now = Date.now();
            let speedTmp = -gravity * Math.sin(dollDeg);
                
            dollVD += (speedTmp + userAcc);
            dollVD *= damping;
            dollDeg += dollVD;

            div.style.setProperty('--deg', `${dollDeg * 180 / Math.PI}deg`);
        }
        else now = lastTime;
        requestAnimationFrame(e => {
            animateDoll(now);
        });

    }
    requestAnimationFrame(e => {
        animateDoll(0);
    });
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
        
        body.src = imgUrls.body;
        body.className = "dollBody";
        body.draggable  = false;
        div.appendChild(body);
        
        hand.src = imgUrls.hand;
        hand.className = "dollHand";
        hand.draggable  = false;
        div.appendChild(hand);
    }
    if(!typ && grabbing) {
        dollX = mouseX - addX;
        dollY = mouseY - addY;
    }
    if(dollY < divHeight / 2) {
        dollY = divHeight / 2;
        dollVY = 0;
    }
    if(dollY > document.documentElement.clientHeight - divHeight / 2) {
        dollY = document.documentElement.clientHeight - divHeight / 2;
        dollVY = 0;
    }
    div.style.left = `calc(${dollX}px)`;
    div.style.top = `calc(${dollY}px)`;

    winWidMult = dollX / document.documentElement.clientWidth;
    winHeiMult = dollY / document.documentElement.clientHeight;
}

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX, mouseY = e.clientY;
    if(mouseDown && (Math.sqrt(Math.pow((mouseX - mouseStartX), 2) + Math.pow((mouseY - mouseStartY), 2)) > 10 || grabbing)) {
        div.style.transformOrigin = "50% 0";
        grabbing = true;
        
        div.style.setProperty('--translate', `-50%, -50%`);

        div.style.cursor = "grabbing";
        if(body.src !== imgUrls.fallBodyOuch) {
            body.src = imgUrls.dragBody;
            hand.src = imgUrls.dragTail;
            hand.style.left = "-75px";
            hand.style.top = "30px";
            hand.style.transformOrigin = "50% 0";
        }
        updateDoll(false);
    }
    else {
        div.style.transformOrigin = "50% 50%";
    }
});

div.addEventListener('mousedown', (e) => {
    grabbing = false;
    if(e.button === 2) {
        mouseDown = false;
        return;
    }
    mouseDown = true;
    mouseStartX = e.clientX, mouseStartY = e.clientY;
    if(dollDire === 1) {
        mouseStartX += divHeight / 2;
        addX = (mouseX + divHeight / 2) - div.offsetLeft;
    }
    else {
        addX = mouseX - div.offsetLeft;
    }
    addY = mouseY - div.offsetTop;
});

document.addEventListener('mouseup', async function (e) {
    mouseDown = false;
    if(e.button === 0) {
        if(grabbing) {
            dollVY = 0;
            body.src = imgUrls.body;
            hand.src = imgUrls.hand;
            hand.style.display = "inline";
            div.style.cursor = "auto";
        }
        else {
            if(dollDire === 0) {
                if(!falling) {
                    body.src = imgUrls.bottomBodyHappy;
                    setTimeout(() => {
                        if(body.src === imgUrls.bottomBodyHappy) body.src = imgUrls.bottomBody;
                    }, 1000);
                    return;
                }
                else {
                    dollVY = 0;
                }
            }
            else {
                body.src = imgUrls.bodyHappy;
                setTimeout(() => {
                    if(body.src === imgUrls.bodyHappy) body.src = imgUrls.body;
                }, 1000);
            }
            hand.src = imgUrls.hand;
            div.style.cursor = "grab";
        }
    }
    grabbing = false;
    if(div.offsetLeft >= document.documentElement.clientWidth * 0.2 && div.offsetLeft <= document.documentElement.clientWidth * 0.8) {
        dollDire = 0;
    }
    else {
        dollVD = 0;
        dollDeg = 0;
        if(div.offsetLeft > document.documentElement.clientWidth / 2) dollDire = 1;
        else dollDire = -1;
    }

    if(dollDire === 0) {
        body.src = imgUrls.fallBody;
        hand.style.display = "none";
        falling = true;
        function runAnimation() {
            return new Promise((resolve) => {
                function animateFall(lastTime) {
                    if(!((!mouseDown || dollY < mouseY + 20) && dollY !== document.documentElement.clientHeight - divHeight / 2) || dollDire !== 0) {
                        resolve();
                        return;
                    }

                    let now;
                    if(Date.now() - lastTime > 10) {
                        now = Date.now();
                        if(mouseDown && dollY > mouseY + 20) dollY = mouseY + 10;
                        addY = mouseY - dollY;
                        dollVY += 0.25;
                        dollY += dollVY;
                        if(dollY > document.documentElement.clientHeight - divHeight / 2) {
                            dollY = document.documentElement.clientHeight - divHeight / 2;
                            dollVY = 0;
                        }
                        updateDoll(true);
                    }
                    else now = lastTime;
                    requestAnimationFrame(() => {
                        animateFall(now);
                    });
                }
                animateFall(0);
            });
        }
        runAnimation().then(() => {
            if(dollDire === 0) {
                if(dollY === document.documentElement.clientHeight - divHeight / 2) falling = false;
                if(!falling) {
                    dollY = document.documentElement.clientHeight - divHeight / 2;
                    updateDoll(true);
                    body.src = imgUrls.bottomBody;
                    div.style.setProperty('--translate', `-50%, -20px`);
                    hand.style.display = "inline";
                    hand.src = imgUrls.bottomTail;
                    hand.style.left = "-60px";
                    hand.style.top = "-40px";
                    hand.style.transformOrigin = "50% 100%";
                }
                else body.src = imgUrls.fallBodyOuch;
            }
        });
    }
    else {
        body.style.top = "0px";
        hand.style.left = "-60px";
        hand.style.top = "-10px";
        hand.style.transformOrigin = "left bottom";

        div.style.setProperty('--scaleX', -dollDire);
        div.style.setProperty('--translate', `${-(50 + dollDire * 46)}%, -50%`);
        while(!mouseDown && !(dollX === 0 || dollX === document.documentElement.clientWidth)) {
            dollVX += 2 * dollDire;
            dollX += dollVX;
            if(dollX < 0 && dollDire === -1) {
                dollVX = 0;
                dollX = 0;
            }
            if(dollX > document.documentElement.clientWidth && dollDire === 1) {
                dollVX = 0;
                dollX = document.documentElement.clientWidth;
            }
            updateDoll(true);
            await sleep(10);
        }
    }
});


div.addEventListener('mouseenter', function() {
    div.style.cursor = "grab";
    mouseEnter = true;
    if(!(Math.abs(tailRad) > 0.03)) oldTime = Date.now();
    animateHand(oldTime);
});

async function animateHand(lastTime) {
    let now = Date.now();

    const elapsed = now - oldTime;

    tailRad = Math.sin(elapsed * 0.3 * Math.PI / 180) * 0.3; 
    if(now - lastTime < 10) {
        now = lastTime;
    }
    hand.style.transform = `rotate(${tailRad}rad)`;

    if (Math.abs(tailRad) > 0.03 || mouseEnter) {
        requestAnimationFrame(() => {
            animateHand(now);
        });
    } else {
        hand.style.transform = 'rotate(0rad)';
    }
}

div.addEventListener('mouseleave', async function (e) {
    div.style.cursor = "auto";
    mouseEnter = false;

    cancelAnimationFrame(animationId);
    hand.style.transform = 'rotate(0rad)';
});

div.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

window.addEventListener("resize", () => {
    dollX = document.documentElement.clientWidth * winWidMult;
    if(!falling && dollDire === 0) dollY = document.documentElement.clientHeight - divHeight / 2;
    else dollY = document.documentElement.clientHeight * winHeiMult;
    updateDoll(true);
})

const observer = new MutationObserver((mutations) => {
    updateDoll(false);
});
observer.observe(document.body, {
	childList: true,
	subtree: true,
	attributes: true,
	attributeFilter: ['style']
});