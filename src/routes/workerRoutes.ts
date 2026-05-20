/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { getWorkers, createWorker, updateWorker, deleteWorker } from '../controllers/workerController.js';

const router = express.Router();

router.get('/', getWorkers);
router.post('/', createWorker);
router.put('/:id', updateWorker);
router.delete('/:id', deleteWorker);

export default router;
