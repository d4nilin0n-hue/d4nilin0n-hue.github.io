const CLIENT_ID = 'dcdf1b28e75a4bb1b46ba48533bddf78';
const REDIRECT_URI = 'https://d4nilin0n-hue.github.io/spotify-ps3/index.html';

const SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing user-library-read user-library-modify user-read-private user-top-read playlist-modify-public playlist-modify-private';

let accessToken = null;
let deviceId = null;

function generateRandomString(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function login() {
    const url = 'https://accounts.spotify.com/authorize' +
        '?client_id=' + encodeURIComponent(CLIENT_ID) +
        '&response_type=token' +
        '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
        '&scope=' + encodeURIComponent(SCOPES);

    window.location = url;
}


function apiCall(endpoint, method, body, callback) {
    if (!accessToken) return;

    const xhr = new XMLHttpRequest();
    xhr.open(method || 'GET', 'https://api.spotify.com/v1' + endpoint, true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);

    if (body) {
        xhr.setRequestHeader('Content-Type', 'application/json');
    }

    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                callback(JSON.parse(xhr.responseText));
            } catch(e) {
                callback({});
            }
        } else {
            if (xhr.status === 401) {
                // Token expirado → volver a login
                setTimeout(login, 2000);
            }
        }
    };

    xhr.onerror = function() {
        showWarning('Network error during API call');
    };

    xhr.send(body ? JSON.stringify(body) : null);
}
async function exchangeCodeForToken(code) {
    const codeVerifier = localStorage.getItem('code_verifier');

    if (!codeVerifier) {
        showWarning('Error: code_verifier not found. Please try logging in again.');
        return;
    }

    const payload = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: codeVerifier
    });

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: payload
        });

        if (!response.ok) {
            const err = await response.json();
            showWarning('Token error: ' + (err.error_description || response.status));
            return;
        }

        const data = await response.json();
        accessToken = data.access_token;

        // Limpia la URL y el storage
        history.replaceState({}, document.title, REDIRECT_URI);
        localStorage.removeItem('code_verifier');

        // Oculta login y muestra la app
        document.getElementById('login').style.display = 'none';
        document.getElementById('main').style.display = 'block';

        getActiveDevice();
        fetchProfile().then(populateUI);
        loadPopularPlaylists();
        loadTopGenres();
        loadLikedSongs();
        setTimeout(initOrRefreshKeyboardNavigation, 1000);

    } catch (err) {
        showWarning('Network error obtaining token');
    }
}

function loadPopularPlaylists() {
            apiCall('/me/top/tracks?limit=20&time_range=medium_term', 'GET', null, function(topData) {
                if (!topData?.items?.length) {
                    document.getElementById('popularPlaylists').innerHTML = '<p>No data.</p>';
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
                                if (!deviceId) return showWarning('Open Spotify on a device first');
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

        const idsArray = Array.from(artistIds).slice(0, 50);
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

            const sortedGenres = Object.keys(genreCount)
                .sort((a, b) => genreCount[b] - genreCount[a])
                .slice(0, 12);

            const container = document.getElementById('topGenres');

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

                apiCall('/search?q=' + encodeURIComponent(genre + ' mood') + '&type=playlist&limit=3', 'GET', null, function(searchData) {
                    let bgUrl = 'https://via.placeholder.com/300x300/111/333?text=' + encodeURIComponent(genre.toUpperCase());

                    if (searchData && searchData.playlists && searchData.playlists.items.length > 0) {
                        const best = searchData.playlists.items.find(p => p.images && p.images.length > 0);
                        if (best && best.images[0]) {
                            bgUrl = best.images[0].url;
                        }
                    }

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
function loadLikedSongs() {
    apiCall('/me/tracks?limit=50', 'GET', null, function(data) {
        const container = document.getElementById('myFavouriteSongsSection');
        container.innerHTML = ''; // Limpiar

        if (!data || !data.items || data.items.length === 0) {
            container.innerHTML = '<p style="color: #aaa; text-align: center; padding: 40px;">No tienes canciones guardadas en ❤️ aún.</p>';
            return;
        }

        data.items.forEach(item => {
            const track = item.track;

            const div = document.createElement('div');
            div.className = 'liked-song-item navigable';
            div.tabIndex = 0;

            // Portada del álbum
            const img = document.createElement('img');
            img.src = track.album.images[track.album.images.length - 1]?.url || 'https://via.placeholder.com/64/222/fff?text=♪';
            img.alt = track.name;
            img.className = 'liked-song-cover';

            // Info
            const infoDiv = document.createElement('div');
            infoDiv.className = 'liked-song-info';

            const title = document.createElement('p');
            title.className = 'liked-song-title';
            title.textContent = track.name.length > 40 ? track.name.substring(0, 40) + '...' : track.name;

            const artist = document.createElement('p');
            artist.className = 'liked-song-artist';
            artist.textContent = track.artists.map(a => a.name).join(', ');

            infoDiv.appendChild(title);
            infoDiv.appendChild(artist);

            // Reproducir con Enter o click
            div.onclick = div.onkeydown = function(e) {
                if (e && (e.key === 'Enter' || e.key === ' ')) e.preventDefault();
                if (!deviceId) {
                    showWarning('Open Spotify on a device first');
                    return;
                }
                apiCall('/me/player/play?device_id=' + deviceId, 'PUT', { uris: [track.uri] }, () => {});
            };

            div.appendChild(img);
            div.appendChild(infoDiv);
            container.appendChild(div);
        });

        // Refresca navegación por teclado
        setTimeout(initOrRefreshKeyboardNavigation, 500);
    });
}
function getActiveDevice() {
    apiCall('/me/player/devices', 'GET', null, function(data) {
        const active = data.devices ? data.devices.find(d => d.is_active) : null;
        if (active) {
            deviceId = active.id;
            document.getElementById('deviceName').textContent = active.name + ' (' + active.type + ')';
        } else {
            document.getElementById('deviceName').textContent = 'Ninguno activo';
        }
    });
}
function populateUI(profile) {
    if (profile.images && profile.images[0]) {
        document.querySelector(".pfp").src = profile.images[0].url; // Sets the user's profile picture in the header
    }
}
function fetchProfile() {
    apiCall('/me', 'GET', null, function(profile) {
        if (profile.images && profile.images[0]) {
            document.querySelector(".pfp").src = profile.images[0].url;
        }
    });
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
        showWarning('Open Spotify on a device first');
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
function getTokenFromHash() {
    const hash = window.location.hash.substring(1);
    const params = {};
    hash.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        params[key] = decodeURIComponent(value);
    });
    return params.access_token || null;
}

window.onload = function() {
    accessToken = getTokenFromHash();

    if (accessToken) {
        history.replaceState({}, document.title, REDIRECT_URI);

        document.getElementById('login').style.display = 'none';
        document.getElementById('main').style.display = 'block';

        getActiveDevice();
        fetchProfile();
        loadPopularPlaylists();
        loadTopGenres();
        loadLikedSongs();
        setTimeout(initOrRefreshKeyboardNavigation, 1000);
    }
};
function gotosection(section){
    switch(section){
        case 'yourmusic':
            document.getElementById("main").style.left = "-300vw";
            document.getElementById('yourmusic').style.left = "60px";
            break;
        case 'browse':
            document.getElementById('yourmusic').style.left = "300vw";
            document.getElementById('main').style.left = "60px";
            break;
        case 'pairqr':
            document.getElementById("login").style.display = "none";
            document.getElementById("login-step-two").style.display = "block";
            break;
    }
}
