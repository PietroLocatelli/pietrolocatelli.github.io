// Light/dark mode toggle shared by all pages except main page
(() => {
    const root = document.documentElement;
    const button = document.getElementById('theme-toggle');
    if (!button) return;

    const updateLabel = (theme) => {
        button.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    };

    const setTheme = (theme) => {
        root.dataset.theme = theme;
        updateLabel(theme);
        try {
            localStorage.setItem('theme', theme);
        } catch {
            console.warn("Local storage not available, the theme choice will not be remembered between sessions.")
        }
    };

    updateLabel(root.dataset.theme);
    button.addEventListener('click', () => {
        setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
    });
})();