(async () => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');
    
    if(!projectId){
        window.location.href = '/labs/';
        return;
    }
    
    const response = await fetch('/labs/experiments.json');
    const experiments = await response.json();
    const project = experiments[projectId];
    
    if(!project){
        Moke.alert('Project not found');
        setTimeout(() => {
        	window.location.href = '/labs/'
        }, 1500);

        return;
    }
    
    Moke.element('.banner h1').text(project.name);
})();