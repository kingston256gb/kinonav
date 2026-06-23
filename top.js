// Выбор раздела топа
const topSelect = document.querySelectorAll('#top-btn')
let topLength = 10

// Пагинация
const pagination = document.querySelector('.top-pagination')
const prevPage = document.querySelector('#previous')
const nextPage = document.querySelector('#next')
const currPageSpan = document.querySelector('#currPage')
const maxPageSpan = document.querySelector('#maxPage')
const perPage = 12
let currPage = 1

// Модалка поиска
const resultContainer = document.querySelector('#searchResults')
const reasultModal = document.querySelector('.search-modal')
const resultLen = document.querySelector('#result-length')

// Поиск
const searchLine = document.querySelector('#search')
const searchBtn = document.querySelector('.search-btn')

// Кэш
const CACHE_KEY = 'kinonav_cache_topMovies'
const CACHE_LIFETIME = 7 * 24 * 60 * 60 * 1000 // 7 дней
const CACHE_TIME_KEY = 'kinonav_cache_topMovies_time'

// API
const headers = {
    'X-API-KEY': 'dffe49fd-dd5c-4c19-9e2f-67743d52b6eb',
    'Content-Type': 'application/json'
}

// ТОП-250
let topArray = []
const topSection = document.querySelector('#top-container')

topSelect.forEach(btn => {
    btn.addEventListener('click', () => {
        const activeBtn = document.querySelector('.active')
        if (btn.classList.contains('active')) {
            return
        }
        topLength = Number(btn.getAttribute('data-top'))
        activeBtn.classList.remove('active')
        btn.classList.add('active')
        currPage = 1
        paginationStatsUpdate()
    })
});

function paginationStatsUpdate() {
    const pages = Math.ceil(topLength / perPage)
    pagination.style.display = pages === 1 ? 'none' : 'flex'
    maxPageSpan.textContent = pages
    currPageSpan.textContent = currPage
    getTopMovies()
}

async function getTopMovies() {
    topSection.innerHTML = 'Поиск...'

    if (topArray.length === 250) {
        renderTop(topArray, currPage)
        return
    }
    
    try {
        const cached = localStorage.getItem(CACHE_KEY)
        const uncached = JSON.parse(cached)
        const cacheTime = Number(localStorage.getItem(CACHE_TIME_KEY))

        if (cached && cacheTime && uncached && Array.isArray(uncached) && Date.now() - cacheTime <= CACHE_LIFETIME) {
            topArray = uncached
            renderTop(topArray, currPage)
            return
        }
        
        throw new Error("Кэш побит, просрочен или отсутсвует"); 

    } catch (error) {
        console.error(error);
        localStorage.removeItem(CACHE_KEY)
        localStorage.removeItem(CACHE_TIME_KEY)
    }

    try {
        for (let page = 1; page < 14; page++) {
                const res = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.2/films/collections?type=TOP_250_MOVIES&page=${page}`, {
                method: 'GET',
                headers: headers
            })
            if (! res.ok) {
                throw new Error("Ошибка получения фильмов с API: "+res.status);
            }

            const data = await res.json()

            data.items.forEach((movie, index) => {
                const place = (page - 1) * 20 + index + 1
                topArray.push({
                    id: movie.kinopoiskId,
                    name: movie.nameRu || movie.nameEn || movie.nameOriginal || 'Названия нет',
                    poster: movie.posterUrl || movie.posterUrlPreview || '',
                    place: place,
                    year: movie.year,
                    rating: movie.ratingImdb || movie.ratingKinopoisk
                })
            });
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(topArray))
        localStorage.setItem(CACHE_TIME_KEY, Date.now())

        renderTop(topArray, currPage)
    } catch (error) {
        console.error(error);
        topSection.innerHTML = `Ошибка: ${error.message}`
        topArray = []
    }
}

function renderTop(top, page) {
    topSection.innerHTML = ''

    const filteredTop = top.filter(movie => {
        return movie.place <= topLength
    })

    const start = (page - 1) * perPage
    const end = Math.min(start + perPage, filteredTop.length)
    const pagedTop = filteredTop.slice(start, end)

    pagedTop.forEach(movie => {
        const a = document.createElement('a')
        a.classList.add('top-card', 'btn')
        a.href = `movie.html?id=${movie.id}`
        a.innerHTML = `
                             <img class="top-card_poster" src="${movie.poster}">
                            <h3 class="top-card_name">${movie.name}</h3>
                            <div class="top-card_data">
                                <span>🗓️ ${movie.year}</span>
                                <span>⭐ ${movie.rating}</span>
                            </div>
                            <span class="top-card_place" data-place="${movie.place}">${movie.place}</span>`
        topSection.appendChild(a)
    });
}


prevPage.addEventListener('click', () => {
    if (currPage === 1) {
        return
    }
    currPage--
    paginationStatsUpdate()
})
nextPage.addEventListener('click', () => {
    if (currPage === Math.ceil(topLength / perPage)) {
        return
    }
    currPage++
    paginationStatsUpdate()
})



async function getSearchResults(q) {
    resultContainer.innerHTML = 'Поиск...'
    try {
        const r = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${q}&page=1`, {
            method: 'GET',
            headers: headers
        })

        if (! r.ok) {
            throw new Error("Ошибка поиска: ", r.statusText);
        }

        const data = await r.json()

        if (data.searchFilmsCountResult === 0) {
            throw new Error("Ничего не найдено");
        }

        renderSearchResults(data.films)
    } catch (error) {
        console.error(error);
        resultContainer.innerHTML = `<p>${error.message}</p>`
    }
}
function renderSearchResults(data) {
    resultContainer.innerHTML = ''
    resultLen.textContent = '0'

    data.forEach(movie => {
        const card = document.createElement('article')
        card.classList.add('search-result_card')
        card.innerHTML = `
        <img class="seaerch-result_card-poster" src="${movie.posterUrl || movie.posterUrlPreview || ''}">
                    <h3 class="seaerch-result_card-name">${movie.nameRu || movie.nameEn || 'Нет названия'}</h3>
                    <a class="seaerch-result_card-btn btn" href="movie.html?id=${movie.kinopoiskId}">Подробнее</a>`
        resultContainer.appendChild(card)
    });

    resultLen.textContent = data.length

    reasultModal.classList.add('active')
    document.body.style.overflow = 'hidden'
    searchLine.value = ''
}

reasultModal.addEventListener('click', (e) => {
    if (e.target === reasultModal) {
        reasultModal.classList.remove('active')
        document.body.style.overflow = ''
    }
})

searchBtn.addEventListener('click', () => {
    if (! searchLine.value.trim()) {
        return
    }

    getSearchResults(searchLine.value.trim())
})

topSection.innerHTML = 'Загрузка...'
paginationStatsUpdate()