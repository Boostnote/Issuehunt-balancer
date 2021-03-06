import { Transaction, TransactionManager, EntityManager } from 'typeorm'
import { Controller, Get, Post, Body, Param, NotFoundError } from 'routing-controllers'
import Transfer from '../entities/Transfer'
import Balance from '../entities/Balance'
import Joi from 'joi'
import ValidationError from '../lib/errors/ValidationError'
import {
  TransferCreateBody,
  transferCreateBodySchema
} from '../schemas/transfers'

@Controller()
class TransferController {
  @Get('/transfers')
  async list () {
    const transfers = await Transfer.find()

    return {
      transfers
    }
  }

  @Get('/transfers/:transferId')
  async show (@Param('transferId') transferId: string) {
    const transfer = await Transfer.findOne({
      where: {
        id: transferId
      }
    })

    if (transfer == null) throw new NotFoundError('The transfer does not exist.')

    return {
      transfer
    }
  }

  @Post('/transfers')
  @Transaction()
  async create (@TransactionManager() manager: EntityManager, @Body() body: TransferCreateBody): Promise<any> {
    const { error, value } = Joi.validate(body, transferCreateBodySchema)
    if (error != null) throw new ValidationError()
    const {
      senderUniqueName,
      receiverUniqueName,
      amount,
      note
    } = value

    const senderBalance = await Balance.findOne({
      where: {
        uniqueName: senderUniqueName
      }
    })
    if (senderBalance == null) throw new ValidationError('The sender does not exist.')
    let receiverBalance = await Balance.findOne({
      where: {
        uniqueName: receiverUniqueName
      }
    })
    if (receiverBalance == null) {
      receiverBalance = await Balance.create({
        uniqueName: receiverUniqueName,
        amount: '0'
      })
      await receiverBalance.save()
    }

    try {
      await senderBalance.decreaseAmount(amount)
      await receiverBalance.increaseAmount(amount)
    } catch (error) {
      if (error.name === 'BalanceError') throw new ValidationError(error.message)
      else throw error
    }

    const transfer = await Transfer
      .create({
        senderId: senderBalance.id,
        receiverId: receiverBalance.id,
        amount,
        note
      })
      .save()

    return {
      transfer
    }
  }
}

export default TransferController
