import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCreatedResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminAuth, AuthenticatedAdmin, CurrentAdmin } from '../common/decorators/auth.decorators';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { ALLOWED_IMAGE_TYPES, UPLOAD_FOLDERS, UploadFolder, UploadsService } from './uploads.service';

@ApiTags('Admin · Uploads')
@Controller('admin/uploads')
@AdminAuth()
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('image')
  @ResponseMessage('Image uploaded')
  @ApiOperation({ summary: 'Upload an image (resized to max 1600px and converted to WebP)' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'folder', enum: UPLOAD_FOLDERS, required: false })
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } })
  @ApiCreatedResponse({
    schema: {
      example: {
        success: true,
        message: 'Image uploaded',
        data: { url: 'http://localhost:4000/uploads/products/2026/10/5f1c….webp', width: 1200, height: 1200, size: 84211, contentType: 'image/webp' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
          return cb(new UnsupportedMediaTypeException('Only JPG, PNG, WebP, AVIF or GIF images are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('folder') folder: string | undefined,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    if (!file) throw new BadRequestException('Choose an image to upload (form field "file")');
    const target = (folder ?? 'products') as UploadFolder;
    if (!UPLOAD_FOLDERS.includes(target)) {
      throw new BadRequestException(`folder must be one of: ${UPLOAD_FOLDERS.join(', ')}`);
    }
    return this.uploads.uploadImage(file, target, admin.email);
  }
}
