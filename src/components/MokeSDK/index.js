/*
    Moke Web SDK
    Version 1.3
    Made by Daniel Limon

    See more at daniellimon.github.io
*/

(function(global){
    'use strict';

    const css_injection = `
        alert-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, .1);
            backdrop-filter: blur(3px);
            -webkit-backdrop-filter: blur(3px);
            z-index: 9999999999999;
            transition: opacity .5s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        alert-element {
            position: relative;
            width: 340px;
            padding: 28px;
            padding-bottom: 70px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.5), rgba(221, 221, 221, 0.2));
            box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.4), 0 10px 30px rgba(0, 0, 0, 0.05);
            border-radius: 25px;
            animation: alert-in 0.25s ease-out forwards;
            box-shadow: 0 20px 60px rgba(0,0,0,0.25), 0 8px 25px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6);
            z-index: 9999999999999;
            outline: none;
        }
        alert-button {
            width: 95%;
            height: 40px;
            bottom: 5%;
            left: 2.5%;
            position: absolute;
            color: rgb(0, 0, 0);
            background: rgba(255, 255, 255, 0.5);
            backdrop-filter: blur(5px);
            border-radius: 17px;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            font-weight: 500;
            border: 1px solid rgba(255,255,255,0.25);
            box-shadow: 0 8px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.35);
            cursor: pointer;
            transition: transform .15s ease, box-shadow .15s ease, filter .15s ease;
        }
        alert-button:hover {
            box-shadow: 0 10px 25px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.4);
        }
        alert-button:active {
            transform: scale(0.97);
            box-shadow: 0 4px 10px rgba(0,0,0,0.25), inset 0 2px 4px rgba(0,0,0,0.2);
        }
        alert-button::after {
            content: '';
            position: absolute;
            top: -50%; left: -50%;
            width: 200%; height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
            opacity: 0;
            transition: opacity 0.3s;
        }
        alert-button:active::after {
            opacity: 1;
        }
        alert-button p {
            margin: 0;
        }
        alert-text {
            display: block;
            font-size: 15px;
            color: #1c1c1e;
            margin-bottom: 8px;
            font-weight: 500;
        }
        @keyframes alert-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .alert-button-group {
            display: flex;
            gap: 10px;
            position: absolute;
            bottom: 5%;
            left: 2.5%;
            width: 95%;
        }
        .alert-button-group alert-button {
            position: relative;
            left: 0;
            flex: 1;
        }
        alert-input {
            display: block;
            width: 100%;
            padding: 10px;
            margin-top: 15px;
            background: rgba(255, 255, 255, 0.3);
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            backdrop-filter: blur(5px);
            font-size: 14px;
            outline: none;
            box-sizing: border-box;
        }
        alert-input:focus {
            border-color: rgba(0, 0, 0, 0.3);
            background: rgba(255, 255, 255, 0.5);
        }
        [moke-page] {
            transform: scale(0.97);
            display: none;
        }
        [data-if] { }
        [data-each] { }
    `;

    const style = document.createElement('style');
    style.textContent = css_injection;
    document.head.appendChild(style);

    const _bus = new EventTarget();
    const Moke = {
        version: '1.3',
        CurrentContexts: [
            global,
            (typeof translation !== 'undefined' ? translation : {})
        ],
        on(action, callback){
            const handler = (e) => callback(e.detail ?? e);
            _bus.addEventListener(action, handler);
            return () => _bus.removeEventListener(action, handler);
        },
        emit(action, data){
            _bus.dispatchEvent(new CustomEvent(action, { detail: data }));
        },
        element(selector){
            const nodes = document.querySelectorAll(selector);
            const nodeList = Array.from(nodes);
            const delegatedListeners = [];

            const api = {
                nodes: nodeList,
                _toggle(show){
                    this.nodes.forEach(el => {
                        if(!show){
                            const current = window.getComputedStyle(el).display;
                            if(current !== 'none') el.dataset.oldDisplay = current;
                            el.style.display = 'none';
                        } else {
                            el.style.display = el.dataset.oldDisplay || 'block';
                        }
                    });
                    return this;
                },
                hide(){
                    return this._toggle(false);
                },
                show(){
                    return this._toggle(true);
                },
                toggle(){
                    this.nodes.forEach(el => {
                        const isHidden = window.getComputedStyle(el).display === 'none';
                        isHidden ? (el.style.display = el.dataset.oldDisplay || 'block') : this.hide();
                    });
                    return this;
                },
                each(callback){
                    this.nodes.forEach((el, i) => callback.call(el, i, el));
                    return this;
                },
                fade(type = 'in', duration = 400){
                    this.nodes.forEach(el => {
                        el.style.transition = `opacity ${duration}ms ease`;
                        if(type === 'in'){
                            el.style.opacity = '0';
                            this.show();
                            el.offsetHeight;
                            el.style.opacity = '1';
                        } else {
                            el.style.pointerEvents = 'none';
                            el.style.opacity = '0';
                            setTimeout(() => {
                                if(el.style.opacity === '0'){
                                    el.style.display = 'none';
                                }
                            }, duration);
                        }
                    });
                    return this;
                },
                addClass(_class){
                    this.nodes.forEach(el => el.classList.add(_class));
                    return this;
                },
                removeClass(_class){
                    this.nodes.forEach(el => el.classList.remove(_class));
                    return this;
                },
                on(action, callback){
                    const handler = (e) => {
                        const targetElement = e.target.closest(selector);
                        if(targetElement){
                            callback.call(targetElement, e);
                        }
                    };
                    document.addEventListener(action, handler);
                    delegatedListeners.push({ action, handler });
                    return this;
                },
                off(){
                    delegatedListeners.forEach(({ action, handler }) => {
                        document.removeEventListener(action, handler);
                    });
                    delegatedListeners.length = 0;
                    return this;
                },
                html(html){
                    this.nodes.forEach(el => {
                        el.innerHTML = html;
                        Moke.hydrateNode(el);
                    });
                    return this;
                },
                text(text){
                    this.nodes.forEach(el => {
                        el.innerText = text;
                        Moke.hydrateNode(el);
                    });
                    return this;
                },
                css(property, value){
                    this.nodes.forEach(el => el.style[property] = value);
                    return this;
                },
                find(subSelector){
                    const allFound = [];
                    this.nodes.forEach(el => {
                        const found = el.querySelectorAll(subSelector);
                        allFound.push(...Array.from(found));
                    });
                    const wrapper = Moke.element.__createFromNodes(allFound);
                    return wrapper;
                }
            };

            return api;
        },
        __createFromNodes(nodeArray){
            const wrapper = this.element('__never__');
            wrapper.nodes = nodeArray;
            return wrapper;
        },
        async navigate(url, push_history = true){
            if(push_history){
                window.history.pushState({}, "", url);
            }
            Router.currentPath = url;

            const allPages = document.querySelectorAll("[moke-page]");
            const targetPage = document.querySelector(`[moke-page="${url}"]`);

            for(const page of allPages){
                if(window.getComputedStyle(page).display !== "none" && page !== targetPage){
                    page.style.transition = "opacity 0.2s ease, transform 0.1s";
                    page.style.opacity = "0";
                    page.style.transform = "scale(0.97)";
                    await Moke.sleep(200);
                    page.style.display = "none";
                }
            }

            if(targetPage){
                if(!targetPage.dataset.originalDisplay){
                    const original = window.getComputedStyle(targetPage).display;
                    targetPage.dataset.originalDisplay = original === 'none' ? 'block' : original;
                }
                if(targetPage.getAttribute('callback')){
                    const fnName = targetPage.getAttribute('callback').replace('()', '');
                    const fn     = Moke.get(fnName);
                    await new Promise(async (resolve) => {
                        if(typeof fn === 'function'){
                            await fn(targetPage);
                        }
                        resolve();
                    });

                }
                targetPage.style.opacity = "0";
                targetPage.style.display = targetPage.dataset.originalDisplay;
                targetPage.offsetHeight;
                targetPage.style.transition = "opacity 0.2s ease, transform 0.1s";
                targetPage.style.opacity = "1";
                targetPage.style.transform = "scale(1)";
                window.dispatchEvent(new CustomEvent('Moke_PageLoaded', { detail: url }));
            }
        },
        import({ piece, as_module = false, def_route = false, stylesheet = false } = {}){
            if(!piece) return Promise.reject(new Error('Moke.import: piece is required'));
            if(document.querySelector(`script[data-piece="${piece}"]`)){
                return Promise.resolve(piece);
            }

            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.dataset.piece = piece;

                let path = '';
                if(def_route === 'http'){
                    path = piece;
                } else if(def_route === true){
                    path = `/src/components/${piece}/script.js`;
                } else {
                    path = `${piece}/script.js`;
                }

                script.src = path;
                if(as_module) script.setAttribute('type', 'module');

                if(stylesheet && def_route !== 'http'){
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = path.replace('script.js', 'style.css');
                    
                    document.head.appendChild(link);
                } else if(def_route === 'http'){
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = stylesheet;
                    document.head.appendChild(link);
                }

                script.onload = () => {
                    hydrate();
                    resolve(piece);
                };

                script.onerror = () => reject(new Error(`Failed to load [${piece}]`));
                document.body.appendChild(script);
            });
        },
        sleep(ms){
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        Hydration: {
            register(obj){
                const reactiveObj = refresh(obj);
                Moke.CurrentContexts.unshift(reactiveObj);

                hydrate();
                return reactiveObj;
            }
        },
        get(path, defaultValue){
            for(let source of Moke.CurrentContexts){
                if(!source) continue;
                const result = path.split('.').reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : undefined, source);
                if(result !== undefined) return result;
            }
            return defaultValue;
        },
        set(path, value){
            const keys = path.split('.');
            let found = false;
            for(let source of Moke.CurrentContexts){
                if(!source) continue;
                let obj = source;
                for(let i = 0; i < keys.length - 1; i++){
                    if(obj[keys[i]] === undefined) break;
                    obj = obj[keys[i]];
                }
                if(obj && obj[keys[keys.length - 1]] !== undefined){
                    obj[keys[keys.length - 1]] = value;
                    found = true;
                    break;
                }
            }
            if(!found){
                let target = Moke.CurrentContexts[0];
                for(let i = 0; i < keys.length - 1; i++){
                    if(!target[keys[i]]) target[keys[i]] = {};
                    target = target[keys[i]];
                }
                target[keys[keys.length - 1]] = value;
            }
            hydrate();
        },
        ready(callback){
            if(document.readyState === 'loading'){
                document.addEventListener('DOMContentLoaded', callback);
            } else {
                callback();
            }
        },
        uuid(){
            return 'moke-' + Math.random().toString(36).substr(2, 9);
        },
        throttle(fn, delay){
            let last = 0;
            return (...args) => {
                const now = Date.now();
                if(now - last >= delay){
                    last = now;
                    fn.apply(this, args);
                }
            };
        },
        debounce(fn, delay){
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => fn.apply(this, args), delay);
            };
        },
        cookie: {
            get(name){
                const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
                return match ? decodeURIComponent(match[1]) : undefined;
            },
            set(name, value, options = {}){
                let cookieStr = encodeURIComponent(name) + '=' + encodeURIComponent(value);
                if(options.expires){
                    if(typeof options.expires === 'number'){
                        const d = new Date();
                        d.setTime(d.getTime() + options.expires * 864e5);
                        options.expires = d;
                    }
                    cookieStr += '; expires=' + options.expires.toUTCString();
                }
                if(options.path) cookieStr += '; path=' + options.path;
                if(options.domain) cookieStr += '; domain=' + options.domain;
                if(options.secure) cookieStr += '; secure';
                if(options.sameSite) cookieStr += '; samesite=' + options.sameSite;
                document.cookie = cookieStr;
            },
            delete(name){
                Moke.cookie.set(name, '', { expires: -1 });
            }
        },
        local: {
            get(key){
                try { return JSON.parse(localStorage.getItem(key)); } catch (e){ return null; }
            },
            set(key, value){
                localStorage.setItem(key, JSON.stringify(value));
            },
            remove(key){
                localStorage.removeItem(key);
            }
        },
        params(url){
            url = url || window.location.search;
            const params = {};
            const queryString = url.indexOf('?') !== -1 ? url.split('?')[1] : '';
            if(!queryString) return params;
            queryString.split('&').forEach(pair => {
                const [key, val] = pair.split('=');
                params[decodeURIComponent(key)] = val ? decodeURIComponent(val) : '';
            });
            return params;
        },
        _dialogQueue: [],
        _dialogOpen: false,
        alert(content = ''){
            return this._enqueueDialog('alert', content);
        },
        confirm(content = '', options = {}){
            return this._enqueueDialog('confirm', content, options);
        },
        prompt(content = '', defaultValue = '', options = {}){
            return this._enqueueDialog('prompt', content, defaultValue, options);
        },
        _enqueueDialog(type, ...args){
            return new Promise((resolve, reject) => {
                this._dialogQueue.push({ type, args, resolve, reject });
                this._processQueue();
            });
        },
        _processQueue(){
            if(this._dialogOpen || this._dialogQueue.length === 0) return;
            this._dialogOpen = true;
            const { type, args, resolve, reject } = this._dialogQueue.shift();
            this._showDialog(type, args, resolve, reject);
        },
        _closeDialog(container){
            container.style.opacity = '0';
            setTimeout(() => {
                if(container.parentNode) container.remove();
                Moke._dialogOpen = false;
                Moke._processQueue();
            }, 300);
        },
        _showDialog(type, args, resolve, reject){
            const container = document.createElement('alert-container');
            const element = document.createElement('alert-element');
            element.setAttribute('role', 'dialog');
            element.setAttribute('aria-modal', 'true');
            element.tabIndex = -1;

            const escHandler = (e) => {
                if(e.key === 'Escape'){
                    if(type === 'confirm') resolve(false);
                    else if(type === 'prompt') resolve(null);
                    else resolve();
                    this._closeDialog(container);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);

            if(type !== 'alert'){
                container.addEventListener('click', (e) => {
                    if(e.target === container){
                        if(type === 'confirm') resolve(false);
                        else if(type === 'prompt') resolve(null);
                        this._closeDialog(container);
                        document.removeEventListener('keydown', escHandler);
                    }
                });
            }

            if(type === 'alert'){
                const content = args[0];
                element.innerHTML = `
                    <alert-text>${content}</alert-text>
                    <alert-button tabindex="0"><p>OK</p></alert-button>
                `;
                element.querySelector('alert-button').addEventListener('click', () => {
                    resolve();
                    this._closeDialog(container);
                    document.removeEventListener('keydown', escHandler);
                });
                container.appendChild(element);
                document.body.appendChild(container);
                element.focus();
                Moke.hydrateNode(element);
                return;
            }

            if(type === 'confirm'){
                const [content, options = {}] = args;
                const okText = options.okText || 'OK';
                const cancelText = options.cancelText || 'Cancel';
                element.innerHTML = `
                    <alert-text>${content}</alert-text>
                    <div class="alert-button-group">
                        <alert-button id="confirm-cancel" style="background: rgba(255, 255, 255, 0.2);" tabindex="0"><p>${cancelText}</p></alert-button>
                        <alert-button id="confirm-ok" tabindex="0"><p>${okText}</p></alert-button>
                    </div>
                `;
                element.querySelector('#confirm-ok').addEventListener('click', () => {
                    resolve(true);
                    this._closeDialog(container);
                    document.removeEventListener('keydown', escHandler);
                });
                element.querySelector('#confirm-cancel').addEventListener('click', () => {
                    resolve(false);
                    this._closeDialog(container);
                    document.removeEventListener('keydown', escHandler);
                });
                container.appendChild(element);
                document.body.appendChild(container);
                element.focus();
                Moke.hydrateNode(element);
                return;
            }

            if(type === 'prompt'){
                const [content, defaultValue = '', options = {}] = args;
                const okText = options.okText || 'OK';
                const cancelText = options.cancelText || 'Cancel';
                element.innerHTML = `
                    <alert-text>${content}</alert-text>
                    <input type="text" id="prompt-input" value="${defaultValue.replace(/"/g, '&quot;')}"
                        style="width:100%; padding:10px; border-radius:10px; border:1px solid rgba(0,0,0,0.1);
                        background:rgba(255,255,255,0.4); outline:none; margin-top:10px; font-family:inherit;">
                    <div class="alert-button-group">
                        <alert-button id="prompt-cancel" style="background: rgba(255, 255, 255, 0.2);" tabindex="0"><p>${cancelText}</p></alert-button>
                        <alert-button id="prompt-ok" tabindex="0"><p>${okText}</p></alert-button>
                    </div>
                `;
                const input = element.querySelector('#prompt-input');
                element.querySelector('#prompt-ok').addEventListener('click', () => {
                    resolve(input.value);
                    this._closeDialog(container);
                    document.removeEventListener('keydown', escHandler);
                });
                element.querySelector('#prompt-cancel').addEventListener('click', () => {
                    resolve(null);
                    this._closeDialog(container);
                    document.removeEventListener('keydown', escHandler);
                });
                container.appendChild(element);
                document.body.appendChild(container);
                input.focus();
                Moke.hydrateNode(element);
                return;
            }
        },
        hydrateNode(node){
            if(!node) return;
            const all = node.querySelectorAll ? node.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,div,alert-text,strong,li,a,i,input,button,[data-if],[data-each],[data-bind]') : [];
            const allArray = [node, ...Array.from(all)];
            allArray.forEach(el => {
                processHydrateElement(el);
            });
        }
    };

    // Centralised action delegation for data-action
    document.addEventListener('click', e => {
        const actionEl = e.target.closest('[data-action]');
        if(actionEl){
            const action = actionEl.dataset.action;
            const arg = actionEl.dataset.arg;
            Moke.emit('action:' + action, { element: actionEl, arg });
        }
    });

    function refresh(obj){
        return new Proxy(obj, {
            get(target, key){
                const val = target[key];
                if(typeof val === 'object' && val !== null){
                    return refresh(val);
                }
                return val;
            },
            set(target, key, value){
                target[key] = value;
                hydrate();
                return true;
            }
        });
    }

    const Router = refresh({ currentPath: window.location.pathname });

    function processHydrateElement(el){
        // data-if handling
        if(el.hasAttribute('data-if')){
            const path = el.dataset.if;
            const value = Moke.get(path);
            if(value){
                el.style.display = el.dataset.originalDisplay || '';
            } else {
                if(!el.dataset.originalDisplay) el.dataset.originalDisplay = getComputedStyle(el).display;
                el.style.display = 'none';
            }
            // continue with other hydrations for text inside
        }

        // data-each handling
        if(el.hasAttribute('data-each')){
            const path = el.dataset.each;
            const items = Moke.get(path);
            const template = el.querySelector(':scope > template');
            if(!template || !Array.isArray(items)) return;
            // remove previous cloned elements
            let child = el.firstChild;
            while (child){
                if(child !== template){
                    el.removeChild(child);
                    child = el.firstChild;
                } else {
                    child = child.nextSibling;
                }
            }
            const frag = document.createDocumentFragment();
            items.forEach((item, index) => {
                const clone = document.importNode(template.content, true);
                const tempDiv = document.createElement('div');
                tempDiv.appendChild(clone);
                Moke.CurrentContexts.unshift({ item, index });
                Moke.hydrateNode(tempDiv);
                Moke.CurrentContexts.shift();
                while (tempDiv.firstChild) frag.appendChild(tempDiv.firstChild);
            });
            el.appendChild(frag);
            return;
        }

        // data-bind on inputs
        if(el.tagName === 'INPUT' && el.hasAttribute('data-bind')){
            const bindPath = el.dataset.bind;
            if(!el.dataset.boundListener){
                el.dataset.boundListener = 'true';
                el.addEventListener('input', () => {
                    if(document.activeElement === el){
                        Moke.set(bindPath, el.value);
                    }
                });
            }
            // set value from context but don't overwrite if focused
            const val = Moke.get(bindPath);
            if(val !== undefined && document.activeElement !== el){
                el.value = val;
            }
            // placeholder still handled below
        }

        // Regular element processing
        if(el.tagName === 'INPUT'){
            if(!el.dataset.originalPlaceholder) el.dataset.originalPlaceholder = el.placeholder;
            const placeholder = el.dataset.originalPlaceholder;
            const matches = placeholder.match(/\{\{\s*(.*?)\s*\}\}/g);
            if(matches) el.placeholder = renderTemplate(placeholder, matches);

            if(!el.dataset.originalValue) el.dataset.originalValue = el.value;
            const valMatches = el.dataset.originalValue.match(/\{\{\s*(.*?)\s*\}\}/g);
            if(valMatches && document.activeElement !== el){
                el.value = renderTemplate(el.dataset.originalValue, valMatches);
            }
            return;
        }

        if(el.tagName === 'BUTTON'){
            if(el.hasAttribute('data-action')) return; // let delegation handle it
            if(el.hasAttribute('data-no-hydrate-click')) return;
            if(!el.dataset.originalClick) el.dataset.originalClick = el.getAttribute('onclick') || '';
            const hydOnclick = el.dataset.originalClick;
            const matches = hydOnclick.match(/\{\{\s*(.*?)\s*\}\}/g);
            if(matches){
                el.onclick = new Function(renderTemplate(hydOnclick, matches));
            }
            return;
        }

        if(el.tagName === 'A'){
            if(!el.dataset.originalHref) el.dataset.originalHref = el.getAttribute('href') || '';
            const hydHref = el.dataset.originalHref;
            const matches = hydHref.match(/\{\{\s*(.*?)\s*\}\}/g);
            if(matches){
                el.onclick = (e) => {
                    e.preventDefault();
                    window.open(renderTemplate(hydHref, matches));
                };
            }
            return;
        }

        if(!el.dataset.originalText) el.dataset.originalText = el.innerHTML;
        const text = el.dataset.originalText;
        const matches = text.match(/\{\{\s*(.*?)\s*\}\}/g);
        if(matches) el.innerHTML = renderTemplate(text, matches);
    }

    function hydrate(){
        // Process all elements with data-hydrate first, then the rest
        const elements = document.querySelectorAll(
            'h1, h2, h3, h4, h5, h6, p, span, div, alert-text, strong, li, a, i, input, button, [data-if], [data-each], [data-bind]'
        );
        elements.forEach(el => processHydrateElement(el));
        window.dispatchEvent(new CustomEvent('Hydration'));
    }

    function renderTemplate(template, matches){
        let renderedText = template;
        matches.forEach(match => {
            const path = match.replace(/\{\{\s*|\s*\}\}/g, '');
            const value = Moke.get(path);
            renderedText = renderedText.replace(match, value ?? `[${path}]`);
        });
        return renderedText;
    }

    // Global overrides
    global.Moke = Moke;
    global.alert = function(content){
        return Moke.alert(content);
    };
    global.confirm = function(content, options){
        return Moke.confirm(content, options);
    };
    global.prompt = function(content, defaultValue, options){
        return Moke.prompt(content, defaultValue, options);
    };

    // Bootstrap
    window.addEventListener('DOMContentLoaded', () => {
        hydrate();
        Moke.emit('ready');
    });
    window.addEventListener('load', () => Moke.emit('load'));
    window.addEventListener('Translations_Ready', () => hydrate());
    window.onpopstate = () => Moke.navigate(window.location.pathname, false);

})(window);

(function handleInitialRoute(){
    const fullPath = window.location.pathname + window.location.search;
    
    if(fullPath !== '/' && fullPath !== ''){
        const targetPath = fullPath;
        window.history.replaceState({}, '', '/');
        
        if(document.readyState === 'loading'){
            document.addEventListener('DOMContentLoaded', () => {
                Moke.navigate(targetPath);
            });
        } else {
            Moke.navigate(targetPath);
        }
    }
})();