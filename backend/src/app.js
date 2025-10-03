import dotenv from "dotenv";
dotenv.config();
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import compression from "compression";
import morgan from "morgan";
import createError from "http-errors";
import indexRoutes from "./routes/index.routes.js";
const app = express();

// Security middleware
app.use(helmet()); // protects headers
// Cors 
const whitelist = ['http://localhost:3005']
const corsOptionsDelegate = function (req, callback) {
    var corsOptions;
    if (whitelist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
    } else {
        corsOptions = { origin: false } // disable CORS for this request
    }
    callback(null, corsOptions) // callback expects two parameters: error and options
}
app.use(cors(corsOptionsDelegate));
app.use(compression());
app.use(morgan("common"))
// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parser với security
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Routes
app.use("/", indexRoutes); //test routes


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
});

app.use((req, res, next) => {
    next(createError(404, "Not Found"));
});
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json({
        status: "error",
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // 
    })
})

export default app;