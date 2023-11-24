import pg from "pg";
import dotenv from 'dotenv'

dotenv.config()

const connectionData = {
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  port: process.env.PG_PORT,
  password: process.env.PG_PASSWORD
}


const tipusInterval = {
  '5_min': {
    dateTrunc: 'minute',
    interval: '1 minute',
    residu: '5'
  },
  '1_min': {
    dateTrunc: 'minute',
    interval: '1 minute',
    residu: '1'
  },
  '10_min': {
    dateTrunc: 'minute',
    interval: '1 minute',
    residu: '10'
  },
  '30_min': {
    dateTrunc: 'minute',
    interval: '1 minute',
    residu: '30'
  },
  '1_h': {
    dateTrunc: 'hour',
    interval: '1 hour',
    residu: '1'
  },
  '1_day': {
    dateTrunc: 'day',
    interval: '1 day',
    residu: '1'
  },
  '1_month': {
    dateTrunc: 'month',
    interval: '1 month',
    residu: '1'
  }
}

const tipusZona = {
  'exterior': 'sensors_data_exterior',
  'interior': 'sensors_data'
}


export const getDataHoraria = async (variable, zona, dia) => {
  try {
    console.log('intento entrar')
    const data = new Date(dia)
    data.setUTCHours(0)
    const diaParsed = data.toISOString()
    const zonaSensor = tipusZona[zona]
    const client = new pg.Client(connectionData)
    await client.connect()

    const query = await client.query(
      `
      SELECT
        date_trunc('hour', captura_data AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Madrid' AS interval_temps,
        AVG(${variable}) AS data
      FROM sensors_data
      WHERE captura_data > ($1::timestamp + interval '1 hour') AT TIME ZONE 'Europe/Madrid'
          AND captura_data < ($1 + interval '1 day')::timestamp AT TIME ZONE 'Europe/Madrid'
      GROUP BY interval_temps
      ORDER BY interval_temps;

      `,
      [diaParsed]
    )
    
    await client.end()
    return query.rows
    
    
  } catch (error) {
    console.log('entro al error')
    console.log(error)
    return error
  }
}


export const getLiveData = async (variable, zona) => {
  try {
    const zonaSensor = tipusZona[zona]
    const client = new pg.Client(connectionData)
    await client.connect()
    const { rows } = await client.query(
      `
        SELECT id, ${variable} AS data FROM sensors_data ORDER BY id DESC LIMIT 1
      `,
      []
    )
    await client.end()
    return rows
  } catch (error) {
    console.log(error)
    return error
  }
}

export const getData = async (variable, zona, diaInici, diaFinal, interval) => {
  try {
    const zonaSensor = tipusZona[zona]
    const intervalBo = tipusInterval[interval]

    if (!intervalBo) {
      return new Error('Valors introduits erronis')
    }
    
    const client = new pg.Client(connectionData)
    await client.connect()

    const query = await client.query(
      `
      SELECT
        date_trunc('${intervalBo.dateTrunc}', timeseries) AS interval_temps,
        AVG(${variable}) AS data
      FROM (
        SELECT
          captura_data,
          date_trunc('${intervalBo.dateTrunc}', captura_data) - 
          (date_part('${intervalBo.dateTrunc}', captura_data)::integer % ${intervalBo.residu}) * interval '${intervalBo.interval}' AS timeseries,
          ${variable}
        FROM ${zonaSensor}
        WHERE captura_data >= $1::timestamp AT TIME ZONE 'Europe/Madrid'
            AND captura_data < $2::timestamp AT TIME ZONE 'Europe/Madrid'
      ) subquery
      GROUP BY timeseries
      ORDER BY timeseries;

      `,
      [diaInici, diaFinal]
    )
    await client.end()
    return query.rows
    
    
  } catch (error) {
    console.log(error)
    return error
  }
}