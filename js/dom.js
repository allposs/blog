/* Menu button */
(function () {
    var button = document.getElementById('menu-button')
    if (button) {
        var menu = document.getElementById('patterns-list')
        button.addEventListener('click', function () {
            var expanded = this.getAttribute('aria-expanded') === 'true'
            this.setAttribute('aria-expanded', !expanded)
        })
    }
}())