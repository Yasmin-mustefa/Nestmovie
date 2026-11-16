/* NestMovie — Movie Details page
 * Reads ../data/movies.json and selects a movie using ?id=<movie-id>.
 * Expected movie fields follow the movie object shown in the AI Studio reference.
 */
(() => {
    "use strict";

    const $ = (selector) => document.querySelector(selector);
    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get("id");

    const elements = {
        backdrop: $("#movie-backdrop"),
        poster: $("#movie-poster"),
        title: $("#movie-title"),
        tagline: $("#movie-tagline"),
        genres: $("#movie-genres"),
        facts: $("#quick-facts"),
        imdb: $("#imdb-score"),
        votes: $("#imdb-votes"),
        tomatoes: $("#tomato-score"),
        metascore: $("#metascore"),
        synopsis: $("#movie-synopsis"),
        information: $("#movie-information"),
        cast: $("#cast-list"),
        trailer: $("#trailer-preview"),
        reviews: $("#reviews-list"),
        similar: $("#similar-movies"),
        dialog: $("#trailer-dialog"),
        dialogVideo: $("#dialog-video"),
        dialogTitle: $("#trailer-dialog-title")
    };

    const safeText = (value, fallback = "Not available") =>
        value === undefined || value === null || value === "" ? fallback : String(value);

    const cleanTitle = (title) => safeText(title, "Untitled movie").replace(/\n/g, " ");

    function setText(element, value, fallback = "Not available") {
        if (element) element.textContent = safeText(value, fallback);
    }

    function createInfoItem(label, value) {
        const wrapper = document.createElement("div");
        wrapper.className = "info-item";
        const term = document.createElement("dt");
        const description = document.createElement("dd");
        term.textContent = label;
        description.textContent = safeText(value);
        wrapper.append(term, description);
        return wrapper;
    }

    function renderMovie(movie, allMovies) {
        document.title = `${cleanTitle(movie.title)} | NestMovie`;

        elements.backdrop.style.backgroundImage = movie.backdropUrl
            ? `url("${movie.backdropUrl}")`
            : "none";

        elements.poster.src = movie.posterUrl || "";
        elements.poster.alt = `${cleanTitle(movie.title)} poster`;
        setText(elements.title, cleanTitle(movie.title));
        setText(elements.tagline, movie.tagline, "");
        setText(elements.imdb, movie.imdbRating ? `${movie.imdbRating}/10` : "—");
        setText(elements.votes, movie.imdbVotes ? `${movie.imdbVotes} votes` : "");
        setText(elements.tomatoes, movie.rottenTomatoesScore != null ? `${movie.rottenTomatoesScore}%` : "—");
        setText(elements.metascore, movie.metascore != null ? movie.metascore : "—");
        setText(elements.synopsis, movie.synopsis);

        elements.genres.replaceChildren();
        (movie.genres || []).forEach((genre) => {
            const chip = document.createElement("span");
            chip.className = "genre-chip";
            chip.textContent = genre;
            elements.genres.append(chip);
        });
        if (movie.ageRating) {
            const age = document.createElement("span");
            age.className = "genre-chip";
            age.textContent = movie.ageRating;
            elements.genres.append(age);
        }

        elements.facts.replaceChildren();
        [movie.releaseYear, movie.runtime, movie.country].filter(Boolean).forEach((fact) => {
            const span = document.createElement("span");
            span.textContent = fact;
            elements.facts.append(span);
        });

        elements.information.replaceChildren();
        [
            ["Director", movie.director],
            ["Writers", Array.isArray(movie.writers) ? movie.writers.join(", ") : movie.writers],
            ["Release date", movie.releaseDate],
            ["Runtime", movie.runtime],
            ["Studio", movie.studio],
            ["Country & language", [movie.country, movie.language].filter(Boolean).join(" · ")],
            ["Box office", movie.boxOffice]
        ].forEach(([label, value]) => elements.information.append(createInfoItem(label, value)));

        renderCast(movie.cast || []);
        renderTrailerPreview(movie);
        renderReviews(movie.reviews || []);
        renderSimilarMovies(movie, allMovies);
        bindTrailerButtons(movie);
    }

    function renderCast(cast) {
        elements.cast.replaceChildren();
        if (!cast.length) {
            elements.cast.innerHTML = '<p class="empty-state">Cast information is not available yet.</p>';
            return;
        }

        cast.forEach((person) => {
            const card = document.createElement("article");
            card.className = "cast-card";
            const image = document.createElement("img");
            image.src = person.photoUrl || "";
            image.alt = person.name ? `Portrait of ${person.name}` : "Cast member";
            image.loading = "lazy";
            const text = document.createElement("div");
            const name = document.createElement("strong");
            const role = document.createElement("span");
            name.textContent = safeText(person.name);
            role.textContent = safeText(person.role);
            text.append(name, role);
            card.append(image, text);
            elements.cast.append(card);
        });
    }

    function youtubeEmbedUrl(videoId, autoplay = false) {
        if (!videoId) return "";
        return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1${autoplay ? "&autoplay=1" : ""}`;
    }

    function renderTrailerPreview(movie) {
        elements.trailer.replaceChildren();
        if (!movie.trailerYoutubeId) {
            elements.trailer.textContent = "No trailer is available for this movie.";
            return;
        }
        const frame = document.createElement("iframe");
        frame.src = youtubeEmbedUrl(movie.trailerYoutubeId);
        frame.title = `${cleanTitle(movie.title)} trailer`;
        frame.loading = "lazy";
        frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        frame.allowFullscreen = true;
        elements.trailer.append(frame);
    }

    function bindTrailerButtons(movie) {
        const open = () => {
            if (!movie.trailerYoutubeId) {
                alert("A trailer is not available for this movie yet.");
                return;
            }
            elements.dialogTitle.textContent = `${cleanTitle(movie.title)} — Trailer`;
            elements.dialogVideo.innerHTML = `<iframe src="${youtubeEmbedUrl(movie.trailerYoutubeId, true)}" title="${cleanTitle(movie.title)} trailer" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
            elements.dialog.showModal();
        };
        $("#open-trailer").addEventListener("click", open);
        $("#open-theater").addEventListener("click", open);
    }

    function renderReviews(reviews) {
        elements.reviews.replaceChildren();
        if (!reviews.length) {
            elements.reviews.innerHTML = '<p class="empty-state">No audience reviews have been added yet.</p>';
            return;
        }

        reviews.forEach((review) => {
            const card = document.createElement("article");
            card.className = "review-card";
            const top = document.createElement("div");
            top.className = "review-top";
            const author = document.createElement("div");
            const name = document.createElement("span");
            name.className = "review-author";
            name.textContent = safeText(review.author, "Anonymous");
            const date = document.createElement("span");
            date.className = "review-date";
            date.textContent = safeText(review.date, "");
            author.append(name, date);
            const score = document.createElement("span");
            score.className = "review-score";
            score.textContent = `★ ${safeText(review.rating, "—")}/10`;
            const body = document.createElement("p");
            body.textContent = safeText(review.content);
            top.append(author, score);
            card.append(top, body);
            elements.reviews.append(card);
        });
    }

    function renderSimilarMovies(currentMovie, movies) {
        const currentGenres = currentMovie.genres || [];
        const recommendations = movies
            .filter((movie) => movie.id !== currentMovie.id)
            .map((movie) => ({
                movie,
                overlap: (movie.genres || []).filter((genre) => currentGenres.includes(genre)).length
            }))
            .filter((item) => item.overlap > 0)
            .sort((a, b) => b.overlap - a.overlap)
            .slice(0, 5);

        elements.similar.replaceChildren();
        if (!recommendations.length) {
            elements.similar.innerHTML = '<p class="empty-state">No similar movies found.</p>';
            return;
        }

        recommendations.forEach(({ movie }) => {
            const link = document.createElement("a");
            link.className = "similar-card";
            link.href = `movie.html?id=${encodeURIComponent(movie.id)}`;
            const image = document.createElement("img");
            image.src = movie.posterUrl || "";
            image.alt = `${cleanTitle(movie.title)} poster`;
            image.loading = "lazy";
            const details = document.createElement("div");
            const title = document.createElement("strong");
            title.textContent = cleanTitle(movie.title);
            const year = document.createElement("span");
            year.textContent = safeText(movie.releaseYear, "");
            details.append(title, year);
            link.append(image, details);
            elements.similar.append(link);
        });
    }

    async function loadMovies() {
        try {
            const response = await fetch("../data/movies.json");
            if (!response.ok) throw new Error(`Could not load movies.json (${response.status})`);
            const payload = await response.json();
            const movies = Array.isArray(payload) ? payload : (payload.movies || payload.data || []);
            if (!movies.length) throw new Error("The movie data file is empty or has an unsupported structure.");

            const selected = requestedId
                ? movies.find((movie) => String(movie.id) === requestedId)
                : movies[0];

            if (!selected) {
                elements.title.textContent = "Movie not found";
                elements.synopsis.textContent = "The requested movie could not be found. Return to Discover and select another movie.";
                return;
            }

            renderMovie(selected, movies);
        } catch (error) {
            console.error("NestMovie details page:", error);
            elements.title.textContent = "Unable to load movie";
            elements.synopsis.textContent = "Check that data/movies.json exists, contains movie records, and that you opened the project through a local server.";
        }
    }

    $("#close-trailer").addEventListener("click", () => {
        elements.dialog.close();
        elements.dialogVideo.replaceChildren();
    });

    elements.dialog.addEventListener("close", () => elements.dialogVideo.replaceChildren());

    $("#share-movie").addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            $("#share-movie").textContent = "✓ Link copied";
        } catch {
            $("#share-movie").textContent = "Copy unavailable";
        }
    });

    loadMovies();
})();
