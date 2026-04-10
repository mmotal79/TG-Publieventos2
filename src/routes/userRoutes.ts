/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { getUsers, createUser, updateUser, calculatePayroll } from '../controllers/userController.js';

const router = express.Router();

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.get('/payroll/calculate', calculatePayroll);

export default router;
