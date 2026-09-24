# PICO OS 6 Web App Runtime: what PICO's own docs say

Rendered from developer.picoxr.com with headless Chrome on 2026-09-24 (the site renders
client-side, so a plain fetch returns only navigation). Quotes are verbatim; each section names its
source page. Where these disagree with anything else in the kit, **these win** until measured
otherwise in the emulator.

## 1. WebSpatial only activates in the Web App Runtime, not in a browser tab

> "In the Web App Runtime of PICO OS 6, any WebSpatial API used in your page source is automatically
> activated."
> "Because the Web App Runtime in PICO OS 6 comes with the WebSpatial Runtime built in, if you are
> testing WebSpatial only on the PICO emulator and PICO devices, you do not need to install or use
> WebSpatial Builder or the packaged app mode. You can run it directly in website mode"

Source: https://developer.picoxr.com/document/web/webspatial/

**Consequence:** a page in an ordinary PICO Browser tab is flat. Depth appears only once the page is
running as a standalone Web App.

## 2. How a page becomes a standalone Web App: the "Open as standalone app" button

> "After opening a URL in a PICO browser tab, if that URL belongs to some Web App (i.e., the URL can be
> matched by a Web App's scope), an "Open as standalone app" button will appear in the browser's
> address bar. Clicking this button launches the Web App associated with the current URL as a
> standalone app."

> "If you open the Web App page in the PICO Browser, by default, the address bar only provides an
> "Open as standalone app" button and does not provide an "Install" button."

Once standalone: no tab bar, every page is its own window, `window.open` / `target="_blank"` open new
windows, and a small floating indicator expands into the "PWA menu" (Back/Forward/Home with
`display: minimal-ui`, none with `standalone`, plus "Open in browser" and "Install").

Source: https://developer.picoxr.com/document/web/install-free/

## 3. The URL must be HTTPS, or HTTP at 10.0.2.2 in the emulator. `localhost` does not qualify.

> "All web page URLs for the Web App must use HTTPS."
> "When debugging local URLs in the PICO Emulator, use the default IP address 10.0.2.2. In that case,
> you can use HTTP, for example, http://10.0.2.2:5173/. ... in Vite you'd set server: { host: true }."

On a real PICO OS 6 device (Developer Mode on), HTTP is allowed after:

```
adb shell am broadcast -p com.picoxr.webappservice -a com.picoxr.webappservice.action.TOGGLE_DEBUG_MODE --ez enable true
```

Source: https://developer.picoxr.com/document/web/manifest/ (also on /webspatial/)

**MEASURED in our emulator (2026-09-24), and this overrides the doc for the workshop:**
`http://10.0.2.2:<port>/` loads, but reports `isSecureContext=false`, `beforeinstallprompt` never
fires, and the page stays a flat tab. What worked (Lab 1, installed as
`com.picoxr.webapp.localhost.*`, depth visible):

```
adb reverse tcp:<port> tcp:<port>
# then open http://localhost:<port>/ in the emulator's PICO Browser and install / open as app
```

`localhost` is a secure context, so the page qualifies as a Web App. Use this recipe; see
`labs/SPATIAL-CRACK.md` for the full evidence.

## 4. The manifest: four required fields, JSON MIME type

> "<link rel="manifest" href="/app.webmanifest">"
> "This manifest URL should return a response with a JSON MIME type, such as application/manifest+json."
> "The JSON must include at least these fields: name or short_name ... icons ... start_url ...
> display"

`scope` decides which URLs belong to the app (and so whether the button appears). `display` is
**required** by PICO (not optional as on some platforms).

Source: https://developer.picoxr.com/document/web/manifest/

## 5. Tell which runtime you are in

```js
function getWebRuntime() {
  if (window.matchMedia('(display-mode: browser)').matches) return 'browser';
  if (window.matchMedia('(display-mode: standalone)').matches
      || window.matchMedia('(display-mode: minimal-ui)').matches) return 'webapp';
}
```

Also usable in CSS: `@media (display-mode: standalone) { ... }`. Recommended as an on-page badge in
every lab so the attendee can see at a glance why nothing pops out.

Source: https://developer.picoxr.com/document/web/install-free/

## 6. Installing is optional

Standalone without install works for development. "Install" (PWA menu) adds a home-screen icon and
permissions; in the browser, `beforeinstallprompt` still fires and `prompt()` shows the install
dialog.

Source: https://developer.picoxr.com/document/web/installable/
