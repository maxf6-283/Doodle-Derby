document.addEventListener("DOMContentLoaded", () => {
  const logoBtn = document.querySelector(".logo-button");
  let logoClickCount = 0;
  const logoClickEvent = 20;
  const eventDuration = 10; //seconds
  if (logoBtn) {
    logoBtn.addEventListener("click", () => {
      // 1. Play a sound (optional)
      // const clickSfx = new Audio('path/to/sfx.mp3');
      // clickSfx.play();

      // 2. Add logic (e.g., a screen shake or secret easter egg)
      console.log("Logo clicked! Squish!");
    
      logoClickCount++;
      if (logoClickCount >= logoClickEvent) {
        console.log("unlocked secret easter egg!");
        const sheepInterval = setInterval(spawnDoodle, 50);
        setTimeout(() => {
          clearInterval(sheepInterval);
        }, eventDuration * 1000);
        logoClickCount = 0;
      }
    });
  }
});

const sheepPool = [];
const MAX_POOL_SIZE = 500; // Total sheep allowed to exist

function getSheepFromPool() {
  // If we have a sheep waiting in the pool, reuse it
  if (sheepPool.length > 0) {
    return sheepPool.pop();
  }

  // If pool is empty, only create a new one if we haven't hit the limit
  const totalSheepOnScreen = document.querySelectorAll(".moving-sheep").length;
  if (totalSheepOnScreen < MAX_POOL_SIZE) {
    const doodle = document.createElement("img");
    doodle.src = "/landing-page/sheep_loading.png";
    doodle.classList.add("moving-sheep");
    return doodle;
  }

  return null; // Limit reached, don't spawn
}

function spawnDoodle() {
  const doodle = getSheepFromPool();
  if (!doodle) return;

  // Reset/Randomize properties
  const randomTop = Math.random() * 80;
  const randomDuration = 1 + Math.random() * 1.5;
  const randomSize = 30 + Math.random() * 100;
  const randomZ = Math.floor(Math.random() * 5) - 2;

  // Re-apply styles
  doodle.style.display = "block"; // Make visible
  doodle.style.top = `${randomTop}%`;
  doodle.style.width = `${randomSize}px`;
  doodle.style.opacity = "0.9";
  doodle.style.animation = "none"; // Reset animation
  doodle.style.zIndex = randomZ;

  // Trigger reflow to restart animation
  void doodle.offsetWidth;

  doodle.style.animation = `moveLeft ${randomDuration}s linear forwards`;

  if (!doodle.parentNode) {
    document.body.appendChild(doodle);
  }

  // Instead of removing, we "recycle" it back into the pool
  setTimeout(() => {
    doodle.style.display = "none";
    sheepPool.push(doodle);
  }, randomDuration * 1000);
}
