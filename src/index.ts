import express, { Express } from "express";
import Websocket, { WebSocketServer } from "ws"
import AuthRouter from "./routes/auth.js";
import ClassRouter from "./routes/class.js";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/auth", AuthRouter);
app.use("/class", ClassRouter);

app.get("/", (req, res) => {
    res.json({
        msg: "Health Check! Server running fine"
    })
})

const PORT = 3000

const httpServer = app.listen(PORT, () => {
    console.log(`Backend running on PORT ${PORT}`);
})

const wss = new WebSocketServer({server: httpServer});

console.log(`Websocket server running on PORT ${PORT}`)

wss.on('connection', function connection(ws) {
    console.log("Connected to websocket server");
})