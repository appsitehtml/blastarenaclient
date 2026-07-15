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
  const [playerName, setPlayerName] = useState("");
  const [mapTheme, setMapTheme] = useState("random");
  const [playerSkin, setPlayerSkin] = useState("stickman");

  const myPlayer = useMemo(() => {
    return (
      room?.players?.find(
        player => player.id === socket.id
      ) || null
    );
  }, [room]);

  useEffect(() => {
    function handleRoomCreated(code) {
      setRoomCode(code);
      setMessage("Sala criada com sucesso.");
    }

    function handleJoinedRoom(code) {
      setRoomCode(code);
      setMessage("Você entrou na sala.");
    }

    function handleRoomState(state) {
      setRoom(state);
      setRoomCode(state.code);
    }

    function handleErrorMessage(msg) {
      setMessage(msg);
    }

    socket.on("roomCreated", handleRoomCreated);
    socket.on("joinedRoom", handleJoinedRoom);
    socket.on("roomState", handleRoomState);
    socket.on("errorMessage", handleErrorMessage);

    return () => {
      socket.off("roomCreated", handleRoomCreated);
      socket.off("joinedRoom", handleJoinedRoom);
      socket.off("roomState", handleRoomState);
      socket.off("errorMessage", handleErrorMessage);
    };
  }, []);

  function createRoom(mode) {
    const name = playerName.trim();

    if (!name) {
      setMessage("Digite seu nome.");
      return;
    }

    setMessage("");

    socket.emit("createRoom", {
      mode,
      mapTheme,
      playerName: name,
      playerSkin
    });
  }

  function joinRoom() {
    const code = inputCode.trim().toUpperCase();
    const name = playerName.trim();

    if (!name) {
      setMessage("Digite seu nome.");
      return;
    }

    if (!code) {
      setMessage("Digite o código da sala.");
      return;
    }

    setMessage("");

    socket.emit("joinRoom", {
      code,
      playerName: name,
      playerSkin
    });
  }

  function startGame() {
    socket.emit("startGame");
  }

  if (room?.started) {
    return (
      <Game
        socket={socket}
        room={room}
        myPlayer={myPlayer}
      />
    );
  }

  return (
    <main className="app">
      <section className="menu">
        <h1>Blast Arena</h1>

        <p>
          Crie uma sala e jogue com seu amigo.
        </p>

        {!roomCode && (
          <>
            <div className="mapSelector">
              <label htmlFor="mapTheme">
                Mapa
              </label>

              <select
                id="mapTheme"
                value={mapTheme}
                onChange={event => {
                  setMapTheme(event.target.value);
                }}
              >
                <option value="random">
                  🎲 Aleatório
                </option>

                <option value="classic">
                  🏭 Clássico
                </option>

                <option value="forest">
                  🌲 Floresta
                </option>

                <option value="ice">
                  ❄️ Gelo
                </option>
              </select>
            </div>

            <div className="skinSelector">
              <label htmlFor="playerSkin">
                Personagem
              </label>

              <select
                id="playerSkin"
                value={playerSkin}
                onChange={event => {
                  setPlayerSkin(
                    event.target.value
                  );
                }}
              >
                <option value="stickman">
                  Boneco clássico
                </option>

                <option value="ninja">
                  🥷 Ninja
                </option>

                <option value="iceMonster">
                  👹 Monstro do gelo
                </option>

                <option value="bear">
                  🐻 Urso
                </option>
              </select>
            </div>

            <div className="nameBox">
              <input
                type="text"
                value={playerName}
                onChange={event => {
                  setPlayerName(
                    event.target.value
                  );
                }}
                placeholder="Seu nome"
                maxLength={15}
              />
            </div>

            <button
              onClick={() => createRoom("1v1")}
            >
              Criar sala 1x1
            </button>

            <button
              className="secondaryButton"
              onClick={() =>
                createRoom("duoBots")
              }
            >
              Criar sala 2 jogadores vs 2 bots
            </button>

            <div className="joinBox">
              <input
                value={inputCode}
                onChange={event => {
                  setInputCode(
                    event.target.value
                  );
                }}
                placeholder="Código da sala"
                maxLength={4}
              />

              <button onClick={joinRoom}>
                Entrar
              </button>
            </div>
          </>
        )}

        {roomCode && room && (
          <div className="roomBox">
            <p>
              Mapa:{" "}
              {room.mapTheme === "forest"
                ? "🌲 Floresta"
                : room.mapTheme === "ice"
                  ? "❄️ Gelo"
                  : "🏭 Clássico"}
            </p>

            <h2>Sala {roomCode}</h2>

            <p>
              Modo:{" "}
              {room.mode === "duoBots"
                ? "2 jogadores vs 2 bots"
                : "1x1"}
            </p>

            <p>
              Jogadores:{" "}
              {
                room.players.filter(
                  player => !player.isBot
                ).length
              }
              /2
            </p>

            <div className="playersList">
              {room.players.map(player => (
                <div key={player.id}>
                  {player.name}
                </div>
              ))}
            </div>

            {room.players.filter(
              player => !player.isBot
            ).length < 2 ? (
              <p>
                Envie o código para seu amigo
                entrar.
              </p>
            ) : (
              <button onClick={startGame}>
                Iniciar jogo
              </button>
            )}
          </div>
        )}

        {message && (
          <p className="message">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}

export default App;