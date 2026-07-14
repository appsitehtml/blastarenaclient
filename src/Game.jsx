import { useEffect, useRef, useState } from "react";

const TILE = 48;

const colors = [
  "#4da3ff",
  "#ff4d4d",
  "#8cff66",
  "#ffd24d"
];

function Game({ socket, room, myPlayer }) {
  const canvasRef = useRef(null);
  const visualPlayersRef = useRef(new Map());
const animationFrameRef = useRef(null);
const roomRef = useRef(room);

  const [selectedItem, setSelectedItem] = useState("bomb");
  const [trapMessage, setTrapMessage] = useState("");
  const [chatText, setChatText] = useState("");

  /*
    CONTROLES DO TECLADO

    1 = bomba
    2 = poção de lentidão
    3 = mina terrestre
    Espaço = usa o item selecionado
  */
  useEffect(() => {
    function handleKeyDown(event) {
      const activeElement = document.activeElement;

      /*
        Impede que o personagem se movimente
        enquanto o jogador estiver digitando no chat.
      */
      if (
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA"
      ) {
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

      if (event.code === "Space") {
        event.preventDefault();

        if (selectedItem === "bomb") {
          socket.emit("bomb");
          return;
        }

        if (selectedItem === "slowTrap") {
          if ((myPlayer?.slowTrapCount || 0) <= 0) {
            setTrapMessage(
              "Você não possui poções de lentidão."
            );

            window.setTimeout(() => {
              setTrapMessage("");
            }, 2500);

            return;
          }

          socket.emit(
            "placeHiddenTrap",
            "slowTrap"
          );

          return;
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

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
  socket,
  selectedItem,
  myPlayer?.slowTrapCount
]);

  /*
    MENSAGENS DAS ARMADILHAS
  */
  useEffect(() => {
    let messageTimer;

    function handleTrapMessage(message) {
      setTrapMessage(message);

      window.clearTimeout(messageTimer);

      messageTimer = window.setTimeout(() => {
        setTrapMessage("");
      }, 3000);
    }

    socket.on(
      "trapMessage",
      handleTrapMessage
    );

    return () => {
      socket.off(
        "trapMessage",
        handleTrapMessage
      );

      window.clearTimeout(messageTimer);
    };
  }, [socket]);

  useEffect(() => {
  roomRef.current = room;

  const visualPlayers =
    visualPlayersRef.current;

  const currentPlayerIds = new Set();

  for (const player of room.players || []) {
    currentPlayerIds.add(player.id);

    const existing =
      visualPlayers.get(player.id);

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

  /*
    Remove jogadores que saíram da sala.
  */
  for (const playerId of visualPlayers.keys()) {
    if (!currentPlayerIds.has(playerId)) {
      visualPlayers.delete(playerId);
    }
  }
}, [room]);

  /*
    DESENHO DO JOGO NO CANVAS
  */
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
      animationFrameRef.current =
        requestAnimationFrame(draw);

      return;
    }

    /*
      Usa o tempo entre os frames para manter
      a animação estável mesmo em telas diferentes.
    */
    const deltaTime = Math.min(
      currentTime - previousTime,
      50
    );

    previousTime = currentTime;

    const interpolation =
      1 - Math.pow(0.001, deltaTime / 1000);

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    /*
      CHÃO
    */
    ctx.fillStyle = "#2a2a2a";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    /*
      MAPA
    */
    for (
      let y = 0;
      y < currentRoom.map.length;
      y += 1
    ) {
      for (
        let x = 0;
        x < currentRoom.map[y].length;
        x += 1
      ) {
        const tile =
          currentRoom.map[y][x];

        const px = x * TILE;
        const py = y * TILE;

        ctx.strokeStyle = "#333";

        ctx.strokeRect(
          px,
          py,
          TILE,
          TILE
        );

        if (tile === "#") {
          ctx.fillStyle = "#666";

          ctx.fillRect(
            px + 2,
            py + 2,
            TILE - 4,
            TILE - 4
          );

          ctx.fillStyle = "#888";

          ctx.fillRect(
            px + 8,
            py + 8,
            TILE - 16,
            10
          );
        }

        if (tile === "x") {
          ctx.fillStyle = "#A86A2A";

          ctx.fillRect(
            px + 6,
            py + 6,
            TILE - 12,
            TILE - 12
          );

          ctx.strokeStyle = "#5a3311";

          ctx.strokeRect(
            px + 6,
            py + 6,
            TILE - 12,
            TILE - 12
          );
        }
      }
    }

    /*
      POWER-UPS
    */
    const powerColors = {
      range: "#ffcc00",
      bomb: "#00d0ff",
      speed: "#00ff88",
      shield: "#ff55ff",
      kick: "#ff8c00",
      slowTrap: "#8b5cf6"
    };

    const powerIcons = {
      range: "🔥",
      bomb: "💣",
      speed: "⚡",
      shield: "🛡",
      kick: "🥾",
      slowTrap: "🧪"
    };

    for (
      const power of
      currentRoom.powerUps || []
    ) {
      const cx =
        power.x * TILE + TILE / 2;

      const cy =
        power.y * TILE + TILE / 2;

      ctx.fillStyle =
        powerColors[power.type] ||
        "#ffffff";

      ctx.beginPath();

      ctx.arc(
        cx,
        cy,
        12,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.fillStyle = "#111";
      ctx.font = "bold 13px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(
        powerIcons[power.type] || "?",
        cx,
        cy + 1
      );
    }

    /*
      BOMBAS
    */
    for (
      const bomb of
      currentRoom.bombs || []
    ) {
      const cx =
        bomb.x * TILE + TILE / 2;

      const cy =
        bomb.y * TILE + TILE / 2;

      ctx.fillStyle = "#111";

      ctx.beginPath();

      ctx.arc(
        cx,
        cy,
        18,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.fillStyle = "#eee";

      ctx.beginPath();

      ctx.arc(
        cx - 5,
        cy - 6,
        4,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.strokeStyle = "#ff8c00";
      ctx.lineWidth = 2;

      ctx.beginPath();

      ctx.moveTo(
        cx + 7,
        cy - 10
      );

      ctx.lineTo(
        cx + 12,
        cy - 18
      );

      ctx.stroke();

      ctx.lineWidth = 1;
    }

    /*
      EXPLOSÕES
    */
    for (
      const explosion of
      currentRoom.explosions || []
    ) {
      const px =
        explosion.x * TILE;

      const py =
        explosion.y * TILE;

      ctx.fillStyle = "#ffd400";

      ctx.fillRect(
        px + 3,
        py + 3,
        TILE - 6,
        TILE - 6
      );

      ctx.fillStyle = "#ff6b00";

      ctx.fillRect(
        px + 12,
        py + 12,
        TILE - 24,
        TILE - 24
      );
    }

    /*
      JOGADORES
    */
    const visualPlayers =
      visualPlayersRef.current;

    for (
      const player of
      currentRoom.players || []
    ) {
      let visual =
        visualPlayers.get(player.id);

      if (!visual) {
        visual = {
          x: player.x,
          y: player.y,
          targetX: player.x,
          targetY: player.y
        };

        visualPlayers.set(
          player.id,
          visual
        );
      }

      /*
        Evita atravessar o mapa visualmente
        em caso de reinício ou teletransporte.
      */
      const distanceToTarget =
        Math.abs(
          visual.targetX - visual.x
        ) +
        Math.abs(
          visual.targetY - visual.y
        );

      if (distanceToTarget > 3) {
        visual.x = visual.targetX;
        visual.y = visual.targetY;
      } else {
        visual.x +=
          (
            visual.targetX -
            visual.x
          ) * interpolation;

        visual.y +=
          (
            visual.targetY -
            visual.y
          ) * interpolation;
      }

      /*
        Corrige valores muito próximos do alvo.
      */
      if (
        Math.abs(
          visual.targetX - visual.x
        ) < 0.001
      ) {
        visual.x = visual.targetX;
      }

      if (
        Math.abs(
          visual.targetY - visual.y
        ) < 0.001
      ) {
        visual.y = visual.targetY;
      }

      const cx =
        visual.x * TILE + TILE / 2;

      const cy =
        visual.y * TILE + TILE / 2;

      ctx.globalAlpha =
        player.alive ? 1 : 0.35;

      ctx.fillStyle =
        colors[player.number - 1] ||
        "white";

      ctx.beginPath();

      ctx.arc(
        cx,
        cy,
        17,
        0,
        Math.PI * 2
      );

      ctx.fill();

      /*
        ESCUDO
      */
      if (player.shield) {
        ctx.strokeStyle = "#00ffff";
        ctx.lineWidth = 4;

        ctx.beginPath();

        ctx.arc(
          cx,
          cy,
          22,
          0,
          Math.PI * 2
        );

        ctx.stroke();

        ctx.lineWidth = 1;
      }

      /*
        LENTIDÃO
      */
      if (player.slowed) {
        ctx.strokeStyle = "#8b5cf6";
        ctx.lineWidth = 4;

        ctx.beginPath();

        ctx.arc(
          cx,
          cy,
          25,
          0,
          Math.PI * 2
        );

        ctx.stroke();

        ctx.lineWidth = 1;
      }

      /*
        BOT
      */
      if (player.isBot) {
        ctx.strokeStyle = "#111";
        ctx.lineWidth = 3;

        ctx.strokeRect(
          cx - 14,
          cy - 14,
          28,
          28
        );

        ctx.lineWidth = 1;
      }

      ctx.fillStyle = "#111";
      ctx.font = "bold 15px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(
        player.number,
        cx,
        cy
      );

      ctx.globalAlpha = 1;
    }

    animationFrameRef.current =
      requestAnimationFrame(draw);
  }

  animationFrameRef.current =
    requestAnimationFrame(draw);

  return () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(
        animationFrameRef.current
      );
    }
  };
}, []);

  const humans =
    room.players?.filter(player => {
      return (
        !player.isBot &&
        player.alive
      );
    }).length || 0;

  const bots =
    room.players?.filter(player => {
      return (
        player.isBot &&
        player.alive
      );
    }).length || 0;

  function sendChatMessage(event) {
    event.preventDefault();

    const text = chatText.trim();

    if (!text) {
      return;
    }

    socket.emit(
      "sendMessage",
      text
    );

    setChatText("");
  }

  return (
    <main className="gamePage">
      <div className="gameTop">
        <strong>
          Sala {room.code}
        </strong>

        <span>
          Jogador {myPlayer?.number || "-"}
        </span>

        <span>
          Humanos {humans}
        </span>

        {room.mode === "duoBots" && (
          <span>
            Bots {bots}
          </span>
        )}

        <span>
          WASD / Setas • Espaço
        </span>
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
          2 — 🧪 Lentidão:{" "}
          {myPlayer?.slowTrapCount || 0}
        </button>

      </div>

      {trapMessage && (
        <div className="trapMessage">
          {trapMessage}
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
          {(room.chatMessages || []).map(
            message => (
              <div
                key={message.id}
                className={
                  message.playerId ===
                  socket.id
                    ? "chatMessage myMessage"
                    : "chatMessage"
                }
              >
                <strong>
                  {message.playerName}:
                </strong>

                <span>
                  {message.text}
                </span>
              </div>
            )
          )}
        </div>

        <form
          className="chatForm"
          onSubmit={sendChatMessage}
        >
          <input
            type="text"
            value={chatText}
            onChange={event => {
              setChatText(
                event.target.value
              );
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