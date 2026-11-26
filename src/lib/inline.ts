/**
 * The only scripts the site ships, both inline and both tiny. The build hashes
 * whatever inline scripts it finds in the output and writes those hashes into
 * the Content-Security-Policy header, so editing these needs no other change.
 */

/**
 * Applies a stored theme before first paint and handles the theme toggle.
 * Without JavaScript the page simply follows the system color scheme.
 */
export const THEME_SCRIPT = `(function(){var d=document.documentElement;d.classList.add('js');try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')d.dataset.theme=t}catch(e){}document.addEventListener('click',function(e){var b=e.target instanceof Element&&e.target.closest('[data-theme-toggle]');if(!b)return;var n=(d.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'))==='dark'?'light':'dark';d.dataset.theme=n;try{localStorage.setItem('theme',n)}catch(e){}})})();`;

/**
 * Speculation Rules: when a visitor hovers or starts to press a link to another
 * page of this site, the browser prepares that page in the background, so the
 * navigation is instant. Files (anything with an extension) are left alone.
 */
export const SPECULATION_RULES = JSON.stringify({
  prerender: [
    {
      where: {
        and: [{ href_matches: '/*' }, { not: { href_matches: '/*.*' } }, { not: { selector_matches: '[download]' } }],
      },
      eagerness: 'moderate',
    },
  ],
});
