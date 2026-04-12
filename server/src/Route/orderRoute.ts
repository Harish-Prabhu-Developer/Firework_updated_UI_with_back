import { Router } from "express";
import { createOrder, getAllOrders, convertOrderToInvoice, getOrderPDF, deleteOrder } from "../Controller/orderController.js";

const orderRoute = Router();

orderRoute.post("/", createOrder);
orderRoute.get("/", getAllOrders);
orderRoute.post("/convert/:orderId", convertOrderToInvoice);
orderRoute.get("/pdf/:orderNumber", getOrderPDF);
orderRoute.delete("/:orderId", deleteOrder);

export default orderRoute;
