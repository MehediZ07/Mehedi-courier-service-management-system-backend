import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { AuthService } from './auth.service';

const register = catchAsync(async (req, res) => {
  const result = await AuthService.register(req.body);
  sendResponse(res, { httpStatusCode: status.CREATED, success: true, message: 'User registered successfully.', data: result });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await AuthService.login(email, password);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Login successful.', data: result });
});

const refreshToken = catchAsync(async (req, res) => {
  const token = req.headers['x-refresh-token'] as string;
  const result = await AuthService.refreshToken(token);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Token refreshed.', data: result });
});

const changePassword = catchAsync(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  await AuthService.changePassword(req.user!.userId, oldPassword, newPassword);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Password changed successfully.' });
});

const getMe = catchAsync(async (req, res) => {
  const result = await AuthService.getMe(req.user!.userId);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Profile fetched.', data: result });
});

export const AuthController = { register, login, refreshToken, changePassword, getMe };
