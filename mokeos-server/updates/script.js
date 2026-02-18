const WINDOW_MANAGER_SELECTOR = ".window-manager";
const WINDOW_DRAG_HANDLE_CLASS = ".window-drag-handle";
const WINDOW_APP_NAME_CONTAINER = ".current_app__name button";
const CURRENT_OS_VERSION = "Aurora 1.0 Beta";
const UPDATE_SERVER_URL = 'https://raw.githubusercontent.com/d4nilin0n-hue/d4nilin0n-hue.github.io/refs/heads/main/mokeos-server/updates/update.json';
const FileSystem_root = 'http://127.0.0.1:7777';
const __SYSTEM__WATCHDOG = new BroadcastChannel("__SYSTEM__WATCHDOG-for_mokeOS");

const MOKE_APP_ROOT = "/var/fs/applications/";

let appsCtt__ = 0;
let zCounter = 10;
let currentAppClass = "Workspace";

let isLocked = true;
let pressedKeys = {};

const $desktop = $("#desktop");
const $lockscreen = $(".lockscreen");
const $sherlock = $(".sherlock");
let $IS_SherLoCK_shownQM = false;

const OPENED_APPS = []

window.MokeOS = window.MokeOS || {};
const os_dates = {
    "long": {
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    },
    "short": {
        months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    }
}
//Permissions for apps
const webcam_permit = new BroadcastChannel("OS_webcam_permit");
const microphone_permit = new BroadcastChannel("OS_microphone_permit");
const filesystem_permit = new BroadcastChannel("OS_filesystem_permit");


const alert = (content = "") => {
    if(document.querySelector("mokeos-alert-container")) return;
    const alert_element_temp_system = document.createElement("mokeos-alert-container");
    const alert_alert_temp_system_os = document.createElement("mokeos-alert-element");
    alert_alert_temp_system_os.innerHTML = `
        <mokeos-alert-text>${content}</mokeos-alert-text>
        <mokeos-alert-button><p>Ok</p></mokeos-alert-button>
    `;

    alert_alert_temp_system_os.querySelector("mokeos-alert-button")
    .addEventListener("click", () => {
        alert_alert_temp_system_os.style.opacity = "0";
        alert_element_temp_system.style.opacity = "0";
        setTimeout(() => {
            alert_element_temp_system.remove();
        }, 500);
    });
    alert_element_temp_system.appendChild(alert_alert_temp_system_os);
    document.body.appendChild(alert_element_temp_system);
};

const prompt = (content = "") => {
    return new Promise((resolve) => {

        if(document.querySelector("mokeos-alert-container")) return;

        const alert_element_temp_system = document.createElement("mokeos-alert-container");
        const alert_alert_temp_system_os = document.createElement("mokeos-alert-element");

        alert_alert_temp_system_os.innerHTML = `
            <mokeos-alert-text>${content}</mokeos-alert-text>
            <br>
            <input type="text" data-mokeos-prompt-input>
            <mokeos-alert-button><p>Ok</p></mokeos-alert-button>
        `;
        alert_alert_temp_system_os
            .querySelector("mokeos-alert-button")
            .addEventListener("click", () => {

                const value = alert_alert_temp_system_os
                    .querySelector("[data-mokeos-prompt-input]").value;

                alert_alert_temp_system_os.style.opacity = "0";
                alert_element_temp_system.style.opacity = "0";

                setTimeout(() => {
                    alert_element_temp_system.remove();
                    resolve(value);
                }, 300);
            });

        alert_element_temp_system.appendChild(alert_alert_temp_system_os);
        document.body.appendChild(alert_element_temp_system);
        alert_alert_temp_system_os.querySelector("[data-mokeos-prompt-input]").focus()
    });
};

const confirm = (content = "") => {
    return new Promise((resolve) => {
        if(document.querySelector("mokeos-confirm-container")) return;

        const container = document.createElement("mokeos-confirm-container");
        const modal = document.createElement("mokeos-confirm-element");

        modal.innerHTML = `
            <mokeos-confirm-text>${content}</mokeos-confirm-text>
            <mokeos-confirm-buttons>
                <mokeos-confirm-btn data-action="cancel"><p>Cancel</p></mokeos-confirm-btn>
                <mokeos-confirm-btn data-action="ok" class="primary"><p>Ok</p></mokeos-confirm-btn>
            </mokeos-confirm-buttons>
        `;

        modal.querySelectorAll("mokeos-confirm-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const action = btn.getAttribute("data-action");

                modal.style.opacity = "0";
                container.style.opacity = "0";

                setTimeout(() => container.remove(), 300);

                resolve(action === "ok");
            });
        });

        container.appendChild(modal);
        document.body.appendChild(container);
    });
};

async function loadFileContentSync(path) {
    const request = new XMLHttpRequest();
    request.open('GET', path, false); 
    try {
        request.send(null);
        if (request.status === 200 || request.status === 0) {
            return JSON.parse(request.responseText);
        }
    } catch (e) {
        return null; 
    }
    return null;
}

async function listAppFoldersSync(path) {
    const request = new XMLHttpRequest();
    request.open('GET', path, false); 
    
    try {
        request.send(null);
        
        if (request.status === 200 || request.status === 0) {
             const parser = new DOMParser();
             const doc = parser.parseFromString(request.responseText, 'text/html');
             
             const links = doc.querySelectorAll('a');
             const folders = [];

             links.forEach(link => {
                 const folderName = link.getAttribute('href'); 
                 
                 if (folderName && folderName.endsWith('.mapp') && folderName !== '../') {
                     folders.push(folderName.slice(0, -5)); 
                 }
             });
             return folders;
        }
    } catch (e) {
        console.error("Sherlock Directory Load Failed:", e);
    }
    return [];
}
const SystemCore = {
    checkUpdates: async function() {
        console.log("[Update Daemon] Checking Moke Inc. cloud servers...");
        try {
            const response = await fetch(UPDATE_SERVER_URL);
            if (!response.ok) return;

            const updateData = await response.json();
            
            if (updateData.latest_version !== CURRENT_OS_VERSION) {
                SystemCore.showUpdateModal(updateData)
            }
        } catch (e) {
            console.error("[Update Daemon] Error conectando con GitHub:", e);
        }
    },
    showUpdateModal: async function(updateData) {
        const changes = updateData.changelog.map(item => `• ${item}`).join('\n');
        
        const userAccepted = await confirm(
            `${updateData.latest_version} version available.<br> Would you like to download and install now? System will restart.`
        );

        if (userAccepted) {
            this.startUpdate(updateData);
        }
    },

    startUpdate: async function(updateData) {
        try {
            console.log("[OTA] Iniciando transferencia de archivos al motor de instalación...");
            
            const updatePayload = {
                version: updateData.latest_version,
                files: updateData.files || [] 
            };

            const response = await fetch(`${FileSystem_root}/server-side/install-update`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatePayload)
            });

            if (response.ok) {
                const result = await response.json();
                console.log("[OTA] Servidor respondió:", result.message);

                NotificationCore.notify("Moke Update", "Preparing restart...", "success");
                
                // Guardamos el flag para el post-reboot
                localStorage.setItem("update-completed", updateData.latest_version);
                
                lock(); 

                setTimeout(() => {
                    $(".boot").fadeIn("fast");
                    setTimeout(() => {
                        window.location.href = "/var/recovery/update.html";
                    }, 1000);
                }, 3000);

            } else {
                // El servidor respondió, pero con un error (404, 500, etc.)
                const errorData = await response.json();
                throw new Error(errorData.message || "Server Error");
            }

        } catch (error) {
            console.error("OTA Error Details:", error);
            // Si el error es de conexión, mostramos un mensaje claro
            NotificationCore.notify("Update Error", "Connection failed: Check if filesystem.py is running on port 7777", "error");
        }
    },
    
    showRestartPrompt: function(newVersion) {
        const notificationElement = NotificationCore.notify("System Core", 
            `A critical update (v${newVersion}) is ready. Please restart Moke OS.`, 
            "error"); 
    },
    supportedImagesFormats: ["png", "jpg", "jpeg", "svg", "webp"]
};
const UserCore = {
    settings: {
        ui: {
            brightness: 100,
            nightshift: "false",
        },
        desktop: {
            wallpaper: "/var/wallpapers/mountains.jpg",
        }
    },
    currentUser: null,
    saveSettings: function(){
        localStorage.setItem("SystemCore.settings", JSON.stringify(SystemCore.settings));
    },
    loadSettings: function(){
        if(localStorage.getItem("SystemCore.settings")){
            UserCore.settings = JSON.parse(localStorage.getItem("SystemCore.settings"));
            document.querySelector(".brightness-layer").style.opacity = (101 - UserCore.settings.brightness) / 100;
            const nightshift_layer = document.querySelector(".nightshift-layer");
            if(UserCore.settings.nightshift === "true"){
                nightshift_layer.style.opacity = "1";
            } else {
                nightshift_layer.style.opacity = "0";
            }
        }
    },
}
function authenticate() {
    $lockscreen.animate({ scale: ".95", opacity: "0" });
    $lockscreen.fadeOut("fast");
    $desktop.show();
    $desktop.animate({ scale: "1", opacity: "1" });
    isLocked = false;
    document.querySelector(".screensaver").pause();

    UserCore.currentUser = "guest";
    if(localStorage.getItem("update-completed")){
        alert("Update completed.")
        localStorage.removeItem("update-completed");
        return;
    }
    SystemCore.checkUpdates();
}
function lock() {
    $desktop.animate({ scale: ".98", opacity: "0" });
    $desktop.fadeOut("fast");
    $lockscreen.show();
    $lockscreen.animate({ scale: "1", opacity: "1" });
    isLocked = true;
    document.querySelector(".screensaver").play();
}
function setFocusOnWindow(windowElement) {
    const $windowElement = $(windowElement);
    const appName = $windowElement.attr('data-app-name') || "Workspace";
    
    const windowId = $windowElement.attr('class').split(' ').find(c => 
        c !== 'window' && c !== 'window-instance' && c !== 'focused' && !c.includes('ui-')
    );

    $('.window.focused').removeClass('focused');
    
    OPENED_APPS.forEach(app => {
        if (app.status === "focused") {
            app.status = "running";
        }
    });

    zCounter++;
    $windowElement.css('z-index', zCounter);
    $windowElement.addClass('focused');
    
    $(WINDOW_APP_NAME_CONTAINER).html(appName);
    currentAppClass = windowId;

    const process = OPENED_APPS.find(app => app.id === windowId);
    if (process) {
        process.status = "focused";
    }
}

function focusTopWindowAfterClose() {
    const remainingWindows = document.querySelectorAll('.window-manager .window');
    
    if (remainingWindows.length === 0) {
        $(WINDOW_APP_NAME_CONTAINER).html("Workspace");
        currentAppClass = "Workspace";
        return;
    }

    let topWindow = null;
    let maxZIndex = -1;

    remainingWindows.forEach(win => {
        const z = parseInt(win.style.zIndex || 0); 
        if (z > maxZIndex) {
            maxZIndex = z;
            topWindow = win;
        }
    });

    if (topWindow) {
        setFocusOnWindow(topWindow);
    }
}
async function WINDOW_OPEN(app, dataPayload) {
    let appBaseName = String(app).replace('.mapp', '');
    appBaseName = appBaseName.split('/').pop().replace(/\.+/g, '').trim();

    let specs;
    try {
        const fullSpecPath = `${MOKE_APP_ROOT}${appBaseName}.mapp/specs.json`;
        const response = await fetch(fullSpecPath); 
        
        if (!response.ok) {
            throw new Error(`Specs not found for app: ${appBaseName} at path: ${fullSpecPath}`);
        }
        specs = await response.json();
        
    } catch (error) {
        console.error(`System Error: Could not initialize app "${appBaseName}".`, error);
        
        if (error.name === 'TypeError' || error.name === 'SecurityError') {
             console.error(`[Moke Protocol Error] Permissions: Ensure Firefox preference 'security.fileuri.strict_origin_policy' is set to FALSE.`);
        }
        return; 
    }

    const $__AppleT = $("<div>").addClass("window").addClass("window-instance").appendTo(WINDOW_MANAGER_SELECTOR);
    appsCtt__++;

    let windowClass = `${appBaseName}${appsCtt__}`; 
    windowClass = windowClass.replace(/\.\.\//g, '').replace(/\//g, '');
    if(windowClass.includes('/')) {
        windowClass = windowClass.split('/').pop();
    }
    if(windowClass.includes('../')) {
        windowClass = windowClass.replace('../', '');
    }
    if(windowClass.includes('../../')) {
        windowClass = windowClass.replace('../../', '');
    }

    $__AppleT.addClass(windowClass);
    $__AppleT.attr('data-app-name', specs.name); 
    const dock_mini_app = document.createElement("li");
    const dock_mini_app_img = document.createElement("img");
    dock_mini_app_img.src = `${MOKE_APP_ROOT}${appBaseName}.mapp/icon.svg`;
    dock_mini_app.appendChild(dock_mini_app_img);
    dock_mini_app.classList.add("dock-mini-app");
    dock_mini_app.setAttribute("data-app-name", windowClass);
    dock_mini_app.addEventListener("click", () => {
        const windowClass = $__AppleT.attr('class').split(' ').find(c => c.startsWith(appBaseName));
        if ($__AppleT.is(":visible")) {
            WINDOW_MINIMIZE(windowClass);
        } else {
            for(var i in OPENED_APPS){
                if(OPENED_APPS[i].id === windowClass){
                    OPENED_APPS[i].status = "running";
                    console.log(OPENED_APPS)
                    break;
                }
            }
            setFocusOnWindow($__AppleT[0]);
            $__AppleT.show();
            $__AppleT.animate({ scale: "1", opacity: "1" });
            if($__AppleT.hasClass("fullscreenapp__STYLE")){
                $__AppleT.addClass("fullscreenapp__STYLE");
                document.getElementById("desktop").style.left = "-100%";
                document.querySelector(".window-manager").style.left = "150%";
                document.querySelector(".window-manager").style.top = "0";
                document.querySelector(".window-manager").style.height = "100%";
            }
        }
    });
    document.querySelector(".charms .dock").appendChild(dock_mini_app);

    $__AppleT.html(`
        <iframe src="/var/fs/applications/${app}.mapp/index.html" frameborder="0"></iframe>
        <header>
            <div class="window-close-btn" onclick="WINDOW_CLOSE('${windowClass}')"></div>
            <div class="window-maximize-btn" onclick="WINDOW_MAXIMIZE('${windowClass}')"></div>
            <div class="window-minimize-btn" onclick="WINDOW_MINIMIZE('${windowClass}')"></div>
            <div class="${WINDOW_DRAG_HANDLE_CLASS.substring(1)}" style="margin-top: -15px">
                <span class="window-title">${specs.name}</span>
            </div>
        </header>
    `);


    var app_process = {
        name: specs.name,
        id: windowClass,
        opendate: new Date(),
        status: "starting",
        last_pulse: 0
    }

    if (specs.minimizable === false) {
        $__AppleT.find('.window-minimize-btn').remove();
    }
    if (specs.resizable === false) {
        $__AppleT.find('.window-maximize-btn').remove();
    }

    $sherlock.removeClass("focus").fadeOut("fast");

    
    if (specs.quick_settings) {
    for (var category in specs.quick_settings) {
        
        const menuSelector = category === 'File' ? ".file_menu_dropdown .dropdown-content" : 
                             category === 'Help' ? ".help_menu_dropdown .dropdown-content" : 
                             null;
        
        $(menuSelector).empty();
        
        if (menuSelector && specs.quick_settings[category]) {
            for (var i in specs.quick_settings[category]) {
                (function(itemName, funcCode) { 
                    var quickSetting = document.createElement("a");
                    
                    quickSetting.addEventListener("click", () => {
                        
                        const iframeElement = $__AppleT.find('iframe')[0];
                        const iframeWindow = iframeElement ? iframeElement.contentWindow : null;

                        if (iframeWindow) {
                            try {
                                iframeWindow.eval(funcCode);
                                console.log(`[QuickSettings] Executed: ${funcCode} in ${itemName}`);
                            } catch (e) {
                                console.error(`[QuickSettings] Error executing ${funcCode}:`, e);
                            }
                        } else {
                            console.error("Moke OS: Could not access target iframe window context.");
                        }
                    });
                    
                    quickSetting.textContent = itemName; 
                    $(menuSelector).append(quickSetting);

                })(i, specs.quick_settings[category][i]); 
            }
        } else {
            
        }
    }
}


    if (specs.size) {
        const [width, height] = specs.size.split('x');
        $__AppleT.css({ width: width + "px", height: height + "px" });
    }

    if (specs.window_type === "full") {
        $__AppleT.addClass("fullscreenapp");
        $__AppleT.find('header .window-title').remove();
    }

    if (specs.draggable) {
        $__AppleT.draggable({
            containment: WINDOW_MANAGER_SELECTOR, 
            
            start: function() {
                setFocusOnWindow(this);
                $(this).find('iframe').css('pointer-events', 'none');
            },
            stop: function() {
                $(this).find('iframe').css('pointer-events', 'auto');
            }
        });
    }

    if (specs.resizable) {
        $__AppleT.resizable({ 
            containment: WINDOW_MANAGER_SELECTOR,
            minHeight: 150, 
            minWidth: 200,

            start: function() {
                setFocusOnWindow(this);
                $(this).find('iframe').css('pointer-events', 'none');
            },
            stop: function() {
                $(this).find('iframe').css('pointer-events', 'auto');
            }
        });
    } else {
        $__AppleT.addClass("not-resizable");
    }

    $__AppleT.css({ opacity: "0", scale: "0.95" });
    setFocusOnWindow($__AppleT[0]);
    

    $__AppleT.animate({ scale: "1", opacity: "1" });
    $__AppleT.data('pid', windowClass);
    
    const iframeElement = $__AppleT.find('iframe')[0];
iframeElement.onload = () => {
    const iframeWindow = iframeElement.contentWindow;
    const iframeDoc = iframeWindow.document;

    if (!iframeDoc || iframeDoc.location.href === "about:blank") {
        console.warn("[MokeOS] Iframe not ready, skipping injection");
        return;
    }

    const script = iframeDoc.createElement("script");
    const meta = iframeDoc.createElement("meta");
    script.src = "/var/fs/applications/workspace.mapp/global.js";
    meta.setAttribute("name", "mokeos-app-name");
    meta.setAttribute("content", windowClass);
    OPENED_APPS.forEach(a => { if(a.status === "focused") a.status = "running"; });
    app_process.status = "focused";

    OPENED_APPS.push(app_process);
    console.log(OPENED_APPS)
    script.onload = () => {
        if (dataPayload) {
            try {
                if (typeof iframeWindow.handlePayload === "function") {
                    iframeWindow.handlePayload(dataPayload);
                    console.log("[Moke Protocol] Payload via handlePayload()");
                } else {
                    iframeWindow.eval(dataPayload);
                    console.log("[Moke Protocol] Payload via eval()");
                }
            } catch (e) {
                console.error(`[Moke Protocol] Payload failed in "${app}":`, e);
            }
        }
    };

    iframeDoc.head.appendChild(script);
    iframeDoc.head.appendChild(meta);
};

}
function WINDOW_MINIMIZE(windowClass) {
    const $windowToMinimize = $('.' + windowClass);
    
    if ($windowToMinimize.length === 0) {
        console.warn(`Attempted to minimize non-existent window: ${windowClass}`);
        return;
    }
    $windowToMinimize.animate({ scale: '.9', opacity: '0' }, 300, function() {
        $windowToMinimize.hide();
        document.getElementById("desktop").style.left = "50%";
        document.querySelector(".window-manager").style.left = "0";
        document.querySelector(".window-manager").style.top = "25px";
        document.querySelector(".window-manager").style.height = "calc(100% - 25px)";
    });

    for(var i in OPENED_APPS){
        if(OPENED_APPS[i].id === windowClass){
            OPENED_APPS[i].status = "minimized";
            console.log(OPENED_APPS)
            break;
        }
    }
}
function WINDOW_MAXIMIZE(windowClass) {
    const $windowToMaximize = $('.' + windowClass);
    
    if ($windowToMaximize.length === 0) {
        console.warn(`Attempted to maximize non-existent window: ${windowClass}`);
        return;
    }

    if ($windowToMaximize.hasClass("fullscreenapp__STYLE")) {
        $windowToMaximize.removeClass("fullscreenapp__STYLE");
        document.getElementById("desktop").style.left = "50%";
        document.querySelector(".window-manager").style.left = "0";
        document.querySelector(".window-manager").style.top = "25px";
        document.querySelector(".window-manager").style.height = "calc(100% - 25px)";
    } else {
        $windowToMaximize.addClass("fullscreenapp__STYLE");
        document.getElementById("desktop").style.left = "-100%";
        document.querySelector(".window-manager").style.left = "150%";
        document.querySelector(".window-manager").style.top = "0";
        document.querySelector(".window-manager").style.height = "100%";
    }
}
function WINDOW_CLOSE(windowClass) {
    const $windowToClose = $('.' + windowClass);
    for(var i in OPENED_APPS){
        if(OPENED_APPS[i].id === windowClass){
            OPENED_APPS.splice(i, 1);
            console.log(OPENED_APPS)
            break;
        }
    }
    
    if ($windowToClose.length === 0) {
        console.warn(`Attempted to close non-existent window: ${windowClass}`);
        return;
    }
    $windowToClose.animate({ scale: '.95', opacity: '0' });
    
    $windowToClose.fadeOut(400, function() { 
        this.remove(); 
        focusTopWindowAfterClose();
    });

    const appName = $windowToClose.attr('data-app-name');
        document.getElementById("desktop").style.left = "50%";
        document.querySelector(".window-manager").style.left = "0";
        document.querySelector(".window-manager").style.top = "25px";
        document.querySelector(".window-manager").style.height = "calc(100% - 25px)";
    if (appName) {
        const $dockIcon = $(`.dock-mini-app[data-app-name="${windowClass}"]`);
        $dockIcon.remove();
    }
}
function SHERLOCK_OPEN() {
    if($IS_SherLoCK_shownQM === false){
        $sherlock.fadeIn("fast");
        $sherlock.find("input").focus();
        $sherlock.addClass("focus");
        $IS_SherLoCK_shownQM = true;
    }   else {
        $sherlock.fadeOut("fast");
        $sherlock.removeClass("focus");
        $IS_SherLoCK_shownQM = false;
    }
}
function showSherlockResults(input) {
    const $resultsContainer = $(".sherlock .results");
    $resultsContainer.show();
    
    fetch('./var/fs/applications/')
        .then(response => {
            if (!response.ok) {
                throw new Error("Server directory listing failed.");
            }
            return response.text();
        })
        .then(data => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');
            const links = doc.querySelectorAll('a');
            const appFetchPromises = [];

            links.forEach(link => {
                const folderName = link.getAttribute('href');
                
                if (folderName && folderName.endsWith('.mapp')) {
                    const appFolder = folderName.slice(0, -5); 
                    const appPromise = fetch(`${appFolder}.mapp/specs.json`)
                        .then(res => {
                            if (!res.ok) {
                                return { error: true, reason: `Specs not found for ${appFolder}` }; 
                            }
                            return res.json().then(specs => ({ 
                                appFolder: appFolder, 
                                name: specs.name,
                                hidden: specs.hidden
                            }));
                        })
                        .catch(error => {
                            console.error(`Error fetching specs for ${appFolder}:`, error);
                            return { error: true, reason: `Fetch error for ${appFolder}` };
                        });
                        
                    appFetchPromises.push(appPromise);
                }
            });
            return Promise.all(appFetchPromises);
        })
        .then(appsData => {
            let resultsHTML = '';
            appsData.forEach(app => {
                 if (!app.error && app.name && app.name.toLowerCase().includes(input.toLowerCase()) && !app.hidden) {
                        resultsHTML += `
                        <div class="sherlock_result_item app_sherlock_result" 
                             onclick="WINDOW_OPEN('${app.appFolder.replace("/var/fs/applications/", "")}'); $IS_SherLoCK_shownQM = false;"
                             data-app-folder="${app.appFolder}">
                             <img src="${app.appFolder}.mapp/icon.svg" alt="">
                            <span class="app-name">${app.name}</span>
                            <span class="app-type">App</span>
                        </div>
                    `;
                } else if(input === "system.command--sherlock:list-all-apps"){
                    if(!(app.hidden)){
                        resultsHTML += `
                        <div class="sherlock_result_item app_sherlock_result" 
                             onclick="WINDOW_OPEN('${app.appFolder.replace("/var/fs/applications/", "")}'); $IS_SherLoCK_shownQM = false;"
                             data-app-folder="${app.appFolder}">
                             <img src="${app.appFolder}.mapp/icon.svg" alt="">
                            <span class="app-name">${app.name}</span>
                            <span class="app-type">App</span>
                        </div>
                        `;
                    }
                }
            });
            
            
            const googleSearchURL = `https://www.google.com/search?q=${encodeURIComponent(input)}&igu=1`;
            const wikipediaSearchURL = `https://en.wikipedia.org/wiki/${encodeURIComponent(input)}`;

            if(/^[+-]?\d*\.?\d+(?:[+\-*/][+-]?\d*\.?\d+)*$/.test(input)){
                    resultsHTML += `
                    <div class="sherlock_result_item" 
                    onclick="WINDOW_OPEN('calculator'); $IS_SherLoCK_shownQM = false;" 
                    data-app-folder="calculator_result">
                        <span class="app-name" style="font-size: 50px;">${eval(input)}</span>
                        <span class="app-type">Calculator</span>
                    </div>
                    `;
            }

            if(input.trim() !== "" && input != "system.command--sherlock:list-all-apps") {
                resultsHTML += `
                    <div class="sherlock_result_item" 
                    onclick="WINDOW_OPEN('andromeda', 'uriSearch(\'\'${googleSearchURL}\'\')'); $IS_SherLoCK_shownQM = false;" 
                    data-app-folder="google_search">
                        <span class="app-name">Search Google for "${input}"</span>
                        <span class="app-type">Andromeda Search</span>
                    </div>
                    <div class="sherlock_result_item" 
                    onclick="WINDOW_OPEN('andromeda', 'uriSearch(\'${wikipediaSearchURL}\')')" 
                    data-app-folder="google_search">
                        <span class="app-name">Search with Wikipedia for "${input}"</span>
                        <span class="app-type">Andromeda Search</span>
                    </div>
                `;
            }
            if (resultsHTML.length === 0) {
                 $resultsContainer.html(`
                    
                `)
            } else {
                 if(input.trim() === "") {
                    $resultsContainer.html(`
                        
                    `);
                 } else {
                    if(input === "system.command--sherlock:list-all-apps"){
                        document.querySelector(".sherlock input").value = "";
                        $resultsContainer.html(`
                        ${resultsHTML}
                        `)
                     } else {
                        $resultsContainer.html(`
                        <p class="sherlock_title">Results for "${input}"</p>
                        ${resultsHTML}
                        <br>
                        `)
                    }
                 }
            }

        })
        .catch(error => {
            console.error("Sherlock search failed:", error);
            $resultsContainer.html('<div class="error-message">Error fetching apps.</div>');
        });

    
}

__SYSTEM__WATCHDOG.onmessage = (e) => {
    const appId = e.data.split(":")[1];
    
    const process = OPENED_APPS.find(app => app.id === appId);
    if (process) {
        process.last_pulse = Date.now();
        
        if (process.status === "frozen") {
            process.status = "running";
            console.log(`[Watchdog] App ${appId} recovered.`);
        }
    }
};

function updateClock() {
    const date = new Date();
    const hour = date.getHours();
    const day = date.getDay();
    const dayNumber = date.getUTCDate()
    const month = date.getMonth();
    let minu = date.getMinutes();

    if (minu < 10) {
        minu = "0" + minu;
    }
    const timeString = `${hour}:${minu}`;
    const dateString = `${os_dates.short.days[day]} ${dayNumber} ${os_dates.short.months[month]}`;
    document.querySelectorAll(".clock p").forEach(e => {
        e.textContent = timeString;
    });
    document.querySelectorAll(".date p").forEach(e => {
        e.textContent = dateString;
    });
}
setInterval(() => {
    updateClock();
}, 1000);
document.querySelector(WINDOW_MANAGER_SELECTOR).addEventListener('mousedown', (event) => {
    const windowElement = event.target.closest('.window');
    
    if (windowElement && !windowElement.classList.contains('focused')) {
        setFocusOnWindow(windowElement);
    }
});
document.addEventListener('keydown', (event) => {
  pressedKeys[event.key] = true; 
  if (pressedKeys['Control'] && pressedKeys[' ']) {
    SHERLOCK_OPEN();
    event.preventDefault(); 
  }
  if (pressedKeys['Control'] && pressedKeys['l']) {
    lock();
    event.preventDefault(); 
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    $sherlock.removeClass("focus").fadeOut("fast");
    $IS_SherLoCK_shownQM = false;
  }
});

document.addEventListener('keyup', (event) => {
  pressedKeys[event.key] = false; 
});

const NotificationCore = {
    container: document.querySelector('.notifications-container'),
    
    notify(title, message, type = 'info') {
        if (!NotificationCore.container) return;

        const notificationElement = document.createElement('div');
        notificationElement.className = `moke-notification type-${type}`;
        
        notificationElement.innerHTML = `
            <div class="notification-header">${title}</div>
            <div class="notification-body">${message}</div>
        `;
        NotificationCore.container.appendChild(notificationElement);
        
        setTimeout(() => {
            notificationElement.classList.add('entering');
        }, 10);
        setTimeout(() => {
            notificationElement.classList.remove('entering');
            notificationElement.classList.add('leaving');

            setTimeout(() => {
                notificationElement.remove();
            }, 500); 
        }, 6000); 
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const bootScreen = document.querySelector(".boot");
    const screensaverVideo = document.querySelector(".screensaver");
    
    if (bootScreen && screensaverVideo) {   
        setTimeout(() => {
            $(".boot").fadeOut("fast")
        }, 4000)
    }   
});

window.MokeOS = window.MokeOS || {};
window.MokeOS.notify = NotificationCore.notify;
window.MokeOS.checkUpdates = SystemCore.checkUpdates;

//Settings listener
const __SettINGS_brightness_control = new BroadcastChannel("__SettINGS_brightness_control");
const __SettINGS_nightshift_control = new BroadcastChannel("__SettINGS_nightshift_control");

__SettINGS_brightness_control.onmessage = (e) => {
    document.querySelector(".brightness-layer").style.opacity = (101 - e.data) / 100;
    UserCore.settings.ui.brightness = e.data;

    UserCore.saveSettings();
}
__SettINGS_nightshift_control.onmessage = (e) => {
    const nightshift_layer = document.querySelector(".nightshift-layer");
    if(e.data === "true"){
        nightshift_layer.style.opacity = "1";
        UserCore.settings.ui.nightshift = "true";
    } else {
        nightshift_layer.style.opacity = "0";
        UserCore.settings.ui.nightshift = "false";
    }

    UserCore.saveSettings();
}
UserCore.loadSettings();

document.addEventListener('contextmenu', event => {
  event.preventDefault();
});
async function isWallpaperDark(imageSource, umbral = 100) {
  const image = await new Promise((resolve, reject) => {
    if (imageSource instanceof HTMLImageElement && imageSource.complete) {
      return resolve(imageSource);
    }
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSource.src || imageSource; 
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = image.width;
  canvas.height = image.height;
  
  ctx.drawImage(image, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  let brightnessSum = 0;
  let counter = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const brightness = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
    brightnessSum += brightness;
    counter++; 
  }
  
  const mediumBrightness = brightnessSum / counter;
  return mediumBrightness < umbral;
}
(async () => {
    const wallpaper = UserCore.settings.desktop.wallpaper;

    if (wallpaper.endsWith("mp4")) {
        const screensaver = document.querySelector(".screensaver");
        screensaver.src = wallpaper;
        screensaver.style.display = "block";
        document.querySelector(".wallpaper__system").style.display = "none";
    } else {
        const formats = SystemCore.supportedImagesFormats;
        
        for (const format of formats) {
            if (wallpaper.endsWith(format)) {
                document.querySelector(".screensaver").style.display = "none";
                const systemWallpaper = document.querySelector(".wallpaper__system");
                systemWallpaper.style.display = "block";
                systemWallpaper.src = wallpaper;
                const isDark = await isWallpaperDark(wallpaper);
                
                if (isDark) {
                    document.querySelectorAll("#desktop .top div button, p, .dropdown-content a").forEach((e) => {
                        e.style.color = "white";
                    })
                } else {
                    document.querySelectorAll("#desktop .top div button, p, .dropdown-content a").forEach((e) => {
                        e.style.color = "black";
                    })
                }
                break;
            }
        }
    }
})();
setInterval(() => {
    const now = Date.now();
    const TIMEOUT_THRESHOLD = 5000;

    OPENED_APPS.forEach(app => {
        if (app.status !== "starting" && app.status !== "minimized") {
            if (app.last_pulse !== 0 && (now - app.last_pulse) > TIMEOUT_THRESHOLD) {
                if (app.status !== "frozen") {
                    app.status = "frozen";
                    WINDOW_CLOSE(app.id);
                    NotificationCore.notify("Frozen app", "Closed frozen app: " + app.name, "error")
                }
            }
        }
    });
}, 2000);
window.OPENED_APPS = OPENED_APPS;
