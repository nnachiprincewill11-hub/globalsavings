const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
}
document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());

// These are illustrative demo reviews, not verified customer endorsements.
// Replace them with genuine testimonials and permission before publishing.
const demoReviews = [
  {name:"Ada Eze", place:"Lagos, Nigeria", initials:"AE", quote:"This simple layout makes it easier to think about my savings goals and plan one step at a time."},
  {name:"Emeka Johnson", place:"Abuja, Nigeria", initials:"EJ", quote:"I like having helpful information and a clear place to keep track of what I want to achieve."},
  {name:"Blessing Okafor", place:"Port Harcourt, Nigeria", initials:"BO", quote:"The pages are easy to navigate on my phone, and the savings tips are a useful starting point."},
  {name:"Tomi Adebayo", place:"Ibadan, Nigeria", initials:"TA", quote:"Breaking a goal into smaller steps makes the process feel more manageable."},
  {name:"Chidi Nwosu", place:"Enugu, Nigeria", initials:"CN", quote:"A clean and simple experience that helps me stay focused on my personal plans."},
  {name:"Zainab Bello", place:"Kano, Nigeria", initials:"ZB", quote:"I appreciate that the information is straightforward and easy to read."}
];
let reviewPage = 0;
function renderReviews() {
  const grid = document.getElementById("testimonial-grid");
  const dots = document.getElementById("review-dots");
  if (!grid || !dots) return;
  const isSmall = window.matchMedia("(max-width: 850px)").matches;
  const count = isSmall ? 1 : 3;
  const pages = Math.ceil(demoReviews.length / count);
  reviewPage = Math.min(reviewPage, pages - 1);
  const start = reviewPage * count;
  grid.innerHTML = demoReviews.slice(start, start + count).map(r => `
    <article class="testimonial-card">
      <div class="review-person"><span class="avatar" aria-hidden="true">${r.initials}</span>
        <div><strong>${r.name}</strong><small>${r.place}</small><span class="stars" aria-label="Demo rating">★★★★★</span></div>
      </div>
      <blockquote>“${r.quote}”</blockquote>
    </article>`).join("");
  dots.innerHTML = Array.from({length:pages}, (_, i) =>
    `<button class="${i === reviewPage ? "active" : ""}" aria-label="Show testimonial page ${i+1}" data-page="${i}"></button>`
  ).join("");
  dots.querySelectorAll("button").forEach(b => b.addEventListener("click", () => { reviewPage = Number(b.dataset.page); renderReviews(); }));
}
document.getElementById("prev-review")?.addEventListener("click", () => {
  const isSmall = window.matchMedia("(max-width: 850px)").matches;
  const pages = Math.ceil(demoReviews.length / (isSmall ? 1 : 3));
  reviewPage = (reviewPage - 1 + pages) % pages; renderReviews();
});
document.getElementById("next-review")?.addEventListener("click", () => {
  const isSmall = window.matchMedia("(max-width: 850px)").matches;
  const pages = Math.ceil(demoReviews.length / (isSmall ? 1 : 3));
  reviewPage = (reviewPage + 1) % pages; renderReviews();
});
renderReviews();
window.addEventListener("resize", renderReviews);
