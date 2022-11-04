# hide twitter screenshot threads

![hide twitter screenshot threads](https://i.imgur.com/OZWr0wV.png)

this is a manifest v2 extension for use on image boards; it will attempt to automatically hide threads which use a twitter screenshot as the main image.

it occasionally results in false positives and false negatives, but from my testing it works pretty well; this extension might be worth considering if you are really fed up with twitter screenshot threads.

---

### how it works
the extension scans the main thumbnail for every thread and performs a series of tests to try and determine if the thumbnail is twitter-like. if it almost certainly is, it will automatically hide/collapse the thread, and if it almost certainly isn't, it will not hide the thread.

if it is uncertain as to whether it is or isn't, it will only then download the full size image and do additional tests to try and determine if the image is a twitter screenshot. it tries to avoid downloading too many full size images by making reasonable guesses based solely off of the thumbnail.

after a thread is hidden, it will append a 'view' link and if you hover over the link, it will show a preview of the thread with a twitter logo overlay.

![hovering over view link](https://i.imgur.com/ZEes6MF.png)

you can also pin the extension to the top, and a badge indicator will show how many threads have been hidden on the page.
