import { createTypeormConnection } from '../../lib/database/createTypeormConnection'
import configuration from '../../configuration'
import Balance from '../../entities/Balance'
import Transfer from '../../entities/Transfer'

let isDBPrepared = false
export async function prepareDB () {
  if (configuration.nodeEnv !== 'test') throw new Error('You can drop db on test mode only')

  if (!isDBPrepared) {
    isDBPrepared = true
    return createTypeormConnection()
  }
}

export async function deleteAllDataFromDB () {
  if (configuration.nodeEnv !== 'test') throw new Error('You can drop db on test mode only')
  await Balance.delete({})
  await Transfer.delete({})
}
