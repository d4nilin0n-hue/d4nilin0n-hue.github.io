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
        });
    }

    async function renderExperiments(){
        for(const i in experiments){
            const lab_card = document.createElement('div');
            lab_card.classList.add('lab-card');
            lab_card.classList.add('glass');
            
            lab_card.innerHTML = `
            <div class="lab-header">
                <span class="status-tag pulse-green">${experiments[i].status}</span>
                <span class="version-tag">${experiments[i].version}</span>
            </div>
            <div class="lab-content">
                <h2>${experiments[i].name}</h2>
                <p>${experiments[i].short_desc}</p>
            </div>
            
            <div class="tech-stack">
                    
            </div>
            <a href="${experiments[i].href}" class="view-button">
                <svg>...</svg>
                View
            </a>`;

            for(var j in experiments[i].langs){
                const lab_lang = document.createElement('span');
                lab_lang.classList.add('tech');
                lab_lang.innerText = experiments[i].langs[j];

                lab_card.querySelector('.tech-stack').appendChild(lab_lang);
            }
            document.querySelector('.labs-grid').appendChild(lab_card);
        }
    }
    await getExperiments();
    await renderExperiments();
})();