import express from "express";
import * as dotenv from  "dotenv";
import cors from "cors";
import mongoose from "mongoose";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({limit: "50mb"}));
app.use(express.urlencoded({extended: true}));

app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || "Something went wrong";
    return res.status(status).json({
        success: false,
        status,
        message,
    });
});

app.get("/", (req, res) => {
    res.status(200).json({message: "Hello Abubeker!"});
})

const connectDB = async () => {
    
        mongoose.set("strictQuery", true);
         mongoose
         .connect(process.env.MONGODB_URL)
         .then((res) => console.log("Connected to MongoDB"))
         .catch((error) => {
        console.log("Error connecting to MongoDB", error);
         });
};

const startServer = async () => {
    try {
        connectDB();
        app.listen(8000, () => {
            console.log("Server started on port 8000");
        })
    } catch (error) {
        console.log("Error connecting to MongoDB", error);
    }
}

startServer();