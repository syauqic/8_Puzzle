// =========================================================
// 1. INISIALISASI VARIABEL DAN ELEMEN
// =========================================================

// Fungsi bantu untuk menampilkan/menyembunyikan screen
const showScreen = (id) => {
    document.querySelectorAll('.container').forEach(screen => {
        screen.classList.add('hidden');
    });
    document.getElementById(id).classList.remove('hidden');
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

const puzzleBoard = document.getElementById("puzzleBoard");
const generateButton = document.getElementById("generateButton");
const actionButton = document.getElementById("actionButton");
const puzzleStatus = document.getElementById("puzzleStatus");

const timerDisplay = document.getElementById('timerDisplay');
const gameStatus = document.getElementById('gameStatus');
const playingBoard = document.getElementById('playingBoard');
const solveButton = document.getElementById('solveButton');
const playAgainButton = document.getElementById('playAgainButton');

const solutionBoard = document.getElementById('solutionBoard');
const solutionProgress = document.getElementById('solutionProgress');
const stepCounter = document.getElementById('stepCounter');
const prevStepButton = document.getElementById('prevStepButton');
const nextStepButton = document.getElementById('nextStepButton');
const solvePlayAgainButton = document.getElementById('solvePlayAgainButton');


const GOAL_STATE = [1, 2, 3, 4, 5, 6, 7, 8, 0];
let currentPuzzleState = [...GOAL_STATE]; 
let timerInterval;
let seconds = 0;
let isGameRunning = false;
let solutionPath = []; 
let currentStep = 0;

// Variabel untuk fitur Drag/Swipe BARU
let startX = 0;
let startY = 0;
let isDragging = false;
const DRAG_THRESHOLD = 30; // Jarak geser minimum dalam piksel


// =========================================================
// 2. FUNGSI UTILITY & PUZZLE CORE
// =========================================================

// Cek Solvability (Inversi)
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

// Mengacak puzzle
function shufflePuzzle(state) {
    let array = [...state];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function renderPuzzle(state, boardElement) {
    // Kosongkan board HANYA jika boardElement kosong (initial render)
    if (boardElement.children.length === 0) {
        boardElement.innerHTML = "";
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

    // PENTING: Gunakan properti CSS Grid Area untuk memposisikan tile yang sudah ada.
    // CSS Grid akan menangani transisi antar posisi secara halus (jika transition di CSS sudah benar).
    
    // Ambil semua tile yang sudah ada di DOM
    const tiles = Array.from(boardElement.children);

    // Iterasi melalui state BARU dan atur posisi setiap tile
    state.forEach((value, index) => {
        // Cari elemen tile yang sesuai dengan nilai ini
        const tile = tiles.find(t => t.dataset.value == value);
        
        if (tile) {
            // Hitung baris (row) dan kolom (column) berdasarkan index
            const row = Math.floor(index / 3) + 1;
            const col = (index % 3) + 1;

            // Terapkan posisi Grid. CSS Grid akan menganimasikan transisi grid-area.
            tile.style.gridArea = `${row} / ${col} / ${row + 1} / ${col + 1}`;
        }
    });
}

// =========================================================
// 3. LOGIKA BERMAIN (Langkah 3)
// =========================================================

function formatTime(totalSeconds) {
    const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const sec = (totalSeconds % 60).toString().padStart(2, '0');
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

// Logika Perpindahan Tile (DIPERBAIKI)
function moveTileIfValid(clickedIndex) {
    if (!isGameRunning) return false; 

    const emptyIndex = getTileIndex(0);
    const size = 3;

    // ... (Logika penentuan row/col dan diff tetap sama) ...
    const clickedRow = Math.floor(clickedIndex / size);
    const clickedCol = clickedIndex % size;
    const emptyRow = Math.floor(emptyIndex / size);
    const emptyCol = emptyIndex % size;

    const rowDiff = Math.abs(clickedRow - emptyRow);
    const colDiff = Math.abs(clickedCol - emptyCol);

    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
        // Lakukan perpindahan di array state
        [currentPuzzleState[clickedIndex], currentPuzzleState[emptyIndex]] = 
        [currentPuzzleState[emptyIndex], currentPuzzleState[clickedIndex]];

        // Panggil renderPuzzle TIDAK di sini, tapi di endDrag (sudah benar di kode Anda sebelumnya)
        // agar animasi dipicu setelah array diubah.

        // Cek Kemenangan
        if (checkWin(currentPuzzleState)) {
            stopTimer();

            // ✅ LOGIKA MENANG DIKEMBALIKAN
            document.getElementById('timerContainer').classList.add('hidden');
            gameStatus.textContent = `🎉 Congratulations! you have solved the puzzle in ${formatTime(seconds)}`;
            solveButton.classList.add('hidden');
            playAgainButton.style.display = 'inline-block';
        }
        return true; // Berhasil pindah
    }
    return false; // Gagal pindah
}

// HAPUS fungsi handleClick lama, dan ganti dengan logika drag/swipe:

function getIndexToMove(direction) {
    const emptyIndex = currentPuzzleState.indexOf(0);
    const size = 3; 
    const emptyRow = Math.floor(emptyIndex / size);
    const emptyCol = emptyIndex % size;

    // Hitung posisi tile yang akan bergerak ke posisi kosong
    switch (direction) {
        case 'up': 
            // Kotak kosong bergerak ke atas (swipe ke atas), tile di bawahnya yang bergerak
            return (emptyRow < size - 1) ? emptyIndex + size : -1; 
        case 'down': 
            // Kotak kosong bergerak ke bawah (swipe ke bawah), tile di atasnya yang bergerak
            return (emptyRow > 0) ? emptyIndex - size : -1;
        case 'left': 
            // Kotak kosong bergerak ke kiri (swipe ke kiri), tile di kanannya yang bergerak
            return (emptyCol < size - 1) ? emptyIndex + 1 : -1;
        case 'right': 
            // Kotak kosong bergerak ke kanan (swipe ke kanan), tile di kirinya yang bergerak
            return (emptyCol > 0) ? emptyIndex - 1 : -1;
        default:
            return -1;
    }
}

// Variabel baru untuk melacak elemen yang di-drag (Sudah ada di kode Anda)
let tileElementToMove = null; 


// FUNGSI BARU: Mendapatkan elemen tile DOM yang akan dipindahkan
function getTileElementToMove(direction) {
    const tileIndexToMove = getIndexToMove(direction);
    if (tileIndexToMove === -1) return null;
    
    // Nilai tile yang akan bergerak
    const tileValue = currentPuzzleState[tileIndexToMove];
    
    // Mencari elemen DOM berdasarkan data-value
    return playingBoard.querySelector(`[data-value="${tileValue}"]`);
}

function startDrag(e) {
    if (!isGameRunning || checkWin(currentPuzzleState)) return;
    
    if (e.type === 'touchstart') {
        e.preventDefault(); 
    }
    
    startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    isDragging = true;
    
    // ✅ Tambahkan event mousemove/touchmove untuk melacak pergerakan
    playingBoard.addEventListener('mousemove', dragMove, false);
    playingBoard.addEventListener('touchmove', dragMove, false);
    playingBoard.addEventListener('mouseup', endDrag, false);
    playingBoard.addEventListener('touchend', endDrag, false);

    // BARU: Reset tileElementToMove
    tileElementToMove = null;
}

function dragMove(e) {
    if (!isDragging) return;

    // Logika dragMove hanya untuk visual feedback (opsional), 
    // tapi kita akan gunakan ini untuk menentukan tile mana yang di-highlight saat drag.
    
    let currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    let currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    const diffX = currentX - startX;
    const diffY = currentY - startY;
    
    // Tentukan arah yang mungkin (jika sudah melewati threshold)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > DRAG_THRESHOLD) {
        const direction = diffX > 0 ? 'right' : 'left';
        tileElementToMove = getTileElementToMove(direction);
    } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > DRAG_THRESHOLD) {
        const direction = diffY > 0 ? 'down' : 'up';
        tileElementToMove = getTileElementToMove(direction);
    } else {
        tileElementToMove = null;
    }

    // Terapkan highlight
    playingBoard.querySelectorAll('.tile').forEach(tile => tile.classList.remove('is-dragging'));
    if (tileElementToMove && !tileElementToMove.classList.contains('empty')) {
        tileElementToMove.classList.add('is-dragging');
    }
}


function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    
    // ✅ Hapus semua listener
    playingBoard.removeEventListener('mousemove', dragMove, false);
    playingBoard.removeEventListener('touchmove', dragMove, false);
    playingBoard.removeEventListener('mouseup', endDrag, false);
    playingBoard.removeEventListener('touchend', endDrag, false);
    
    // Hapus highlight setelah drag selesai
    playingBoard.querySelectorAll('.tile').forEach(tile => tile.classList.remove('is-dragging'));

    // ... (Logika penentuan arah geser dan tileIndexToMove tetap sama) ...
    let endX, endY;
    if (e.type === 'touchend') {
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
        const direction = diffX > 0 ? 'right' : 'left';
        tileIndexToMove = getIndexToMove(direction);
    } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > DRAG_THRESHOLD) {
        const direction = diffY > 0 ? 'down' : 'up';
        tileIndexToMove = getIndexToMove(direction);
    }
    
    // Pindahkan tile jika indeksnya valid
    if (tileIndexToMove !== -1) {
        didMove = moveTileIfValid(tileIndexToMove);
    }

    // Jika terjadi perpindahan, panggil renderPuzzle untuk memicu animasi
    if (didMove) {
        // Memicu animasi swap smooth!
        renderPuzzle(currentPuzzleState, playingBoard);
    }
    
    tileElementToMove = null; // Reset
}

// Tambahkan event listeners drag/swipe ke playingBoard
playingBoard.addEventListener('mousedown', startDrag, false);
playingBoard.addEventListener('touchstart', startDrag, false);


// =========================================================
// 4. LOGIKA SOLUSI (Langkah 4)
// =========================================================

// FUNGSI SIMULASI SOLUSI (Tetap sama)
function simulateSolution(startState) {
    if (!isSolvable(startState)) {
        return [];
    }
    
    let path = [
        startState, 
        [1, 2, 3, 4, 0, 5, 7, 8, 6],
        [1, 2, 3, 4, 5, 0, 7, 8, 6],
        [1, 2, 3, 4, 5, 6, 7, 8, 0], 
    ];
    if (checkWin(startState)) return [startState];

    return path; 
}

function showSolutionStep(stepIndex) {
    const totalSteps = solutionPath.length - 1; // Langkah 0 adalah state awal

    if (totalSteps < 0) { 
        stepCounter.textContent = "Tidak ada solusi.";
        solutionProgress.style.width = '100%';
        renderPuzzle(currentPuzzleState, solutionBoard); 
        return;
    }
    
    currentStep = stepIndex;

    renderPuzzle(solutionPath[currentStep], solutionBoard);

    // ✅ Total Langkah dan Progress Bar
    stepCounter.textContent = `Langkah ${currentStep}/${totalSteps}`; 

    const progressPercent = (currentStep / totalSteps) * 100;
    solutionProgress.style.width = `${progressPercent}%`;

    prevStepButton.disabled = currentStep === 0;
    nextStepButton.disabled = currentStep === totalSteps;
}


// =========================================================
// 5. EVENT LISTENERS
// =========================================================

// [Langkah 1] Modal Guide
guideButton.onclick = function () { guideModal.classList.remove('hidden'); };
closeModal.onclick = function () { guideModal.classList.add('hidden'); };
window.onclick = function (event) {
    if (event.target === guideModal) {
        guideModal.classList.add('hidden');
    }
};

// [Langkah 1 -> Langkah 2] Tombol Play (Sama)
playButton.onclick = function () {
    showScreen('screen2'); 
    
    puzzleStatus.textContent = 'Tekan Generate untuk membuat Puzzle.';
    actionButton.disabled = true;
    actionButton.textContent = 'Main (Play)';
    
    currentPuzzleState = [...GOAL_STATE];
    renderPuzzle(currentPuzzleState, puzzleBoard);
};

// [Langkah 2] Tombol Generate (Sama)
generateButton.onclick = function () {
    let shuffledState;
    let solvable;

    do {
        shuffledState = shufflePuzzle([...GOAL_STATE]);
    } while (checkWin(shuffledState));

    solvable = isSolvable(shuffledState);
    currentPuzzleState = shuffledState;
    renderPuzzle(currentPuzzleState, puzzleBoard);

    if (solvable) {
        puzzleStatus.textContent = "✅ Puzzle Solveable";
        actionButton.textContent = "Main (Play)";
    } else {
        puzzleStatus.textContent = "❌ Puzzle Unsolveable";
        actionButton.textContent = "Coba Saja (Try it Out)";
    }
    actionButton.disabled = false;
};

// [Langkah 2 -> Langkah 3] Tombol Action (Play/Try it Out)
actionButton.onclick = function () {
    showScreen('screen3');
    
    stopTimer();
    startTimer();
    gameStatus.textContent = "Geser kotak untuk menyelesaikan puzzle!";
    
    // ✅ KOREKSI: Kontrol Tombol Solve (diaktifkan kembali dan disesuaikan)
    if (isSolvable(currentPuzzleState)) { 
        // Jika puzzle solvable (tombol Action berbunyi "Play"), tampilkan Solve.
        solveButton.classList.remove('hidden'); 
        solveButton.style.display = 'inline-block';
    }
    
    playAgainButton.style.display = 'none';

    // Render puzzle di playingBoard
    renderPuzzle(currentPuzzleState, playingBoard);
};

// [Langkah 3 -> Langkah 4] Tombol Solve (Sama)
solveButton.onclick = function() {
    stopTimer(); 
    showScreen('screen4');

    solutionPath = simulateSolution(currentPuzzleState); 
    
    if (solutionPath.length > 0) {
        document.getElementById('solutionStatus').textContent = `Solusi ditemukan dalam ${solutionPath.length - 1} langkah.`;
        showSolutionStep(0);
    } else {
        document.getElementById('solutionStatus').textContent = `Tidak ada solusi untuk puzzle ini (Unsolveable).`;
        showSolutionStep(0); 
    }
}

// [Langkah 3 & 4 -> Langkah 2] Tombol Main Lagi (Sama)
const resetToScreen2 = () => {
    showScreen('screen2');
    playButton.onclick(); 
};
playAgainButton.onclick = resetToScreen2;
solvePlayAgainButton.onclick = resetToScreen2;

// [Langkah 4] Navigasi Solusi (Sama)
prevStepButton.onclick = () => {
    if (currentStep > 0) showSolutionStep(currentStep - 1);
};

nextStepButton.onclick = () => {
    if (currentStep < solutionPath.length - 1) showSolutionStep(currentStep + 1);
};


// [INITIAL RENDER] Tampilkan screen1 saat halaman dimuat (Sama)
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.container').forEach(screen => {
        screen.classList.add('hidden');
    });
    screen1.classList.remove('hidden');

    guideModal.classList.add('hidden');
    
    renderPuzzle(currentPuzzleState, puzzleBoard);
});