import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { getDataHoraria, getLiveData, getData } from './db.js'
import dotenv from 'dotenv'

dotenv.config()
const app = express()

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.URL_FRONTEND)
  //Permet donar accés a només peticions procedents de la url de l'aplicació web
  next() //next permet passar al següent middleware d'express
})
app.use(cors())
app.use(helmet())



app.get('/getData/:variable/:diaInici/:diaFinal/:interval/:zona', async (req, res, next) => {
  /*
    Les rutes imbricades amb ":" volen dir que poden obtenir qualssevol valor
    degut que en comptes de /getData/variable, serà /getData/temperatura ó /getData/humitat
  */
  const { variable, diaInici, diaFinal, interval, zona } = req.params
  const data = await getData(variable, zona, diaInici, diaFinal, interval)
  res.send(data)

})

app.get('/getDataHoraria/:variable/:dia/:zona', async (req, res, next) => {
  const { variable, dia, zona } = req.params

  const data = await getDataHoraria(variable, zona, dia)

  res.send(data) 
})


app.get('/getLiveData/:variable/:zona', async (req, res, next) => {
  console.log('hola')
  const { variable, zona } = req.params
  const data = await getLiveData(variable, zona) 
  res.send(data)
})


app.listen(process.env.API_PORT, () => {
  console.log('escoltant al port: ', process.env.API_PORT)
})