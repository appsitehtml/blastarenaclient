import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import Game from "./Game";
import "./App.css";

const socket = io("https://blastarena-server.onrender.com");

function App() {
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [room, setRoom] = useState(null);
  const [message, setMessage] = useState("");

  const myPlayer = useMemo(() => {
    return room?.players?.find(player => player.id === socket.id) || null;
  }, [room]);

  useEffect(() => {
    socket.on("roomCreated", code => {
      setRoomCode(code);
      setMessage("Sala criada com sucesso.");
    });

    socket.on("joinedRoom", code => {
      setRoomCode(code);
      setMessage("Você entrou na sala.");
    });

    socket.on("roomState", state => {
      setRoom(state);
      setRoomCode(state.code);
    });

    socket.on("errorMessage", msg => setMessage(msg));

    return () => {
      socket.off("roomCreated");
      socket.off("joinedRoom");
      socket.off("roomState");
      socket.off("errorMessage");
    };
  }, []);

  function createRoom(mode) {
    setMessage("");
    socket.emit("createRoom", mode);
  }

  function joinRoom() {
    const code = inputCode.trim().toUpperCase();
    if (!code) return setMessage("Digite o código da sala.");
    setMessage("");
    socket.emit("joinRoom", code);
  }

  function startGame() {
    socket.emit("startGame");
  }

  if (room?.started) {
    return <Game socket={socket} room={room} myPlayer={myPlayer} />;
  }

  return (
    <main className="app">
      <section className="menu">
        <h1>Blast Arena</h1>
        <p>Crie uma sala e jogue com seu amigo.</p>

        {!roomCode && (
          <>
            <button onClick={() => createRoom("1v1")}>Criar sala 1x1</button>
            <button className="secondaryButton" onClick={() => createRoom("duoBots")}>Criar sala 2 jogadores vs 2 bots</button>

            <div className="joinBox">
              <input
                value={inputCode}
                onChange={e => setInputCode(e.target.value)}
                placeholder="Código da sala"
                maxLength={4}
              />
              <button onClick={joinRoom}>Entrar</button>
            </div>
          </>
        )}

        {roomCode && room && (
          <div className="roomBox">
            <h2>Sala {roomCode}</h2>
            <p>Modo: {room.mode === "duoBots" ? "2 jogadores vs 2 bots" : "1x1"}</p>
            <p>Jogadores: {room.players.filter(p => !p.isBot).length}/2</p>

            <div className="playersList">
              {room.players.map(player => (
                <div key={player.id}>{player.name}</div>
              ))}
            </div>

            {room.players.filter(p => !p.isBot).length < 2 ? (
              <p>Envie o código para seu amigo entrar.</p>
            ) : (
              <button onClick={startGame}>Iniciar jogo</button>
            )}
          </div>
        )}

        {message && <p className="message">{message}</p>}
      </section>
    </main>
  );
}

export default App;
