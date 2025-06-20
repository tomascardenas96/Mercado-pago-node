import { Preference } from "mercadopago";
import { client } from "../config/mp.config.js";

//Creamos la preferencia de pago, acá se crea la orden de pago.
export async function createPreference(products) {
  const preference = new Preference(client);

  //Agregar validaciones para que no se pasen datos incorrectos desde el cliente.

  const result = await preference.create({
    body: {
      items: products.map((product) => {
        return {
          title: product.title,
          quantity: Number(product.quantity),
          unit_price: Number(product.unit_price),
        };
      }),
      currency_id: "ARS",
      back_urls: {
        success: `${process.env.FRONTEND_URL}/success`,
        failure: `${process.env.FRONTEND_URL}/failure`,
        pending: `${process.env.FRONTEND_URL}/pending`,
      },
      auto_return: "approved",
      notification_url: `${process.env.TUNNEL_HOST}/api/payment/webhook`,
    },
  });

  return result;
}

//Funcion que llama a la API de Mercado pago por medio de un ID para obtener los datos detallados de la transaccion.
export async function getPaymentDetails(id) {
  const token = process.env.MP_ACCESS_TOKEN;

  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
    }
  );
  return response.json();
}
