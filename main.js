// =========================================================
// 1. INISIALISASI VARIABEL DAN ELEMEN (TIDAK BERUBAH)
// =========================================================

// URL API Vercel Anda
const API_URL = "https://8-puzzle-solver-api.vercel.app/api/solve";

// Fungsi bantu untuk menampilkan/menyembunyikan screen
const showScreen = (id) => {
  // Menggunakan 'id' sebagai parameter
  document.querySelectorAll(".container").forEach((screen) => {
    screen.classList.add("hidden");
  });
  document.getElementById(id).classList.remove("hidden");

  if (id !== "screen1") {
    homeButton.classList.remove("hidden");
    homeButton.style.display = "inline-block";
  } else {
    homeButton.classList.add("hidden");
  }
};

// Elemen UI
const screen1 = document.getElementById("screen1");
const screen2 = document.getElementById("screen2");
const screen3 = document.getElementById("screen3");
const screen4 = document.getElementById("screen4");

const playButton = document.getElementById("playButton");
const guideButton = document.getElementById("guideButton");
const guideModal = document.getElementById("guideModal");
const closeModal = document.querySelector(".close-button");
const homeButton = document.getElementById("homeButton");

const puzzleBoard = document.getElementById("puzzleBoard");
const generateButton = document.getElementById("generateButton");
const actionButton = document.getElementById("actionButton");
const puzzleStatus = document.getElementById("puzzleStatus");

const timerDisplay = document.getElementById("timerDisplay");
const gameStatus = document.getElementById("gameStatus");
const playingBoard = document.getElementById("playingBoard");
const solveButton = document.getElementById("solveButton");
const playAgainButton = document.getElementById("playAgainButton");
const moveDisplay = document.getElementById("moveDisplay");

const solutionBoard = document.getElementById("solutionBoard");
const solutionProgress = document.getElementById("solutionProgress");
const stepCounter = document.getElementById("stepCounter");
const prevStepButton = document.getElementById("prevStepButton");
const nextStepButton = document.getElementById("nextStepButton");
const solvePlayAgainButton = document.getElementById("solvePlayAgainButton");

// 🆕 ELEMEN BARU UNTUK WAKTU & LANGKAH ALGORITMA
const executionTimeElement = document.getElementById("executionTimeDisplay");
const totalStepsElement = document.getElementById("totalStepsDisplay");

const GOAL_STATE = [1, 2, 3, 4, 5, 6, 7, 8, 0];
let currentPuzzleState = [...GOAL_STATE];
let timerInterval;
let seconds = 0;
let isGameRunning = false;
let solutionPath = []; // Berisi array 1D state
let currentStep = 0;
let totalMoves = 0;

// Variabel untuk fitur Drag/Swipe BARU
let startX = 0;
let startY = 0;
let isDragging = false;
const DRAG_THRESHOLD = 30; // Jarak geser minimum dalam piksel

// =========================================================
// 2. FUNGSI UTILITY & PUZZLE CORE
// =========================================================

// Cek Solvability (Inversi) - DIBIARKAN UNTUK MEMASTIKAN STATUS PUZZLE
function isSolvable(state) {
  let inversions = 0;
  const puzzleArray = state.filter((n) => n !== 0);
  for (let i = 0; i < puzzleArray.length; i++) {
    for (let j = i + 1; j < puzzleArray.length; j++) {
      if (puzzleArray[i] > puzzleArray[j]) {
        inversions++;
      }
    }
  }
  return inversions % 2 === 0;
}

// ✅ MODIFIKASI: RenderPuzzle kini SELALU membuat ulang elemen
function renderPuzzle(state, boardElement) {
  // 1. Selalu kosongkan board (Memaksa render ulang)
  boardElement.innerHTML = "";
  // 2. Buat ulang semua elemen tile sesuai urutan di 'state'

  state.forEach((value) => {
    const tile = document.createElement("div");
    tile.classList.add("tile");
    if (value === 0) {
      tile.classList.add("empty");
    } else {
      tile.textContent = value;
    }
    tile.dataset.value = value;
    boardElement.appendChild(tile);
  });
}

// =========================================================
// 3. LOGIKA BERMAIN (Langkah 3) - PERPINDAHAN DRAG/SWIPE TETAP SAMA
// =========================================================

function formatTime(totalSeconds) {
  const min = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const sec = (totalSeconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

function startTimer() {
  isGameRunning = true;
  seconds = 0;
  timerDisplay.textContent = formatTime(seconds);
  timerInterval = setInterval(() => {
    seconds++;
    timerDisplay.textContent = formatTime(seconds);
  }, 1000);
}

function stopTimer() {
  isGameRunning = false;
  clearInterval(timerInterval);
}

function checkWin(state) {
  return state.every((value, index) => value === GOAL_STATE[index]);
}

function getTileIndex(value) {
  return currentPuzzleState.indexOf(parseInt(value));
}

function moveTileIfValid(clickedIndex) {
  if (!isGameRunning) return false;

  const emptyIndex = getTileIndex(0);
  const size = 3;

  const clickedRow = Math.floor(clickedIndex / size);
  const clickedCol = clickedIndex % size;
  const emptyRow = Math.floor(emptyIndex / size);
  const emptyCol = emptyIndex % size;

  const rowDiff = Math.abs(clickedRow - emptyRow);
  const colDiff = Math.abs(clickedCol - emptyCol);

  if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
    // Lakukan perpindahan di array state
    [currentPuzzleState[clickedIndex], currentPuzzleState[emptyIndex]] = [
      currentPuzzleState[emptyIndex],
      currentPuzzleState[clickedIndex],
    ]; // TAMBAH LANGKAH

    totalMoves++;
    moveDisplay.textContent = totalMoves; // Cek Kemenangan

    if (checkWin(currentPuzzleState)) {
      stopTimer();

      document.getElementById("timerContainer").classList.add("hidden");
      document.getElementById("moveCounterContainer").classList.add("hidden");
      gameStatus.textContent = `🎉 Congratulations! you have solved the puzzle in ${formatTime(
        seconds
      )} with ${totalMoves} moves!`;

      solveButton.classList.add("hidden");
      playAgainButton.style.display = "inline-block";
    }
    return true; // Berhasil pindah
  }
  return false; // Gagal pindah
}

function getIndexToMove(direction) {
  const emptyIndex = currentPuzzleState.indexOf(0);
  const size = 3;
  const emptyRow = Math.floor(emptyIndex / size);
  const emptyCol = emptyIndex % size;

  switch (direction) {
    case "up":
      return emptyRow < size - 1 ? emptyIndex + size : -1;
    case "down":
      return emptyRow > 0 ? emptyIndex - size : -1;
    case "left":
      return emptyCol < size - 1 ? emptyIndex + 1 : -1;
    case "right":
      return emptyCol > 0 ? emptyIndex - 1 : -1;
    default:
      return -1;
  }
}

let tileElementToMove = null;

function getTileElementToMove(direction) {
  const tileIndexToMove = getIndexToMove(direction);
  if (tileIndexToMove === -1) return null;

  const tileValue = currentPuzzleState[tileIndexToMove];

  return playingBoard.querySelector(`[data-value="${tileValue}"]`);
}

function startDrag(e) {
  if (!isGameRunning || checkWin(currentPuzzleState)) return;

  if (e.type === "touchstart") {
    e.preventDefault();
  }

  startX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
  startY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
  isDragging = true;

  playingBoard.addEventListener("mousemove", dragMove, false);
  playingBoard.addEventListener("touchmove", dragMove, false);
  playingBoard.addEventListener("mouseup", endDrag, false);
  playingBoard.addEventListener("touchend", endDrag, false);

  tileElementToMove = null;
}

function dragMove(e) {
  if (!isDragging) return;

  let currentX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
  let currentY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;

  const diffX = currentX - startX;
  const diffY = currentY - startY;

  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > DRAG_THRESHOLD) {
    const direction = diffX > 0 ? "right" : "left";
    tileElementToMove = getTileElementToMove(direction);
  } else if (
    Math.abs(diffY) > Math.abs(diffX) &&
    Math.abs(diffY) > DRAG_THRESHOLD
  ) {
    const direction = diffY > 0 ? "down" : "up";
    tileElementToMove = getTileElementToMove(direction);
  } else {
    tileElementToMove = null;
  } // Terapkan highlight

  playingBoard
    .querySelectorAll(".tile")
    .forEach((tile) => tile.classList.remove("is-dragging"));
  if (tileElementToMove && !tileElementToMove.classList.contains("empty")) {
    tileElementToMove.classList.add("is-dragging");
  }
}

function endDrag(e) {
  if (!isDragging) return;
  isDragging = false; // Hapus semua listener

  playingBoard.removeEventListener("mousemove", dragMove, false);
  playingBoard.removeEventListener("touchmove", dragMove, false);
  playingBoard.removeEventListener("mouseup", endDrag, false);
  playingBoard.removeEventListener("touchend", endDrag, false); // Hapus highlight setelah drag selesai

  playingBoard
    .querySelectorAll(".tile")
    .forEach((tile) => tile.classList.remove("is-dragging"));

  let endX, endY;
  if (e.type === "touchend") {
    if (e.changedTouches.length === 0) return;
    endX = e.changedTouches[0].clientX;
    endY = e.changedTouches[0].clientY;
  } else {
    endX = e.clientX;
    endY = e.clientY;
  }

  const diffX = endX - startX;
  const diffY = endY - startY;
  let tileIndexToMove = -1;
  let didMove = false;

  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > DRAG_THRESHOLD) {
    const direction = diffX > 0 ? "right" : "left";
    tileIndexToMove = getIndexToMove(direction);
  } else if (
    Math.abs(diffY) > Math.abs(diffX) &&
    Math.abs(diffY) > DRAG_THRESHOLD
  ) {
    const direction = diffY > 0 ? "down" : "up";
    tileIndexToMove = getIndexToMove(direction);
  } // Pindahkan tile jika indeksnya valid

  if (tileIndexToMove !== -1) {
    didMove = moveTileIfValid(tileIndexToMove);
  } // Jika terjadi perpindahan, panggil renderPuzzle untuk memicu animasi

  if (didMove) {
    renderPuzzle(currentPuzzleState, playingBoard);
  }

  tileElementToMove = null; // Reset
}

// Tambahkan event listeners drag/swipe ke playingBoard
playingBoard.addEventListener("mousedown", startDrag, false);
playingBoard.addEventListener("touchstart", startDrag, false);

// =========================================================
// 4. LOGIKA SOLUSI (Langkah 4) - BARU MENGGUNAKAN API
// =========================================================

/**
 * Mengambil solusi path dari API Python di Vercel.
 * @param {Array<number>} startState - State puzzle 1D (misal: [8, 1, 3, 4, 0, 2, 7, 6, 5]).
 * @returns {Promise<Object>} - Object berisi {path: Array<Array<number>>, time: number, steps: number}
 */
async function getSolutionPath(startState) {
  // 1. Ubah state 1D array dari JS menjadi matriks 3x3 untuk API
  const stateMatrix = [
    startState.slice(0, 3),
    startState.slice(3, 6),
    startState.slice(6, 9),
  ];

  const dataToSend = {
    action: "solve",
    initialState: stateMatrix,
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSend),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Gagal (Status ${response.status}): ${
          errorData.error || response.statusText
        }`
      );
    }

    const result = await response.json();

    if (!result.winState || result.content.length === 0) {
      // Jika API mengatakan Unsolveable/Limit, atau content kosong
      return { path: [], time: 0, steps: 0 };
    }

    // 🆕 API sudah mengirimkan data path yang runtut (hasil convertToFrontEnd di Python)
    const finalPath = [];

    // Tambahkan state awal (langkah 0)
    finalPath.push(result.content[0].state.flat());

    // Tambahkan state tujuan dari setiap langkah (langkah 1 sampai N)
    for (let i = 1; i < result.content.length; i++) {
      const step = result.content[i];
      // frontEndPath hanya berisi 1 state (state tujuan)
      if (step.frontEndPath && step.frontEndPath.length > 0) {
        finalPath.push(step.frontEndPath[0].flat());
      }
    }
    
    // 🔥 PERBAIKAN Logika Tambahan: Pastikan goal state ada di akhir
    // Cek jika state terakhir bukan goal state, tambahkan goal state jika langkahnya pas
    // Ini membantu menyinkronkan total langkah jika API memotong langkah terakhir
    if (result.totalSteps > 0 && finalPath.length - 1 < result.totalSteps) {
        const lastState = finalPath[finalPath.length - 1];
        if (!checkWin(lastState)) { // Jika state terakhir bukan solusi, tambahkan Goal State
             finalPath.push([...GOAL_STATE]);
        }
    }
    
    return {
      path: finalPath,
      time: result.executionTime || 0,
      steps: result.totalSteps || 0,
    };
  } catch (error) {
    console.error("API Error (Solve):", error);
    alert(`Gagal terhubung ke Solver API. Detail: ${error.message}`);
    return { path: [], time: 0, steps: 0 };
  }
}

// ✅ MODIFIKASI: showSolutionStep
function showSolutionStep(stepIndex) {
  // totalSteps akan menjadi solutionPath.length - 1 (misal 38 - 1 = 37)
  const totalMoves = solutionPath.length - 1; 

  // Cek apakah solusi ada
  if (totalMoves < 0) {
    stepCounter.textContent = "Tidak ada solusi.";
    solutionProgress.style.width = "0%";
    solutionBoard.innerHTML = "";
    renderPuzzle(currentPuzzleState, solutionBoard); // Tampilkan state awal
    return;
  }

  currentStep = stepIndex;

  renderPuzzle(solutionPath[currentStep], solutionBoard);

  // totalMoves akan menjadi pembilang (misal 37)
  stepCounter.textContent = `Langkah ${currentStep}/${totalMoves}`;

  const progressPercent = (currentStep / totalMoves) * 100;
  solutionProgress.style.width = `${progressPercent}%`;

  prevStepButton.disabled = currentStep === 0;
  nextStepButton.disabled = currentStep === totalMoves;
}

// =========================================================
// 5. EVENT LISTENERS (MODIFIKASI UTAMA)
// =========================================================

// [Langkah 1] Modal Guide (Tetap Sama)
guideButton.onclick = function () {
  guideModal.classList.remove("hidden");
};
closeModal.onclick = function () {
  guideModal.classList.add("hidden");
};
window.onclick = function (event) {
  if (event.target === guideModal) {
    guideModal.classList.add("hidden");
  }
};

// [Langkah 1 -> Langkah 2] Tombol Play (Tetap Sama)
playButton.onclick = function () {
  showScreen("screen2");

  puzzleStatus.textContent = "Tekan Generate untuk membuat Puzzle.";
  actionButton.disabled = true;
  actionButton.textContent = "Main (Play)";

  currentPuzzleState = [...GOAL_STATE];
  renderPuzzle(currentPuzzleState, puzzleBoard);
};

// [Langkah 2] Tombol Generate (BARU MENGGUNAKAN API)
generateButton.onclick = async function () {
  puzzleStatus.textContent = "⚙️ Menggenerasi puzzle acak...";
  actionButton.disabled = true;

  try {
    // choiceNum: 0 meminta state acak yang solvable dari API
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "generate", choiceNum: 0 }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Gagal (Status ${response.status}): ${
          errorData.error || response.statusText
        }`
      );
    }

    const result = await response.json();
    const stateMatrix = result.initialState; 

    let shuffledState = stateMatrix.flat();

    currentPuzzleState = shuffledState;
    renderPuzzle(currentPuzzleState, puzzleBoard); 

    const solvable = isSolvable(shuffledState);

    if (solvable) {
      puzzleStatus.textContent = "✅ Puzzle Solveable";
      actionButton.textContent = "Main (Play)";
    } else {
      puzzleStatus.textContent = "❌ Puzzle Unsolveable";
      actionButton.textContent = "Coba Saja (Try it Out)";
    }
    actionButton.disabled = false;
  } catch (error) {
    console.error("API Error (Generate):", error);
    puzzleStatus.textContent = `🚨 Gagal Generate. Cek API: ${error.message}`;
    actionButton.disabled = true;
  }
};

// [Langkah 2 -> Langkah 3] Tombol Action (Play/Try it Out) (Tetap Sama)
actionButton.onclick = function () {
  showScreen("screen3");

  stopTimer();
  startTimer();

  document.getElementById("timerContainer").classList.remove("hidden");
  document.getElementById("moveCounterContainer").classList.remove("hidden");

  totalMoves = 0;
  moveDisplay.textContent = totalMoves;

  gameStatus.textContent = "Geser kotak untuk menyelesaikan puzzle!";

  if (isSolvable(currentPuzzleState)) {
    solveButton.classList.remove("hidden");
    solveButton.style.display = "inline-block";
  }

  playAgainButton.style.display = "none"; // Render puzzle di playingBoard

  renderPuzzle(currentPuzzleState, playingBoard);
};

// [Langkah 3 -> Langkah 4] Tombol Solve (MODIFIKASI UTAMA UNTUK SINKRONISASI)
solveButton.onclick = async function () {
  stopTimer();
  showScreen("screen4"); // Tampilkan pesan loading

  document.getElementById("solutionStatus").textContent =
    "Mencari solusi menggunakan Best-First Search (API), mohon tunggu...";
    
  // Sembunyikan statistik lama saat loading
  executionTimeElement.textContent = '...';
  totalStepsElement.textContent = '...';


  // 🆕 Panggil API solver dan dapatkan object hasil
  const solveResult = await getSolutionPath(currentPuzzleState);
  solutionPath = solveResult.path;
  const executionTime = solveResult.time;
  // const totalSteps = solveResult.steps; // Nilai mentah dari API (misalnya 37)

  if (solutionPath.length > 0) {
    // 🔥 PERBAIKAN UTAMA: Gunakan panjang array state - 1 sebagai total langkah
    // Nilai ini akan selalu sama dengan pembilang counter (misal: 38 - 1 = 37)
    const totalMovesDisplayed = solutionPath.length - 1; 

    // 🆕 Tampilkan Waktu dan Langkah
    executionTimeElement.textContent = executionTime.toFixed(7); // Menggunakan toFixed(7)
    totalStepsElement.textContent = totalMovesDisplayed; // SINKRONISASI

    // Langkah 0 adalah state awal
    // 🆕 Gunakan totalMovesDisplayed untuk tampilan header juga
    document.getElementById(
      "solutionStatus"
    ).textContent = `✅ Solusi ditemukan! Total ${totalMovesDisplayed} langkah dalam ${executionTime.toFixed(7)} detik.`;
    
    showSolutionStep(0);
  } else {
    // Gagal
    executionTimeElement.textContent = 'N/A';
    totalStepsElement.textContent = 'N/A';
    
    document.getElementById(
      "solutionStatus"
    ).textContent = `❌ Tidak ada solusi untuk puzzle ini (Unsolveable atau limit API terlampaui).`;
    
    showSolutionStep(0); // Tampilkan state awal
  }
};

// [Langkah 3 & 4 -> Langkah 2] Tombol Main Lagi (Tetap Sama)
const resetToScreen2 = () => {
  showScreen("screen2");
  playButton.onclick();
};
playAgainButton.onclick = resetToScreen2;
solvePlayAgainButton.onclick = resetToScreen2;

// [Langkah 4] Navigasi Solusi (Tetap Sama)
prevStepButton.onclick = () => {
  if (currentStep > 0) showSolutionStep(currentStep - 1);
};

nextStepButton.onclick = () => {
  if (currentStep < solutionPath.length - 1) showSolutionStep(currentStep + 1);
};

// [INITIAL RENDER] Tampilkan screen1 saat halaman dimuat (Tetap Sama)
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".container").forEach((screen) => {
    screen.classList.add("hidden");
  });
  screen1.classList.remove("hidden");

  guideModal.classList.add("hidden");

  renderPuzzle(currentPuzzleState, puzzleBoard);
});

function goToHome() {
  showScreen("screen1");

  stopTimer();

  homeButton.classList.add("hidden");

  currentPuzzleState = GOAL_STATE;
  playingBoard.innerHTML = "";
  puzzleBoard.innerHTML = "";
}
homeButton.onclick = goToHome;