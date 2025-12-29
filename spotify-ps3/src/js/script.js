const CLIENT_ID = 'dcdf1b28e75a4bb1b46ba48533bddf78';
const REDIRECT_URI = 'https://d4nilin0n-hue.github.io/index.html'; // ¡EXACTO como lo registraste en Spotify!
const SCOPES = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-library-read',
    'user-library-modify',
    'user-read-private',
    'user-top-read',
    'playlist-modify-public',
    'playlist-modify-private'
].join(' ');

let accessToken = null;
let deviceId = null;
// ====== AUTHENTICATION ======
function generateRandomString(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text; // Generates a random string used as the PKCE code verifier
}
async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); // Computes the PKCE code challenge from the code verifier
}
function login() {
            const url = 'https://accounts.spotify.com/authorize' +
                '?response_type=token' +
                '&client_id=' + encodeURIComponent(CLIENT_ID) +
                '&scope=' + encodeURIComponent(SCOPES) +
                '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
                '&show_dialog=false';

            window.location = url;
        }

        document.getElementById('loginBtn').onclick = login;
function apiCall(endpoint, method = 'GET', body, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, 'https://api.spotify.com/v1' + endpoint, true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    if (body) xhr.setRequestHeader('Content-Type', 'application/json')
        
    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
            callback(JSON.parse(xhr.responseText));
        } else {
            showWarning('Error Spotify: ' + xhr.status);
            if (xhr.status === 401) {
                // Token expirado → volver a login
                setTimeout(login, 2000);
            }
        }
    };
    xhr.onerror = () => showWarning('Error de red');
    xhr.send(body ? JSON.stringify(body) : null);
}
function loadPopularPlaylists() {
            apiCall('/me/top/tracks?limit=20&time_range=medium_term', 'GET', null, function(topData) {
                if (!topData?.items?.length) {
                    document.getElementById('popularPlaylists').innerHTML = '<p>No hay datos.</p>';
                    return;
                }
                const artistIds = [];
                topData.items.forEach(track => {
                    track.artists.forEach(artist => {
                        if (!artistIds.includes(artist.id) && artistIds.length < 5) {
                            artistIds.push(artist.id);
                        }
                    });
                });

                apiCall('/artists?ids=' + artistIds.join(','), 'GET', null, function(artistsData) {
                    const genres = [];
                    artistsData.artists.forEach(artist => {
                        artist.genres?.forEach(g => {
                            if (!genres.includes(g)) genres.push(g);
                        });
                    });

                    const query = encodeURIComponent(genres.slice(0, 3).join(' '));
                    apiCall('/search?q=' + query + '&type=playlist&limit=30&market=from_token', 'GET', null, function(searchData) {
                        const container = document.getElementById('popularPlaylists');
                        container.innerHTML = '';

                        const valid = (searchData.playlists?.items || [])
                            .filter(pl => pl?.images?.[0]?.url && pl.tracks)
                            .sort(() => 0.5 - Math.random())
                            .slice(0, 5);

                        valid.forEach(playlist => {
                            const div = document.createElement('div');
                            div.className = 'playlist-item navigable';
                            div.tabIndex = 0;

                            const img = document.createElement('img');
                            img.src = playlist.images[0].url;
                            img.alt = playlist.name;

                            const dataContainer = document.createElement('div');
                            dataContainer.className = 'data-playlist-container';

                            const title = document.createElement('p');
                            title.className = 'playlist-title';
                            title.textContent = playlist.name.length > 20 ? playlist.name.substring(0,20)+'...' : playlist.name;

                            const count = document.createElement('p');
                            count.className = 'track-count';
                            count.textContent = playlist.tracks.total + ' songs';

                            div.onclick = div.onkeydown = function(e) {
                                if (e && (e.key === 'Enter' || e.key === ' ')) e.preventDefault();
                                if (!deviceId) return showWarning('Abre Spotify en un dispositivo primero');
                                apiCall('/me/player/play?device_id=' + deviceId, 'PUT', { context_uri: playlist.uri }, () => {});
                            };

                            dataContainer.appendChild(title);
                            dataContainer.appendChild(count);
                            div.appendChild(img);
                            div.appendChild(dataContainer);
                            container.appendChild(div);
                        });

                        const moreBtn = document.createElement('button');
                        moreBtn.className = 'more-button navigable';
                        moreBtn.tabIndex = 0;
                        moreBtn.textContent = 'MORE';
                        container.appendChild(moreBtn);
                    });
                });
            });
            setTimeout(initOrRefreshKeyboardNavigation, 1000);
        }
function loadTopGenres() {
    apiCall('/me/top/tracks?limit=50&time_range=long_term', 'GET', null, function(topData) {
        if (!topData || !topData.items || topData.items.length === 0) return;

        const artistIds = new Set();
        topData.items.forEach(track => {
            track.artists.forEach(artist => {
                if (artist.id) artistIds.add(artist.id);
            });
        });

        const idsArray = Array.from(artistIds).slice(0, 50); // Máximo por llamada
        if (idsArray.length === 0) return;

        apiCall('/artists?ids=' + idsArray.join(','), 'GET', null, function(artistsData) {
            const genreCount = {};

            artistsData.artists.forEach(artist => {
                if (artist && artist.genres) {
                    artist.genres.forEach(genre => {
                        genreCount[genre] = (genreCount[genre] || 0) + 1;
                    });
                }
            });

            // Ordenar por popularidad y tomar top 12
            const sortedGenres = Object.keys(genreCount)
                .sort((a, b) => genreCount[b] - genreCount[a])
                .slice(0, 12);

            const container = document.getElementById('topGenres');

            // Géneros predefinidos con imágenes fallback (por si Spotify no da buena)
            const genreImages = {
                'rock': 'https://i.scdn.co/image/ab67706f000000029bb74f4ac1069a5e7f5e5d1f',
                'pop': 'https://i.scdn.co/image/ab67706f00000002e435ce3e9e2f034e8e9e4f0e',
                'indie': 'https://i.scdn.co/image/ab67706f00000002d6a5f3b3f1b9e1e9e1e9e1e9',
                'hip hop': 'https://i.scdn.co/image/ab67706f00000002e8e9e1e9e1e9e1e9e1e9e1e9',
                'edm': 'https://i.scdn.co/image/ab67706f00000002f1e9e1e9e1e9e1e9e1e9e1e9',
                'latin': 'https://i.scdn.co/image/ab67706f00000002e1e9e1e9e1e9e1e9e1e9e1e9',
                'chill': 'https://i.scdn.co/image/ab67706f00000002c1e9e1e9e1e9e1e9e1e9e1e9',
                'focus': 'https://i.scdn.co/image/ab67706f00000002b1e9e1e9e1e9e1e9e1e9e1e9',
                'workout': 'https://i.scdn.co/image/ab67706f00000002a1e9e1e9e1e9e1e9e1e9e1e9',
                'party': 'https://i.scdn.co/image/ab67706f0000000291e9e1e9e1e9e1e9e1e9e1e9',
                'sleep': 'https://i.scdn.co/image/ab67706f0000000281e9e1e9e1e9e1e9e1e9e1e9',
                'mood': 'https://i.scdn.co/image/ab67706f0000000271e9e1e9e1e9e1e9e1e9e1e9'
            };

            sortedGenres.forEach(genre => {
                const div = document.createElement('div');
                div.className = 'genre-card navigable';
                div.tabIndex = 0;

                // Buscar imagen específica del género en Spotify
                apiCall('/search?q=' + encodeURIComponent(genre + ' mood') + '&type=playlist&limit=3', 'GET', null, function(searchData) {
                    let bgUrl = 'https://via.placeholder.com/300x300/111/333?text=' + encodeURIComponent(genre.toUpperCase());

                    if (searchData && searchData.playlists && searchData.playlists.items.length > 0) {
                        const best = searchData.playlists.items.find(p => p.images && p.images.length > 0);
                        if (best && best.images[0]) {
                            bgUrl = best.images[0].url;
                        }
                    }

                    // Fallback a imágenes oficiales de Spotify si coincide
                    const lowerGenre = genre.toLowerCase();
                    for (const key in genreImages) {
                        if (lowerGenre.includes(key)) {
                            bgUrl = genreImages[key];
                            break;
                        }
                    }

                    div.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url('${bgUrl}')`;
                    div.style.backgroundSize = 'cover';
                    div.style.backgroundPosition = 'center';
                });

                const name = document.createElement('span');
                name.textContent = genre.charAt(0).toUpperCase() + genre.slice(1);
                name.className = 'genre-name';

                div.onclick = function() {
                    document.getElementById('searchInput').value = genre;
                    document.getElementById('searchBtn').click();
                };

                div.appendChild(name);
                container.appendChild(div);
            });

            initOrRefreshKeyboardNavigation();
        });
    });
}
// ====== DEVICE AND PROFILE ======
function getActiveDevice() {
    apiCall('/me/player/devices', 'GET', null, function(data) {
        var active = data.devices.find(d => d.is_active);
        if (active) {
            deviceId = active.id;
            document.getElementById('deviceName').textContent = active.name + ' (' + active.type + ')';
        } else {
            document.getElementById('deviceName').textContent = 'Ninguno activo';
        } // Detects and displays the currently active playback device
    });
}
function populateUI(profile) {
    if (profile.images && profile.images[0]) {
        document.querySelector(".pfp").src = profile.images[0].url; // Sets the user's profile picture in the header
    }
}
async function fetchProfile() {
    const res = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: 'Bearer ' + accessToken }
    });
    return await res.json(); // Fetches the authenticated user's profile data
}
// ====== SEARCH ======
document.getElementById('searchBtn').onclick = function() {
    var term = document.getElementById('searchInput').value.trim();
    if (!term) return;
    apiCall('/search?q=' + encodeURIComponent(term) + '&type=track&limit=20', 'GET', null, function(data) {
        var results = document.getElementById('results');
        results.innerHTML = '';
        data.tracks.items.forEach(function(track) {
            var li = document.createElement('li');
            li.className = 'navigable';
            li.tabIndex = 0;
            var artists = track.artists.map(a => a.name).join(', ');
            li.innerHTML = '<strong>' + track.name + '</strong><br>' + artists +
                '<button onclick="playTrack(\'spotify:track:' + track.id + '\')">▶ Reproducir</button>';
            li.onclick = li.onkeydown = function(e) {
                if (e && (e.key === 'Enter' || e.key === ' ')) {
                    playTrack('spotify:track:' + track.id);
                }
            };
            results.appendChild(li); // Populates search results with tracks and play buttons
        });
    });
};
window.playTrack = function(trackUri) {
    if (!deviceId) {
        showWarning('Abre Spotify en tu dispositivo primero');
        return;
    }
    apiCall('/me/player/play?device_id=' + deviceId, 'PUT', { uris: [trackUri] }, function() {}); // Plays a single track on the active device
};
// ====== PS3-STYLE WARNING ======
function showWarning(message) {
    document.querySelector('.warning-text').textContent = message;
    var modal = document.getElementById('ps3Warning');
    modal.style.opacity = 0;
    modal.style.display = 'flex';
    var fade = setInterval(function() {
        if (parseFloat(modal.style.opacity) < 1) {
            modal.style.opacity = parseFloat(modal.style.opacity) + 0.1;
        } else clearInterval(fade);
    }, 10); // Shows a PS3-style warning modal with fade-in animation
}
function closeWarning() {
    var modal = document.getElementById('ps3Warning');
    var fade = setInterval(function() {
        if (parseFloat(modal.style.opacity) > 0) {
            modal.style.opacity -= 0.1;
        } else {
            clearInterval(fade);
            modal.style.display = 'none';
            modal.style.opacity = 1;
            initOrRefreshKeyboardNavigation(); // Restores keyboard focus after closing the warning
        }
    }, 10); // Hides the warning modal with fade-out animation
}
// ====== NAVEGACIÓN REIMAGINADA (FLEXIBLE Y UNIVERSAL) ======

document.body.style.cursor = 'none';

let currentFocus = null;

function getNavigableElements() {
    return Array.from(document.querySelectorAll('.navigable'));
}

function updateFocus() {
    getNavigableElements().forEach(el => el.classList.remove('keyboard-focus'));
    if (currentFocus) {
        currentFocus.classList.add('keyboard-focus');
        currentFocus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function initOrRefreshKeyboardNavigation() {
    const elements = getNavigableElements();
    if (elements.length > 0) {
        if (!currentFocus || !elements.includes(currentFocus)) {
            currentFocus = elements[0];
        }
        updateFocus();
    }
}

// Calcula el elemento más cercano en la dirección deseada
function getNearestInDirection(direction) {
    const elements = getNavigableElements();
    if (!currentFocus || elements.length === 0) return null;

    const currentRect = currentFocus.getBoundingClientRect();
    const candidates = elements.filter(el => el !== currentFocus);

    let best = null;
    let bestDistance = Infinity;

    candidates.forEach(el => {
        const rect = el.getBoundingClientRect();
        let distance = Infinity;

        switch (direction) {
            case 'left':
                if (rect.right < currentRect.left) {
                    distance = Math.abs(rect.top - currentRect.top) + (currentRect.left - rect.right);
                }
                break;
            case 'right':
                if (rect.left > currentRect.right) {
                    distance = Math.abs(rect.top - currentRect.top) + (rect.left - currentRect.right);
                }
                break;
            case 'up':
                if (rect.bottom < currentRect.top) {
                    distance = Math.abs(rect.left - currentRect.left) + (currentRect.top - rect.bottom);
                }
                break;
            case 'down':
                if (rect.top > currentRect.bottom) {
                    distance = Math.abs(rect.left - currentRect.left) + (rect.top - currentRect.bottom);
                }
                break;
        }

        if (distance < bestDistance) {
            bestDistance = distance;
            best = el;
        }
    });

    return best;
}

document.addEventListener('keydown', function(e) {
    if (document.getElementById('ps3Warning').style.display === 'flex') {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            closeWarning();
        }
        return;
    }

    const elements = getNavigableElements();
    if (elements.length === 0) return;

    let newFocus = null;

    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            newFocus = getNearestInDirection('left') || currentFocus;
            break;
        case 'ArrowRight':
            e.preventDefault();
            newFocus = getNearestInDirection('right') || currentFocus;
            break;
        case 'ArrowUp':
            e.preventDefault();
            newFocus = getNearestInDirection('up') || currentFocus;
            break;
        case 'ArrowDown':
            e.preventDefault();
            newFocus = getNearestInDirection('down') || currentFocus;
            break;
        case 'Enter':
        case ' ':
            e.preventDefault();
            if (currentFocus) {
                if (currentFocus.classList.contains('search-icon')) {
                    document.querySelector('.search-section').style.display = 'block';
                    document.getElementById('searchInput').focus();
                } else {
                    currentFocus.click();
                }
            }
            return;
    }

    if (newFocus && newFocus !== currentFocus) {
        currentFocus = newFocus;
        updateFocus();
    }
});
function getTokenFromUrl() {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            return params.get('access_token');
        }

        window.onload = function () {
            accessToken = getTokenFromUrl();

            if (accessToken) {
                // Limpiamos el hash de la URL para que quede bonita
                history.replaceState({}, document.title, window.location.pathname);

                document.getElementById('loginBtn').style.display = 'none';
                document.getElementById('main').style.display = 'block';

                getActiveDevice();
                fetchProfile().then(populateUI);
                loadPopularPlaylists();
                loadTopGenres();
                setTimeout(initOrRefreshKeyboardNavigation, 1000);
            }
        };
function gotosection(section){
    document.getElementById("main").style.left = "-200vw";
}
