(function(){
    const headerHTML = `<ul class="left">
    <li data-page="/labs/">Labs</li>
    <li data-page="/services/">Services</li>
</ul>
<img src="/logo.png" alt="Daniel Limon">
<ul class="right">
    <li data-page="/aboutme/">About me</li>
    <li data-page="/contact/">Contact</li>
</ul>
<div class="cursor"></div>
<select id="current-website">
    <option value="/">Home</option>
    <option value="/labs/">Labs</option>
    <option value="/services/">Services</option>
    <option value="/aboutme/">About me</option>
    <option value="/contact/">Contact</option>
</select>`;

    const headerCSS = `header{
    position: fixed;
    width: 96vw;
    height: 50px;
    top: 2vw;
    left: 50%;
    transform: translateX(-50%);
    overflow: hidden;
    border-radius: 20px;
    background: rgba(255, 255, 255, .5);
    font-family: "Noto Serif", serif;
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, .3);
    max-width: 1500px;
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
    margin-left: 30px;
    margin-right: 30px;
    letter-spacing: 0.05em;
    transition: transform .5s, filter .2s, text-shadow .1s;
    cursor: pointer;
    width: 110px;
    text-align: center;
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
    background: black;
    transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1), height .2s;
    will-change: transform, width;
}
header select{
    display: none;
}
@media screen and (max-width: 768px) {
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
}`;

    const temp_header = document.createElement('header');
    temp_header.innerHTML = headerHTML;

    const temp_header_css = document.createElement('style');
    temp_header_css.innerHTML = headerCSS;

    const current_option = document.querySelector(`select option[value="${window.location.pathname}"]`);
    const activeLi = document.querySelector(`li[data-page="${window.location.pathname}"]`);

    temp_header.querySelectorAll('ul li').forEach((el) => {
        el.addEventListener("mouseover", () => {
            var rect = el.getBoundingClientRect();
            changeCursorPos(rect.left);
        });

        el.addEventListener('click', () => {
            document.location.href = el.getAttribute('data-page');
        });
    });
    
    temp_header.querySelector('img').addEventListener('mouseover', () => {
        changeCursorPos(document.querySelector('header img').getBoundingClientRect().left);
    });

    temp_header.querySelector('img').addEventListener('click', () => {
        if(window.location.pathname == '/'){
            return;
        }
        window.location.href = '/';
        window.scrollTo(0, 0);
    });

    temp_header.querySelector('select').addEventListener('change', () => {
        window.location.href = temp_header.querySelector('select').value;
    });

    if(current_option){
        current_option.setAttribute("disabled", "true");
        current_option.setAttribute("selected", "true");
    }

    function changeCursorPos(x){
        document.querySelector('header .cursor').style.left = `calc(${x}px - 20px)`;
        document.querySelector('header .cursor').style.height = '2px';
        document.querySelector('header .cursor').style.transform = 'scaleX(1.2)';
        setTimeout(() => {
            document.querySelector('header .cursor').style.transform = 'none';
            document.querySelector('header .cursor').style.height = '3px';
        }, 200);
    }
    document.head.appendChild(temp_header_css);
    document.body.prepend(temp_header);

    if(window.location.pathname != '/' && activeLi){
        document.querySelector('.cursor').style.transition = 'none';
        let cursorX = document.querySelector(`li[data-page="${window.location.pathname}"]`).getBoundingClientRect().left;
        document.querySelector('.cursor').style.left = `calc(${cursorX}px - 20px)`;
        window.addEventListener('load', () => {
            document.querySelector('.cursor').style.transition = 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1), height .2s';
        })
    }
})();