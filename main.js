// =========================================================
// 1. INISIALISASI VARIABEL DAN ELEMEN (MODIFIKASI: PENAMBAHAN ELEMEN MODAL POHON)
// =========================================================

// URL API Vercel Anda
const API_URL = "https://8-puzzle-solver-api.vercel.app/api/solve";

// Fungsi bantu untuk menampilkan/menyembunyikan screen
const showScreen = (id) => {
  // Menggunakan 'id' sebagai parameter
  document.querySelectorAll(".container").forEach((screen) => {
    screen.classList.add("hidden");
    screen.classList.remove("with-sidebar"); // Hapus sidebar saat pindah screen
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

const explanationButton = document.getElementById("explanationButton"); // Tombol buka/tutup sidebar
const treePanel = document.getElementById("treeExplanationPanel"); // Panel Sidebar 
const solutionPathContainer = document.getElementById("solutionPathContainer"); 

// VARIABEL & ELEMEN BARU UNTUK MODAL POHON
const openTreeModalButton = document.getElementById("openTreeModalButton"); // Tombol di dalam sidebar
const treeModal = document.getElementById("treeModal"); // Modal utama
const closeTreeModalButton = document.getElementById("closeTreeModalButton"); // Tombol tutup modal
const treeVisualizationContainer = document.getElementById("treeVisualizationInModal"); // SVG container di dalam modal

// MODIFIKASI: Mengubah target, karena D3 akan ada di modal
// const exploredNodesContainer = document.getElementById("exploredNodesContainer"); 

const totalNodesExploredDisplay = document.getElementById("totalNodesExploredDisplay"); 

// VARIABEL BARU (YANG HILANG) UNTUK LIST NODE EXPLORASI DI SIDEBAR (FIX)
const exploredNodesListContainer = document.getElementById("exploredNodesListContainer"); 

let isTreePanelVisible = false;
let exploredTreeData = []; // VARIABEL BARU: Menyimpan semua node yang dieksplorasi

// ELEMEN BARU UNTUK WAKTU & LANGKAH ALGORITMA
const executionTimeElement = document.getElementById("executionTimeDisplay");
const totalStepsElement = document.getElementById("totalStepsDisplay");

const GOAL_STATE = [1, 2, 3, 4, 5, 6, 7, 8, 0];
let currentPuzzleState = [...GOAL_STATE];
let timerInterval;
let seconds = 0;
let isGameRunning = false;
let solutionPath = []; // Berisi array 1D state (Hanya state 3x3)
let solutionDetails = []; // BARU: Berisi detail dari API (termasuk moves, heuristic)
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

// MODIFIKASI: RenderPuzzle kini SELALU membuat ulang elemen
function renderPuzzle(state, boardElement) {
    // 1. Selalu kosongkan board (Memaksa render ulang)
    boardElement.innerHTML = ""; // 2. Buat ulang semua elemen tile sesuai urutan di 'state'
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
 * Mengambil solusi path dan detail langkah dari API Python di Vercel.
 * @param {Array<number>} startState - State puzzle 1D (misal: [8, 1, 3, 4, 0, 2, 7, 6, 5]).
 * @returns {Promise<Object>} - Object berisi {path: Array<Array<number>>, details: Array<Object>, time: number, steps: number, initialHeuristic: number, exploredTree: Array<Object>}
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
            // PERBAIKAN: Pastikan initialHeuristic default 0 jika gagal
            return { path: [], details: [], time: 0, steps: 0, initialHeuristic: 0, exploredTree: [] };
        }

        const finalPath = [];
        const finalDetails = []; // BARU: Menyimpan detail langkah lengkap

        // Iterasi hasil dari API (sudah berupa state matriks dan moves string)
        for (const step of result.content) {
            finalPath.push(step.state.flat());
            const detail = {
                state: step.state.flat(), // State saat ini (untuk Langkah X)
                move: step.moves[0], // Ambil move pertama (misal: "DOWN")
                heuristic: step.heuristic, // PASTIKAN NILAI HEURISTIK DIBACA DARI API
                previousState:
                    finalDetails.length > 0
                        ? finalDetails[finalDetails.length - 1].state
                        : null,
            };
            finalDetails.push(detail);
        }
        
        // MODIFIKASI: Memproses exploredTreeData dari matriks 3x3 ke 1D
        const processedExploredTree = result.exploredTree.map((node, index) => ({
            state: node.state.flat(),
            heuristic: node.heuristic,
            nodeIndex: index,
            // Parent bisa null. Jika ada, ubah dari matriks 3x3 ke 1D
            parent: node.parent ? node.parent.flat() : null 
        }));

        return {
            path: finalPath,
            details: finalDetails, // PENTING: Details ini akan digunakan
            time: result.executionTime || 0,
            steps: finalDetails.length - 1,
            initialHeuristic: result.initialHeuristic || 0,
            // KEMBALIKAN DATA POHON YANG SUDAH DIPROSES
            exploredTree: processedExploredTree
        };
    } catch (error) {
        console.error("API Error (Solve):", error);
        alert(`Gagal terhubung ke Solver API. Detail: ${error.message}`);
        return { path: [], details: [], time: 0, steps: 0, initialHeuristic: 0, exploredTree: [] };
    }
}

// =========================================================
// FUNGSI BARU: KONVERSI DATA FLAT KE STRUKTUR POHON D3.JS
// =========================================================
function dataToTree(flatData) {
    if (!flatData || flatData.length === 0) return null;

    // Gunakan Map untuk mencari node berdasarkan state dengan cepat
    const nodesMap = new Map();
    flatData.forEach(node => {
        // Konversi array state ke string agar bisa dijadikan kunci Map
        const stateKey = JSON.stringify(node.state);
        nodesMap.set(stateKey, {
            ...node, 
            stateKey: stateKey, // Tambahkan kunci string
            children: [] 
        });
    });

    let root = null;

    // Bangun hierarki pohon dari belakang (child mencari parent)
    nodesMap.forEach(node => {
        const parentKey = node.parent ? JSON.stringify(node.parent) : null;
        
        if (parentKey && nodesMap.has(parentKey)) {
            const parentNode = nodesMap.get(parentKey);
            // Tambahkan node saat ini sebagai child dari parent
            parentNode.children.push(node);
        } else if (node.parent === null) {
            // Jika parent-nya null, ini adalah root node (node awal)
            root = node;
        }
    });

    return root;
}


// =========================================================
// FUNGSI MODIFIKASI: VISUALISASI POHON DENGAN D3.JS (Target: Modal)
// =========================================================
/**
 * Merender pohon pencarian BFS menggunakan D3.js Tree Layout di dalam modal.
 * @param {Array<Object>} flatTreeData - Daftar node flat dari API.
 * @param {Array<number>} currentStepState - State langkah saat ini (untuk highlight).
 */
function renderD3TreeInModal(flatTreeData, currentStepState) {
    // Kosongkan container dari SVG sebelumnya
    treeVisualizationContainer.innerHTML = '';
    
    if (flatTreeData.length === 0) {
        treeVisualizationContainer.innerHTML = `<p class="loading-message">Visualisasi pohon tidak tersedia.</p>`;
        return;
    }

    // 1. Konversi data flat ke struktur pohon hierarki
    const rootData = dataToTree(flatTreeData);
    if (!rootData) return;

    // Tentukan dimensi SVG
    const containerWidth = treeVisualizationContainer.clientWidth;
    // Tentukan tinggi berdasarkan kedalaman/jumlah node agar tidak terlalu padat
    // Jarak vertikal per level diatur 100px.
    const idealHeight = Math.max(800, flatTreeData.length * 50); 

    treeVisualizationContainer.style.height = `${idealHeight}px`;

    const margin = { top: 30, right: 20, bottom: 20, left: 20 };
    const width = containerWidth - margin.left - margin.right;
    const height = idealHeight - margin.top - margin.bottom;

    // 2. Buat SVG
    const svg = d3.select(treeVisualizationContainer)
        .append("svg")
        .attr("width", containerWidth)
        .attr("height", idealHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
        
    // 3. Konfigurasi D3 Tree Layout
    const treeLayout = d3.tree()
        // Size: [Lebar, Tinggi] untuk layout Top-Down
        .size([width, height]) 
        .nodeSize([180, 40]);
        // nodeSize tidak perlu lagi karena kita atur manual di langkah 5

    // 4. Ubah data hierarki menjadi objek D3 "root"
    const root = d3.hierarchy(rootData); 

    // 5. Hitung posisi pohon
    const nodes = treeLayout(root).descendants();
    const links = root.links();

    // Atur jarak vertikal antar kedalaman (Level 1, Level 2, dst)
    nodes.forEach(d => {
        // d.y menjadi jarak dari atas (kedalaman)
        d.y = d.depth * 100; // Jarak vertikal 100px per level
    });

    // 6. DRAW LINKS (Garis-garis penghubung)
    svg.selectAll(".link")
        .data(links)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkVertical() // <-- Menggunakan Link VERTICAL (atas-bawah)
            .x(d => d.x) // <-- X menggunakan d.x (posisi horizontal default D3)
            .y(d => d.y)) // <-- Y menggunakan d.y (posisi vertikal/kedalaman)
        .style("fill", "none")
        .style("stroke", "#ccc")
        .style("stroke-width", "1.5px");

    // 7. DRAW NODES (Lingkaran)
    const node = svg.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", d => `node${d.children ? " node--internal" : " node--leaf"}`)
        .attr("transform", d => `translate(${d.x},${d.y})`) // <-- TRANSLATE (x, y)
        .classed("node--solution", d => JSON.stringify(d.data.state) === JSON.stringify(currentStepState)); 
        
    // Status node saat ini (untuk highlight)
    const currentStepKey = currentStepState ? JSON.stringify(currentStepState) : null;
    
    // Lingkaran Node
    node.append("circle")
        .attr("r", 15)
        .style("fill", d => {
            const isCurrent = d.data.stateKey === currentStepKey;
            const isGoal = d.data.heuristic === 0;
            
            if (isCurrent) return "#dc3545"; // Merah untuk Current Step
            if (isGoal) return "#28a745"; // Hijau untuk Goal
            return "#6f42c1"; // Ungu untuk node biasa
        })
        .style("stroke", d => {
            // Highlight node yang merupakan bagian dari Solusi
            const isInSolution = solutionDetails.some(sol => sol.state.join(',') === d.data.state.join(','));
            return isInSolution ? "#ffc107" : "#555"; 
        })
        .style("stroke-width", d => {
            const isInSolution = solutionDetails.some(sol => sol.state.join(',') === d.data.state.join(','));
            return isInSolution ? "3px" : "1.5px";
        });

    // Teks Heuristik (di bawah node)
    node.append("text")
        .attr("dy", "3.1em")
        .attr("text-anchor", "middle")
        .text(d => `H: ${d.data.heuristic}`)
        .style("font-size", "9px");
        
    // Teks State (di atas node) - Menggunakan format list sederhana
    node.append("text")
        .attr("dy", "0.4em") // Pindah ke atas lingkaran
        .attr("x", 0) // Kembali ke tengah node (x=0)
        .attr("text-anchor", "middle") // Dipusatkan
        .text(d => `${d.data.nodeIndex}`) // Format list [1, 2, 3, ...]
        .style("font-size", "10px")
        .style("font-weight", "bold");

    // Tambahkan Zoom dan Pan (opsional, tapi disarankan)
    const zoom = d3.zoom()
        .scaleExtent([0.5, 5])
        .on("zoom", (event) => {
            svg.attr("transform", event.transform);
        });
    d3.select(treeVisualizationContainer).select("svg").call(zoom);
}

// =========================================================
// FUNGSI BARU: MERENDER LIST NODE EXPLORASI DI SIDEBAR (FIX)
// =========================================================
/**
 * Merender daftar node yang dieksplorasi (maksimal 50) di sidebar.
 * @param {Array<Object>} flatTreeData - Daftar node flat dari API.
 */
function renderExploredNodesList(flatTreeData) {
    // Pastikan kontainer ada di HTML
    if (!exploredNodesListContainer) {
        // Jika tidak ada di HTML, anggap tidak perlu ditampilkan
        return;
    }
    
    exploredNodesListContainer.innerHTML = ''; // Kosongkan konten lama
    
    if (flatTreeData.length === 0) {
        exploredNodesListContainer.innerHTML = `<p class="loading-message">Memuat data node yang dieksplorasi...</p>`;
        return;
    }

    const maxNodesToShow = 50; // Batasan seperti di screenshot
    const nodesToShow = flatTreeData.slice(0, maxNodesToShow);
    
    const ul = document.createElement('ul');
    ul.classList.add('node-list');

    nodesToShow.forEach((node, index) => {
        const li = document.createElement('li');
        // Format: [0] | H: 12 | State: [1, 5, 0, 2, 6, 4, 8, ...]
        const statePreview = node.state.slice(0, 9).join(', '); 
        li.innerHTML = `[${index}] | <b>H: ${node.heuristic}</b> | State: [${statePreview}]`;
        ul.appendChild(li);
    });
    
    // Tambahkan elipsis jika ada lebih dari 50 node
    if (flatTreeData.length > maxNodesToShow) {
        const li = document.createElement('li');
        li.textContent = `... dan ${flatTreeData.length - maxNodesToShow} node lainnya.`;
        li.style.fontStyle = 'italic';
        ul.appendChild(li);
    }
    
    exploredNodesListContainer.appendChild(ul);
}


// FUNGSI BARU: Buka Modal Pohon
function openTreeModal() {
    if (exploredTreeData.length === 0) {
        alert("Data pohon belum tersedia. Harap selesaikan (Solve) puzzle terlebih dahulu.");
        return;
    }
    
    treeModal.classList.remove('hidden');
    
    // Tentukan langkah saat ini untuk highlight
    const currentStepDetail = solutionDetails[currentStep];
    const currentStepState = currentStepDetail ? currentStepDetail.state : null;
    
    // Render D3 Tree di dalam modal
    // Menggunakan setTimeout agar D3 membaca dimensi modal yang sudah terlihat
    setTimeout(() => {
        renderD3TreeInModal(exploredTreeData, currentStepState);
    }, 10);
}

// FUNGSI BARU: Tutup Modal Pohon
function closeTreeModal() {
    treeModal.classList.add('hidden');
    // Kosongkan container D3 setelah ditutup untuk memori
    treeVisualizationContainer.innerHTML = '';
}


// =========================================================
// MODIFIKASI FUNGSI: MENGISI PANEL PENJELASAN (Sidebar)
// =========================================================
function renderSolutionPathCards(stepIndex) {
    if (solutionDetails.length === 0) {
        solutionPathContainer.innerHTML = `<p class="loading-message" style="color: #777; text-align: center;">Tidak ada data langkah solusi yang tersedia.</p>`;
        return;
    }
    
    solutionPathContainer.innerHTML = ""; // Bersihkan konten lama
    
    const totalSteps = solutionDetails.length - 1;

    // Kumpulan langkah yang akan ditampilkan
    let stepsToRender = new Set();
    
    // 1. START (Langkah 0) - Pasti Tampil
    stepsToRender.add(0);
    
    // 2. Langkah Tepat SEBELUM currentStep (jika > 0)
    if (stepIndex > 0) {
        stepsToRender.add(stepIndex - 1);
    }
    
    // 3. Langkah SAAT INI (Current Step) - Pasti Tampil
    stepsToRender.add(stepIndex);

    // 4. Langkah GOAL (Langkah Terakhir) - Pasti Tampil (kecuali Goal = Current)
    if (totalSteps > 0 && totalSteps !== stepIndex) {
        stepsToRender.add(totalSteps);
    }

    // Sortir langkah dan buat array
    // Gunakan filter untuk menghilangkan duplikat/langkah yang tidak valid
    const uniqueSortedSteps = Array.from(stepsToRender)
        .filter(step => step >= 0 && step <= totalSteps)
        .sort((a, b) => a - b);
    
    let renderedStepsCount = 0;

    for (let i = 0; i < uniqueSortedSteps.length; i++) {
        const currentRenderStep = uniqueSortedSteps[i];
        
        // LOGIKA ELIPSIS 
        // Jika langkah yang akan dirender (currentRenderStep) JAUH dari langkah sebelumnya (uniqueSortedSteps[i - 1]),
        // kita sisipkan elipsis
        if (i > 0 && currentRenderStep > uniqueSortedSteps[i - 1] + 1) {
            const ellipsis = document.createElement("p");
            ellipsis.classList.add('loading-message');
            ellipsis.style.textAlign = 'center';
            ellipsis.style.fontSize = '1.2em';
            ellipsis.style.margin = '5px 0';
            ellipsis.textContent = '... (langkah terlewat)';
            solutionPathContainer.appendChild(ellipsis);
        }

        const detail = solutionDetails[currentRenderStep];
        if (!detail) continue;

        const isCurrent = currentRenderStep === stepIndex;
        const isGoal = currentRenderStep === totalSteps; 
        
        const heuristicValue = detail.heuristic !== undefined && detail.heuristic !== null 
            ? detail.heuristic 
            : 'N/A'; 

        // KARD UNTUK SETIAP LANGKAH
        const stepCard = document.createElement("div");
        stepCard.classList.add("tree-step-card");
        if (isCurrent) {
            stepCard.classList.add("current-step");
            // Scroll ke langkah saat ini saat fungsi ini dipanggil
            // Menggunakan setTimeout untuk memastikan DOM sudah dirender
            setTimeout(() => {
                stepCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }, 10); 
        }
        
        let content = `
            <div class="step-header">
                <span>${currentRenderStep === 0 ? "START" : `Langkah ${currentRenderStep}`}</span>
                <span class="heuristic-value">H: ${heuristicValue}</span>
            </div>
        `;

        if (currentRenderStep > 0) {
            let moveIcon = "";
            switch (detail.move) {
                case "UP": moveIcon = "⬆️"; break;
                case "DOWN": moveIcon = "⬇️"; break;
                case "LEFT": moveIcon = "⬅️"; break;
                case "RIGHT": moveIcon = "➡️"; break;
                default: moveIcon = "➡️";
            } 
            
            let tileMoved = 'N/A'; // Default

            // Logika untuk menemukan ubin mana yang pindah: 
            // Ambil ubin yang sebelumnya berada di posisi 0 (kosong) saat ini.
            if (detail.previousState) {
                const zeroIndexCurrent = detail.state.indexOf(0); 
                tileMoved = detail.previousState[zeroIndexCurrent];
            }
            
            // Perbaikan kecil: Pastikan tileMoved adalah angka yang valid (bukan 0)
            if (tileMoved === 0 || tileMoved === undefined || tileMoved === null) {
                tileMoved = 'N/A';
            }

            content += `<p class="step-move"><b>${moveIcon} ${detail.move}</b> (Pindahkan ubin ${tileMoved})</p>`;
        } else {
            content += `<p class="step-move">Keadaan Awal (Puzzle State)</p>`;
        }

        if (isGoal) {
            content += `<p class="goal-reached">✨ SOLUSI DITEMUKAN! (GOAL H=0)</p>`;
        }

        stepCard.innerHTML += content;
        solutionPathContainer.appendChild(stepCard);
        renderedStepsCount++;
    }
}


// MODIFIKASI FUNGSI: MENGISI PANEL PENJELASAN (Hanya path cards)
function renderTreePanelContent(stepIndex) {
    // 1. Render kartu langkah solusi (yang perlu di-highlight per step)
    renderSolutionPathCards(stepIndex);
    
    // 2. Perbarui jumlah total node
    totalNodesExploredDisplay.textContent = exploredTreeData.length;
    
    // 3. Render daftar node yang dieksplorasi di sidebar (FIX PENTING DITAMBAHKAN)
    renderExploredNodesList(exploredTreeData);
    
    // 4. Tombol modal diaktifkan jika data pohon ada
    openTreeModalButton.disabled = exploredTreeData.length === 0;

    // Catatan: Visualisasi D3 kini HANYA dipanggil saat modal dibuka!
}

// FUNGSI BARU: Mengaktifkan/Menonaktifkan Panel
function toggleTreePanel() {
    isTreePanelVisible = !isTreePanelVisible;
    if (isTreePanelVisible) {
        screen4.classList.add("with-sidebar"); // Aktifkan tata letak 2 kolom (CSS)
        treePanel.classList.remove("hidden"); // Penting: Menghilangkan class 'hidden'
        explanationButton.innerHTML = "◀️ Sembunyikan Penjelasan";
        renderTreePanelContent(currentStep); // Isi konten saat dibuka
    } else {
        screen4.classList.remove("with-sidebar"); // Non-aktifkan tata letak 2 kolom (CSS)
        treePanel.classList.add("hidden"); // Sembunyikan panel dengan class 'hidden'
        explanationButton.innerHTML = "Penjelasan Pohon (AI) ▶️";
    }
}

// MODIFIKASI: showSolutionStep
function showSolutionStep(stepIndex) {
    // totalSteps akan menjadi solutionPath.length - 1 (misal 38 - 1 = 37)
    const totalMoves = solutionPath.length - 1; // Cek apakah solusi ada

    if (totalMoves < 0) {
        stepCounter.textContent = "Tidak ada solusi.";
        solutionProgress.style.width = "0%";
        solutionBoard.innerHTML = "";
        renderPuzzle(currentPuzzleState, solutionBoard); // Tampilkan state awal
        return;
    }

    currentStep = stepIndex;

    renderPuzzle(solutionPath[currentStep], solutionBoard); // totalMoves akan menjadi pembilang (misal 37)

    stepCounter.textContent = `Langkah ${currentStep}/${totalMoves}`;

    const progressPercent = (currentStep / totalMoves) * 100;
    solutionProgress.style.width = `${progressPercent}%`;

    prevStepButton.disabled = currentStep === 0;
    nextStepButton.disabled = currentStep === totalMoves; 
    
    // BARU: Update konten panel penjelasan jika sedang terlihat
    if (isTreePanelVisible) {
        // Hanya perlu memanggil renderTreePanelContent lagi
        renderTreePanelContent(currentStep); 
    }
    
    // Jika modal pohon terbuka, render ulang untuk update highlight
    if (!treeModal.classList.contains('hidden')) {
        const currentStepDetail = solutionDetails[currentStep];
        const currentStepState = currentStepDetail ? currentStepDetail.state : null;
        renderD3TreeInModal(exploredTreeData, currentStepState);
    }
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
// Listener untuk Modal Panduan
window.onclick = function (event) {
    if (event.target === guideModal) {
        guideModal.classList.add("hidden");
    }
};

// Listener untuk Modal Pohon BARU
closeTreeModalButton.onclick = closeTreeModal;
window.onclick = function (event) {
    // Tambahkan logika untuk modal pohon
    if (event.target === treeModal) {
        closeTreeModal();
    } 
    // Pertahankan logika modal panduan
    if (event.target === guideModal) {
        guideModal.classList.add("hidden");
    }
};

// Tombol Buka Modal Pohon BARU (di dalam Sidebar)
openTreeModalButton.onclick = openTreeModal;


// [Langkah 1 -> Langkah 2] Tombol Play (MODIFIKASI: Reset Tree)
playButton.onclick = function () {
    showScreen("screen2");

    puzzleStatus.textContent = "Tekan Generate untuk membuat Puzzle.";
    actionButton.disabled = true;
    actionButton.textContent = "Main (Play)";

    currentPuzzleState = [...GOAL_STATE];
    renderPuzzle(currentPuzzleState, puzzleBoard); 
    
    // BARU: Reset Status Panel Penjelasan dan Data
    isTreePanelVisible = false;
    screen4.classList.remove("with-sidebar");
    // Karena kita HILANGKAN 'hidden' dari HTML, kita tambahkan di sini saat reset
    treePanel.classList.add("hidden"); 
    explanationButton.innerHTML = "Penjelasan Pohon (AI) ▶️";
    explanationButton.disabled = true; // Nonaktifkan sampai solve selesai
    exploredTreeData = []; // Reset data pohon
    
    // FIX: Pastikan konten list node di sidebar direset saat ke screen2
    if (exploredNodesListContainer) {
        exploredNodesListContainer.innerHTML = `<p class="loading-message">Memuat data node yang dieksplorasi...</p>`;
    }
};

// [Langkah 2] Tombol Generate (BARU MENGGUNAKAN API) - Tetap Sama

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

// [Langkah 3 -> Langkah 4] Tombol Solve (MODIFIKASI UTAMA UNTUK SINKRONISASI & POHON)
solveButton.onclick = async function () {
    stopTimer();
    showScreen("screen4"); 
    
    // Sembunyikan panel penjelasan saat solve dimulai
    isTreePanelVisible = false;
    screen4.classList.remove("with-sidebar");
    treePanel.classList.add("hidden");
    explanationButton.innerHTML = "Penjelasan Pohon (AI) ▶️";
    explanationButton.disabled = true; // Nonaktifkan
    
    document.getElementById("solutionStatus").textContent =
        "Mencari solusi menggunakan Best-First Search (API), mohon tunggu...";
    executionTimeElement.textContent = "...";
    totalStepsElement.textContent = "...";

    const solveResult = await getSolutionPath(currentPuzzleState);
    
    solutionPath = solveResult.path;
    solutionDetails = solveResult.details; // SIMPAN DETAIL LENGKAP
    exploredTreeData = solveResult.exploredTree; // SIMPAN DATA POHON LENGKAP
    
    const executionTime = solveResult.time;
    
    if (solutionPath.length > 0) {
        const totalMovesDisplayed = solutionPath.length - 1;

        executionTimeElement.textContent = executionTime.toFixed(7);
        totalStepsElement.textContent = totalMovesDisplayed;

        document.getElementById(
            "solutionStatus"
        ).textContent = `✅ Solusi ditemukan! Total ${totalMovesDisplayed} langkah dalam ${executionTime.toFixed(
            7
        )} detik.`;
        showSolutionStep(0);
        explanationButton.disabled = false; // Aktifkan tombol penjelasan
        openTreeModalButton.disabled = false; // Aktifkan tombol modal
    } else {
        // Gagal
        executionTimeElement.textContent = "N/A";
        totalStepsElement.textContent = "N/A";
        document.getElementById(
            "solutionStatus"
        ).textContent = `❌ Tidak ada solusi untuk puzzle ini (Unsolveable atau limit API terlampaui).`;
        showSolutionStep(0);
        openTreeModalButton.disabled = true;
    }
};

// [Langkah 3 & 4 -> Langkah 2] Tombol Main Lagi (Tetap Sama)
const resetToScreen2 = () => {
    showScreen("screen2");
    // playButton.onclick() menjalankan logika inisialisasi Screen2
    playButton.onclick();
};
playAgainButton.onclick = resetToScreen2;
solvePlayAgainButton.onclick = resetToScreen2;

// [Langkah 4] Navigasi Solusi (MODIFIKASI: Panggil renderTreePanelContent)
prevStepButton.onclick = () => {
    if (currentStep > 0) showSolutionStep(currentStep - 1);
};

nextStepButton.onclick = () => {
    if (currentStep < solutionPath.length - 1) showSolutionStep(currentStep + 1);
};

// Tombol Penjelasan Pohon
explanationButton.onclick = toggleTreePanel;

// [INITIAL RENDER] Tampilkan screen1 saat halaman dimuat (Tetap Sama)
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".container").forEach((screen) => {
        screen.classList.add("hidden");
    });
    screen1.classList.remove("hidden");

    guideModal.classList.add("hidden");
    treeModal.classList.add("hidden"); // Pastikan modal pohon tersembunyi

    renderPuzzle(currentPuzzleState, puzzleBoard);
    
    // PENTING: Sembunyikan panel penjelasan secara default saat awal dimuat (jika HTML sudah diubah)
    treePanel.classList.add("hidden"); 
});

function goToHome() {
    showScreen("screen1");

    stopTimer();

    homeButton.classList.add("hidden");

    currentPuzzleState = GOAL_STATE;
    playingBoard.innerHTML = "";
    puzzleBoard.innerHTML = "";
    
    // BARU: Reset data pohon dan panel
    exploredTreeData = [];
    isTreePanelVisible = false;
    screen4.classList.remove("with-sidebar");
    treeModal.classList.add("hidden");
    explanationButton.disabled = true;
    
    // FIX: Pastikan konten list node di sidebar direset saat ke Home
    if (exploredNodesListContainer) {
        exploredNodesListContainer.innerHTML = `<p class="loading-message">Memuat data node yang dieksplorasi...</p>`;
    }
}
homeButton.onclick = goToHome;