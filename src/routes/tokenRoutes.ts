import express from 'express';
import { getTokenInsight } from '../controllers/tokenController';

const router = express.Router();

router.post('/:id/insight', getTokenInsight);

export default router;


