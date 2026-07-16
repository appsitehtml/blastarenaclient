import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import Game from "./Game";
import "./App.css";

const socket = io(
  "https://blastarena-server.onrender.com"
);

function App() {
  const [roomCode, setRoomCode] =
    useState("");

  const [inputCode, setInputCode] =
    useState("");

  const [room, setRoom] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [playerName, setPlayerName] =
    useState("");

  const [mapTheme, setMapTheme] =
    useState("random");

  const [playerSkin, setPlayerSkin] =
    useState("stickman");

  const [gameMode, setGameMode] =
    useState("classic");

  const myPlayer = useMemo(() => {
    return (
      room?.players?.find(player => {
        return player.id === socket.id;
      }) || null
    );
  }, [room]);

  useEffect(() => {
    function handleRoomCreated(code) {
      setRoomCode(code);
      setMessage(
        "Sala criada com sucesso."
      );
    }

    function handleJoinedRoom(code) {
      setRoomCode(code);
      setMessage(
        "Você entrou na sala."
      );
    }

    function handleRoomState(state) {
      setRoom(state);
      setRoomCode(state.code);
    }

    function handleErrorMessage(text) {
      setMessage(text);
    }

    socket.on(
      "roomCreated",
      handleRoomCreated
    );

    socket.on(
      "joinedRoom",
      handleJoinedRoom
    );

    socket.on(
      "roomState",
      handleRoomState
    );

    socket.on(
      "errorMessage",
      handleErrorMessage
    );

    return () => {
      socket.off(
        "roomCreated",
        handleRoomCreated
      );

      socket.off(
        "joinedRoom",
        handleJoinedRoom
      );

      socket.off(
        "roomState",
        handleRoomState
      );

      socket.off(
        "errorMessage",
        handleErrorMessage
      );
    };
  }, []);

  function createRoom(mode) {
    const name =
      playerName.trim();

    if (!name) {
      setMessage(
        "Digite seu nome."
      );

      return;
    }

    setMessage("");

    socket.emit("createRoom", {
      mode,
      gameMode,
      mapTheme,
      playerName: name,
      playerSkin
    });
  }

  function joinRoom() {
    const code =
      inputCode
        .trim()
        .toUpperCase();

    const name =
      playerName.trim();

    if (!name) {
      setMessage(
        "Digite seu nome."
      );

      return;
    }

    if (!code) {
      setMessage(
        "Digite o código da sala."
      );

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

  async function copyRoomCode() {
    try {
      await navigator.clipboard.writeText(
        roomCode
      );

      setMessage(
        "Código copiado com sucesso."
      );
    } catch {
      setMessage(
        `Código da sala: ${roomCode}`
      );
    }
  }

  function getMapName(theme) {
    if (theme === "forest") {
      return "🌲 Floresta";
    }

    if (theme === "ice") {
      return "❄️ Gelo";
    }

    if (theme === "lava") {
      return "🌋 Lava";
    }

    return "🏭 Clássico";
  }

  function getGameModeName(mode) {
    if (mode === "paintball") {
      return "🎯 Duelo Paintball";
    }

    return "💣 Blast Arena";
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

  const humanPlayers =
    room?.players?.filter(player => {
      return !player.isBot;
    }) || [];

  const humanCount =
    humanPlayers.length;

  return (
    <main className="app">
      <section className="menu">
        <h1>Blast Arena</h1>

        <p>
          Crie uma sala e jogue com
          seu amigo.
        </p>

        {!roomCode && (
          <>
            <div className="modeSelector">
              <label htmlFor="gameMode">
                Modo de jogo
              </label>

              <select
                id="gameMode"
                value={gameMode}
                onChange={event => {
                  setGameMode(
                    event.target.value
                  );
                }}
              >
                <option value="classic">
                  💣 Blast Arena
                </option>

                <option value="paintball">
                  🎯 Duelo Paintball
                </option>
              </select>
            </div>

            {gameMode === "paintball" && (
              <div className="paintModeInfo">
                <strong>
                  Duelo Paintball
                </strong>

                <span>
                  5 vidas • 10 tiros •
                  Espaço atira • R recarrega
                </span>
              </div>
            )}

            <div className="mapSelector">
              <label htmlFor="mapTheme">
                Mapa
              </label>

              <select
                id="mapTheme"
                value={mapTheme}
                onChange={event => {
                  setMapTheme(
                    event.target.value
                  );
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

                <option value="lava">
                  🌋 Lava
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

                <option value="superSaiyan">
                  ⚡ Super Saiyajin
                </option>

                <option value="itadori">
                  👊 Itadori
                </option>

                <option value="gojo">
                  👁️ Satoru Gojo
                </option>

                <option value="naruto">
                  🍥 Naruto
                </option>

                <option value="rick">
                  🧪 Rick
                </option>

                <option value="morty">
                  😰 Morty
                </option>

                <option value="pickleRick">
                  🥒 Pickle Rick
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
                autoComplete="off"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                createRoom("1v1");
              }}
            >
              {gameMode === "paintball"
                ? "Criar duelo Paintball"
                : "Criar sala 1x1"}
            </button>

            {gameMode === "classic" && (
              <button
                type="button"
                className="secondaryButton"
                onClick={() => {
                  createRoom("duoBots");
                }}
              >
                Criar sala 2 jogadores
                vs 2 bots
              </button>
            )}

            <div className="joinBox">
              <input
                type="text"
                value={inputCode}
                onChange={event => {
                  setInputCode(
                    event.target.value
                  );
                }}
                placeholder="Código da sala"
                maxLength={4}
                autoComplete="off"
              />

              <button
                type="button"
                onClick={joinRoom}
              >
                Entrar
              </button>
            </div>
          </>
        )}

        {roomCode && (
          <div className="roomBox">
            <h2>
              Sala {roomCode}
            </h2>

            <div className="roomCodeBox">
              <span>
                Código da sala
              </span>

              <strong>
                {roomCode}
              </strong>

              <button
                type="button"
                onClick={copyRoomCode}
              >
                Copiar código
              </button>
            </div>

            {!room ? (
              <p>
                Carregando dados da
                sala...
              </p>
            ) : (
              <>
                <p>
                  Jogo:{" "}
                  {getGameModeName(
                    room.gameMode
                  )}
                </p>

                <p>
                  Mapa:{" "}
                  {getMapName(
                    room.mapTheme
                  )}
                </p>

                <p>
                  Modalidade:{" "}
                  {room.mode ===
                  "duoBots"
                    ? "2 jogadores vs 2 bots"
                    : "1x1"}
                </p>

                <p>
                  Jogadores:{" "}
                  {humanCount}/2
                </p>

                <div className="playersList">
                  {room.players.map(
                    player => (
                      <div
                        key={player.id}
                      >
                        <span>
                          {player.name}
                        </span>

                        <small>
                          {" "}
                          —{" "}
                          {player.isBot
                            ? "Bot"
                            : `Jogador ${player.number}`}
                        </small>
                      </div>
                    )
                  )}
                </div>

                {humanCount < 2 ? (
                  <p>
                    Envie o código para
                    seu amigo entrar.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={startGame}
                  >
                    {room.gameMode ===
                    "paintball"
                      ? "Iniciar duelo Paintball"
                      : "Iniciar jogo"}
                  </button>
                )}
              </>
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