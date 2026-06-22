const id = new URLSearchParams(window.location.search).get('id')

const name = document.querySelector('#name')
const slogan = document.querySelector('.slogan')
const type = document.querySelector('#type')
const year = document.querySelector('#year')
const rating = document.querySelector('#rating')
const genre = document.querySelector('#genres')
const countries = document.querySelector('#countries')
const duration = document.querySelector('#dur')
const age = document.querySelector('#age')
const description = document.querySelector('.desc')
const poster = document.querySelector('#poster')

const actorsContainer = document.querySelector('.actors-container')

const headers = {
    'X-API-KEY': 'dffe49fd-dd5c-4c19-9e2f-67743d52b6eb',
    'Content-Type': 'application/json'
}

async function getFilmData(id) {
    try {
        const res = await fetch(`https://kinopoiskapiunofficial.tech/api/v2.2/films/${id}`, {
            method: 'GET',
            headers
        })

        if (!res.ok) {
            throw new Error("Не удалось получить данные о фильме: " + res.status)
        }

        const data = await res.json()
        renderFilmData(data)
    } catch (error) {
        console.error(error)
    }
}

function renderFilmData(d) {
    name.textContent = d.nameRu || d.nameEn || d.nameOriginal || 'Название не указано'
    poster.src = d.posterUrlPreview || d.posterUrl || ''

    if (d.slogan) {
        slogan.style.opacity = '1'
        slogan.textContent = d.slogan
    } else {
        slogan.style.opacity = '0'
        slogan.textContent = ''
    }

    type.textContent =
        d.type === 'FILM' ? 'фильм' :
        d.type === 'TV_SERIES' || d.type === 'MINI_SERIES' ? 'сериал' :
        d.type === 'TV_SHOW' ? 'тв-шоу' :
        'контент'

    rating.textContent = d.ratingImdb || d.ratingKinopoisk || '--'
    year.textContent = d.year || '----'

    countries.textContent = (d.countries || []).map(e => e.country).join(', ')
    genre.textContent = (d.genres || []).map(e => e.genre).join(', ')
    duration.textContent = d.filmLength || '?'

    age.textContent = d.ratingAgeLimits
        ? d.ratingAgeLimits.replace('age', '') + '+'
        : '—'

    description.textContent = d.description || 'Описание отсутствует'

    getActors(id)
}

async function getActors(id) {
    try {
        const res = await fetch(`https://kinopoiskapiunofficial.tech/api/v1/staff?filmId=${id}`, {
            headers
        })

        if (!res.ok) {
            throw new Error("Не удалось загрузить список актеров " + res.status)
        }

        const data = await res.json()

        const actors = data
            .filter(e => e.professionKey === 'ACTOR')
            .slice(0, 10)

        renderActors(actors)
    } catch (error) {
        console.error(error)
    }
}

function renderActors(list) {
    actorsContainer.innerHTML = ''

    list.forEach(e => {
        const art = document.createElement('article')
        art.classList.add('actor-card')

        art.innerHTML = `
            <img class="actor-photo" src="${e.posterUrl || ''}">
            <span class="actor-name">${e.nameRu || e.nameEn || 'Без имени'}</span>
        `

        actorsContainer.appendChild(art)
    })
}

name.textContent = ''
slogan.textContent = ''
year.textContent = ''
genre.textContent = ''
age.textContent = ''
duration.textContent = ''
countries.textContent = ''
rating.textContent = ''
poster.src = ''
type.textContent = ''
actorsContainer.innerHTML = ''
description.textContent = ''

getFilmData(id)