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

  let confettiRunning = false;
  let stopConfetti = false;

  // 🔹 RENDER TILE
  function render(board) {
    const oldTiles = Array.from(boardEl.children);
    lastRects.clear();
    oldTiles.forEach((el) =>
      lastRects.set(el.dataset.key, el.getBoundingClientRect())
    );

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
        boardEl.appendChild(tile);
      }
    }
    currentBoard = board.map((r) => [...r]);
  }

  stopConfetti = true;

  // 🔹 GENERATE PUZZLE (sederhana)
  function generatePuzzle() {
    const board = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 0, 8],
    ];
    render(board);
    tryBtn.style.display = "inline-block";
    solveBtn.style.display = "inline-block";
    for (let key in arrows) arrows[key].style.display = "none";
    progressBar.style.width = "0%";
    progressBar.parentElement.style.visibility = "hidden";
  }

  // 🔹 MODE TRY IT
  function enableTryIt() {
    tryBtn.style.display = "none";
    arrows.up.style.display = "block";
    arrows.down.style.display = "block";
    arrows.left.style.display = "block";
    arrows.right.style.display = "block";
  }

  // 🔹 MODE SOLVE (dummy animasi)
  function startSolve() {
    arrows.up.style.display = "none";
    arrows.down.style.display = "none";
    arrows.left.style.display = "block";
    arrows.right.style.display = "block";
    progressBar.parentElement.style.visibility = "visible";

    let pct = 0;
    const interval = setInterval(() => {
      pct += 20;
      progressBar.style.width = pct + "%";
      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          progressBar.parentElement.style.visibility = "hidden";
        }, 500);
      }
    }, 600);
  }

  // 🔹 GERAKKAN TILE (mode Try It)
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
      render(newBoard);
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

  // 🎉 POPUP COMPLETE + PLAY AGAIN
  function showCompletionPopup() {
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
      zIndex: "999",
      backdropFilter: "blur(6px)",
    });

    const text = document.createElement("h1");
    text.textContent = "🎉 COMPLETE! 🎉";
    Object.assign(text.style, {
      color: "#fff",
      fontSize: "64px",
      marginBottom: "20px",
      textShadow: "0 0 20px #00f6ff, 0 0 40px #00f6ff",
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

      stopConfetti = true; // 🎈 stop balon
      overlay.remove();
      generatePuzzle();
    };

    overlay.appendChild(text);
    overlay.appendChild(button);
    document.body.appendChild(overlay);

    const winSound = document.getElementById("winSound");
    if (winSound) {
      winSound.volume = 0.7;
      winSound.play();
    }

    startConfettiLoop();
  }

  // 🎈 BALON (CONFETTI) LOOP FOREVER
  function startConfettiLoop() {
    const canvas = document.getElementById("confetti");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 20 + 10,
      color: `hsl(${Math.random() * 360}, 100%, 70%)`,
      speed: Math.random() * 2 + 1.5,
      swing: Math.random() * 0.05 + 0.02,
    }));

    stopConfetti = false;
    confettiRunning = true;

    function update() {
      if (stopConfetti) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        confettiRunning = false;
        return; // keluar dari loop
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let p of pieces) {
        p.y += p.speed;
        p.x += Math.sin(p.y * p.swing) * 2;

        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
          p.color = `hsl(${Math.random() * 360}, 100%, 70%)`;
          p.size = Math.random() * 20 + 10;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      requestAnimationFrame(update);
    }

    update();
  }

  // Render awal
  render([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 0],
  ]);

  window.generatePuzzle = generatePuzzle;
  window.startSolve = startSolve;
  window.enableTryIt = enableTryIt;
  window.moveTile = moveTile;
});
