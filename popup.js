let furryName = null;
let lastName = "xxbDark";
let furryNameList = [];
function addFurry(url, name) {
    if(document.getElementById(name) || !name) return;
    if(document.getElementById("loadingTxt")) {
        document.getElementById("loadingTxt").remove();
    }
    furryNameList.push({
        imgUrl: url,
        name: name
    });

    let div = document.createElement("li");
    div.id = name;
    div.className = "li";
    div.innerHTML = `<br>`;
    document.getElementById("furryList").appendChild(div);

    div.addEventListener('click', () => {
        document.getElementById(`${lastName}UseTips`).style.display = "none";
        document.getElementById(`${name}UseTips`).style.display = "block";
        lastName = name;
        chrome.runtime.sendMessage({
            type: 'updateContent',
            fileName: name
        });
    });

    let icon = document.createElement("img");
    icon.src = url;
    icon.className = "img";
    div.appendChild(icon);
    
    let useTxtTxt = document.createElement("h3");
    useTxtTxt.id = `${name}UseTips`;
    useTxtTxt.textContent = "[使用中]";
    useTxtTxt.className = "useTxt";
    div.appendChild(useTxtTxt);

    let nameTxt = document.createElement("h3");
    nameTxt.textContent = name;
    nameTxt.className = "txt";
    div.appendChild(nameTxt);
}

function closeChooseFilePage() {
    let div = document.getElementById("newFurry");
    let ipt = document.getElementById("inputDiv");
    let btn = document.getElementById("addBtn");
    div.style.transform = "translate(-50%, calc(-100% - 25px)) rotate(0deg)";
    btn.style.top = "0px";
    btn.style.opacity = "1";
    ipt.style.display = "none";
    ipt.style.opacity = "0";
}

chrome.runtime.sendMessage({
    type: 'getAllFurries',
});
setInterval(() => {
    if(furryNameList.length > 0) return;
    chrome.storage.local.get(['list', 'nwFurryName'], (data) => {
        furryName = data.nwFurryName;
        for(let i = 0; i < data.list.length; i++) {
            addFurry(data.list[i].imgUrl, data.list[i].name);
        }
        document.getElementById(`${lastName}UseTips`).style.display = "none";
        document.getElementById(`${furryName}UseTips`).style.display = "block";
        lastName = furryName;
    });
}, 500);

setInterval(() => {
    chrome.storage.local.get(['imgUrl', 'name'], (data) => {
        if(furryName === data.name) return;
        furryName = data.name;
        addFurry(data.imgUrl, data.name);
    });
}, 500);

let close = document.getElementById("close");
close.addEventListener('click', closeChooseFilePage);

let enter = document.getElementById("enter");
enter.addEventListener('click', async () => {
    chrome.runtime.sendMessage({
        type: 'updateContent',
        fileName: document.getElementById("inputDiv").querySelector("input").value
    });
    document.getElementById("inputDiv").querySelector("input").value = "";
    closeChooseFilePage();
});


document.getElementById('addBtn').addEventListener('click', async () => {
    let div = document.getElementById("newFurry");
    let ipt = document.getElementById("inputDiv");
    let btn = document.getElementById("addBtn");
    div.style.transform = "translate(-50%, calc(-100% - 25px)) rotate(180deg)";
    btn.style.top = "45px";
    btn.style.opacity = "0";
    ipt.style.display = "block";
    ipt.style.opacity = "1";
});