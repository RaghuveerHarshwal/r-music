/* =========================================
   RAGHU MUSIC
   YouTube Music Player
========================================= */


/* =========================================
   1. CONFIGURATION
========================================= */

const API_KEY = "AIzaSyA6Sv2CPyg5iLU9KA48rNxwZpSjIIYPAms";

const MAX_RESULTS = 12;


/* =========================================
   2. VARIABLES
========================================= */

let player = null;

let playerReady = false;

let currentIndex = -1;

let songs = [];

let progressTimer = null;


let likedSongs =
    JSON.parse(
        localStorage.getItem("raghuLikedSongs")
    ) || [];


let historySongs =
    JSON.parse(
        localStorage.getItem("raghuHistory")
    ) || [];


/* =========================================
   3. DOM ELEMENTS
========================================= */

const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchButton");

const results =
    document.getElementById("results");

const sectionTitle =
    document.getElementById("sectionTitle");

const resultCount =
    document.getElementById("resultCount");

const playerTitle =
    document.getElementById("playerTitle");

const playerArtist =
    document.getElementById("playerArtist");

const playerThumbnail =
    document.getElementById("playerThumbnail");

const playerLike =
    document.getElementById("playerLike");

const playButton =
    document.getElementById("playButton");

const previousButton =
    document.getElementById("previousButton");

const nextButton =
    document.getElementById("nextButton");

const progress =
    document.getElementById("progress");

const currentTime =
    document.getElementById("currentTime");

const duration =
    document.getElementById("duration");

const volume =
    document.getElementById("volume");

const menuButton =
    document.getElementById("menuButton");

const sidebar =
    document.getElementById("sidebar");

const closeSidebar =
    document.getElementById("closeSidebar");


/* =========================================
   4. YOUTUBE IFRAME API
========================================= */

/*
    IMPORTANT

    YouTube looks for this function globally.

    Using window makes sure the function
    is available globally.
*/

window.onYouTubeIframeAPIReady = function () {

    console.log(
        "YouTube IFrame API loaded"
    );


    const container =
        document.getElementById(
            "youtubePlayer"
        );


    if (!container) {

        console.error(
            "youtubePlayer element not found"
        );

        return;
    }


    player =
        new YT.Player(
            "youtubePlayer",
            {

                width: "1",

                height: "1",

                videoId: "",


                playerVars: {

                    autoplay: 0,

                    controls: 0,

                    disablekb: 1,

                    fs: 0,

                    modestbranding: 1,

                    playsinline: 1,

                    rel: 0

                },


                events: {

                    onReady:
                        onPlayerReady,

                    onStateChange:
                        onPlayerStateChange,

                    onError:
                        onPlayerError

                }

            }
        );
};


/* =========================================
   5. PLAYER READY
========================================= */

function onPlayerReady(event) {

    console.log(
        "YouTube player READY"
    );


    playerReady = true;


    player.setVolume(
        Number(volume.value)
    );


    console.log(
        "Player volume:",
        volume.value
    );
}


/* =========================================
   6. PLAYER ERROR
========================================= */

function onPlayerError(event) {

    console.error(
        "YouTube Player Error:",
        event.data
    );


    let message =
        "This video cannot be played.";


    switch (event.data) {

        case 2:

            message =
                "Invalid YouTube video ID.";

            break;


        case 5:

            message =
                "YouTube HTML5 player error.";

            break;


        case 100:

            message =
                "This video was not found or is private.";

            break;


        case 101:

        case 150:

            message =
                "This video does not allow playback on external websites.";

            break;

    }


    console.warn(message);
}


/* =========================================
   7. PLAYER STATE
========================================= */

function onPlayerStateChange(event) {

    if (!window.YT) {
        return;
    }


    if (
        event.data ===
        YT.PlayerState.PLAYING
    ) {

        playButton.textContent =
            "❚❚";

        startProgress();

    }


    else if (
        event.data ===
        YT.PlayerState.PAUSED
    ) {

        playButton.textContent =
            "▶";

        stopProgress();

    }


    else if (
        event.data ===
        YT.PlayerState.ENDED
    ) {

        playButton.textContent =
            "▶";

        stopProgress();

        playNext();

    }

}


/* =========================================
   8. SEARCH YOUTUBE
========================================= */

async function searchYouTube() {

    const query =
        searchInput.value.trim();


    if (!query) {

        alert(
            "Please enter a song name."
        );

        return;
    }


    if (
        !API_KEY ||
        API_KEY ===
        "YOUR_YOUTUBE_API_KEY"
    ) {

        alert(
            "Add your YouTube API key inside script.js first."
        );

        return;
    }


    sectionTitle.textContent =
        "Searching...";


    resultCount.textContent =
        "";


    results.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">
                ♪
            </div>

            <h3>
                Searching YouTube...
            </h3>

            <p>
                Please wait.
            </p>

        </div>

    `;


    try {

        const url =

            "https://www.googleapis.com/youtube/v3/search" +

            "?part=snippet" +

            "&q=" +
            encodeURIComponent(query) +

            "&type=video" +

            "&videoCategoryId=10" +

            "&maxResults=" +
            MAX_RESULTS +

            "&key=" +
            API_KEY;


        console.log(
            "Searching YouTube:",
            query
        );


        const response =
            await fetch(url);


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "YouTube API Error:",
                data
            );


            throw new Error(
                data.error?.message ||
                "YouTube API request failed."
            );
        }


        songs =
            (data.items || [])

                .filter(
                    item =>
                        item.id &&
                        item.id.videoId
                )

                .map(
                    item => ({

                        id:
                            item.id.videoId,

                        title:
                            cleanTitle(
                                item.snippet.title
                            ),

                        artist:
                            item.snippet.channelTitle,

                        thumbnail:
                            item.snippet
                                .thumbnails
                                .high
                                ? item.snippet
                                    .thumbnails
                                    .high
                                    .url

                                : item.snippet
                                    .thumbnails
                                    .default
                                    .url

                    })
                );


        currentIndex = -1;


        displaySongs(
            songs
        );


    }

    catch (error) {

        console.error(
            "Search error:",
            error
        );


        sectionTitle.textContent =
            "Search Error";


        results.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ⚠
                </div>

                <h3>
                    Unable to search
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>

        `;

    }

}


/* =========================================
   9. CLEAN TITLE
========================================= */

function cleanTitle(title) {

    return String(title)

        .replace(
            /&quot;/g,
            '"'
        )

        .replace(
            /&#39;/g,
            "'"
        )

        .replace(
            /&amp;/g,
            "&"
        );

}


/* =========================================
   10. DISPLAY SONGS
========================================= */

function displaySongs(list) {

    sectionTitle.textContent =
        "Search Results";


    resultCount.textContent =
        `${list.length} songs`;


    if (list.length === 0) {

        results.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ♪
                </div>

                <h3>
                    No songs found
                </h3>

                <p>
                    Try another search.
                </p>

            </div>

        `;

        return;
    }


    results.innerHTML = "";


    list.forEach(
        (song, index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "song-card";


            const liked =
                isLiked(song.id);


            card.innerHTML = `

                <div class="song-thumbnail">

                    <img
                        src="${escapeHTML(song.thumbnail)}"
                        alt="${escapeHTML(song.title)}"
                        loading="lazy"
                    >

                    <button
                        class="card-play"
                        data-index="${index}"
                        type="button"
                    >
                        ▶
                    </button>

                </div>


                <button
                    class="card-like"
                    data-like="${escapeHTML(song.id)}"
                    type="button"
                >
                    ${liked ? "♥" : "♡"}
                </button>


                <div class="card-info">

                    <div class="card-title">
                        ${escapeHTML(song.title)}
                    </div>

                    <div class="card-channel">
                        ${escapeHTML(song.artist)}
                    </div>

                </div>

            `;


            const play =
                card.querySelector(
                    ".card-play"
                );


            play.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    playSong(index);

                }
            );


            card.addEventListener(
                "click",
                function () {

                    playSong(index);

                }
            );


            const like =
                card.querySelector(
                    ".card-like"
                );


            like.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    toggleLike(song);

                    displaySongs(songs);

                }
            );


            results.appendChild(
                card
            );

        }
    );

}


/* =========================================
   11. PLAY SONG
========================================= */

function playSong(index) {

    if (!songs[index]) {

        console.warn(
            "Song does not exist:",
            index
        );

        return;
    }


    if (!playerReady || !player) {

        alert(
            "YouTube player is still loading. Please wait a moment and try again."
        );

        console.warn(
            "Player not ready:",
            {
                player,
                playerReady
            }
        );

        return;
    }


    currentIndex =
        index;


    const song =
        songs[index];


    console.log(
        "Playing:",
        song.title,
        song.id
    );


    playerTitle.textContent =
        song.title;


    playerArtist.textContent =
        song.artist;


    playerThumbnail.src =
        song.thumbnail;


    updateLikeButton();


    progress.value =
        0;


    currentTime.textContent =
        "0:00";


    duration.textContent =
        "0:00";


    player.loadVideoById(
        {
            videoId: song.id
        }
    );


    addToHistory(
        song
    );


    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );

}


/* =========================================
   12. PLAY / PAUSE
========================================= */

playButton.addEventListener(
    "click",
    function () {

        if (
            !playerReady ||
            !player
        ) {

            alert(
                "YouTube player is not ready yet."
            );

            return;
        }


        if (
            currentIndex === -1
        ) {

            if (
                songs.length > 0
            ) {

                playSong(0);

            }

            else {

                alert(
                    "Search for a song first."
                );

            }

            return;
        }


        const state =
            player.getPlayerState();


        if (
            state ===
            YT.PlayerState.PLAYING
        ) {

            player.pauseVideo();

        }

        else {

            player.playVideo();

        }

    }
);


/* =========================================
   13. NEXT
========================================= */

nextButton.addEventListener(
    "click",
    playNext
);


function playNext() {

    if (
        songs.length === 0
    ) {

        return;
    }


    let nextIndex =
        currentIndex + 1;


    if (
        nextIndex >=
        songs.length
    ) {

        nextIndex = 0;

    }


    playSong(
        nextIndex
    );

}


/* =========================================
   14. PREVIOUS
========================================= */

previousButton.addEventListener(
    "click",
    function () {

        if (
            songs.length === 0
        ) {

            return;
        }


        let previousIndex =
            currentIndex - 1;


        if (
            previousIndex < 0
        ) {

            previousIndex =
                songs.length - 1;

        }


        playSong(
            previousIndex
        );

    }
);


/* =========================================
   15. PROGRESS
========================================= */

function startProgress() {

    stopProgress();


    progressTimer =
        setInterval(
            updateProgress,
            500
        );

}


function stopProgress() {

    if (
        progressTimer
    ) {

        clearInterval(
            progressTimer
        );

        progressTimer =
            null;

    }

}


function updateProgress() {

    if (
        !playerReady ||
        !player
    ) {

        return;
    }


    const total =
        player.getDuration();


    const current =
        player.getCurrentTime();


    if (
        !total ||
        total <= 0
    ) {

        return;
    }


    progress.value =
        (
            current /
            total
        ) * 100;


    currentTime.textContent =
        formatTime(
            current
        );


    duration.textContent =
        formatTime(
            total
        );

}


/* =========================================
   16. SEEK
========================================= */

progress.addEventListener(
    "input",
    function () {

        if (
            !playerReady ||
            !player
        ) {

            return;
        }


        const total =
            player.getDuration();


        if (
            !total
        ) {

            return;
        }


        const newTime =
            total *
            (
                Number(
                    progress.value
                ) / 100
            );


        player.seekTo(
            newTime,
            true
        );

    }
);


/* =========================================
   17. FORMAT TIME
========================================= */

function formatTime(seconds) {

    seconds =
        Math.floor(
            seconds || 0
        );


    const minutes =
        Math.floor(
            seconds / 60
        );


    const remaining =
        seconds % 60;


    return (
        minutes +
        ":" +
        String(
            remaining
        ).padStart(
            2,
            "0"
        )
    );

}


/* =========================================
   18. VOLUME
========================================= */

volume.addEventListener(
    "input",
    function () {

        if (
            !playerReady ||
            !player
        ) {

            return;
        }


        player.setVolume(
            Number(
                volume.value
            )
        );

    }
);


/* =========================================
   19. LIKES
========================================= */

function isLiked(id) {

    return likedSongs.some(
        song =>
            song.id === id
    );

}


function toggleLike(song) {

    const existingIndex =
        likedSongs.findIndex(
            item =>
                item.id === song.id
        );


    if (
        existingIndex !== -1
    ) {

        likedSongs.splice(
            existingIndex,
            1
        );

    }

    else {

        likedSongs.push(
            song
        );

    }


    localStorage.setItem(
        "raghuLikedSongs",
        JSON.stringify(
            likedSongs
        )
    );


    updateLikeButton();

}


/* =========================================
   20. UPDATE PLAYER LIKE
========================================= */

function updateLikeButton() {

    if (
        currentIndex === -1 ||
        !songs[currentIndex]
    ) {

        playerLike.textContent =
            "♡";

        return;
    }


    playerLike.textContent =
        isLiked(
            songs[currentIndex].id
        )
            ? "♥"
            : "♡";

}


playerLike.addEventListener(
    "click",
    function () {

        if (
            currentIndex === -1 ||
            !songs[currentIndex]
        ) {

            return;
        }


        toggleLike(
            songs[currentIndex]
        );

    }
);


/* =========================================
   21. HISTORY
========================================= */

function addToHistory(song) {

    historySongs =
        historySongs.filter(
            item =>
                item.id !== song.id
        );


    historySongs.unshift(
        song
    );


    historySongs =
        historySongs.slice(
            0,
            50
        );


    localStorage.setItem(
        "raghuHistory",
        JSON.stringify(
            historySongs
        )
    );

}


/* =========================================
   22. SIDEBAR
========================================= */

menuButton.addEventListener(
    "click",
    function () {

        sidebar.classList.add(
            "open"
        );

    }
);


closeSidebar.addEventListener(
    "click",
    function () {

        sidebar.classList.remove(
            "open"
        );

    }
);


/* =========================================
   23. SIDEBAR NAVIGATION
========================================= */

document
    .querySelectorAll(
        ".nav-item"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    document
                        .querySelectorAll(
                            ".nav-item"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    const section =
                        button.dataset.section;


                    sidebar.classList.remove(
                        "open"
                    );


                    if (
                        section === "home"
                    ) {

                        sectionTitle.textContent =
                            "Discover Music";

                        resultCount.textContent =
                            songs.length
                                ? `${songs.length} songs`
                                : "";

                        displaySongs(
                            songs
                        );

                    }


                    else if (
                        section === "liked"
                    ) {

                        showLikedSongs();

                    }


                    else if (
                        section === "history"
                    ) {

                        showHistory();

                    }

                }
            );

        }
    );


/* =========================================
   24. LIKED SONGS
========================================= */

function showLikedSongs() {

    sectionTitle.textContent =
        "Liked Songs";


    resultCount.textContent =
        `${likedSongs.length} songs`;


    displaySpecialSongs(
        likedSongs
    );

}


/* =========================================
   25. HISTORY
========================================= */

function showHistory() {

    sectionTitle.textContent =
        "Recently Played";


    resultCount.textContent =
        `${historySongs.length} songs`;


    displaySpecialSongs(
        historySongs
    );

}


/* =========================================
   26. SPECIAL SONGS
========================================= */

function displaySpecialSongs(list) {

    if (
        list.length === 0
    ) {

        results.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ♪
                </div>

                <h3>
                    Nothing here yet
                </h3>

                <p>
                    Start listening to music.
                </p>

            </div>

        `;

        return;
    }


    results.innerHTML = "";


    list.forEach(
        (song, index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "song-card";


            card.innerHTML = `

                <div class="song-thumbnail">

                    <img
                        src="${escapeHTML(song.thumbnail)}"
                        alt="${escapeHTML(song.title)}"
                        loading="lazy"
                    >

                    <button
                        class="card-play"
                        type="button"
                    >
                        ▶
                    </button>

                </div>


                <button
                    class="card-like"
                    type="button"
                >
                    ${
                        isLiked(song.id)
                            ? "♥"
                            : "♡"
                    }
                </button>


                <div class="card-info">

                    <div class="card-title">
                        ${escapeHTML(song.title)}
                    </div>

                    <div class="card-channel">
                        ${escapeHTML(song.artist)}
                    </div>

                </div>

            `;


            card
                .querySelector(
                    ".card-play"
                )
                .addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();

                        songs =
                            list;

                        playSong(
                            index
                        );

                    }
                );


            card.addEventListener(
                "click",
                function () {

                    songs =
                        list;

                    playSong(
                        index
                    );

                }
            );


            card
                .querySelector(
                    ".card-like"
                )
                .addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();

                        toggleLike(
                            song
                        );

                        showLikedSongs();

                    }
                );


            results.appendChild(
                card
            );

        }
    );

}


/* =========================================
   27. SEARCH BUTTON
========================================= */

searchButton.addEventListener(
    "click",
    searchYouTube
);


/* =========================================
   28. ENTER KEY
========================================= */

searchInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
        ) {

            searchYouTube();

        }

    }
);


/* =========================================
   29. HTML ESCAPE
========================================= */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value);


    return div.innerHTML;

}


/* =========================================
   30. INITIALIZATION
========================================= */

console.log(
    "Raghu Music JavaScript loaded"
);

console.log(
    "Waiting for YouTube IFrame API..."
);