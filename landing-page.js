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

function _buildOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "dd-overlay";
  return overlay;
}

function _buildModal() {
  const modal = document.createElement("div");
  modal.className = "dd-modal";
  return modal;
}

function _close(overlay, modal, resolve, value) {
  overlay.classList.add("closing");
  modal.classList.add("closing");
  setTimeout(() => { overlay.remove(); resolve(value); }, 150);
}

function ddAlert(titleOrMsg, message) {
  const title = message !== undefined ? titleOrMsg : null;
  const msg   = message !== undefined ? message : titleOrMsg;
  return new Promise((resolve) => {
    const overlay = _buildOverlay();
    const modal   = _buildModal();
    if (title) {
      const h = document.createElement("p");
      h.className = "dd-modal-title";
      h.textContent = title;
      modal.appendChild(h);
    }
    const p = document.createElement("p");
    p.className = "dd-modal-message";
    p.textContent = msg;
    modal.appendChild(p);
    const btnRow = document.createElement("div");
    btnRow.className = "dd-modal-buttons";
    const ok = document.createElement("button");
    ok.className = "dd-btn primary";
    ok.textContent = "OK";
    ok.addEventListener("click", () => _close(overlay, modal, resolve, undefined));
    btnRow.appendChild(ok);
    modal.appendChild(btnRow);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) _close(overlay, modal, resolve, undefined);
    });
    ok.focus();
  });
}

function ddPrompt(label, placeholder = "") {
  return new Promise((resolve) => {
    const overlay = _buildOverlay();
    const modal   = _buildModal();
    const p = document.createElement("p");
    p.className = "dd-modal-message";
    p.textContent = label;
    modal.appendChild(p);
    const input = document.createElement("input");
    input.className = "dd-modal-input";
    input.type = "text";
    input.placeholder = placeholder || "type here...";
    modal.appendChild(input);
    const btnRow = document.createElement("div");
    btnRow.className = "dd-modal-buttons";
    const cancel = document.createElement("button");
    cancel.className = "dd-btn";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", () => _close(overlay, modal, resolve, null));
    const ok = document.createElement("button");
    ok.className = "dd-btn primary";
    ok.textContent = "OK";
    ok.addEventListener("click", () => {
      const val = input.value.trim();
      _close(overlay, modal, resolve, val || null);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") ok.click();
      if (e.key === "Escape") cancel.click();
    });
    btnRow.appendChild(cancel);
    btnRow.appendChild(ok);
    modal.appendChild(btnRow);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) _close(overlay, modal, resolve, null);
    });
    setTimeout(() => input.focus(), 100);
  });
}

// Wire up buttons to use the new modals
document.getElementById("joinBtn").addEventListener("click", async () => {
  const code = await ddPrompt("Enter Game Code:", "e.g. ABC123");
  if (!code) return;
  const baseUrl = window.location.origin + "/lobby.html";
  window.location.replace(`${baseUrl}#r=${code}`);
});

document.getElementById("creditsLink").addEventListener("click", () => {
  ddAlert("Credits!!", 
    "Artists: Allie, Jay, Marissa, and Bella "+
    "programmers: Neel, Seven, Zidane, Isha, Allie and... " + 
    " audio: Jay and... " + 
    "designers: Zidane and Emily"
  );
});

document.getElementById("howToPlayLink").addEventListener("click", () => {
  ddAlert("How to Play", "Each players submits 5-10 word prompts. At the start of"+ 
    "each round, two artists are randomly selected and given a prompt to draw. " + 
    "The rest of the players have a set time limit to guess both artists prompts. " +
     "The artist with the most correct guesses in the time limit wins the round!" +
     " The player who guesses the fastest gains the most points!! Have fun doodlers!!"
  );
});