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

  useEffect(() => {
    function handleKey(e) {
      const keys = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        W: "up",
        s: "down",
        S: "down",
        a: "left",
        A: "left",
        d: "right",
        D: "right"
      };

      const element = document.activeElement;

if (
  element?.tagName === "INPUT" ||
  element?.tagName === "TEXTAREA"
) {
  return;
}

      if (keys[e.key]) {
        e.preventDefault();
        socket.emit("move", keys[e.key]);
      }

      if (e.code === "Space") {
        e.preventDefault();
        socket.emit("bomb");
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [socket]);

  useEffect(() => {

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0,0,canvas.width,canvas.height);

    // chão

    ctx.fillStyle="#2a2a2a";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // mapa

    for(let y=0;y<room.map.length;y++){

      for(let x=0;x<room.map[y].length;x++){

        const tile=room.map[y][x];

        const px=x*TILE;
        const py=y*TILE;

        ctx.strokeStyle="#333";
        ctx.strokeRect(px,py,TILE,TILE);

        if(tile=="#"){

          ctx.fillStyle="#666";

          ctx.fillRect(px+2,py+2,TILE-4,TILE-4);

          ctx.fillStyle="#888";

          ctx.fillRect(px+8,py+8,TILE-16,10);

        }

        if(tile=="x"){

          ctx.fillStyle="#A86A2A";

          ctx.fillRect(px+6,py+6,TILE-12,TILE-12);

          ctx.strokeStyle="#5a3311";

          ctx.strokeRect(px+6,py+6,TILE-12,TILE-12);

        }

      }

    }

    // powerups

    console.log(room.powerUps);

    room.powerUps?.forEach(power=>{

      const cx=power.x*TILE+24;
      const cy=power.y*TILE+24;

      if(power.type==="range") ctx.fillStyle="#ffcc00";
if(power.type==="bomb") ctx.fillStyle="#00d0ff";
if(power.type==="speed") ctx.fillStyle="#00ff88";
if(power.type==="shield") ctx.fillStyle="#ff55ff";
if(power.type==="kick") ctx.fillStyle="#ff8c00";

      ctx.beginPath();
      ctx.arc(cx,cy,12,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle="#111";

      ctx.font="bold 13px Arial";

      ctx.textAlign="center";
      ctx.textBaseline="middle";

      const text = {
  range: "🔥",
  bomb: "💣",
  speed: "⚡",
  shield: "🛡",
  kick: "🥾"
};

      ctx.fillText(text[power.type] || "?", cx, cy + 1);

    });

    // bombas

    room.bombs?.forEach(b=>{

      const cx=b.x*TILE+24;
      const cy=b.y*TILE+24;

      ctx.fillStyle="#111";

      ctx.beginPath();

      ctx.arc(cx,cy,18,0,Math.PI*2);

      ctx.fill();

      ctx.fillStyle="#eee";

      ctx.beginPath();

      ctx.arc(cx-5,cy-6,4,0,Math.PI*2);

      ctx.fill();

    });

    // explosões

    room.explosions?.forEach(exp=>{

      const px=exp.x*TILE;
      const py=exp.y*TILE;

      ctx.fillStyle="#ffd400";
      ctx.fillRect(px+3,py+3,TILE-6,TILE-6);

      ctx.fillStyle="#ff6b00";
      ctx.fillRect(px+12,py+12,TILE-24,TILE-24);

    });

    // jogadores

    room.players.forEach(player=>{

      const cx=player.x*TILE+24;
      const cy=player.y*TILE+24;

      ctx.globalAlpha=player.alive?1:0.35;

      ctx.fillStyle=colors[player.number-1]||"white";

      ctx.beginPath();

      ctx.arc(cx,cy,17,0,Math.PI*2);

      ctx.fill();

      // escudo

      if(player.shield){

        ctx.strokeStyle="#00ffff";

        ctx.lineWidth=4;

        ctx.beginPath();

        ctx.arc(cx,cy,22,0,Math.PI*2);

        ctx.stroke();

        ctx.lineWidth=1;

      }

      if(player.isBot){

        ctx.strokeStyle="#111";

        ctx.lineWidth=3;

        ctx.strokeRect(cx-14,cy-14,28,28);

        ctx.lineWidth=1;

      }

      ctx.fillStyle="#111";

      ctx.font="bold 15px Arial";

      ctx.textAlign="center";

      ctx.textBaseline="middle";

      ctx.fillText(player.number,cx,cy);

      ctx.globalAlpha=1;

    });

  },[room]);

  const humans=room.players.filter(p=>!p.isBot&&p.alive).length;

  const bots=room.players.filter(p=>p.isBot&&p.alive).length;

  const [chatText, setChatText] = useState("");

  function sendChatMessage(event) {
  event.preventDefault();

  const text = chatText.trim();

  if (!text) return;

  socket.emit("sendMessage", text);
  setChatText("");
}

  return(

    <main className="gamePage">

      <div className="gameTop">

        <strong>Sala {room.code}</strong>

        <span>Jogador {myPlayer?.number}</span>

        <span>Humanos {humans}</span>

        {room.mode==="duoBots"&&<span>Bots {bots}</span>}

        <span>WASD / Setas • Espaço</span>

      </div>

      {room.winner&&(

        <div className="winnerBox">

          <h2>{

            room.winner==="Empate"
            ?"EMPATE"

            :room.winner==="Jogadores"
            ?"VOCÊS VENCERAM"

            :room.winner==="Bots"
            ?"BOTS VENCERAM"

            :`${room.winner} venceu`

          }</h2>

          <button
            onClick={()=>socket.emit("restartGame")}
          >
            Jogar novamente
          </button>

        </div>

      )}

      <canvas

        ref={canvasRef}

        width={13*TILE}

        height={11*TILE}

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
      onChange={event => setChatText(event.target.value)}
      placeholder="Digite uma mensagem..."
      maxLength={100}
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