function sendMail(name, body){
    const original = name;

    if(name.trim() == "" || !name){
        alert('Not a valid name.');
        return;
    }
    if(body.trim() == "" || !body){
        alert('Not a valid mail body.')
        return;
    }
    if(name.endsWith('s') || name.endsWith('z')){
        name = `${name}'`;
    } else {
        name = `${name}'s`;
    }
    const mailURL = `mailto:d4nilin0n@icloud.com?subject=${encodeURIComponent(name + ' Consult')}&body=${encodeURIComponent(body)}`;

    window.location.href = mailURL;
    Moke.alert(`Thanks ${original}! I'll get back to you soon.`);
}