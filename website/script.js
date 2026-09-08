/* =========================================================
   Gearx KAVACH Website JavaScript
   This file controls:
   1. Sticky header state
   2. Mobile menu
   3. Scroll reveal animations
   4. Cursor glow
   5. Product image gallery
   6. Prebooking form demo interaction
   ========================================================= */
// Initialize EmailJS
emailjs.init({
  publicKey: "Jr4ohoC95bqD6JEtk"
});
const header = document.querySelector("[data-header]");
const menuButton = document.querySelector("[data-menu-button]");
const cursorGlow = document.querySelector(".cursor-glow");
const revealItems = document.querySelectorAll(".reveal");
const gallery = document.querySelector("[data-gallery]");
const galleryImage = document.querySelector("[data-gallery-image]");
const prebookForm = document.querySelector("[data-prebook-form]");
const productSelect = document.querySelector("[data-product-select]");
const formMessage = document.querySelector("[data-form-message]");
const productButtons = document.querySelectorAll("[data-select-product]");

// Adds a glass background to the header after the user starts scrolling.
const setHeaderState = () => {
  header.classList.toggle("scrolled", window.scrollY > 24);
};

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

// Opens and closes the mobile navigation menu.
menuButton.addEventListener("click", () => {
  const open = header.classList.toggle("menu-active");
  document.body.classList.toggle("menu-open", open);
  menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});

// Closes mobile menu after clicking a navigation link.
document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("menu-active");
    document.body.classList.remove("menu-open");
    menuButton.setAttribute("aria-label", "Open menu");
  });
});

// Reveals cards and sections when they enter the viewport.
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 45, 260)}ms`;
  revealObserver.observe(item);
});

// Moves the soft glow behind the cursor for a premium interactive feel.
window.addEventListener(
  "pointermove",
  (event) => {
    cursorGlow.style.left = `${event.clientX}px`;
    cursorGlow.style.top = `${event.clientY}px`;
  },
  { passive: true }
);

// Product story gallery: change the large image when a gallery tab is clicked.
if (gallery && galleryImage) {
  gallery.addEventListener("click", (event) => {
    const button = event.target.closest("[data-image]");
    if (!button) return;

    gallery.querySelectorAll(".gallery-button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    galleryImage.style.opacity = "0";

    window.setTimeout(() => {
      galleryImage.src = button.dataset.image;
      galleryImage.alt = `${button.textContent.trim()} preview for KAVACH smart helmet`;
      galleryImage.style.opacity = "1";
    }, 160);
  });
}

// Product catalog buttons: select product in the form and scroll to prebooking.
productButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedProduct = button.dataset.selectProduct;
    productSelect.value = selectedProduct;
    document.querySelector("#prebook").scrollIntoView({ behavior: "smooth" });
  });
});

// Send prebooking details through EmailJS.
if (prebookForm && formMessage) {
  prebookForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = prebookForm.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
    formMessage.textContent = "Submitting your prebooking...";

    try {
      await emailjs.sendForm(
        "service_7jrvgqp",
        "template_0ur8pai",
        prebookForm
      );

      const name =
        prebookForm.querySelector('[name="name"]')?.value.trim() || "Rider";

      const product =
        prebookForm.querySelector('[name="product"]')?.value || "KAVACH";

      formMessage.textContent =
        `Thank you, ${name}! Your prebooking for ${product} has been submitted successfully. We will contact you soon.`;

      prebookForm.reset();
    } catch (error) {
  console.error("EmailJS error:", error);

  formMessage.textContent =
    `Email failed: ${error?.text || error?.message || "Unknown error"}`;

  alert(
    `EmailJS Error:\n${error?.text || error?.message || JSON.stringify(error)}`
  );
} 
    finally {
      submitButton.disabled = false;
      submitButton.textContent = "Submit Prebooking";
    }
  });
}