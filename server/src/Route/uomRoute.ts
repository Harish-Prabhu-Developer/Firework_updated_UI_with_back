import express from 'express';
import { 
  createUom, 
  getAllUoms, 
  getUomById, 
  updateUom, 
  deleteUom 
} from '../Controller/uomController.js';

const uomRoute = express.Router();

uomRoute.get('/', getAllUoms);
uomRoute.get('/:id', getUomById);
uomRoute.post('/', createUom);
uomRoute.put('/:id', updateUom);
uomRoute.delete('/:id', deleteUom);

export default uomRoute;
