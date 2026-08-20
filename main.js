/**
 * Caelum Mercer — light page runtime
 * Product order (newest release first) + scroll progress + reveal-on-view
 */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
let scrollY = 0;
let targetScroll = 0;

/** Newest product first. In-progress (empty data-released) ranks above shipped apps. */
function sortProductsByRelease() {
  const section = document.querySelector("#products");
  if (!section) return;

  const products = [...section.querySelectorAll(":scope > .product")];
  products.sort((a, b) => {
    const dateA = a.dataset.released || "";
    const dateB = b.dataset.released || "";
    if (!dateA && !dateB) return 0;
    if (!dateA) return -1;
    if (!dateB) return 1;
    return dateB.localeCompare(dateA);
  });
  products.forEach((el) => section.appendChild(el));
}

sortProductsByRelease();

function updateScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  targetScroll = max > 0 ? window.scrollY / max : 0;
  scrollY += (targetScroll - scrollY) * 0.12;
  root.style.setProperty("--scroll", scrollY.toFixed(4));
  requestAnimationFrame(updateScroll);
}
requestAnimationFrame(updateScroll);

const revealEls = document.querySelectorAll(".reveal, .reveal-up");
if (!reduceMotion && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-in"));
}

requestAnimationFrame(() => {
  document.querySelectorAll(".hero .reveal").forEach((el) => el.classList.add("is-in"));
});
