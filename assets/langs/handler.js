var translation = null;

(async function(){
    const lang = navigator.language || 'en-US';

    async function fetchLangauge(which){
        const request = new Request(`/assets/langs/${which}.json`);
        await fetch(request).then(async (response) => {
            if (!response.ok) {
                await fetchLangauge('en-US');
                throw new Error(`Status: ${response.status}, http error found.`);
            }

            return response.json();
        }).then((json) => {
            translation = json;
            window.dispatchEvent(new CustomEvent('Translations_Ready'));
        })
    }

    await fetchLangauge(lang);
})();