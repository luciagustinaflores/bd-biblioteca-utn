import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config()

const URI_DB = process.env.URI_DB || "mongodb://localhost:27017"
const connectDb = async (URI: string) => {
    try {
        await mongoose.connect (URI)
    } catch (e) {
        console.log("Error al conectar con MongoDB")
    }
}
connectDb(URI_DB) 

const args = process.argv.splice(2)
const action = args[0]

const generateError = (message: string, name: string) => {
  const error = new Error(message)
  error.name = name
  return error
}

const handleError = (error: Error) => {
  if (error.name === "CastError") {
    return "Invalid ID"
  }

  return error.message
}


interface IBooks {
  title: string
  author: string
  price: number
  stock: number
  category: string
}

const bookSchema = new mongoose.Schema<IBooks>({
  title: String,
  author: String,
  price: Number,
  stock: Number,
  category: String
})

const Book = mongoose.model("book", bookSchema)

const createBook = async (data: string[]) => {
    try {
    
        const newBook: IBooks = {
        title: "",
        author: "Desconocido",
        price: 0,
        stock: 0,
        category: "Sin categoría"
        }
    
        const isKeyValueFormat = data[0].includes("=")
        if (isKeyValueFormat) {
            for (let i = 0; i < data.length; i++) {
                const [prop, value] = data[i]?.split("=") as string[]

                switch (prop) {
                        case "title":
                        newBook.title = value
                        break
                        case "author":
                        newBook.author = value ? value : newBook.author
                        break
                        case "price":
                        newBook.price = value ? Number(value) : newBook.price
                        break
                        case "stock":
                        newBook.stock = value ? Number(value) : newBook.stock
                        break
                        case "category":
                        newBook.category = value ? value : newBook.category
                        break
                        default:
                        throw generateError("Propiedad no válida para el libro", "InvalidData")
                    }
            }
        } else {
            const [title, author, price, stock, category] = data

            newBook.title = title || ""
            newBook.author = author || newBook.author
            newBook.price = price ? Number(price) : newBook.price
            newBook.stock = stock ? Number(stock) : newBook.stock
            newBook.category = category || newBook.category
        }

        if (!newBook.title) {
            throw generateError("Title needed", "TitleNeeded")
        }

        return await Book.create(newBook)

    } catch (error) {
        const e = error as Error
        return handleError(e)
    }
}

const readBook = async (id: string | undefined) => {
    try {
        if (!id){ return await Book.find({}, {title: 1, _id: 1})}

        const foundBook = await Book.findById(id)

        if (!foundBook) throw generateError("Item not found", "ItemNotFound")

        return foundBook

    } catch (error) {
        const e = error as Error
        return handleError(e)
    }
}

const updateBook = async (id: string | undefined, updates: string[]) => {
    try {
        const data: Partial<IBooks> = {}
        for (const update of updates) {
            const [prop, value] = update.split("=")
            if (!value) {throw generateError('Invalid data for ${prop}', "InvalidDataForProp")}
            switch (prop) {
                case "title":
                    data.title = value
                    break
                case "author":
                    data.author = value
                    break
                case "price":
                    data.price = +value
                    break
                case "stock":
                    data.stock = +value
                    break
                case "category":
                    data.category = value
                    break
                default:
                    throw generateError("Invalid data to update book", "InvalidDataForUpdate")
            }
        }

        return await Book.findByIdAndUpdate(id, data, {new: true})
    } catch (error) {
        const e = error as Error
        return handleError(e) }
}

const deleteBook = async (id: string | undefined) => {
    try {
        if (!id) {
            return "Please insert a valid id"
        }

        const deletedBook = await Book.findByIdAndDelete(id) 

        if (!deletedBook) throw generateError("Product not found", "ProductNotFound")
        
        return deletedBook
    } catch (error) {
        const e = error as Error
        return handleError(e) }
}

const main = async () => {
    connectDb (URI_DB)

    switch (action) {
        case "info":
            console.log(`
        create data → para crear la ficha de un libro
        read → para leer los libros (título + id)
        read + id → para leer info completa de un libro
        update id data → para actualizar un libro
        delete id → para borrar un libro
      `)
        break 
        case "create":
            console.log(await createBook(args.splice(1)))
            break
        case "read":
            console.log(await readBook(args[1]))
            break
        case "update": 
            console.log (await updateBook(args[1], args.slice(2)))
            break
        case "delete":
            console.log(await deleteBook(args[1]))
            break
    }

  await mongoose.disconnect()
}

main()
