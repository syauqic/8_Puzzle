document.addEventListener("DOMContentLoaded", function () {
  const boardEl = document.getElementById("board");
  const progressBar = document.querySelector(".progress-bar");
  const solveBtn = document.getElementById("solveBtn");
  const tryBtn = document.getElementById("tryBtn");

  const arrows = {
    up: document.getElementById("arrowUp"),
    down: document.getElementById("arrowDown"),
    left: document.getElementById("arrowLeft"),
    right: document.getElementById("arrowRight"),
  };

  let currentBoard = [];
  let lastRects = new Map();

  // control flags
  let stopConfetti = false;
  let tryMode = false;
  let solving = false; // agar tidak tumpuk solve calls

  // -----------------------
  // RENDER with FLIP animation
  // -----------------------
  function render(board, animate = true) {
    // record old rects
    const oldTiles = Array.from(boardEl.children);
    lastRects.clear();
    oldTiles.forEach((el) => {
      const key = el.dataset.key;
      if (key !== undefined) lastRects.set(key, el.getBoundingClientRect());
    });

    // create new tiles
    boardEl.innerHTML = "";
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const val = board[r][c];
        const tile = document.createElement("div");
        tile.className = val === 0 ? "tile zero" : "tile";
        tile.textContent = val === 0 ? "" : val;
        tile.dataset.key = `${val}`;
        tile.style.gridRowStart = r + 1;
        tile.style.gridColumnStart = c + 1;
        tile.style.transition = "";
        tile.style.transform = "";
        boardEl.appendChild(tile);
      }
    }
    currentBoard = board.map((r) => [...r]);

    if (!animate) return;

    // measure new rects and animate from old positions (FLIP)
    const newTiles = Array.from(boardEl.children);
    newTiles.forEach((el) => {
      const key = el.dataset.key;
      const newRect = el.getBoundingClientRect();
      const oldRect = lastRects.get(key);
      if (oldRect) {
        const dx = oldRect.left - newRect.left;
        const dy = oldRect.top - newRect.top;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => {
          el.style.transition = "transform 350ms ease";
          el.style.transform = "translate(0,0)";
        });
        el.addEventListener(
          "transitionend",
          () => {
            el.style.transition = "";
            el.style.transform = "";
          },
          { once: true }
        );
      } else {
        el.style.transform = "scale(0.9)";
        el.style.opacity = "0";
        requestAnimationFrame(() => {
          el.style.transition = "transform 200ms ease, opacity 200ms ease";
          el.style.transform = "scale(1)";
          el.style.opacity = "1";
        });
        el.addEventListener(
          "transitionend",
          () => {
            el.style.transition = "";
            el.style.transform = "";
            el.style.opacity = "";
          },
          { once: true }
        );
      }
    });
  }

  // -----------------------
  // SOLVABILITY CHECK (needed)
  // -----------------------
  // flat: array of 9 numbers (0..8)
  function isSolvable(flat) {
    const arr = flat.filter((n) => n !== 0);
    let inv = 0;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] > arr[j]) inv++;
      }
    }
    return inv % 2 === 0;
  }

  // -----------------------
  // GENERATE PUZZLE (random solvable)
  // -----------------------
  function generateSolvable() {
    let nums = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    // shuffle until solvable (limit attempts for safety)
    let tries = 0;
    do {
      nums = nums.sort(() => Math.random() - 0.5);
      tries++;
      if (tries > 2000) break; // fallback
    } while (!isSolvable(nums));
    return [nums.slice(0, 3), nums.slice(3, 6), nums.slice(6, 9)];
  }

  //   function generatePuzzle() {
  //     const board = generateSolvable();
  //     render(board, false);
  //     tryBtn.style.display = "inline-block";
  //     solveBtn.style.display = "inline-block";
  //     for (let key in arrows) arrows[key].style.display = "none";
  //     progressBar.style.width = "0%";
  //     progressBar.parentElement.style.visibility = "hidden";
  //     const autoBtn = document.getElementById("autoBtn");
  //     if (autoBtn) {
  //       autoBtn.remove(); // hapus dari DOM biar bersih
  //       tryMode = false;
  //       solving = false;
  //     }
  //   }

  function generatePuzzle() {
  // 🔹 Beberapa puzzle mudah (solvable)
  const easyPuzzles = [
    [
      [1, 2, 3],
      [4, 5, 6],
      [7, 0, 8], // hampir selesai
    ],
    [
      [1, 2, 3],
      [4, 5, 6],
      [0, 7, 8], // 0 di kiri bawah
    ],
    [
      [1, 2, 3],
      [4, 0, 6],
      [7, 5, 8], // sedikit acak
    ],
  ];

  // 🔸 Pilih salah satu puzzle secara acak
  const board = easyPuzzles[Math.floor(Math.random() * easyPuzzles.length)];

  // 🔹 Render puzzle ke layar
  render(board);

  // 🔹 Tampilkan tombol Try It & Solve
  tryBtn.style.display = "inline-block";
  solveBtn.style.display = "inline-block";

  // 🔹 Sembunyikan tombol arah
  for (let key in arrows) arrows[key].style.display = "none";

  // 🔹 Reset progress bar
  progressBar.style.width = "0%";
  progressBar.parentElement.style.visibility = "hidden";

  // 🔹 Hilangkan tombol Auto Play kalau ada
  const autoBtn = document.getElementById("autoBtn");
  if (autoBtn) {
    autoBtn.remove();
  }

  // 🔹 Reset mode & status
  tryMode = false;
  solving = false;
}


  // -----------------------
  // MODE TRY IT
  // -----------------------
  function enableTryIt() {
    tryBtn.style.display = "none";
    arrows.up.style.display = "block";
    arrows.down.style.display = "block";
    arrows.left.style.display = "block";
    arrows.right.style.display = "block";
    tryMode = true;
  }

  // -----------------------
  // MODE SOLVE (dummy but animated)
  // -----------------------
  //

  // -----------------------
  // MODE SOLVE (dummy but animated + tombol Auto Play)
  // -----------------------
  function startSolve() {
    if (solving) return;
    solving = true;
    tryMode = false;

    const steps = [
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 0],
      ],
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 0, 8],
      ],
      [
        [1, 2, 3],
        [4, 0, 6],
        [7, 5, 8],
      ],
      [
        [1, 2, 3],
        [0, 4, 6],
        [7, 5, 8],
      ],
    ];

    arrows.up.style.display = "none";
    arrows.down.style.display = "none";
    arrows.left.style.display = "block";
    arrows.right.style.display = "block";

    progressBar.parentElement.style.visibility = "visible";
    progressBar.style.width = "0%";

    // 🔹 Tambahkan tombol Auto Play di sebelah Solve
    let autoBtn = document.getElementById("autoBtn");
    if (!autoBtn) {
      autoBtn = document.createElement("button");
      autoBtn.id = "autoBtn";
      autoBtn.textContent = "Auto Play";
      Object.assign(autoBtn.style, {
        marginLeft: "8px",
        padding: "10px 16px",
        background: "#1b9aaa",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
      });
      autoBtn.onmouseover = () => (autoBtn.style.background = "#157a84");
      autoBtn.onmouseout = () => (autoBtn.style.background = "#1b9aaa");
      solveBtn.insertAdjacentElement("afterend", autoBtn);
    }
    autoBtn.style.display = "inline-block";

    // 🔹 Ketika tombol Auto Play diklik → jalankan auto animasi solve
    autoBtn.onclick = () => {
      autoBtn.disabled = true;
      solveBtn.disabled = true;
      autoPlaySolve(steps, () => {
        autoBtn.disabled = false;
        autoBtn.style.display = "none";
        solveBtn.disabled = false;
        progressBar.parentElement.style.visibility = "hidden";
        solving = false;
      });
    };
  }

  // -----------------------
  // ANIMASI AUTO PLAY (dummy animation)
  // -----------------------
  function autoPlaySolve(steps, onFinish) {
    let idx = 0;
    const total = steps.length;
    const stepDuration = 700;
    progressBar.style.transition = `width ${stepDuration}ms linear`;

    function step() {
      render(steps[idx], true);
      const pct = Math.round(((idx + 1) / total) * 100);
      progressBar.style.width = pct + "%";

      idx++;
      if (idx < total) {
        setTimeout(step, stepDuration);
      } else {
        setTimeout(() => {
          if (onFinish) onFinish();
        }, 400);
      }
    }

    step();
  }

  // -----------------------
  // MOVE TILE (Try It)
  // -----------------------
  function moveTile(direction) {
    let [zr, zc] = findZero(currentBoard);
    let newBoard = currentBoard.map((r) => [...r]);
    let targetR = zr,
      targetC = zc;

    if (direction === "up" && zr < 2) targetR++;
    if (direction === "down" && zr > 0) targetR--;
    if (direction === "left" && zc < 2) targetC++;
    if (direction === "right" && zc > 0) targetC--;

    if (targetR !== zr || targetC !== zc) {
      [newBoard[zr][zc], newBoard[targetR][targetC]] = [
        newBoard[targetR][targetC],
        newBoard[zr][zc],
      ];
      render(newBoard, true);
      if (isSolved(newBoard)) showCompletionPopup();
    }
  }

  function findZero(board) {
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) if (board[r][c] === 0) return [r, c];
    return [0, 0];
  }

  function isSolved(board) {
    const correct = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    return board.flat().every((v, i) => v === correct[i]);
  }

  // -----------------------
  // POPUP COMPLETE + PLAY AGAIN (stop confetti)
  // -----------------------
  function showCompletionPopup() {
    // create overlay
    const overlay = document.createElement("div");
    overlay.id = "completePopup";
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "2000",
      backdropFilter: "blur(6px)",
    });

    const text = document.createElement("h1");
    text.textContent = "🎉 COMPLETE! 🎉";
    Object.assign(text.style, {
      color: "#fff",
      fontSize: "64px",
      marginBottom: "20px",
      textShadow: "0 0 20px #00f6ff, 0 0 40px #1b9aaa",
    });

    const button = document.createElement("button");
    button.textContent = "🔁 Play Again";
    Object.assign(button.style, {
      padding: "12px 28px",
      fontSize: "18px",
      border: "none",
      borderRadius: "8px",
      background: "#1b9aaa",
      color: "#fff",
      cursor: "pointer",
      transition: "0.3s",
    });
    button.onmouseover = () => (button.style.background = "#157a84");
    button.onmouseout = () => (button.style.background = "#1b9aaa");

    button.onclick = () => {
      const winSound = document.getElementById("winSound");
      if (winSound) {
        winSound.pause();
        winSound.currentTime = 0;
      }
      stopConfetti = true; // stop confetti loop
      overlay.remove();
      generatePuzzle();
    };

    overlay.appendChild(text);
    overlay.appendChild(button);
    document.body.appendChild(overlay);

    // play sound
    const winSound = document.getElementById("winSound");
    if (winSound) {
      winSound.volume = 0.5;
      // play may be blocked by browser until user gesture; that's OK
      try {
        winSound.play();
      } catch (e) {
        /* ignore */
      }
    }

    // start confetti loop
    stopConfetti = false;
    startConfettiLoop();
  }

  // -----------------------
  // CONFETTI LOOP (canvas) with resize support
  // -----------------------
  function startConfettiLoop() {
    const canvas = document.getElementById("confetti");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function setup() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    setup();
    window.addEventListener("resize", setup);

    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 30 + 15,
      color: `hsl(${Math.random() * 360}, 100%, 70%)`,
      speed: Math.random() * 2 + 1.2,
      swing: Math.random() * 0.05 + 0.02,
    }));

    function update() {
      if (stopConfetti) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let p of pieces) {
        p.y += p.speed;
        p.x += Math.sin(p.y * p.swing) * 2;
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
          p.color = `hsl(${Math.random() * 360}, 100%, 70%)`;
          p.size = Math.random() * 30 + 15;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.95;
        ctx.fill();
      }
      requestAnimationFrame(update);
    }

    update();
  }

  // -----------------------
  // KEYBOARD (only when tryMode)
  // -----------------------
  document.addEventListener("keydown", function (event) {
    if (!tryMode) return;
    if (event.key === "ArrowUp") moveTile("up");
    else if (event.key === "ArrowDown") moveTile("down");
    else if (event.key === "ArrowLeft") moveTile("left");
    else if (event.key === "ArrowRight") moveTile("right");
  });

  // -----------------------
  // initial render
  // -----------------------
  render(
    [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 0],
    ],
    false
  );

  // expose global functions to HTML buttons
  window.generatePuzzle = generatePuzzle;
  window.startSolve = startSolve;
  window.enableTryIt = enableTryIt;
  window.moveTile = moveTile;
});
