import {connect} from "mongoose"
import dotenv from "dotenv"
dotenv.config()

const URI_DB = process.env.URI_DB || "mongodb://localhost:27017"
const connectDb = async (URI: string) => {
    try {
        await connect (URI)
        console.log("Conectado con éxito a MongoDB")
    } catch (e) {
        console.log("Error al conectar con MongoDB")
    }
}
connectDb(URI_DB) 

