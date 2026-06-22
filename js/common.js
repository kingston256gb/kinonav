// ========= Обработчик темы ==========
const logoImgs = document.querySelectorAll('#logo')
const useDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const theme = localStorage.getItem('theme')
const changeThemeBtn = document.querySelector('.change-theme_btn')

// Смена лого в зависимости от темы
function updateLogo(dark) {
    logoImgs.forEach(i => {
        i.src = dark ? 'assets/imgs/logo_dark.png' : 'assets/imgs/logo_light.png'
    })
}

if (theme) {
    document.body.setAttribute('data-theme', theme)
    changeThemeBtn.textContent = theme === 'dark' ? '☀️' : '🌙'
    updateLogo(theme === 'dark')
} else {
    useDark ? document.body.setAttribute('data-theme', 'dark') : body.setAttribute('data-theme', 'light')
    changeThemeBtn.textContent = useDark ? '☀️' : '🌙'
    updateLogo(useDark)
}

// Смена темы
changeThemeBtn.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark'

    if (isDark) {
        document.body.setAttribute('data-theme', 'light')
        changeThemeBtn.textContent = '🌙'
        localStorage.setItem('theme', 'light')
        updateLogo(false)  
    } else {
        document.body.setAttribute('data-theme', 'dark')
        changeThemeBtn.textContent = '☀️'
        localStorage.setItem('theme', 'dark')
        updateLogo(true)   
    }
})



// ========== Мобильное меню =========
const burgerBtn = document.querySelector('#burgerBtn')
const mobileNav = document.querySelector('#mobile')

burgerBtn.addEventListener('click', () => {
    mobileNav.classList.toggle('active')
})