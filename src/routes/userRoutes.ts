/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { getUsers, createUser, updateUser, calculatePayroll, getUserByEmail } from '../controllers/userController.js';

const router = express.Router();

router.get('/', getUsers);
router.get('/email/:email', getUserByEmail);
router.post('/', createUser);
router.put('/:id', updateUser);
router.get('/payroll/calculate', calculatePayroll);

export default router;
