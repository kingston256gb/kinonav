// ======= WEB элементы сайта ========
const body = document.body
const popularFilms = document.querySelector('#popularFilms')

// Секция рандомайзера
const randomazerBtn = document.querySelector('#randomizeBtn')
const closeRandomize = document.querySelector('.modal-close')

// Модалка рандомайзера (настройка фильтров)
const filterModal = document.querySelector('#modalOverlay')
const genreSelector = document.querySelector('#genres')
const filterForm = document.querySelector('#filtersForm')

// Модалка с гифкой
const gifModal = document.querySelector('.dice-modal')
const gifTitle = document.querySelector('.gif-title')
const gif = document.querySelector('.dice-gif')

// Модальное окно с рандомно выбранным фильмом
const resultModal = document.querySelector('#resultModal')
const resultTitle = document.querySelector('.movie-title')
const resultYear = document.querySelector('.year-value')
const resultGenres = document.querySelector('.genre-value')
const resultRating = document.querySelector('.rating-value')
const resultDesc = document.querySelector('.movie-description')
const againBtn = document.querySelector('.again-btn')
const infoBtn = document.querySelector('.info-btn')
const resultPoster = document.querySelector('.movie-poster')
const closeResult = document.querySelector('.close-result')

// История выпадений
const historyBlock = document.querySelector('#history')
const clearBtn = document.querySelector('.history-clear')
let history = []



// ========== Просто нужные переменные ========
// Связаные с API
const headers = {
    'X-API-KEY': 'dffe49fd-dd5c-4c19-9e2f-67743d52b6eb',
    'Content-Type': 'application/json'
}
let genres = []
let lastParams = null

// Кэш
const CACHE_POPULAR_KEY = 'kinonav_cachePopular'
const CACHE_POPULAR_TIME_KEY = 'kinonav_cachePopular_time'
const CACHE_POPULAR_LIFE = 2 * 60 * 60 * 1000 // 2 часа
const CACHE_GENRES_KEY = 'kinonav_genres'

// Кэш история
const HISTORY_KEY = 'kinonav_history'

// ========= Функции ==========
// Загрузка популярных фильмов в секцию с популярными фильмами
async function loadPopular() {

    const cachedPopular = localStorage.getItem(CACHE_POPULAR_KEY)
    const cacheTime = localStorage.getItem(CACHE_POPULAR_TIME_KEY)

    if (cachedPopular && cacheTime && (Date.now() - Number(cacheTime)) <= CACHE_POPULAR_LIFE) {
        try {
            const cachedFilms = JSON.parse(cachedPopular)
            if (Array.isArray(cachedFilms) && cachedFilms.length !== 0) {
                return cachedFilms
            }
            throw new Error("Кеш побит или стерт");
        } catch (error) {
            console.error(error);
            localStorage.removeItem(CACHE_POPULAR_KEY)
            localStorage.removeItem(CACHE_POPULAR_TIME_KEY)
        }
    }

    try {
        popularFilms.innerHTML = '<p class="loading">Загрузка популярных фильмов</p>'
        const page = Math.floor(Math.random() * 35) + 1

        const response = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.2/films/collections?type=TOP_POPULAR_ALL&page=${page}`, {
            'headers': headers
        })
        
        if (! response.ok) {
            throw new Error('Ошибка при загрузки фильмов. Мы уже работаем над проблемой')
        }

        const data = await response.json()

        if (data.items.length === 0) {
            throw new Error("Ошибка при загрузке фильмов. Мы уже работаем над проблемой");
        }

        const gettedFilms = data.items

        localStorage.setItem(CACHE_POPULAR_KEY, JSON.stringify(gettedFilms))
        localStorage.setItem(CACHE_POPULAR_TIME_KEY, Date.now())

        return gettedFilms
    } catch (error) {
        popularFilms.innerHTML = `<p class="error">${error.message}</p>`
        return
    }

}

// Загрузка жанров 
async function loadGenres() {
    const cached = localStorage.getItem(CACHE_GENRES_KEY)
    if (cached) {
        try {
            const uncached = JSON.parse(cached)
            if (Array.isArray(uncached) && uncached.length !== 0) {
                return uncached
            }
            throw new Error("Кэш битый или стертый");
        } catch (error) {
            console.error('Ошибка получения кэша: '+error.message)
        }
    }
    try {
        const r = await fetch('https://kinopoiskapiunofficial.tech/api/v2.2/films/filters', {
            method: 'GET',
            headers: headers
        })
        if (! r.ok) {
            throw new Error("Ошибка API: " + r.status);
        }
        const data = await r.json()
        let genres = data.genres
        genres = genres.filter(genre => {return genre.genre})
        localStorage.setItem(CACHE_GENRES_KEY, JSON.stringify(genres))
        return genres
    } catch (error) {
        return
    }
}

// Выбор рандомного фильма по запросу пользователя
async function selectRandomMovie(params) {
    try {
        const response = await fetch(
            `https://kinopoiskapiunofficial.tech/api/v2.2/films?genres=${params.genre}&order=RATING&type=${params.type}&ratingFrom=${params.rating}&ratingTo=10&yearFrom=${params.from}&yearTo=${params.to}&page=1`, {
                'headers': headers
            })
        
        if (! response.ok) {
            throw new Error("Не удалось найти ничего подходящего");
        }

        const data = await response.json()

        if (data.total === 0) {
            throw new Error("Под такие запросы кино увы нет 😞");
        }

        const pages = data.totalPages
        if (pages > 1){
            const page = Math.floor(Math.random() * pages) + 1

            const responseNew = await fetch(
                `https://kinopoiskapiunofficial.tech/api/v2.2/films?genres=${params.genre}&order=RATING&type=${params.type}&ratingFrom=${params.rating}&ratingTo=10&yearFrom=${params.from}&yearTo=${params.to}&page=${page}`, {
                    'headers': headers
                })

            if (! responseNew.ok) {
                throw new Error("Не удалось найти ничего подходящего");
            }

            const dataNew = await responseNew.json()
            const probablyMovies = dataNew.items

            const selectedMovie = probablyMovies[Math.floor(Math.random() * probablyMovies.length)]

            history.unshift({
                id: selectedMovie.kinopoiskId,
                name: selectedMovie.nameRu || selectedMovie.nameEn || selectedMovie.nameOriginal || 'Название не указано',
                poster: selectedMovie.posterUrl || selectedMovie.posterUrlPreview || '',
                year: selectedMovie.year || '----',
                rating: selectedMovie.ratingImdb || selectedMovie.ratingKinopoisk || '--',
                savedTime: Date.now()
            })
            saveHistory(history)

            return selectedMovie.kinopoiskId
        }
        const probablyMovies = data.items
        const selectedMovie = probablyMovies[Math.floor(Math.random() * probablyMovies.length)]

        history.unshift({
            id: selectedMovie.kinopoiskId,
            name: selectedMovie.nameRu || selectedMovie.nameEn || selectedMovie.nameOriginal || 'Название не указано',
            poster: selectedMovie.posterUrl || selectedMovie.posterUrlPreview || '',
            year: selectedMovie.year || '----',
            rating: selectedMovie.ratingImdb || selectedMovie.ratingKinopoisk || '--',
            savedTime: Date.now()
        })
        saveHistory(history)

        return selectedMovie.kinopoiskId
    } catch (error) {
        gifTitle.textContent = error.message
        gifTitle.style.color = 'var(--text-delete)'
        return
    }
}

async function randomMovie(params) {
    gifModal.classList.add('active')

    const [filmId] = await Promise.all([
        selectRandomMovie(params),
        diceRoll()
    ])

    if (! filmId) {
        gifTitle.textContent = '💔 Произошла ошибка! Попробуйте снова позже'
        gifTitle.style.color = 'var(--text-delete)'
        setTimeout(() => {
            gifModal.classList.remove('active')
        }, 2000)
        return
    }

    const response = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.2/films/${filmId}`, {
        'headers': headers
    })
    if (! response.ok) {
        gifTitle.textContent = '💔 Произошла ошибка! Попробуйте снова позже'
        gifTitle.style.color = 'var(--text-delete)'
        setTimeout(() => {
            gifModal.classList.remove('active')
        }, 2000)
        return
    }
    
    const data = await response.json()

    renderResults(data)
    gifModal.classList.remove('active')
    resultModal.classList.add('active')

    resetGif()
}

// == Рендер-функции ==
// Отображение этих жанров в DOM (в выпадающем спысике в модальном окне)
function rebderGenres(genres) {
    if (!genres) {
        return
    }

    const zeroOpt = document.createElement('option')
    zeroOpt.value = ''
    zeroOpt.textContent = 'любой'
    genreSelector.appendChild(zeroOpt)

    genres.forEach(g => {
        const opt = document.createElement('option')
        opt.value = g.id 
        opt.textContent = g.genre
        genreSelector.appendChild(opt)
    });
}

// Отображение полученных популярных фильмов в секции
function renderPopular(films) {
    popularFilms.innerHTML = ''
    films.forEach(film => {
        const card = document.createElement('article')
        card.classList.add('popular-card')
        card.innerHTML = `<img class="popular-film-poster-img" src="${film.posterUrlPreview}">
                        <h3 class="popular-film-name">${film.nameRu || film.nameEn || film.nameOriginal}</h3>
                        <div class="popular-film-info">
                            <span class="rating">${film.ratingImdb || film.ratingKinopoisk || '--'}</span>
                            <span class="type"></span> 
                            <span class="year">${film.year || '----'}</span>
                        </div>
                        <p class="short-desc">${film.description || 'Описание отсутсвует'}</p>
                        <a class="btn popular-film-btn" href="movie.html?id=${film.kinopoiskId}">Подробнее</a>`
        const type = film.type
        const typeSpan = card.querySelector('.type')
        if (type === 'FILM') {
            typeSpan.textContent = 'Фильм'
        } else if (type === 'TV_SERIES' || type === 'MINI_SERIES') {
            typeSpan.textContent = 'Сериал'
        }

        popularFilms.appendChild(card)
    })

    const moreBtn = document.createElement('a')
    moreBtn.classList.add('popular-card', 'more-btn', 'btn')
    moreBtn.href = 'top.html'
    moreBtn.textContent = 'Ещё →' 
    popularFilms.appendChild(moreBtn)
    
}

// Вращение кубика (модальное окно при поиске рандомного фильма)
function diceRoll() {
    return new Promise(resolve => {
        gif.src = 'assets/imgs/dice.gif'

        const GIF_DUR = 3000
        const START_CHANGE = 2300

        setTimeout(() => {
            gifTitle.style.opacity = '0'
            setTimeout(() => {
                gifTitle.textContent = '🎉 Нашли то, что тебе нужно!'
                gifTitle.style.color = 'var(--text-confirm)'
                gifTitle.style.opacity = '1'
            }, 400)
        }, START_CHANGE)

        setTimeout(() => {
            gif.src = 'assets/imgs/dice_last_frame.png'
            resolve()
        }, GIF_DUR)
    })
}

function renderResults(p) {
    resultDesc.textContent = ''
    resultGenres.textContent = ''
    resultRating.textContent = ''
    resultTitle.textContent = ''
    resultYear.textContent = ''
    resultPoster.src = ''
    infoBtn.setAttribute('film-id', '')

    resultDesc.textContent = p.shortDescription || p.description || 'Описания нет'
    resultGenres.textContent = p.genres.slice(0, 3).map(g => g.genre).join(', ') || '-----'
    resultRating.textContent = p.ratingImdb || p.ratingKinopoisk || '--'
    resultTitle.textContent = p.nameRu || p.nameEn || p.nameOriginal || 'Название не указано'
    resultYear.textContent = p.year || '----'
    resultPoster.src = p.posterUrlPreview || p.posterUrl || ''
    infoBtn.href = `movie.html?id=${p.kinopoiskId}`
}

function resetGif() {
    gifTitle.textContent = '🎲 Выбираем подходящее тебе кино... '
    gifTitle.style.color = 'var(--accent)'
}

// Инициализация при запуске сайта
async function init() {
    const popularFilmsArray = await loadPopular()
    if (popularFilmsArray) {
        renderPopular(popularFilmsArray)
    }

    genres = await loadGenres()
    rebderGenres(genres)
    loadHistory()
}


// === Функции истории ===
function loadHistory() {
    const historyStorage = localStorage.getItem(HISTORY_KEY)
    history = JSON.parse(historyStorage)    

    if (! Array.isArray(history) || history.length === 0 ) {
        console.error("Ошибка получения: история пуста");
        historyBlock.innerHTML = '<p class="history-message">❌ История пуста. Воспользуйся рандомайзером, а мы запоним что тебе выпало ;)</p>'
        history = []
        return
    }
    showHistory(history.slice(0, 35))
}

function showHistory(hist) {
    historyBlock.innerHTML = ''
    hist.forEach(movie => {
        console.log('savedTime:', movie.savedTime);
    console.log('typeof savedTime:', typeof movie.savedTime);
    console.log('Number(savedTime):', Number(movie.savedTime));
        const card = document.createElement('article')
        const diff = Number(Date.now()) - Number(movie.savedTime)
        const time = diff / 1000 < 60 ? `${Math.floor(diff / 1000)} c` 
                    : diff / 1000 / 60 < 60 ? `${Math.floor(diff / 1000 / 60)} мин`
                    : diff / 1000 / 60 / 60 < 24 ? `${Math.floor(diff / 1000 / 60 / 60)} ч`
                    : `${Math.floor(diff / 1000 / 60 / 60 / 24)} д`
        card.classList.add('history-card') 
        card.innerHTML = `
                        <span class="history-time">🕛 ${time} назад</span>
                        <img class="history-poster" src="${movie.poster}">
                        <h3 class="history-name">${movie.name}</h3>
                        <div class="history-data">
                            <span>🗓️ ${movie.year}</span>
                            <span>⭐ ${movie.rating}</span>
                        </div>
                        <a class="btn history-film-btn" href="movie.html?id=${movie.id}">Подробнее</a>`
        historyBlock.appendChild(card)
    });
}

function saveHistory(h) {
    localStorage.removeItem(HISTORY_KEY)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h))
    loadHistory()
}




// ========= Кнопки =========
// Действия с кнопкой-рандомайзером
randomazerBtn.addEventListener('click', () => {
    filterModal.classList.add('active')
    body.style.overflow = 'hidden'
})
closeRandomize.addEventListener('click', () => {
    filterModal.classList.remove('active')
    body.style.overflow = ''
})

// Поиск фильма
filterForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    filterModal.classList.remove('active')

    const params = {
        genre: document.querySelector('#genres').value,
        type: document.querySelector('.type-filter').value,
        rating: document.querySelector('.rating-filter').value,
        from: document.querySelector('#min-year').value || 1000,
        to: document.querySelector('#max-year').value || 2026,
    }

    lastParams = params

    filterModal.classList.remove('active')
    
    randomMovie(params)
})

closeResult.addEventListener('click', () => {
    resultModal.classList.remove('active')
    body.style.overflow = ''
})

againBtn.addEventListener('click', () => {
    resultModal.classList.remove('active')
    randomMovie(lastParams)
})

clearBtn.addEventListener('click', ()=>{
    localStorage.removeItem(HISTORY_KEY)

    clearBtn.textContent = 'История очищена'
    clearBtn.style.border = '2px solid var(--border-confirm)'
    clearBtn.style.color = 'var(--text-confirm)'
    clearBtn.style.background = 'var(--confirm)'

    setTimeout(()=>{
        clearBtn.textContent = 'Очистить историю'
        clearBtn.style.border = '2px solid var(--border-delete)'
        clearBtn.style.color = 'var(--text-delete)'
        clearBtn.style.background = 'var(--delete)'
    }, 1000)

    loadHistory()
})



init()