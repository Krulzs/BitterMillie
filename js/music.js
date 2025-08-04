const audioTracks = {
    background: { src: 'music/rain.mp3', volume: 0.30, loop: true },
    nuvema: { src: 'music/nuvema.ogg', volume: 0.30, loop: true },
    estela: { src: 'music/estela.ogg', volume: 0.30, loop: true },
    night: { src: 'music/night.ogg', volume: 0.30, loop: true },
    puella: { src: 'music/puella.ogg', volume: 0.30, loop: true },
    dontgiveup: { src: 'music/dontgiveup.ogg', volume: 0.30, loop: true },
    rozen: { src: 'music/rozen.ogg', volume: 0.30, loop: true }
};

const audioElements = {};
let isAudioUnlocked = false; 

function createAudio(name, { src, volume, loop }) {
    const audio = new Audio(src);
    audio.loop = loop;
    audio.volume = 0;
    audio.dataset.targetVolume = volume;
    audioElements[name] = audio;
    return audio;
}

function fade(audio, to, duration = 400) {
    const from = audio.volume;
    if (from === to) {
        if (to > 0 && audio.paused) {
            audio.play().catch(e => {}); 
        }
        return;
    };
    const step = (to - from) / (duration / 40);
    let current = from;
    clearInterval(audio._fadeInterval);

    if (to > 0 && audio.paused) {
        audio.play().catch(e => {
        });
    }

    audio._fadeInterval = setInterval(() => {
        current += step;
        if ((step > 0 && current >= to) || (step < 0 && current <= to)) {
            audio.volume = to;
            clearInterval(audio._fadeInterval);
            if (to === 0) {
                audio.pause();
                audio.currentTime = 0;
            }
        } else {
            audio.volume = current;
        }
    }, 40);
}

Object.keys(audioTracks).forEach(name => {
    createAudio(name, audioTracks[name]);
});


const volumeSlider = document.getElementById('master-volume');
const volumeIcon = document.getElementById('volume-icon');
const volumeToggle = document.getElementById('volume-toggle');
let masterVolume = parseFloat(volumeSlider.value);
let muted = false;

const musicGroups = [
    { name: 'nuvema', chapters: [1], pages: [1, 2, 3, 4], audios: ['nuvema'], muteBackground: false },
    { name: 'estela', chapters: [1], pages: [5, 6], audios: ['estela'], muteBackground: true },
    { name: 'night', chapters: [1], pages: [7, 8, 9, 10], audios: ['night'], muteBackground: false },
    { name: 'puella', chapters: [2], pages: [4, 5, 6, 7, 8, 9], audios: ['puella'], muteBackground: true },
    { name: 'dontgiveup', chapters: [2], pages: [10, 11, 12, 13, 14], audios: ['dontgiveup'], muteBackground: true },
    { name: 'rozen', chapters: [2], pages: [15], audios: ['rozen'], muteBackground: false }
];

let activeAudios = new Set();

function updateAudio() {
    if (!isAudioUnlocked) return;

    const currentPage = pageIndex + 1;
    const foundGroup = musicGroups.find(g => g.chapters.includes(currentChapter) && g.pages.includes(currentPage));

    const backgroundShouldBeMuted = foundGroup?.muteBackground || false;
    const newActiveAudios = foundGroup ? new Set(foundGroup.audios) : new Set();

    if (backgroundShouldBeMuted || muted) {
        fade(audioElements.background, 0);
    } else {
        fade(audioElements.background, audioTracks.background.volume * masterVolume);
    }

    for (const name in audioElements) {
        if (name === 'background') continue;
        if (!newActiveAudios.has(name) && audioElements[name].volume > 0) {
            fade(audioElements[name], 0);
        }
    }

    for (const name of newActiveAudios) {
        if (muted) {
            fade(audioElements[name], 0);
        } else {
            const targetVol = audioTracks[name].volume * masterVolume;
            fade(audioElements[name], targetVol);
        }
    }
    activeAudios = newActiveAudios;
}

function unlockAudio() {
    if (isAudioUnlocked) return; 

    console.log("First user interaction detected. Unlocking audio...");

    const unlockPromises = Object.values(audioElements).map(audio => {
        const promise = audio.play();
        if (promise !== undefined) {
            return promise.then(() => audio.pause()).catch(() => {});
        }
        return Promise.resolve();
    });
    
    Promise.all(unlockPromises).then(() => {
        console.log("Audio unlocked.");
        isAudioUnlocked = true;
        updateAudio();
    }).catch(err => {
        console.error("Audio could not be unlocked.", err);
    });
}

document.body.addEventListener('click', unlockAudio, { once: true });
document.body.addEventListener('keydown', unlockAudio, { once: true });
document.body.addEventListener('touchstart', unlockAudio, { once: true });

volumeSlider.addEventListener('input', () => {
    masterVolume = parseFloat(volumeSlider.value);
    if (!muted) updateAudio();
});

volumeToggle.addEventListener('click', () => {
    muted = !muted;
    updateAudio(); 
    volumeIcon.textContent = muted || masterVolume == 0 ? '🔇' : '🔊';
});

function patchNavigationAudio() {
    if (typeof render !== 'function') {
        console.error("Error: render() function not found. Make sure music.js is loaded after script.js");
        return;
    }

    const oldRender = render; 
    render = function () {
        oldRender(); 
        updateAudio(); 
    };

    selectEl.addEventListener('change', e => {
    });
}

patchNavigationAudio();