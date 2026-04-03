(async function(){
    const pagesList = {
        "/": "Daniel Limon",
        "/labs/": "Labs",
        "/services/": "Services",
        "/aboutme/": "About Daniel",
        "/contact/": "Contact Daniel",
        "/404.html": "Not found"
    }
    const currentTitle = pagesList[window.location.pathname];
    
    if(currentTitle){
        document.title = currentTitle; 
    } else {
        document.title = "Daniel Limon";
    }

    var icn, touch, translations, header, footer;
    icn = document.createElement('link');
    icn.setAttribute('rel', 'shortcut icon');
    icn.href = '/assets/img/logo_min.png';
    icn.setAttribute('type', 'image/x-icon')

    touch = document.createElement('link');
    touch.setAttribute('rel', 'apple-touch-icon');
    touch.href = '/assets/img/logo_min.png';

    document.head.appendChild(icn);
    document.head.appendChild(touch);

    const cfgRequest = new Request(`${window.location.pathname}cfg.json`);
    var settings;

    fetch(cfgRequest).then((response) => {
        if(!response.ok){
            throw new Error("No cfg file found or http error");
        }
        return response.json();
    }).then((json) => {
        settings = json;
    })

    window.addEventListener("Translations_Ready", () => {
        if(settings?.header !== false){
            header = document.createElement('script');
            header.src = '/assets/header/header.js';

            document.body.appendChild(header);
        }

        if(settings?.footer !== false){
            footer = document.createElement('script');
            footer.src = '/assets/footer/footer.js';

            document.body.appendChild(footer);
        }

        document.body.classList.add('ready');
        const elements = document.querySelectorAll('h1, p, a, h2, h3, h4, h5, span, li, button, select, option');

        elements.forEach((e) => {
            const text = e.innerHTML;
            const matches = text.match(/\{\{\s*(.*?)\s*\}\}/g);

            if (matches) {
                let newText = text;

                matches.forEach(match => {
                    const path = match.replace(/\{\{\s*|\s*\}\}/g, '');

                    const value = path.split('.').reduce((obj, key) => {
                        return (obj && obj[key] !== undefined) ? obj[key] : null;
                    }, translation);

                    const replacement = value !== null ? value : `[Missing: ${path}]`;
                    newText = newText.replace(match, replacement);
                });

                e.innerHTML = newText;
            }
        });

        /* 
            Kidnap browser's default callback and change it with my own
        */
        document.body.addEventListener('click', (e) => {
            const el = e.target.closest('a');
            if (el) {
                e.preventDefault();
                const href = el.getAttribute('href') || el.dataset.href; 
                document.body.classList.remove('ready');
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            }

            const sec_el = e.target.closest('p');
            if(sec_el){
                e.preventDefault();
                const href = sec_el.getAttribute('href') || sec_el.dataset.href; 
                document.body.classList.remove('ready');
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            }
        });
    });
    translations = document.createElement('script');
    translations.src = '/assets/langs/handler.js';
    document.body.prepend(translations);
})();