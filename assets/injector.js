(function(){
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
})();