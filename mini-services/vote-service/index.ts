// vote-service: Real-time election results socket.io mini-service
// Port: 3003 (hardcoded — used by Caddy gateway via ?XTransformPort=3003)
//
// Implementation notes:
//   With socket.io `path: "/"`, engine.io's `attach()` would intercept EVERY
//   HTTP request (because every URL starts with "/"), preventing our own
//   /internal/* endpoints from being reached. To work around this, we do NOT
//   let socket.io auto-attach to the httpServer. Instead we:
//     1. Create engine.io Server manually
//     2. Create socket.io Server (no httpServer) and `io.bind(engine)`
//     3. Use our own request handler that:
//          - serves /internal/* ourselves
//          - delegates everything else to `engine.handleRequest(req, res)`
//     4. Manually route "upgrade" events to `engine.handleUpgrade(...)`
//     5. Manually call `engine.init()` once the httpServer is listening so the
//        underlying WebSocket server (`this.ws`) is set up.
//
// Events emitted to clients:
//   - "results:update"  payload: ElectionResults
//   - "vote:cast"        payload: { candidateId, candidateName, candidatePhoto, candidateColor, totalVotes, timestamp, voterTokenMasked?, voterRole? }
//   - "voter:online"     payload: { count }
//
// Events received from clients:
//   - "subscribe:results"  (ack only — we already push on connect)
//
// Internal HTTP endpoints (must be reachable from localhost only):
//   - GET  /internal/health   → 200 { ok, uptime, clients }
//   - POST /internal/notify   → recomputes results, broadcasts to all clients,
//                               optionally emits "vote:cast" if candidate info provided

import { createServer, IncomingMessage, ServerResponse } from "http";
import { PrismaClient } from "@prisma/client";
import { Server as EngineIOServer } from "engine.io";
import { Server as SocketIOServer, Socket } from "socket.io";

// ----------------------------------------------------------------------------
// Types (mirrors src/lib/types.ts in the main app — DO NOT diverge)
// ----------------------------------------------------------------------------
interface CandidateResult {
  id: string;
  name: string;
  class: string;
  photo: string;
  color: string;
  order: number;
  voteCount: number;
  percentage: number; // 0-100 with one decimal
  isPair: boolean;
  partnerName: string;
  partnerClass: string;
  partnerPhoto: string;
}

interface ElectionResults {
  totalVoters: number;
  totalVotes: number;
  turnOut: number; // 0-100 with one decimal
  candidates: CandidateResult[];
  lastUpdated: string; // ISO string
}

interface VoteCastPayload {
  candidateId: string;
  candidateName: string;
  candidatePhoto: string;
  candidateColor: string;
  totalVotes: number;
  timestamp: string;
  voterTokenMasked?: string;
  voterRole?: string;
}

interface NotifyBody {
  candidateId?: string;
  candidateName?: string;
  candidatePhoto?: string;
  candidateColor?: string;
  voterTokenMasked?: string;
  voterRole?: string;
}

// ----------------------------------------------------------------------------
// Prisma client (separate instance for this mini-service)
// ----------------------------------------------------------------------------
const prisma = new PrismaClient({
  log: ["error", "warn"],
});

// ----------------------------------------------------------------------------
// Results computation — mirrors main app's computeResults() in src/lib/results.ts
// ----------------------------------------------------------------------------
async function computeResults(): Promise<ElectionResults> {
  const [candidates, voters, settings] = await Promise.all([
    prisma.candidate.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { _count: { select: { votes: true } } },
    }),
    prisma.voter.count(),
    prisma.settings.findUnique({ where: { id: "default" } }),
  ]);

  const totalVotes = candidates.reduce((s, c) => s + c._count.votes, 0);
  const totalVoters = settings?.totalVoters || voters;

  const candidateResults: CandidateResult[] = candidates.map((c) => ({
    id: c.id,
    name: c.name,
    class: c.class,
    photo: c.photo,
    color: c.color,
    order: c.order,
    voteCount: c._count.votes,
    percentage:
      totalVotes > 0
        ? Math.round((c._count.votes / totalVotes) * 1000) / 10
        : 0,
    isPair: c.isPair,
    partnerName: c.partnerName,
    partnerClass: c.partnerClass,
    partnerPhoto: c.partnerPhoto,
  }));

  return {
    totalVoters,
    totalVotes,
    turnOut:
      totalVoters > 0
        ? Math.round((totalVotes / totalVoters) * 1000) / 10
        : 0,
    candidates: candidateResults,
    lastUpdated: new Date().toISOString(),
  };
}

// ----------------------------------------------------------------------------
// Engine.io + Socket.io setup (manual attach — see notes at top of file)
// ----------------------------------------------------------------------------
const PORT = 3003;
const startedAt = Date.now();

const engine = new EngineIOServer({
  // DO NOT change the path — Caddy forwards ?XTransformPort=3003 to "/"
  path: "/",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const io = new SocketIOServer({
  path: "/",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  serveClient: false, // we don't serve socket.io.js (clients use the npm package)
});

// Bind socket.io's namespace/rooms logic to the engine.io connection events
io.bind(engine);

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

function broadcastOnlineCount() {
  io.emit("voter:online", { count: io.engine.clientsCount });
}

// ----------------------------------------------------------------------------
// Internal HTTP request handler
// ----------------------------------------------------------------------------
async function handleInternalRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const url = req.url || "";

  // CORS preflight for internal endpoints
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  // ---- GET /internal/health ----
  if (req.method === "GET" && url.startsWith("/internal/health")) {
    sendJson(res, 200, {
      ok: true,
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      clients: io.engine.clientsCount,
      service: "vote-service",
      port: PORT,
    });
    return;
  }

  // ---- POST /internal/notify ----
  if (req.method === "POST" && url.startsWith("/internal/notify")) {
    try {
      const raw = await readBody(req);
      let parsed: NotifyBody = {};
      if (raw.length > 0) {
        try {
          parsed = JSON.parse(raw.toString("utf8")) as NotifyBody;
        } catch {
          sendJson(res, 400, { ok: false, error: "Invalid JSON body" });
          return;
        }
      }

      // Recompute results from DB
      const results = await computeResults();

      // Broadcast fresh results to ALL connected web clients
      io.emit("results:update", results);

      // If candidate info provided, also broadcast a vote:cast event
      if (parsed.candidateId || parsed.candidateName) {
        const voteCast: VoteCastPayload = {
          candidateId: parsed.candidateId || "",
          candidateName: parsed.candidateName || "",
          candidatePhoto: parsed.candidatePhoto || "",
          candidateColor: parsed.candidateColor || "",
          totalVotes: results.totalVotes,
          timestamp: new Date().toISOString(),
          voterTokenMasked: parsed.voterTokenMasked,
          voterRole: parsed.voterRole,
        };
        io.emit("vote:cast", voteCast);
      }

      sendJson(res, 200, { ok: true, results });
      return;
    } catch (err) {
      console.error("[/internal/notify] error:", err);
      sendJson(res, 500, {
        ok: false,
        error: err instanceof Error ? err.message : "Internal error",
      });
      return;
    }
  }

  // Unknown internal route
  sendJson(res, 404, { ok: false, error: "Not found" });
}

// ----------------------------------------------------------------------------
// HTTP server with manual routing
// ----------------------------------------------------------------------------
const httpServer = createServer(async (req, res) => {
  const url = req.url || "";

  // Only intercept /internal/* — let everything else fall through to engine.io
  if (url.startsWith("/internal/")) {
    try {
      await handleInternalRequest(req, res);
    } catch (err) {
      console.error("[http] unhandled error in internal route:", err);
      if (!res.headersSent) {
        sendJson(res, 500, { ok: false, error: "Internal server error" });
      }
    }
    return;
  }

  // Delegate everything else to engine.io (handles /socket.io/* polling & /)
  engine.handleRequest(req, res);
});

// Manually route WebSocket upgrade requests to engine.io
httpServer.on("upgrade", (req, socket, head) => {
  // We could also intercept /internal/* upgrades here, but we don't need any.
  engine.handleUpgrade(req, socket, head);
});

// ----------------------------------------------------------------------------
// Socket.io connection handler
// ----------------------------------------------------------------------------
io.on("connection", async (socket: Socket) => {
  console.log(`[socket] client connected: ${socket.id}`);

  // Immediately push current results to the new client (fresh DB query)
  try {
    const results = await computeResults();
    socket.emit("results:update", results);
  } catch (err) {
    console.error("[socket] initial results push failed:", err);
  }

  // Ack-only subscription event (we already push on connect and on notify)
  socket.on("subscribe:results", (_payload: unknown, ack?: (res: unknown) => void) => {
    console.log(`[socket] ${socket.id} subscribed to results`);
    if (typeof ack === "function") {
      ack({ ok: true, message: "subscribed" });
    }
  });

  // Broadcast updated online viewer count to everyone
  broadcastOnlineCount();

  socket.on("disconnect", (reason: string) => {
    console.log(`[socket] client disconnected: ${socket.id} (${reason})`);
    broadcastOnlineCount();
  });

  socket.on("error", (err: unknown) => {
    console.error(`[socket] error on ${socket.id}:`, err);
  });
});

// ----------------------------------------------------------------------------
// Start the server
// ----------------------------------------------------------------------------
httpServer.listen(PORT, () => {
  // engine.io's `init()` is normally called when the httpServer emits
  // "listening" — but only if engine was attached via `engine.attach(srv)`.
  // Since we manually route, we have to call init() ourselves so the
  // underlying WebSocket.Server (`this.ws`) gets created.
  engine.init();

  console.log(`[vote-service] socket.io + http server listening on port ${PORT}`);
  console.log(`[vote-service] socket.io path: "/"  (Caddy will forward ?XTransformPort=3003)`);
  console.log(`[vote-service] internal HTTP endpoints:`);
  console.log(`[vote-service]   GET  /internal/health`);
  console.log(`[vote-service]   POST /internal/notify`);
});

// ----------------------------------------------------------------------------
// Graceful shutdown
// ----------------------------------------------------------------------------
async function shutdown(signal: string) {
  console.log(`[vote-service] received ${signal}, shutting down...`);
  io.close();
  engine.close();
  httpServer.close(() => {
    prisma
      .$disconnect()
      .then(() => {
        console.log("[vote-service] closed");
        process.exit(0);
      })
      .catch((err) => {
        console.error("[vote-service] error during disconnect:", err);
        process.exit(1);
      });
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("[vote-service] unhandledRejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[vote-service] uncaughtException:", err);
});
