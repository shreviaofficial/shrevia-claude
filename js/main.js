/* ============================================================
   SHREVIA — interactions
   nav state · mobile menu · scroll reveals · counters ·
   card tilt · investor form · footer year
   ============================================================ */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- header scroll state ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- active nav link ---------- */
  var page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a, .mobile-menu a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === page) a.classList.add("active");
  });

  /* ---------- mobile menu ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("mobile-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- scroll reveals ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReduced) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- count-up stats ---------- */
  function pad(n, width) {
    var s = String(n);
    while (s.length < width) s = "0" + s;
    return s;
  }
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var width = parseInt(el.getAttribute("data-pad"), 10) || 0;
    if (prefersReduced) { el.textContent = pad(target, width); return; }
    var dur = 1400;
    var start = null;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = pad(Math.round(target * eased), width);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- card tilt (subtle, pointer only) ---------- */
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (canHover && !prefersReduced) {
    document.querySelectorAll(".tilt").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "perspective(900px) rotateX(" + (-y * 3.4).toFixed(2) + "deg) rotateY(" + (x * 3.4).toFixed(2) + "deg) translateY(-2px)";
      });
      card.addEventListener("pointerleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ---------- investor form ---------- */
  var form = document.getElementById("investor-form");
  var success = document.getElementById("form-success");
  if (form && success) {
    var mobile = form.querySelector('input[type="tel"]');
    if (mobile) {
      mobile.addEventListener("input", function () {
        mobile.value = mobile.value.replace(/[^0-9]/g, "").slice(0, 12);
      });
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      // No backend wired yet — swap to success state.
      // Hook this handler to your endpoint (Formspree / API) when ready.
      form.style.display = "none";
      success.classList.add("show");
      success.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
    });
  }

  /* ---------- footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- 3D module watchdog ----------
     If the three.js CDN (or module scripts) never load, swap the
     empty canvases for their static SVG fallbacks. */
  window.setTimeout(function () {
    if (window.__shreviaScenes) return;
    [
      ["substrate-scene", "substrate-fallback"],
      ["stack-scene", "stack-fallback"],
    ].forEach(function (pair) {
      var canvas = document.getElementById(pair[0]);
      var fb = document.getElementById(pair[1]);
      if (canvas && !canvas.dataset.ok) {
        canvas.style.display = "none";
        if (fb) fb.hidden = false;
      }
    });
  }, 4000);
})();
