/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TelaModel, ModeloModel, CorteModel, BordadoModel, EstampadoModel, AcabadoModel, ConfiguracionModel } from '../models/Catalogs.model.js';

const getModel = (type: string): mongoose.Model<any> | null => {
  switch(type) {
    case 'telas': return TelaModel;
    case 'modelos': return ModeloModel;
    case 'cortes': return CorteModel;
    case 'bordados': return BordadoModel;
    case 'estampados': return EstampadoModel;
    case 'acabados': return AcabadoModel;
    case 'configuracion': return ConfiguracionModel;
    default: return null;
  }
};

export const getCatalog = async (req: Request, res: Response) => {
  const Model = getModel(req.params.type);
  if (!Model) return res.status(400).json({ message: 'Invalid catalog type' });
  try {
    const data = await Model.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const createCatalogItem = async (req: Request, res: Response) => {
  const Model = getModel(req.params.type);
  if (!Model) return res.status(400).json({ message: 'Invalid catalog type' });
  try {
    const newItem = new Model(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ error });
  }
};

export const updateCatalogItem = async (req: Request, res: Response) => {
  const Model = getModel(req.params.type);
  if (!Model) return res.status(400).json({ message: 'Invalid catalog type' });
  try {
    const updated = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error });
  }
};

export const deleteCatalogItem = async (req: Request, res: Response) => {
  const Model = getModel(req.params.type);
  if (!Model) return res.status(400).json({ message: 'Invalid catalog type' });
  try {
    await Model.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(400).json({ error });
  }
};
