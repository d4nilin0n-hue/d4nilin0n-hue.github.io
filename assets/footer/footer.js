/*
    Footer Version 1.0
    Made by: Daniel Limón, for: daniellimon.com
*/

(async function(){
    const footerHTML = `<div class="footer-container">
            <div class="footer-section branding">
                <img src="/assets/img/logo_min.png" alt="Logo">
                <p>${translation.footer.tagline}</p>
            </div>

            <div class="footer-section links">
                <p><b>${translation.footer.links_title}</b></p>
                <a href="/labs/">${translation.header.labs}</a>
                <a href="/services/">${translation.header.services}</a>
                <a href="/contact/">${translation.header.contact}</a>
            </div>

            <div class="footer-section status">
                <p><b>${translation.footer.status_title}</b></p>
                <div class="status-indicator">
                    <span class="dot"></span>
                    <span>${translation.footer.status_available}</span>
                </div>
                <p class="location">${translation.footer.handcraft}</p>
            </div>
        </div>

        <div class="footer-bottom">
            <p>${translation.footer.donot}</p>
        </div>`;

    const footerCSS = `footer{
    margin-top: 10%;
    width: 96vw;
    height:500px;
    max-width: 1500px;
    background: rgba(221, 221, 221, 0.4);
    border-radius: 20px;
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    margin: 4vw auto 2vw;
    padding: 40px 20px 20px;
    margin-left: 2vw;
}

.footer-container {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 40px;
    margin-bottom: 30px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    padding-bottom: 30px;
}

.footer-section {
    flex: 1;
    min-width: 200px;
}

.footer-section b {
    display: block;
    margin-bottom: 15px;
    font-size: 0.9rem;
    letter-spacing: 1px;
    text-transform: uppercase;
    opacity: 0.8;
}

.footer-section p, .footer-section a {
    font-size: 0.9rem;
    color: rgba(0, 0, 0, 0.7);
    text-decoration: none;
    display: block;
    margin-bottom: 8px;
    transition: opacity 0.2s;
}

.footer-section a:hover {
    opacity: 1;
    text-decoration: underline;
}

.footer-section.branding img {
    height: 30px;
    margin-bottom: 15px;
    filter: grayscale(1);
    opacity: 0.7;
}

.status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    margin-bottom: 10px;
}

.dot {
    width: 8px;
    height: 8px;
    background: #4CAF50;
    border-radius: 50%;
    box-shadow: 0 0 10px #4CAF50;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
}

.footer-bottom {
    text-align: center;
    font-size: 0.75rem;
    opacity: 0.5;
}

@media screen and (max-width: 768px) {
    .footer-container {
        flex-direction: column;
        text-align: center;
    }
    .status-indicator {
        justify-content: center;
    }
}`;
    var temp_footer = document.createElement('footer');
    temp_footer.innerHTML = footerHTML;

    const temp_footer_css = document.createElement('style');
    temp_footer_css.innerHTML = footerCSS;

    document.head.appendChild(temp_footer_css);
    document.body.appendChild(temp_footer);
})();