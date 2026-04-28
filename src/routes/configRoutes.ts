/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import GlobalConfig from '../models/GlobalConfig.model';

const router = express.Router();

// Get the single config document
router.get('/', async (req, res) => {
  try {
    let config = await GlobalConfig.findOne();
    if (!config) {
      // Create default if not exists
      config = await GlobalConfig.create({});
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching configuration', error });
  }
});

// Update the config document
router.put('/', async (req, res) => {
  try {
    let config = await GlobalConfig.findOne();
    if (!config) {
      config = new GlobalConfig(req.body);
    } else {
      Object.assign(config, req.body);
      config.updatedAt = new Date();
    }
    await config.save();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Error saving configuration', error });
  }
});

export default router;
