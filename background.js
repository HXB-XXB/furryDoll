let furryNameList = [
];
let furryName = null; // 默认模型，每次onload时生成

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'updatePopup') {
        console.log(message.imgUrl);
        furryName = message.name;
        furryNameList.push({
            imgUrl: message.imgUrl,
            name: message.name
        });
        chrome.storage.local.set({
            imgUrl: message.imgUrl,
            name: message.name
        });
        sendResponse({status: 'stored'});
    }
    else if (message.type === 'updateContent') {
        chrome.storage.local.set({
            fileName: message.fileName
        });
        sendResponse({status: 'stored'});
    }
    else if (message.type === 'getAllFurries') {
        chrome.storage.local.set({
            list: furryNameList,
            nwFurryName: furryName
        });
        sendResponse({status: 'stored'});
    }
    else if (message.type === 'getFurryName') {
        chrome.storage.local.set({
            furryName: furryName
        });
        sendResponse({status: 'stored'});
    }
    return true;
});