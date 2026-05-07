import express from 'express';
import { ExchangeRateModel } from '../models/ExchangeRate.model.js';

const router = express.Router();

router.get('/current', async (req, res) => {
  try {
    // 1. Fetch latest from DB
    const latest = await ExchangeRateModel.findOne().sort({ date: -1 });
    const now = new Date();
    
    // We check if the latest one is older than 6 hours
    const isOutdated = !latest || (now.getTime() - latest.date.getTime()) > 6 * 60 * 60 * 1000;
    
    if (isOutdated) {
      // 2. Fetch from DolarAPI
      try {
        const dolarApiRes = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        if (dolarApiRes.ok) {
          const data = await dolarApiRes.json();
          if (data.promedio) {
            
            // Check if there is an exact match for today's date (so we don't duplicate on the same day if rate is the same)
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const existingToday = await ExchangeRateModel.findOne({ 
               date: { $gte: startOfDay }, 
               rate: data.promedio 
            });

            if (!existingToday) {
               const newRate = await ExchangeRateModel.create({
                 date: new Date(data.fechaActualizacion || new Date()),
                 rate: data.promedio
               });
               return res.json({ rate: newRate.rate, date: newRate.date });
            } else {
               return res.json({ rate: existingToday.rate, date: existingToday.date });
            }
          }
        }
      } catch (e) {
        console.error("Error fetching from dolarapi", e);
      }
    }
    
    if (latest) {
      return res.json({ rate: latest.rate, date: latest.date });
    } else {
      return res.json({ rate: 40, date: new Date() }); // fallback
    }
  } catch (error: any) {
    res.status(500).json({ error: "Server error", message: error.message });
  }
});

// Get History
router.get('/history', async (req, res) => {
  try {
    const history = await ExchangeRateModel.find().sort({ date: -1 }).limit(30);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: "Server error", message: error.message });
  }
});

// Get by specific date (closest before or equal to date)
router.get('/date/:date', async (req, res) => {
  try {
    const targetDate = new Date(req.params.date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }
    
    // Set to end of day to include any rates added on that day
    targetDate.setHours(23, 59, 59, 999);

    const match = await ExchangeRateModel.findOne({ date: { $lte: targetDate } }).sort({ date: -1 });
    if (match) {
      return res.json({ rate: match.rate, date: match.date });
    }

    // fallback to current if none found
    const latest = await ExchangeRateModel.findOne().sort({ date: -1 });
    if (latest) return res.json({ rate: latest.rate, date: latest.date });
    return res.json({ rate: 40, date: new Date() }); 
  } catch (error: any) {
    res.status(500).json({ error: "Server error", message: error.message });
  }
});

export default router;
