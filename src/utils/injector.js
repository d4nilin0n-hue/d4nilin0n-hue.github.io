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

    var icn, touch, translations, header, footer, MokeSDK;
    icn = document.createElement('link');
    icn.setAttribute('rel', 'shortcut icon');
    icn.href = '/src/assets/img/logo_min.png';
    icn.setAttribute('type', 'image/x-icon')

    touch = document.createElement('link');
    touch.setAttribute('rel', 'apple-touch-icon');
    touch.href = '/src/assets/img/logo_min.png';

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
        Moke.Hydration.register(translation);
        document.body.classList.add('ready');
        if(settings?.header !== false){
            Moke.import({
                piece: 'Header',
                def_route: true
            });
        }

        if(settings?.footer !== false){
            Moke.import({
                piece: 'Footer',
                def_route: true
            });
        }

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
        });
    });

    Moke.import({
        piece: 'Translations',
        def_route: true
    });
})();