const axios = require('axios')
const inserts = require('../getDBinfo/inserts.js')
const concept = require('../getDBinfo/getConcept')
const api = require('./fitbitApi')

// Mocks
jest.mock('axios')
jest.mock('../getDBinfo/inserts')
jest.mock('../getDBinfo/getConcept')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getStepsAndSave', () => {
  it('debe insertar un solo registro de pasos cuando Fitbit devuelve datos', async () => {
    // 1) preparamos el mock de la API
    axios.get.mockResolvedValue({
      data: { 'activities-steps': [ { dateTime: '2018-12-26', value: '2504' } ] }
    })
    
    // 2) preparamos el mock de los conceptos
    inserts.insertObservation.mockResolvedValue(42);
    concept.getConceptInfoObservation.mockResolvedValue({ concept_id: 1, concept_name: 'steps' })

    // 3) llamamos a la función bajo test
    const result = await api.getStepsAndSave('USER_1','TOKEN_X','2018-12-26');

    // 4) comprobamos que se ha llamado a insertObservation con el objeto correcto

    expect(inserts.insertObservation).toHaveBeenCalled();
    expect(result).toBe(true);

  })
})

describe('getHeartRateAndSave', () => {
  it('debe insertar cada punto intradía y devolver el array de timestamps exitosos', async () => {
    // 1) simulamos la respuesta intradía de la API
    axios.get.mockResolvedValue({
      data: {
        'activities-heart': [ { dateTime:'2019-05-08', value: { restingHeartRate:76 } } ],
        'activities-heart-intraday': {
          dataset: [
            { time:'00:00:00', value:78 },
            { time:'00:01:00', value:81 }
          ]
        }
      }
    })
    // 2) conceptos de HR
    concept.getConceptInfoObservation.mockResolvedValue({ concept_id: 10, concept_name: 'heart_rate' })
    concept.getConceptUnit.mockResolvedValue({ concept_id: 20, concept_name: 'bpm' })

    // 3) ejecutamos
    const result = await api.getHeartRateAndSave('USER_2', 'TOKEN_Y', '2019-05-08')

    // 4) verificamos inserciones y retorno
    expect(inserts.insertObservation).toHaveBeenCalledTimes(2)
    expect(result.successfulDates).toEqual([
      '2019-05-08T00:00:00',
      '2019-05-08T00:01:00'
    ])
    expect(result.failedDates).toEqual([])
  })
})