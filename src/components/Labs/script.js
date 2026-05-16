(async function(){
    let experiments;
    async function getExperiments(){
        const request = new Request('/labs/experiments.json');
        
        await fetch(request).then((response) => {
            if(!response.ok){
                throw new Error("HTTP Error");
            }
            return response.json();
        }).then((json) => {
            experiments = json;
            Moke.Hydration.register(experiments);
        });
    }

    async function renderExperiments(){
        if(!experiments || typeof experiments !== 'object') return;

        for(const [projectId, experiment] of Object.entries(experiments)){
            const lab_card = document.createElement('div');
            lab_card.classList.add('lab-card', 'glass');
            
            lab_card.innerHTML = `
            <div class="lab-header">
                <span class="status-tag pulse-green">${experiment.status}</span>
                <span class="version-tag">${experiment.version}</span>
            </div>
            <div class="lab-content">
                <h2>${experiment.name}</h2>
                <p>${experiment.short_desc}</p>
            </div>
            
            <div class="tech-stack"></div>
            <a href="/labs/project/?id=${projectId}" class="view-button">
                View
            </a>`;

            if(experiment.langs && Array.isArray(experiment.langs)){
                for(const lang of experiment.langs){
                    const lab_lang = document.createElement('span');
                    lab_lang.classList.add('tech');
                    lab_lang.innerText = lang;

                    lab_card.querySelector('.tech-stack').appendChild(lab_lang);
                }
            }
            document.querySelector('.labs-grid').appendChild(lab_card);
        }
    }


    await getExperiments();
    await renderExperiments();
})();