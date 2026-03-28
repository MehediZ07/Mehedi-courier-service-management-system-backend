import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { UserService } from './user.service.js';

const getAllUsers = catchAsync(async (req, res) => {
  const result = await UserService.getAllUsers(req.query as Record<string, string>);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Users fetched.', data: result.data, meta: result.meta });
});

const getUserById = catchAsync(async (req, res) => {
  const result = await UserService.getUserById(req.params.id as string);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'User fetched.', data: result });
});

const updateUser = catchAsync(async (req, res) => {
  const result = await UserService.updateUser(req.params.id as string, req.body);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'User updated.', data: result });
});

const uploadProfileImage = catchAsync(async (req, res) => {
  console.log('Upload request received:', {
    hasFile: !!req.file,
    userId: req.params.id,
    contentType: req.headers['content-type']
  });

  if (!req.file) {
    return sendResponse(res, { httpStatusCode: status.BAD_REQUEST, success: false, message: 'No file uploaded.' });
  }

  const targetUserId = req.params.id as string;
  const currentUserId = req.user!.userId;
  const currentUserRole = req.user!.role;

  // Check if user is uploading their own profile or is an admin
  const isAdmin = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN';
  const isOwnProfile = targetUserId === currentUserId;

  if (!isAdmin && !isOwnProfile) {
    return sendResponse(res, { 
      httpStatusCode: status.FORBIDDEN, 
      success: false, 
      message: 'You can only upload your own profile image.' 
    });
  }

  const imageUrl = req.file.path;
  const user = await UserService.getUserById(targetUserId);
  const result = await UserService.updateUserProfileImage(targetUserId, imageUrl, user.profileImage || undefined);

  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Profile image uploaded.', data: result });
});

const updateStatus = catchAsync(async (req, res) => {
  const result = await UserService.updateStatus(req.params.id as string, req.body.status);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'User status updated.', data: result });
});

const updateRole = catchAsync(async (req, res) => {
  const result = await UserService.updateRole(req.params.id as string, req.body.role);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'User role updated.', data: result });
});

const deleteUser = catchAsync(async (req, res) => {
  await UserService.deleteUser(req.params.id as string);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'User deleted.' });
});

export const UserController = { getAllUsers, getUserById, updateUser, uploadProfileImage, updateStatus, updateRole, deleteUser };
