/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { getCatalog, createCatalogItem, updateCatalogItem, deleteCatalogItem } from '../controllers/catalogController.js';

const router = express.Router();

router.get('/:type', getCatalog);
router.post('/:type', createCatalogItem);
router.put('/:type/:id', updateCatalogItem);
router.delete('/:type/:id', deleteCatalogItem);

export default router;
