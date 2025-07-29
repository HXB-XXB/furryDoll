let furryNameList = [
];
let furryName = null; // 默认模型，每次onload时生成

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    chrome.storage.local.set({ state: extensionState });
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
    else if (message.type === 'updateError') {
        chrome.storage.local.set({
            err: message.err
        });
        sendResponse({status: 'stored'});
    }
    else if (message.type === 'cleanError') {
        chrome.storage.local.set({
            err: ""
        });
        sendResponse({status: 'stored'});
    }
    return true;
});

// 保存状态到本地存储
let extensionState = {
  lastRun: new Date().toISOString(),
  data: {}
};

// 启动时恢复状态
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(['state'], (result) => {
        if (result.state) {
        extensionState = result.state;
        console.log('State restored:', extensionState);
        }
    });
});

// 定期保存状态
setInterval(() => {
    chrome.storage.local.set({ state: extensionState });
}, 1000);

// 监听安装事件
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});