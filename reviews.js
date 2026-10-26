/* ===== Floating Reviews — seamless infinite loop, pauses on interaction ===== */
(function () {
  function init() {
    var track = document.querySelector(".floating-reviews-track");
    if (!track || track.dataset.ready) return;
    track.dataset.ready = "1";

    // 1. Take only the ORIGINAL first group (ignore any hand-made duplicate)
    var groups = track.querySelectorAll(".floating-reviews-group");
    var original = groups[0];
    if (!original) return;
    for (var i = 1; i < groups.length; i++) groups[i].parentNode.removeChild(groups[i]);

    // 2. Wrap track in a clipping viewport (edge fades live here)
    var viewport = document.createElement("div");
    viewport.className = "floating-reviews-viewport";
    track.parentNode.insertBefore(viewport, track);
    viewport.appendChild(track);

    var distance = 0;   // width of ONE group (incl. margins) = loop length
    var position = 0;
    var last = 0;
    var paused = false;
    var SPEED = 40;     // px per second

    // 3. Build copies so the track is always wider than 2x the screen
    function build() {
      var copies = track.querySelectorAll(".floating-reviews-group");
      for (var i = copies.length - 1; i > 0; i--) track.removeChild(copies[i]);

      distance = original.offsetWidth;
      if (!distance) return;

      var needed = Math.ceil((viewport.offsetWidth * 2) / distance) + 1;
      if (needed < 2) needed = 2;
      for (var n = 1; n < needed; n++) {
        var clone = original.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
      }
      position = position % distance;
    }

    function frame(t) {
      if (!last) last = t;
      var dt = Math.min((t - last) / 1000, 0.05);
      last = t;

      if (!paused && distance > 0) {
        position += SPEED * dt;
        if (position >= distance) position -= distance; // jump back — identical content, so no gap
      }
      track.style.transform = "translate3d(" + (-position) + "px,0,0)";
      track.style.webkitTransform = "translate3d(" + (-position) + "px,0,0)";
      requestAnimationFrame(frame);
    }

    // 4. Pause on hover / touch / focus, resume after
    var resumeTimer;
    function pause() { paused = true; clearTimeout(resumeTimer); }
    function resume(delay) {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function () { paused = false; }, delay || 0);
    }
    viewport.addEventListener("mouseenter", pause);
    viewport.addEventListener("mouseleave", function () { resume(0); });
    viewport.addEventListener("touchstart", pause, { passive: true });
    viewport.addEventListener("touchend", function () { resume(1500); }, { passive: true });
    viewport.addEventListener("touchcancel", function () { resume(1500); }, { passive: true });
    viewport.addEventListener("focusin", pause);
    viewport.addEventListener("focusout", function () { resume(0); });

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(build, 150);
    });
    window.addEventListener("load", build);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);

    build();
    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();