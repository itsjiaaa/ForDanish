function showTab(tabId, button = null){
    // ซ่อนเนื้อหาทุกแท็บ
    document.querySelectorAll('.tab-content').forEach(tab =>
        tab.classList.remove('active')
    );

    // เอาคลาส active ออกจากปุ่มเมนูทั้งหมด
    document.querySelectorAll('.tab-btn').forEach(btn =>
        btn.classList.remove('active')
    );

    // แสดงแท็บหลักที่ถูกเลือก
    const targetTab = document.getElementById(tabId);
    if(targetTab) {
        targetTab.classList.add('active');
    }

    // ทำไฮไลท์สีขาวเฉพาะตอนกดเมนูทั่วไป (ถ้ากดโลโก้จะไม่มีบล็อคขาวติดไป)
    if(button){
        button.classList.add('active');
    }
}

// =======================
// Puzzle Game
// =======================
let selectedPiece = null;
const ROWS = 3;
const COLS = 3;

function createPuzzle(){
    const board = document.getElementById("puzzle-board");
    if(!board) return;

    board.innerHTML = "";

    for(let row = 0; row < ROWS; row++){
        for(let col = 0; col < COLS; col++){
            const piece = document.createElement("div");
            piece.classList.add("puzzle-piece");

            piece.dataset.correct = `${col},${row}`;
            piece.dataset.current = `${col},${row}`;

            piece.style.backgroundImage = "url('images/puzzle.png')";
            piece.style.backgroundRepeat = "no-repeat";
            piece.style.backgroundSize = "600px 310px";
            piece.style.backgroundPosition = `-${col * 200}px -${row * 103}px`;

            board.appendChild(piece);
        }
    }
    addClickEvents();
}

function shufflePuzzle(){
    selectedPiece = null;
    const pieces = Array.from(document.querySelectorAll(".puzzle-piece"));
    if(pieces.length === 0) return;

    const data = pieces.map(piece => ({
        position: piece.style.backgroundPosition,
        current: piece.dataset.current
    }));

    for(let i = data.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [data[i], data[j]] = [data[j], data[i]];
    }

    pieces.forEach((piece,index)=>{
        piece.style.backgroundPosition = data[index].position;
        piece.dataset.current = data[index].current;
        piece.style.border = "1px solid #ddd";
    });
}

function addClickEvents(){
    document.querySelectorAll(".puzzle-piece").forEach(piece => {
        piece.onclick = () => {
            if(selectedPiece === null){
                selectedPiece = piece;
                piece.style.border = "3px solid red";
                return;
            }

            if(selectedPiece === piece){
                piece.style.border = "1px solid #ddd";
                selectedPiece = null;
                return;
            }

            const tempPosition = selectedPiece.style.backgroundPosition;
            selectedPiece.style.backgroundPosition = piece.style.backgroundPosition;
            piece.style.backgroundPosition = tempPosition;

            const tempCurrent = selectedPiece.dataset.current;
            selectedPiece.dataset.current = piece.dataset.current;
            piece.dataset.current = tempCurrent;

            selectedPiece.style.border = "1px solid #ddd";
            selectedPiece = null;

            checkWin();
        };
    });
}

function checkWin(){
    let win = true;
    document.querySelectorAll(".puzzle-piece").forEach(piece => {
        if(piece.dataset.current !== piece.dataset.correct){
            win = false;
        }
    });

    if(win){
        setTimeout(() => {
            alert("❤️ Congratulations! ❤️\n\nYou completed our puzzle!");
        },100);
    }
}

// =======================
// Memory Match
// =======================
const memoryIcons = [
    "💚","💚", "🌷","🌷", "💌","💌", "🐱","🐱",
    "🍀","🍀", "🌸","🌸", "❤️","❤️", "🧸","🧸"
];

let firstCard = null;
let secondCard = null;
let lockBoard = false;

function createMemoryGame(){
    const board = document.getElementById("memory-board");
    if(!board) return;

    board.innerHTML = "";
    const cards = [...memoryIcons].sort(() => Math.random() - 0.5);

    cards.forEach(icon => {
        const card = document.createElement("div");
        card.className = "memory-card";
        card.dataset.icon = icon;
        card.textContent = "❓";

        card.onclick = () => {
            if(lockBoard) return;
            if(card === firstCard) return;
            if(card.textContent !== "❓") return;

            card.textContent = icon;

            if(!firstCard){
                firstCard = card;
                return;
            }

            secondCard = card;

            if(firstCard.dataset.icon === secondCard.dataset.icon){
                firstCard = null;
                secondCard = null;
                checkMemoryWin();
            }else{
                lockBoard = true;
                setTimeout(()=>{
                    firstCard.textContent = "❓";
                    secondCard.textContent = "❓";
                    firstCard = null;
                    secondCard = null;
                    lockBoard = false;
                },800);
            }
        };
        board.appendChild(card);
    });
}

function checkMemoryWin(){
    const cards = document.querySelectorAll(".memory-card");
    let win = true;
    cards.forEach(card=>{
        if(card.textContent === "❓") win = false;
    });

    if(win){
        setTimeout(()=>{
            alert("💚 You matched all memories! 💚");
        },200);
    }
}

// ===================================================
// MAZE GAME: เวอร์ชันเต็มกรอบ + สร้างทางเดินอัตโนมัติ (ไม่มีวันตัน)
// ===================================================
const canvas = document.getElementById("mazeCanvas");

if (canvas) {
    const ctx = canvas.getContext("2d");

    // ตั้งค่าขนาด Canvas ให้เต็มกรอบพอดี (500x500 px)
    canvas.width = 500;
    canvas.height = 500;

    const cols = 15; // จำนวนคอลัมน์
    const rows = 15; // จำนวนแถว
    const tileSize = canvas.width / cols; // คำนวณขนาดบล็อกให้พอดีกับกรอบอัตโนมัติ

    let mazeMap = [];
    
    // พิกัดผู้เล่นและเป้าหมาย (อิงจากแถวและคอลัมน์)
    const player = { x: 1, y: 1 };
    const goal = { x: cols - 2, y: rows - 2 };

    // ฟังก์ชันสร้างเขาวงกตอัตโนมัติ (รับประกันว่ามีทางออกและเชื่อมต่อกันหมด)
    function generateMaze() {
        // 1. สร้างกำแพงทึบทั้งหมดก่อน (1 คือกำแพง, 0 คือทางเดิน)
        mazeMap = Array.from({ length: rows }, () => Array(cols).fill(1));

        const stack = [];
        const startCell = { r: 1, c: 1 };
        mazeMap[startCell.r][startCell.c] = 0;
        stack.push(startCell);

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = [];

            // หาช่องเพื่อนบ้านที่ห่างไป 2 บล็อก (บน, ล่าง, ซ้าย, ขวา)
            const dirs = [
                { r: -2, c: 0 }, { r: 2, c: 0 },
                { r: 0, c: -2 }, { r: 0, c: 2 }
            ];

            dirs.forEach(d => {
                const nr = current.r + d.r;
                const nc = current.c + d.c;
                if (nr > 0 && nr < rows - 1 && nc > 0 && nc < cols - 1) {
                    if (mazeMap[nr][nc] === 1) {
                        neighbors.push({ r: nr, c: nc, dir: d });
                    }
                }
            });

            if (neighbors.length > 0) {
                // สุ่มเลือกช่องเพื่อนบ้าน 1 ช่อง เพื่อระเบิดกำแพงสร้างทางเดิน
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                
                // ทุบกำแพงตรงกลางระหว่างช่องปัจจุบันกับช่องถัดไป
                mazeMap[current.r + next.dir.r / 2][current.c + next.dir.c / 2] = 0;
                mazeMap[next.r][next.c] = 0;

                stack.push({ r: next.r, c: next.c });
            } else {
                stack.pop();
            }
        }

        // มั่นใจว่าจุดเริ่มต้นและจุดจบเป็นทางโล่ง
        mazeMap[player.y][player.x] = 0;
        mazeMap[goal.y][goal.x] = 0;
    }

    // ฟังก์ชันวาดเขาวงกตและไอคอน
    function drawMaze() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // วาดกำแพงสีเขียวเข้ม
        ctx.fillStyle = "#225C2C";
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (mazeMap[r][c] === 1) {
                    ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
                }
            }
        }

        // ตั้งค่าสำหรับวาดอิโมจิให้จัดวางกึ่งกลางช่องพอดี
        ctx.font = `${tileSize * 0.8}px Arial`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        // วาดผู้ชายวิ่ง 🏃‍♂️
        ctx.fillText("🏃‍♂️", player.x * tileSize + tileSize / 2, player.y * tileSize + tileSize / 2);

        // วาดหัวใจ ❤️
        ctx.font = `${tileSize * 0.9}px Arial`;
        ctx.fillText("❤️", goal.x * tileSize + tileSize / 2, goal.y * tileSize + tileSize / 2);
    }

    // ตรวจสอบการเคลื่อนที่
    document.addEventListener("keydown", e => {
        const mazeTab = document.getElementById('maze');
        if (!mazeTab || !mazeTab.classList.contains('active')) return;

        let nextX = player.x;
        let nextY = player.y;

        if (e.key === "ArrowUp")    nextY -= 1;
        if (e.key === "ArrowDown")  nextY += 1;
        if (e.key === "ArrowLeft")  nextX -= 1;
        if (e.key === "ArrowRight") nextX += 1;

        // ถ้าช่องที่จะเดินไปไม่ใช่กำแพง (เป็น 0) ถึงจะเดินได้
        if (mazeMap[nextY] && mazeMap[nextY][nextX] === 0) {
            player.x = nextX;
            player.y = nextY;
            drawMaze();
        }

        // เมื่อเดินไปถึงหัวใจ
        if (player.x === goal.x && player.y === goal.y) {
            setTimeout(() => {
                alert("🎉 คุณช่วยให้เขาตามหาหัวใจจนเจอแล้ว! Happy Anniversary นะคะ ❤️");
                // รีเซ็ตเกมกลับจุดเริ่ม
                player.x = 1;
                player.y = 1;
                drawMaze();
            }, 100);
        }
    });

    // เริ่มต้นสร้างเกม
    generateMaze();
    drawMaze();
}

// สั่งให้เริ่มวาดส่วนประกอบของเกมทันทีหลังเปิดเว็บ
createPuzzle();
createMemoryGame();