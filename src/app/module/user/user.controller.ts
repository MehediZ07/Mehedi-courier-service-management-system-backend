import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { UserService } from './user.service';

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
  if (!req.file) {
    return sendResponse(res, { httpStatusCode: status.BAD_REQUEST, success: false, message: 'No file uploaded.' });
  }

  const imageUrl = req.file.path;
  const user = await UserService.getUserById(req.params.id as string);
  const result = await UserService.updateUserProfileImage(req.params.id as string, imageUrl, user.profileImage || undefined);

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
