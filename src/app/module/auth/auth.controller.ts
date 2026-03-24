import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { AuthService } from './auth.service.js';

const register = catchAsync(async (req, res) => {
  const result = await AuthService.register(req.body);
  sendResponse(res, { httpStatusCode: status.CREATED, success: true, message: 'User registered successfully.', data: result });
});

const registerCourier = catchAsync(async (req, res) => {
  const result = await AuthService.registerCourier(req.body);
  sendResponse(res, { httpStatusCode: status.CREATED, success: true, message: 'Courier registration submitted. Awaiting admin approval.', data: result });
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

export const AuthController = { register, registerCourier, login, refreshToken, changePassword, getMe };
