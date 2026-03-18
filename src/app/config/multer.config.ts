import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import cloudinary from './cloudinary.config';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'courier-system',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
    resource_type: 'auto',
  } as any,
});

export const upload = multer({ storage });
export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 10);
