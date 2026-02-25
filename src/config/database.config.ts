import "reflect-metadata"
import { DataSource } from "typeorm"
import { fileURLToPath } from "url"
import path from "path"
import { Config } from "./config"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const AppDataSource = new DataSource({
  type: "postgres",
  host: Config.DB_HOST,
  port: Number(Config.DB_PORT),
  username: Config.DB_USERNAME,
  password: Config.DB_PASSWORD,
  database: Config.DB_NAME,
  entities: [path.join(__dirname, "../entities/**/*.entity.{ts,js}")],
  migrations: [path.join(__dirname, "../migrations/**/*.{ts,js}")],
  synchronize: false,
  logging: ["error"],
})
