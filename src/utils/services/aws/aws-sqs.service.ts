import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SendMessageCommandInput,
  SQS,
} from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ENV_KEYS } from '../../config/config.module';
import { InternalServerErrorException } from '../../exceptions/internal-server-error.exception';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class SQSService {
  private readonly fileName = SQSService.name;
  private readonly sqsClient: SQS;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    const awsSQSAccessKey = this.configService.getOrThrow<string>(
      ENV_KEYS.AWS_ACCESS_KEY,
    );
    const awsSQSSecretKey = this.configService.getOrThrow<string>(
      ENV_KEYS.AWS_SECRET_KEY,
    );
    const awsRegion = this.configService.getOrThrow<string>(
      ENV_KEYS.AWS_REGION,
    );

    this.sqsClient = new SQS({
      region: awsRegion,
      credentials: {
        accessKeyId: awsSQSAccessKey,
        secretAccessKey: awsSQSSecretKey,
      },
    });
  }

  /**
   * Send a message to an SQS queue.
   * @param params - The parameters for the SendMessageCommand.
   * @returns The result of the SendMessageCommand.
   * @throws InternalServerErrorException if there is an error sending the message.
   */
  async sendMessage(params: SendMessageCommandInput) {
    try {
      const command = new SendMessageCommand(params);

      const result = await this.sqsClient.send(command);
      return result;
    } catch (error) {
      this.logger.error(
        this.fileName,
        this.sendMessage.name,
        'Error sending message to SQS',
        error,
      );
      throw new InternalServerErrorException(`Error in sendMessage operation`);
    }
  }

  /**
   * Receive messages from an SQS queue.
   * @param queueUrl - The URL of the SQS queue.
   * @param maxMessages - The maximum number of messages to receive.
   * @returns The result of the ReceiveMessageCommand.
   * @throws InternalServerErrorException if there is an error receiving the message.
   */
  async receiveMessage(queueUrl: string, maxMessages = 10) {
    const normalizedMaxMessages = Math.min(Math.max(1, maxMessages), 10);

    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: normalizedMaxMessages,
      });

      const result = await this.sqsClient.send(command);
      return result;
    } catch (error) {
      this.logger.error(
        this.fileName,
        this.receiveMessage.name,
        'Error receiving message from SQS',
        error,
      );
      throw new InternalServerErrorException(
        `Error in receiveMessage operation`,
      );
    }
  }

  /**
   * Receive messages from an SQS queue using a ReceiveMessageCommand.
   * @param command - The ReceiveMessageCommand to send to the SQS client.
   * @returns The result of the ReceiveMessageCommand.
   * @throws InternalServerErrorException if there is an error receiving the message.
   */
  async receiveMessageWithCommand(command: ReceiveMessageCommand) {
    try {
      const result = await this.sqsClient.send(command);
      return result;
    } catch (error) {
      this.logger.error(
        this.fileName,
        this.receiveMessageWithCommand.name,
        'Error receiving message from SQS',
        error,
      );
      throw new InternalServerErrorException(
        `Error in receiveMessageWithCommand operation`,
      );
    }
  }

  /**
   * Delete a message from an SQS queue.
   * @param queueUrl - The URL of the SQS queue.
   * @param receiptHandle - The receipt handle of the message to delete.
   * @returns The result of the DeleteMessageCommand.
   * @throws InternalServerErrorException if there is an error deleting the message.
   */
  async deleteMessage(queueUrl: string, receiptHandle: string) {
    this.logger.debug(
      this.fileName,
      this.deleteMessage.name,
      'Deleting message from SQS',
      { queueUrl, receiptHandle },
    );

    try {
      const command = new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
      });
      const result = await this.sqsClient.send(command);
      return result;
    } catch (error) {
      this.logger.error(
        this.fileName,
        this.deleteMessage.name,
        'Error deleting message from SQS',
        error,
      );
      throw new InternalServerErrorException(
        `Error in deleteMessage operation`,
      );
    }
  }

  /**
   * Purge all messages from an SQS queue by receiving and deleting them in batches.
   * @param queueUrl - The URL of the SQS queue.
   * @param batchSize - The number of messages to process in each batch (default: 10).
   * @throws InternalServerErrorException if there is an error during the purge operation.
   */
  async purgeQueue(queueUrl: string, batchSize = 10) {
    try {
      let messagesDeleted = 0;
      let hasMoreMessages = true;

      while (hasMoreMessages) {
        const result = await this.receiveMessageWithCommand(
          new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: batchSize,
            VisibilityTimeout: 120,
            WaitTimeSeconds: 20,
          }),
        );

        if (!result.Messages || result.Messages.length === 0) {
          this.logger.warn(
            this.fileName,
            this.purgeQueue.name,
            'No more messages to delete',
          );
          hasMoreMessages = false;
          break;
        }

        // Delete all messages in the batch
        for (const message of result.Messages) {
          if (message.ReceiptHandle) {
            await this.deleteMessage(queueUrl, message.ReceiptHandle);
            messagesDeleted++;
          }
        }
      }

      this.logger.info(
        this.fileName,
        this.purgeQueue.name,
        'Successfully purged queue',
        { queueUrl, messagesDeleted },
      );

      return { messagesDeleted };
    } catch (error) {
      this.logger.error(
        this.fileName,
        this.purgeQueue.name,
        'Error purging queue',
        error,
      );
      throw new InternalServerErrorException(`Error in purgeQueue operation`);
    }
  }
}
