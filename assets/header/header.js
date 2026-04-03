/*
    Header Version 1.0
    Made by: Daniel Limón, for: daniellimon.com
*/

(async function(){
    const headerHTML = `<ul class="left">
    <li data-page="/labs/">${translation.header.labs}</li>
    <li data-page="/services/">${translation.header.services}</li>
</ul>
<img src="/assets/img/logo.png" alt="Daniel Limon">
<ul class="right">
    <li data-page="/aboutme/">${translation.header.about_me}</li>
    <li data-page="/contact/">${translation.header.contact}</li>
</ul>
<div class="cursor"></div>
<select id="current-website">
    <option value="/">${translation.header.home}</option>
    <option value="/labs/">${translation.header.labs}</option>
    <option value="/services/">${translation.header.services}</option>
    <option value="/aboutme/">${translation.header.about_me}</option>
    <option value="/contact/">${translation.header.contact}</option>
</select>`;

    const headerCSS = `header{
    position: fixed;
    width: 96vw;
    height: 50px;
    top: 2vw;
    left: 50%;
    z-index: 10000;
    transform: translateX(-50%);
    overflow: hidden;
    border-radius: 20px;
    background: rgba(255, 255, 255, .5);
    font-family: "Noto Serif", serif;
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, .3);
    max-width: 1300px;
    box-shadow: 0px 10px 43px 0px rgba(0,0,0,0.2);
    -webkit-box-shadow: 0px 10px 43px 0px rgba(0,0,0,0.2);
    -moz-box-shadow: 0px 10px 43px 0px rgba(0,0,0,0.2);
}
header img{
    height: 40px;
    position: absolute;
    top: 5px;
    left: 50%;
    transform: translateX(-50%);
    cursor: pointer;
}
header ul.left{
    position: absolute;
    display: flex;
    top: 50%;
    left: 30px;
    transform: translateY(-50%);
}
header ul.right{
    position: absolute;
    display: flex;
    top: 50%;
    right: 30px;
    transform: translateY(-50%);
}
header ul li{
    list-style: none;
    /*margin-left: 30px;
    margin-right: 30px;*/
    letter-spacing: 0.05em;
    transition: transform .5s, filter .2s, text-shadow .1s;
    cursor: pointer;
    width: 110px;
    text-align: center;
    transition-delay: filter .1s;
}
header:has(li:hover) li {
    filter: blur(1px);
}
header ul li:hover{
    transform: translateY(-1px);
    filter: none !important;
}
header ul li:active{
    transform: translateY(1px);
    text-shadow: 0px 0px 11px #757575a5;
}
header .cursor{
    position: absolute;
    bottom: 0;
    left: calc(50% - 50px);
    width: 100px;
    height: 3px;
    background: rgba(0, 0, 0, .3);
    transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1), height .2s;
    will-change: transform, width;
    pointer-events: none;
    z-index: 0;
    transform-origin: center;
}
header select{
    display: none;
}
@media screen and (max-width: 768px){
    header ul{
        display: none !important;
    }
    header .cursor{
        display: none;
    }
    header img{
        left: 20px;
        transform: none;
    }
    header select{
        display: block;
        position: absolute;
        right: 10px;
        height: 30px;
        top: 10px;
        width: 30%;
    }
}

div[header-gradient]{
    position: fixed;
    z-index: 9999;
    top: 0;
    left: 0;
    width: 100%;
    height: calc(4vw + 50px);
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 100%);z
}
    
div[header-space]{
    width: 100%;
    margin: 0;
    margin-bottom: calc(4vw + 50px);
}`;
    var headerTimeout, temp_header, current_option, activeLi, logoPos, temp_header_space, temp_header_gradient;

    function render(){
        temp_header = document.createElement('header');
        temp_header_space = document.createElement('div');
        temp_header_gradient = document.createElement('div');
    
        temp_header.innerHTML = headerHTML;

        const temp_header_css = document.createElement('style');
        temp_header_css.innerHTML = headerCSS;

        temp_header_space.setAttribute('header-space', 'true');
        temp_header_gradient.setAttribute('header-gradient', 'true');

        document.head.appendChild(temp_header_css);
        document.body.prepend(temp_header);
        document.body.prepend(temp_header_gradient);
        document.body.prepend(temp_header_space);

        //On end:
        current_option = temp_header.querySelector(`select option[value="${window.location.pathname}"]`);
        activeLi = temp_header.querySelector(`li[data-page="${window.location.pathname}"]`);
    }
    function renderPositions(){
        logoPos = temp_header.querySelector('header img').getBoundingClientRect();
        /* 
            Why onmouseover and not addEventListener?
            Because onmouseover rewrites the previous assigned callback,
            while addEventListener does not and stack them up
            leading to a crappy UI and UX
        */
        temp_header.querySelectorAll('ul li').forEach((el) => {
            el.onmouseover = () => {
                var rect = el.getBoundingClientRect();
                changeCursorPos(rect.left, rect.width);
            }
        });

        temp_header.onclick = (el) => {
            if(el.target.matches('li')){
                document.body.classList.remove('ready');
                setTimeout(() => {
                    window.location.href = el.target.getAttribute('data-page');
                }, 300);
            }
        }

        temp_header.querySelector('img').onmouseover = () => {
            changeCursorPos(logoPos.left - 110, logoPos.width);
        }

        temp_header.querySelector('img').onclick = () => {
            if(window.location.pathname == '/'){
                window.scrollTo(0, 0);
                return;
            }
            document.body.classList.remove('ready');
            setTimeout(() => {
                window.location.href = '/';
            }, 300);
        }

        temp_header.querySelector('select').onchange = () => {
            document.body.classList.remove('ready');
            setTimeout(() => {
                window.location.href = temp_header.querySelector('select').value;
            }, 300);
        }

        if(current_option){
            current_option.setAttribute("disabled", "true");
            current_option.setAttribute("selected", "true");
        }

        if(window.location.pathname != '/' && activeLi){
            temp_header.querySelector('.cursor').style.transition = 'none';
            let cursorX = temp_header.querySelector(`li[data-page="${window.location.pathname}"]`).getBoundingClientRect().left;
            temp_header.querySelector('.cursor').style.left = `calc(${cursorX}px - 70px)`;
            setTimeout(() => {
                temp_header.querySelector('.cursor').style.transition = 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1), height .2s';
            }, 100);
        }
    }

    function changeCursorPos(x, width){
        /*
            Clears current interval so cursor never crashes out
        */
        clearTimeout(headerTimeout);

        temp_header.querySelector('.cursor').style.left = `calc(${x}px - 10px - ${width}px / 2)`;
        temp_header.querySelector('.cursor').style.height = '2px';
        temp_header.querySelector('.cursor').style.transform = 'scaleX(1.2)';
        headerTimeout = setTimeout(() => {
            temp_header.querySelector('.cursor').style.transform = 'none';
            temp_header.querySelector('.cursor').style.height = '3px';
        }, 200);
    }
    
    window.addEventListener('resize', () => {
        renderPositions();
    })
    render();
    renderPositions();
})();