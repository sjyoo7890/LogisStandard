import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FtpService, FileType, TransferStatus } from './ftp.service';

class DistributeFileDto {
  filePath!: string;
  fileType!: FileType;
  targetCenterIds!: string[];
}

@ApiTags('FTP')
@Controller('api/ftp')
export class FtpController {
  constructor(private readonly ftpService: FtpService) {}

  @Post('distribute')
  @ApiOperation({ summary: '파일 배포' })
  async distributeFile(@Body() body: DistributeFileDto) {
    switch (body.fileType) {
      case 'ADDRESS_DB':
        return this.ftpService.distributeAddressDB(body.filePath, body.targetCenterIds);
      case 'MLF':
        return this.ftpService.distributeMLFFile(body.filePath, body.targetCenterIds);
      case 'SORTING_PLAN':
        return this.ftpService.distributeSortingPlan(body.filePath, body.targetCenterIds);
    }
  }

  @Get('active')
  @ApiOperation({ summary: '진행 중인 전송 목록' })
  getActiveTransfers() {
    return this.ftpService.getActiveTransfers();
  }

  @Get('history')
  @ApiOperation({ summary: '전송 이력 조회' })
  @ApiQuery({ name: 'fileType', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getTransferHistory(
    @Query('fileType') fileType?: FileType,
    @Query('status') status?: TransferStatus,
    @Query('limit') limit?: string,
  ) {
    return this.ftpService.getTransferHistory({
      fileType,
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('status')
  @ApiOperation({ summary: '전송 상태 요약' })
  getTransferStatus() {
    return this.ftpService.getTransferStatus();
  }

  @Post(':transferId/retry')
  @ApiOperation({ summary: '실패한 전송 재시도' })
  async retryTransfer(@Param('transferId') transferId: string) {
    const result = await this.ftpService.retryTransfer(transferId);
    if (!result) {
      return { success: false, message: 'Transfer not found or not in failed state' };
    }
    return { success: true, transfer: result };
  }
}
