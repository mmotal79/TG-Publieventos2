/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import Client from '../models/Client.model.js';

export const getClients = async (req: Request, res: Response) => {
  try {
    const clients = await Client.find().sort({ razonSocial: 1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const newClient = new Client(req.body);
    await newClient.save();
    res.status(201).json(newClient);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'El número de celular ya está registrado.' });
    }
    res.status(400).json({ error });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const updated = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.json({ message: 'Client deleted' });
  } catch (error) {
    res.status(400).json({ error });
  }
};
