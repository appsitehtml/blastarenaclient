import { useEffect, useRef, useState } from "react";

const TILE = 48;

const PLAYER_COLORS = [
  "#4da3ff",
  "#ff4d4d",
  "#8cff66",
  "#ffd24d"
];

const POWER_COLORS = {
  range: "#ffcc00",
  bomb: "#00d0ff",
  speed: "#00ff88",
  shield: "#ff55ff",
  kick: "#ff8c00",
  slowTrap: "#8b5cf6",
  visionTrap: "#111111"
};

const [
  opponentEffectMessage,
  setOpponentEffectMessage
] = useState("");

const POWER_ICONS = {
  range: "🔥",
  bomb: "💣",
  speed: "⚡",
  shield: "🛡",
  kick: "🥾",
  slowTrap: "🧪",
  visionTrap: "👁"
};

function drawClassicWall(ctx, px, py) {
  ctx.fillStyle = "#666";
  ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);

  ctx.fillStyle = "#888";
  ctx.fillRect(px + 8, py + 8, TILE - 16, 10);
}

function drawClassicBox(ctx, px, py) {
  ctx.fillStyle = "#A86A2A";
  ctx.fillRect(px + 6, py + 6, TILE - 12, TILE - 12);

  ctx.strokeStyle = "#5a3311";
  ctx.strokeRect(px + 6, py + 6, TILE - 12, TILE - 12);
}

function drawForestWall(ctx, px, py) {
  const cx = px + TILE / 2;

  ctx.fillStyle = "#4f321c";
  ctx.fillRect(cx - 6, py + 18, 12, 28);

  ctx.fillStyle = "#224f27";
  ctx.beginPath();
  ctx.arc(cx, py + 17, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#34753a";
  ctx.beginPath();
  ctx.arc(cx - 9, py + 13, 11, 0, Math.PI * 2);
  ctx.arc(cx + 10, py + 12, 12, 0, Math.PI * 2);
  ctx.arc(cx, py + 5, 12, 0, Math.PI * 2);
  ctx.fill();
}

function drawForestBox(ctx, px, py) {
  const cx = px + TILE / 2;

  ctx.fillStyle = "#6b3f20";
  ctx.fillRect(cx - 5, py + 20, 10, 24);

  ctx.fillStyle = "#2e7d32";
  ctx.beginPath();
  ctx.arc(cx, py + 18, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#1c5a22";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 1;
}

function drawIceWall(ctx, px, py) {
  const cx = px + TILE / 2;

  ctx.fillStyle = "#d9f7ff";
  ctx.beginPath();
  ctx.moveTo(px + 3, py + TILE - 4);
  ctx.lineTo(px + 10, py + 14);
  ctx.lineTo(cx - 5, py + 4);
  ctx.lineTo(cx + 3, py + 16);
  ctx.lineTo(px + TILE - 8, py + 7);
  ctx.lineTo(px + TILE - 3, py + TILE - 4);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#8ccfe6";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 1;
}

function drawIceBox(ctx, px, py) {
  const cx = px + TILE / 2;

  ctx.fillStyle = "#9edff3";
  ctx.beginPath();
  ctx.moveTo(px + 7, py + TILE - 7);
  ctx.lineTo(px + 13, py + 18);
  ctx.lineTo(cx, py + 7);
  ctx.lineTo(px + TILE - 10, py + 17);
  ctx.lineTo(px + TILE - 6, py + TILE - 7);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#4b9bb8";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 1;
}

function drawMap(ctx, room, canvas) {
  const theme = room.mapTheme || "classic";

  const floorColor =
    theme === "forest"
      ? "#315c2b"
      : theme === "ice"
        ? "#8ed4ea"
        : "#2a2a2a";

  const gridColor =
    theme === "forest"
      ? "#264b22"
      : theme === "ice"
        ? "#72bed8"
        : "#333333";

  ctx.fillStyle = floorColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < room.map.length; y += 1) {
    for (let x = 0; x < room.map[y].length; x += 1) {
      const tile = room.map[y][x];
      const px = x * TILE;
      const py = y * TILE;

      ctx.strokeStyle = gridColor;
      ctx.strokeRect(px, py, TILE, TILE);

      if (tile === "#") {
        if (theme === "forest") {
          drawForestWall(ctx, px, py);
        } else if (theme === "ice") {
          drawIceWall(ctx, px, py);
        } else {
          drawClassicWall(ctx, px, py);
        }
      }

      if (tile === "x") {
        if (theme === "forest") {
          drawForestBox(ctx, px, py);
        } else if (theme === "ice") {
          drawIceBox(ctx, px, py);
        } else {
          drawClassicBox(ctx, px, py);
        }
      }
    }
  }
}

function drawPowerUps(ctx, room) {
  for (const power of room.powerUps || []) {
    const cx = power.x * TILE + TILE / 2;
    const cy = power.y * TILE + TILE / 2;

    ctx.fillStyle = POWER_COLORS[power.type] || "#ffffff";

    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#111";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
      POWER_ICONS[power.type] || "?",
      cx,
      cy + 1
    );
  }
}

function drawExplosions(ctx, room) {
  const iceTheme = room.mapTheme === "ice";

  for (const explosion of room.explosions || []) {
    const px = explosion.x * TILE;
    const py = explosion.y * TILE;

    ctx.fillStyle = iceTheme ? "#d9f7ff" : "#ffd400";
    ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);

    ctx.fillStyle = iceTheme ? "#4fc3f7" : "#ff6b00";
    ctx.fillRect(px + 12, py + 12, TILE - 24, TILE - 24);
  }
}

function drawBombs(ctx, room) {
  for (const bomb of room.bombs || []) {
    const cx = bomb.x * TILE + TILE / 2;
    const cy = bomb.y * TILE + TILE / 2;

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.fillStyle = "#111";

    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#eeeeee";
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 6, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ff8c00";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + 7, cy - 11);
    ctx.lineTo(cx + 13, cy - 19);
    ctx.stroke();

    ctx.fillStyle = "#ffd400";
    ctx.beginPath();
    ctx.arc(cx + 14, cy - 20, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 1;
  }
}

function drawStickman(ctx, player, cx, cy, currentTime, isMoving) {
  const color = PLAYER_COLORS[player.number - 1] || "#ffffff";
  const phase = currentTime / 85;
  const swing = isMoving ? Math.sin(phase) * 6 : 0;
  const bob = isMoving ? Math.abs(Math.sin(phase)) * 1.5 : 0;

  const headY = cy - 12 - bob;
  const shoulderY = cy - 2 - bob;
  const hipY = cy + 9 - bob;

  ctx.save();
  ctx.globalAlpha = player.alive ? 1 : 0.35;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  // Cabeça
  ctx.beginPath();
  ctx.arc(cx, headY, 7, 0, Math.PI * 2);
  ctx.fill();

  // Corpo
  ctx.beginPath();
  ctx.moveTo(cx, headY + 7);
  ctx.lineTo(cx, hipY);
  ctx.stroke();

  // Braços
  ctx.beginPath();
  ctx.moveTo(cx, shoulderY);
  ctx.lineTo(cx - 11, shoulderY + 7 + swing);
  ctx.moveTo(cx, shoulderY);
  ctx.lineTo(cx + 11, shoulderY + 7 - swing);
  ctx.stroke();

  // Pernas
  ctx.beginPath();
  ctx.moveTo(cx, hipY);
  ctx.lineTo(cx - 9, hipY + 12 - swing);
  ctx.moveTo(cx, hipY);
  ctx.lineTo(cx + 9, hipY + 12 + swing);
  ctx.stroke();

  // Inicial no peito
  const initial = String(player.name || player.number)
    .trim()
    .charAt(0)
    .toUpperCase();

  ctx.fillStyle = "#111";
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initial, cx, shoulderY + 5);

  if (player.shield) {
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (player.slowed) {
    ctx.strokeStyle = "#8b5cf6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy + 12, 17, 0, Math.PI);
    ctx.stroke();
  }

  if (player.frozen) {
    ctx.strokeStyle = "#d9f7ff";
    ctx.fillStyle = "rgba(120, 210, 255, 0.28)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cx - 17, cy - 27, 34, 52, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "14px Arial";
    ctx.fillText("❄", cx, cy - 30);
  }

  if (player.rooted) {
    ctx.strokeStyle = "#42a846";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 13, cy + 20);
    ctx.quadraticCurveTo(cx - 20, cy + 8, cx - 8, cy + 2);
    ctx.moveTo(cx + 13, cy + 20);
    ctx.quadraticCurveTo(cx + 20, cy + 8, cx + 8, cy + 2);
    ctx.stroke();
  }

  if (player.isBot) {
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 17, cy - 25, 34, 48);
  }

  if (player.blinded) {
  ctx.globalAlpha = 1;
  ctx.font = "18px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    "👁",
    cx,
    cy - 32
  );
}

  if (player.emoji) {
    ctx.globalAlpha = 1;
    ctx.font = "28px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(player.emoji, cx, cy - 43);
  }

  ctx.restore();
}

function drawPlayers(ctx, room, visualPlayers, currentTime, interpolation) {
  for (const player of room.players || []) {
    let visual = visualPlayers.get(player.id);

    if (!visual) {
      visual = {
        x: player.x,
        y: player.y,
        targetX: player.x,
        targetY: player.y
      };

      visualPlayers.set(player.id, visual);
    }

    const distanceToTarget =
      Math.abs(visual.targetX - visual.x) +
      Math.abs(visual.targetY - visual.y);

    if (distanceToTarget > 1.5) {
      visual.x = visual.targetX;
      visual.y = visual.targetY;
    } else {
      visual.x += (visual.targetX - visual.x) * interpolation;
      visual.y += (visual.targetY - visual.y) * interpolation;
    }

    if (Math.abs(visual.targetX - visual.x) < 0.001) {
      visual.x = visual.targetX;
    }

    if (Math.abs(visual.targetY - visual.y) < 0.001) {
      visual.y = visual.targetY;
    }

    const isMoving =
      Math.abs(visual.targetX - visual.x) > 0.01 ||
      Math.abs(visual.targetY - visual.y) > 0.01;

    const cx = visual.x * TILE + TILE / 2;
    const cy = visual.y * TILE + TILE / 2;

    drawStickman(
      ctx,
      player,
      cx,
      cy,
      currentTime,
      isMoving
    );
  }
}


function drawBlindnessOverlay(ctx, room, visualPlayers, canvas, socketId) {
  const localPlayer = (room.players || []).find(
    player => player.id === socketId
  );

  if (!localPlayer?.blinded) {
    return;
  }

  const visual = visualPlayers.get(localPlayer.id);

  if (!visual) {
    return;
  }

  const cx = visual.x * TILE + TILE / 2;
  const cy = visual.y * TILE + TILE / 2;
  const radius = 82;

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.97)";
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.arc(cx, cy, radius, 0, Math.PI * 2, true);
  ctx.fill("evenodd");

  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function Game({ socket, room, myPlayer }) {
  const canvasRef = useRef(null);
  const visualPlayersRef = useRef(new Map());
  const animationFrameRef = useRef(null);
  const roomRef = useRef(room);

  const [selectedItem, setSelectedItem] = useState("bomb");
  const [trapMessage, setTrapMessage] = useState("");
  const [chatText, setChatText] = useState("");
  const [emojiMenuOpen, setEmojiMenuOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event) {
      const activeElement = document.activeElement;

      if (
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        setEmojiMenuOpen(current => !current);
        return;
      }

      if (emojiMenuOpen) {
        const emojiByKey = {
          "1": "😂",
          "2": "😡",
          "3": "😭",
          "4": "🔥",
          "5": "👍",
          "6": "👎",
          "7": "💣",
          "8": "😱"
        };

        const selectedEmoji = emojiByKey[event.key];

        if (selectedEmoji) {
          socket.emit("sendEmoji", selectedEmoji);
          setEmojiMenuOpen(false);
        }

        return;
      }

      if (event.key === "1") {
        setSelectedItem("bomb");
        return;
      }

      if (event.key === "2") {
        setSelectedItem("slowTrap");
        return;
      }

      if (event.key === "3") {
        setSelectedItem("visionTrap");
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();

        if (selectedItem === "bomb") {
          socket.emit("bomb");
          return;
        }

        if (selectedItem === "slowTrap") {
          if ((myPlayer?.slowTrapCount || 0) <= 0) {
            setTrapMessage("Você não possui poções de lentidão.");

            window.setTimeout(() => {
              setTrapMessage("");
            }, 2500);

            return;
          }

          socket.emit("placeHiddenTrap", "slowTrap");
          return;
        }

        if (selectedItem === "visionTrap") {
          if ((myPlayer?.visionTrapCount || 0) <= 0) {
            setTrapMessage("Você não possui armadilhas de visão.");

            window.setTimeout(() => {
              setTrapMessage("");
            }, 2500);

            return;
          }

          socket.emit("placeHiddenTrap", "visionTrap");
        }

        return;
      }

      const directions = {
        w: "up",
        W: "up",
        ArrowUp: "up",
        s: "down",
        S: "down",
        ArrowDown: "down",
        a: "left",
        A: "left",
        ArrowLeft: "left",
        d: "right",
        D: "right",
        ArrowRight: "right"
      };

      const direction = directions[event.key];

      if (direction) {
        event.preventDefault();
        socket.emit("move", direction);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    socket,
    selectedItem,
    emojiMenuOpen,
    myPlayer?.slowTrapCount,
    myPlayer?.visionTrapCount
  ]);

  useEffect(() => {
  let messageTimer;

  function handleOpponentEffectMessage(message) {
    setOpponentEffectMessage(message);

    window.clearTimeout(messageTimer);

    messageTimer = window.setTimeout(() => {
      setOpponentEffectMessage("");
    }, 3000);
  }

  socket.on(
    "opponentEffectMessage",
    handleOpponentEffectMessage
  );

  return () => {
    socket.off(
      "opponentEffectMessage",
      handleOpponentEffectMessage
    );

    window.clearTimeout(messageTimer);
  };
}, [socket]);

  useEffect(() => {
    let messageTimer;

    function handleTrapMessage(message) {
      setTrapMessage(message);

      window.clearTimeout(messageTimer);

      messageTimer = window.setTimeout(() => {
        setTrapMessage("");
      }, 3000);
    }

    socket.on("trapMessage", handleTrapMessage);

    return () => {
      socket.off("trapMessage", handleTrapMessage);
      window.clearTimeout(messageTimer);
    };
  }, [socket]);

  useEffect(() => {
    roomRef.current = room;

    const visualPlayers = visualPlayersRef.current;
    const currentPlayerIds = new Set();

    for (const player of room.players || []) {
      currentPlayerIds.add(player.id);

      const existing = visualPlayers.get(player.id);

      if (!existing) {
        visualPlayers.set(player.id, {
          x: player.x,
          y: player.y,
          targetX: player.x,
          targetY: player.y
        });

        continue;
      }

      existing.targetX = player.x;
      existing.targetY = player.y;
    }

    for (const playerId of visualPlayers.keys()) {
      if (!currentPlayerIds.has(playerId)) {
        visualPlayers.delete(playerId);
      }
    }
  }, [room]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    let previousTime = performance.now();

    function draw(currentTime) {
      const currentRoom = roomRef.current;

      if (!currentRoom?.map) {
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const deltaTime = Math.min(currentTime - previousTime, 50);
      previousTime = currentTime;

      const interpolation =
        1 - Math.pow(0.000001, deltaTime / 1000);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawMap(ctx, currentRoom, canvas);
      drawPowerUps(ctx, currentRoom);
      drawExplosions(ctx, currentRoom);
      drawPlayers(
        ctx,
        currentRoom,
        visualPlayersRef.current,
        currentTime,
        interpolation
      );
      drawBombs(ctx, currentRoom);
      drawBlindnessOverlay(
        ctx,
        currentRoom,
        visualPlayersRef.current,
        canvas,
        socket.id
      );

      animationFrameRef.current = requestAnimationFrame(draw);
    }

    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const humans =
    room.players?.filter(player => {
      return !player.isBot && player.alive;
    }).length || 0;

  const bots =
    room.players?.filter(player => {
      return player.isBot && player.alive;
    }).length || 0;

  const humanPlayers =
    room.players?.filter(player => !player.isBot) || [];

  const playerOne =
    humanPlayers.find(player => player.number === 1);

  const playerTwo =
    humanPlayers.find(player => player.number === 2);

  const playerOneName =
    playerOne?.name || "Jogador 1";

  const playerTwoName =
    playerTwo?.name || "Jogador 2";

  function sendChatMessage(event) {
    event.preventDefault();

    const text = chatText.trim();

    if (!text) {
      return;
    }

    socket.emit("sendMessage", text);
    setChatText("");
  }

  return (
    <main className="gamePage">
      <div className="gameTop">
        <span>
          {playerOneName} {room.score?.player1 || 0}
          {" x "}
          {room.score?.player2 || 0} {playerTwoName}
        </span>

        {room.winStreak?.count > 1 && (
          <span>
            🔥{" "}
            {room.winStreak.playerNumber === 1
              ? playerOneName
              : playerTwoName}
            : {room.winStreak.count} vitórias seguidas
          </span>
        )}

        <strong>Sala {room.code}</strong>
        <span>Jogador {myPlayer?.number || "-"}</span>
        <span>Humanos {humans}</span>

        {room.mode === "duoBots" && (
          <span>Bots {bots}</span>
        )}

        <span>WASD / Setas • Espaço</span>
      </div>

      <div className="powerInventory">
        <button
          type="button"
          className={
            selectedItem === "bomb"
              ? "selectedPower"
              : ""
          }
          onClick={() => {
            setSelectedItem("bomb");
          }}
        >
          1 — 💣 Bomba
        </button>

        <button
          type="button"
          className={
            selectedItem === "slowTrap"
              ? "selectedPower"
              : ""
          }
          onClick={() => {
            setSelectedItem("slowTrap");
          }}
        >
          2 —{" "}
          {room.mapTheme === "ice"
            ? "❄ Congelante"
            : room.mapTheme === "forest"
              ? "🌿 Vinhas"
              : "🧪 Lentidão"}
          : {myPlayer?.slowTrapCount || 0}
        </button>

        <button
          type="button"
          className={
            selectedItem === "visionTrap"
              ? "selectedPower"
              : ""
          }
          onClick={() => {
            setSelectedItem("visionTrap");
          }}
        >
          3 — 👁 Visão: {myPlayer?.visionTrapCount || 0}
        </button>
      </div>

      {emojiMenuOpen && (
        <div className="emojiMenu">
          <div>1 — 😂</div>
          <div>2 — 😡</div>
          <div>3 — 😭</div>
          <div>4 — 🔥</div>
          <div>5 — 👍</div>
          <div>6 — 👎</div>
          <div>7 — 💣</div>
          <div>8 — 😱</div>
        </div>
      )}

      {trapMessage && (
        <div className="trapMessage">
          {trapMessage}
        </div>
      )}

      {opponentEffectMessage && (
  <div className="opponentEffectMessage">
    {opponentEffectMessage}
  </div>
)}

      {room.winner && (
        <div className="winnerBox">
          <h2>
            {room.winner === "Empate"
              ? "EMPATE"
              : room.winner === "Jogadores"
                ? "VOCÊS VENCERAM"
                : room.winner === "Bots"
                  ? "BOTS VENCERAM"
                  : `${room.winner} venceu`}
          </h2>

          <button
            type="button"
            onClick={() => {
              socket.emit("restartGame");
            }}
          >
            Jogar novamente
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={13 * TILE}
        height={11 * TILE}
      />

      <div className="gameChat">
        <div className="chatMessages">
          {(room.chatMessages || []).map(message => (
            <div
              key={message.id}
              className={
                message.playerId === socket.id
                  ? "chatMessage myMessage"
                  : "chatMessage"
              }
            >
              <strong>{message.playerName}:</strong>
              <span>{message.text}</span>
            </div>
          ))}
        </div>

        <form
          className="chatForm"
          onSubmit={sendChatMessage}
        >
          <input
            type="text"
            value={chatText}
            onChange={event => {
              setChatText(event.target.value);
            }}
            placeholder="Digite uma mensagem..."
            maxLength={100}
            autoComplete="off"
          />

          <button type="submit">
            Enviar
          </button>
        </form>
      </div>
    </main>
  );
}

export default Game;