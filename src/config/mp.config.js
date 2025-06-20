// SDK de Mercado Pago
import { MercadoPagoConfig } from "mercadopago";
import "dotenv/config.js";

export const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});
